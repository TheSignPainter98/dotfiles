/**
 * atfile — inline `@file` and `@dir` expansion for pi.
 *
 * When the user submits a prompt containing `@path`, this extension reads each
 * referenced path and attaches it to the same turn via a custom message (which
 * participates in LLM context and is persisted in the session). Trailing
 * punctuation (`.,?!"'` etc.) is ignored, so `@install.py,` resolves
 * `install.py`.
 *
 * Resolution rules:
 * - Regular files are attached with their contents (truncated when large).
 * - Directories are attached as a two-level tree listing (the directory's
 *   entries plus one child level), with sizes for files.
 * - Non-existent paths are silently ignored. The @ syntax has false positives
 *   (e.g. `me@foo.com` extracts `foo.com`), so unresolvable references must
 *   not produce warnings or context noise.
 *
 * The attachment happens in `before_agent_start`, after all input transforms
 * and skill/template expansion have run, so `event.prompt` is exactly what the
 * model will see.
 */
import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { truncateHead, formatSize } from "@earendil-works/pi-coding-agent";
import { Box, Text } from "@earendil-works/pi-tui";
import {
  closeSync,
  existsSync,
  openSync,
  readdirSync,
  readSync,
  statSync,
} from "node:fs";
import { homedir } from "node:os";
import { isAbsolute, join, relative, resolve } from "node:path";

/** Custom message type used for the attachment (also the renderer key). */
const CUSTOM_TYPE = "atfile-context";

/** Upper bound on attachments per prompt, to protect the context window. */
const MAX_ATTACHMENTS = 12;

/** Per-file read window before the shared truncation helpers kick in. */
const READ_WINDOW_BYTES = 32 * 1024;
const MAX_LINES_PER_FILE = 500;

/** Directory listing depth: directory entries plus one child level. */
const DIR_DEPTH = 2;
/** Entry cap per directory listing. */
const DIR_MAX_ENTRIES = 400;
/** Directories never expanded in listings. */
const DIR_SKIP = new Set(["node_modules", ".git"]);

/** Punctuation stripped from the end of an @token. */
const TRAILING_PUNCTUATION = ".,;:!?\"'`)]}>*";

interface Attachment {
  /** Path as shown to the user/model (relative when possible). */
  display: string;
  kind: "file" | "dir";
  bytes: number;
  content: string;
  truncated: boolean;
}

interface AtFileDetails {
  attachments: Array<{
    path: string;
    kind: "file" | "dir";
    bytes?: number;
    truncated: boolean;
  }>;
  skipped: string[];
}

/** Pull raw @tokens out of the prompt, in order of appearance, deduplicated. */
export function extractReferences(text: string): string[] {
  const seen = new Set<string>();
  const refs: string[] = [];
  for (const match of text.matchAll(/@([^\s@]+)/g)) {
    let token = match[1];
    while (
      token.length > 0 &&
      TRAILING_PUNCTUATION.includes(token[token.length - 1])
    ) {
      token = token.slice(0, -1);
    }
    if (token.length === 0 || token.length > 256 || seen.has(token)) continue;
    seen.add(token);
    refs.push(token);
  }
  return refs;
}

export interface ResolvedPath {
  token: string;
  absolute: string;
  kind: "file" | "dir";
}

/**
 * Resolve @tokens against `cwd`, keeping only existing regular files and
 * directories. Unresolvable tokens are silently dropped (false positives such
 * as email addresses must not produce warnings or context noise).
 */
export function resolveReferences(
  refs: string[],
  cwd: string,
): ResolvedPath[] {
  const resolved: ResolvedPath[] = [];
  const seenAbsolute = new Set<string>();

  for (const token of refs) {
    const expanded = token.startsWith("~") ? homedir() + token.slice(1) : token;
    const absolute = isAbsolute(expanded) ? expanded : resolve(cwd, expanded);
    if (seenAbsolute.has(absolute)) continue;
    seenAbsolute.add(absolute);

    try {
      const stats = statSync(absolute);
      if (stats.isFile()) {
        resolved.push({ token, absolute, kind: "file" });
      } else if (stats.isDirectory()) {
        resolved.push({ token, absolute, kind: "dir" });
      }
      // Anything else (socket, device, fifo): silently ignored.
    } catch {
      // Does not exist / not accessible: silently ignored.
    }
  }
  return resolved;
}

