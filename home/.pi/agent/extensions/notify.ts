import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { execFile } from "node:child_process";

const NOTIFY_ID = "99999";
const ICON = "/usr/share/icons/Yaru/scalable/generic-symbols/violence2-symbolic.svg";
const IDLE_MS = 60_000;

function notify(body: string) {
  execFile("notify-send", [
    "--urgency=normal",
    "--expire-time=1000",
    `--replace-id=${NOTIFY_ID}`,
    "--transient",
    `--icon=${ICON}`,
    "pi coding agent",
    body,
  ]);
}

function lastAssistantText(messages: { role: string; content: any[] }[]): string {
  for (let i = messages.length - 1; i >= 0; i--) {
    const m = messages[i];
    if (m.role === "assistant") {
      return m.content
        .filter((b: any) => b.type === "text")
        .map((b: any) => b.text)
        .join("")
        .trim();
    }
  }
  return "";
}

let timer: NodeJS.Timeout | null = null;

function scheduleNotify(body: string) {
  if (timer) clearTimeout(timer);
  timer = setTimeout(() => {
    notify(body);
    timer = null;
  }, IDLE_MS);
}

function cancelNotify() {
  if (timer) {
    clearTimeout(timer);
    timer = null;
  }
}

export default function (pi: ExtensionAPI) {
  pi.on("tool_call", async (event) => {
    if (event.toolName === "ask_user_question") {
      scheduleNotify("🤖 needs your input");
    }
  });

  pi.on("agent_end", async (event) => {
    const text = lastAssistantText(event.messages);
    const body = text.endsWith("?") ? "🤖 needs your input" : "🤖 job complete";
    scheduleNotify(body);
  });

  pi.on("input", async () => cancelNotify());
  pi.on("user_bash", async () => cancelNotify());
  pi.on("model_select", async () => cancelNotify());
  pi.on("thinking_level_select", async () => cancelNotify());

  pi.on("tool_execution_end", async (event) => {
    if (event.toolName === "ask_user_question") cancelNotify();
  });

  pi.on("session_shutdown", async () => cancelNotify());
}
