/**
 * Context enhancements extension.
 *
 * Two mutually exclusive modes represented as a closed enum:
 *   - Plan  : system prompt is appended with mode-specific content from
 *              @extensions/prompt-mode-extension-plan.md
 *   - Build : system prompt is appended with mode-specific content from
 *              @extensions/prompt-mode-extension-build.md
 *
 * The base content from @extensions/system-prompt-base.md is ALWAYS
 * inserted, followed by the model name line, followed by the mode-specific
 * content.
 *
 * The model name line ("You are powered by the model named {model}.")
 * is generated dynamically at runtime from the active model's ID.
 * Only the last path component is used (e.g. `glm-5.2` from
 * `openrouter/z-ai/glm-5.2`).
 *
 * Controls:
 *   /plan        -> set mode to Plan
 *   /build       -> set mode to Build
 *   F2           -> toggle between Plan and Build
 *
 * The active mode is persisted in the session and restored on resume/reload.
 */

import type { CustomEntry, ExtensionAPI, ExtensionContext } from "@earendil-works/pi-coding-agent";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

/** The only two modes this extension supports. */
enum Mode {
	Plan = "plan",
	Build = "build",
}

const DEFAULT_MODE = Mode.Build;

/** Cached file contents loaded once on extension start/reload. Never re-read per-prompt. */
let cachedBase = "";
let cachedBuild = "";
let cachedPlan = "";

/** Cached model name for this session (set on session_start, used in before_agent_start). */
let cachedModelName = "unknown";

/** Read all extension files once, at session start or reload time. */
async function loadCachedFiles(cwd: string): Promise<void> {
	const extRoot = join(cwd, "extensions");
	try {
		const [base, build, plan] = await Promise.all([
			readFile(join(extRoot, "system-prompt-base.md"), "utf8"),
			readFile(join(extRoot, "prompt-mode-extension-build.md"), "utf8"),
			readFile(join(extRoot, "prompt-mode-extension-plan.md"), "utf8"),
		]);
		cachedBase = base.trimEnd();
		cachedBuild = build.trimEnd();
		cachedPlan = plan.trimEnd();
	} catch {
		cachedBase = "";
		cachedBuild = "";
		cachedPlan = "";
	}
}

/** Extract just the model name (last segment of the provider/model ID).
 *  e.g. `openrouter/z-ai/glm-5.2` -> `glm-5.2` */
function getModelName(id: string): string {
	return id.split("/").pop() ?? id;
}

/** Toggle to the other mode (there are exactly two). */
function toggle(mode: Mode): Mode {
	return mode === Mode.Plan ? Mode.Build : Mode.Plan;
}

/** Marker shown on the status bar for each mode. */
const MODE_MARKER: Record<Mode, string> = {
	[Mode.Plan]: "plan",
	[Mode.Build]: "build",
};

export default function planBuildModeExtension(pi: ExtensionAPI): void {
	let mode: Mode = DEFAULT_MODE;

	function persistMode(): void {
		pi.appendEntry("plan-build-mode", { mode });
	}

	function renderStatus(ctx: ExtensionContext): void {
		const theme = ctx.ui.theme;
		const color = mode === Mode.Build ? "warning" : "success";
		ctx.ui.setStatus("plan-build-mode", theme.fg(color, theme.italic(MODE_MARKER[mode])));
	}

	function setMode(next: Mode, ctx: ExtensionContext): void {
		if (next === mode) {
			ctx.ui.notify(`Already in ${mode} mode`, "info");
			return;
		}
		mode = next;
		persistMode();
		renderStatus(ctx);
	}

	function toggleMode(ctx: ExtensionContext): void {
		setMode(toggle(mode), ctx);
	}

	// --- Commands ---

	pi.registerCommand("plan", {
		description: "Switch to plan mode",
		handler: async (_args, ctx) => setMode(Mode.Plan, ctx),
	});

	pi.registerCommand("build", {
		description: "Switch to build mode",
		handler: async (_args, ctx) => setMode(Mode.Build, ctx),
	});

	// --- Hotkey ---

	pi.registerShortcut("F2", {
		description: "Toggle plan / build mode",
		handler: async (ctx) => toggleMode(ctx),
	});

	// --- Tool execution policy ---

	const BLOCKED_BUILD_TOOLS = new Set(["edit", "write"]);

	pi.on("tool_call", async (event, _ctx) => {
		if (mode === Mode.Plan && BLOCKED_BUILD_TOOLS.has(event.toolName)) {
			return { block: true, reason: `${event.toolName} tool unavailable as plan mode is active until further notice. Do not circumvent this.` };
		}
	});

	// --- System prompt append ---

	pi.on("before_agent_start", async (event) => {
		const modeContent =
			mode === Mode.Build ? cachedBuild : cachedPlan;
		const modelLine = `You are powered by the model named ${cachedModelName}.`;

		return {
			systemPrompt: [
				event.systemPrompt,
				cachedBase,
				modelLine,
				modeContent,
			]
				.filter(Boolean)
				.join("\n\n"),
		};
	});

	// --- Restore persisted state ---

	pi.on("session_start", async (_event, ctx) => {
		await loadCachedFiles(ctx.cwd);

		const entries = ctx.sessionManager.getEntries();
		const last = entries
			.filter((e): e is CustomEntry<{ mode?: string }> => e.type === "custom" && e.customType === "plan-build-mode")
			.pop();

		const stored = last?.data?.mode;
		mode = stored === Mode.Plan || stored === Mode.Build ? stored : DEFAULT_MODE;

		// Cache model name once per session
		const modelId = ctx.model?.id ?? "unknown";
		cachedModelName = getModelName(modelId);

		renderStatus(ctx);
	});
}