/** Read at most `maxBytes` from the start of a file without slurping it all. */
function readPrefix(path: string, maxBytes: number): string {
  const fd = openSync(path, "r");
  try {
    const buffer = Buffer.alloc(maxBytes);
    const bytesRead = readSync(fd, buffer, 0, maxBytes, 0);
    return buffer.toString("utf8", 0, bytesRead);
  } finally {
    closeSync(fd);
  }
}

/** Prefer a cwd-relative display path; fall back to the absolute path. */
function displayPath(absolute: string, cwd: string): string {
  const rel = relative(cwd, absolute);
  return rel.length > 0 && !rel.startsWith("..") ? rel : absolute;
}

function readFileAttachment(absolute: string, cwd: string): Attachment {
  const stats = statSync(absolute);
  const wholeFileTooBig = stats.size > READ_WINDOW_BYTES;
  const raw = readPrefix(absolute, READ_WINDOW_BYTES + 1);
  const truncation = truncateHead(raw, {
    maxLines: MAX_LINES_PER_FILE,
    maxBytes: READ_WINDOW_BYTES,
  });

  return {
    display: displayPath(absolute, cwd),
    kind: "file",
    bytes: stats.size,
    content: truncation.content,
    truncated: truncation.truncated || wholeFileTooBig,
  };
}

/**
 * Render a two-level tree listing of a directory: its entries, and one child
 * level for subdirectories. Directories first, then files, both alphabetical.
 * `node_modules` and `.git` are never expanded.
 */
export function listDirectoryTree(
  absolute: string,
): { text: string; truncated: boolean } {
  const lines: string[] = [];
  let count = 0;
  let truncated = false;

  const walk = (dir: string, depth: number, prefix: string): void => {
    let dirents;
    try {
      dirents = readdirSync(dir, { withFileTypes: true });
    } catch {
      return; // Unreadable child: just stop that branch.
    }

    dirents.sort((a, b) => {
      if (a.isDirectory() !== b.isDirectory()) return a.isDirectory() ? -1 : 1;
      return a.name.toLowerCase().localeCompare(b.name.toLowerCase());
    });

    for (let i = 0; i < dirents.length; i++) {
      if (count >= DIR_MAX_ENTRIES) {
        truncated = true;
        return;
      }
      const entry = dirents[i];
      const isLast = i === dirents.length - 1;
      const branch = isLast ? "└── " : "├── ";
      const childPrefix = prefix + (isLast ? "    " : "│   ");

      if (entry.isDirectory()) {
        lines.push(`${prefix}${branch}${entry.name}/`);
        count++;
        if (depth < DIR_DEPTH && !DIR_SKIP.has(entry.name)) {
          walk(join(dir, entry.name), depth + 1, childPrefix);
        }
      } else {
        let size = "";
        try {
          size = ` (${formatSize(statSync(join(dir, entry.name)).size)})`;
        } catch {
          // Size is cosmetic; skip it if it cannot be stat'ed.
        }
        lines.push(`${prefix}${branch}${entry.name}${size}`);
        count++;
      }
    }
  };

  walk(absolute, 1, "");
  return { text: lines.join("\n"), truncated };
}

function readDirAttachment(absolute: string, cwd: string): Attachment {
  const tree = listDirectoryTree(absolute);
  const safety = truncateHead(tree.text, {
    maxLines: DIR_MAX_ENTRIES,
    maxBytes: READ_WINDOW_BYTES,
  });

  return {
    display: displayPath(absolute, cwd),
    kind: "dir",
    bytes: 0,
    content: safety.content,
    truncated: tree.truncated || safety.truncated,
  };
}

function buildMessageContent(attachments: Attachment[], skipped: string[]): string {
  const parts: string[] = [
    "The user's prompt references paths with @path syntax. Existing files " +
      "and directories were read automatically when the prompt was submitted " +
      "and are attached below. Treat them as current filesystem state. " +
      "Unresolvable references (including things like email addresses) were " +
      "ignored and are not listed here.",
  ];

  if (skipped.length > 0) {
    parts.push(
      `Note: attachment limit (${MAX_ATTACHMENTS}) reached; skipped: ${skipped.join(", ")}`,
    );
  }

  for (const attachment of attachments) {
    if (attachment.kind === "dir") {
      const suffix = attachment.truncated ? " (truncated)" : "";
      parts.push(`=== DIR: ${attachment.display}/ (tree, 2 levels)${suffix} ===`);    } else {
      const size = formatSize(attachment.bytes);
      const suffix = attachment.truncated ? " (truncated)" : "";
      parts.push(`=== FILE: ${attachment.display} (${size})${suffix} ===`);
    }
    parts.push(attachment.content);
    parts.push(`=== END ${attachment.kind === "dir" ? "DIR" : "FILE"}: ${attachment.display} ===`);
  }

  return parts.join("\n\n");
}

export default function (pi: ExtensionAPI) {
  // Attach @paths to the turn being started.
  pi.on("before_agent_start", async (event, ctx) => {
    const refs = extractReferences(event.prompt);
    if (refs.length === 0) return;

    const resolved = resolveReferences(refs, ctx.cwd);
    if (resolved.length === 0) return; // Only false positives: do nothing.

    const attachments: Attachment[] = [];
    const skipped: string[] = [];
    for (const ref of resolved) {
      if (attachments.length >= MAX_ATTACHMENTS) {
        skipped.push(ref.token);
        continue;
      }
      try {
        attachments.push(
          ref.kind === "file"
            ? readFileAttachment(ref.absolute, ctx.cwd)
            : readDirAttachment(ref.absolute, ctx.cwd),
        );
      } catch (error) {
        // Exists but unreadable: anomalous, so tell the user (not the model).
        ctx.ui.notify?.(
          `atfile: could not read @${ref.token}: ${String(error)}`,
          "warning",
        );
      }
    }

    if (attachments.length === 0) return;

    return {
      message: {
        customType: CUSTOM_TYPE,
        content: buildMessageContent(attachments, skipped),
        display: true,
        details: {
          attachments: attachments.map((a) => ({
            path: a.display,
            kind: a.kind,
            bytes: a.bytes,
            truncated: a.truncated,
          })),
          skipped,
        } satisfies AtFileDetails,
      },
    };
  });

  // Compact transcript rendering: one summary line, full contents when expanded.
  pi.registerMessageRenderer(CUSTOM_TYPE, (message, options, theme) => {
    const details = (message.details ?? {}) as AtFileDetails;
    const items = details.attachments ?? [];
    const label = (a: { path: string; kind: string }) =>
      a.kind === "dir" ? `${a.path}/` : a.path;

    if (!options.expanded) {
      const shown = items.slice(0, 4).map(label).join(", ");
      const more = items.length > 4 ? ` +${items.length - 4} more` : "";
      const text = theme.fg(
        "muted",
        `atfile: attached ${items.length} item${items.length === 1 ? "" : "s"} · ${shown}${more}`,
      );
      return new Text(text, options.outputPad, 0);
    }

    const box = new Box(1, 1, (line) => theme.bg("customMessageBg", line));
    box.addChild(
      new Text(
        theme.fg("accent", theme.bold(`atfile · ${items.length} item(s) attached`)),
        0,
        0,
      ),
    );
    for (const item of items) {
      const suffix = item.truncated ? theme.fg("warning", " (truncated)") : "";
      box.addChild(
        new Text(theme.fg("success", `  ✓ ${label(item)}`) + suffix, 0, 0),
      );
    }
    for (const path of details.skipped ?? []) {
      box.addChild(new Text(theme.fg("warning", `  ✗ over limit: ${path}`), 0, 0));
    }

    const content = typeof message.content === "string" ? message.content : "";
    if (content) {
      box.addChild(new Text(theme.fg("dim", content), 0, 0));
    }
    return box;
  });
}
