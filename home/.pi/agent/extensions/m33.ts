import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";

export default function (pi: ExtensionAPI) {
    pi.on("before_provider_request", (event, _ctx) => {
        if (event.model?.provider === "m33" && event.payload) {
            event.payload.temperature = 0.6;
            event.payload.top_k = 20;
            event.payload.top_p = 0.95;
            event.payload.presence_penalty = 0.0;
            event.payload.repeat_penalty = 1.0;
            event.payload.max_tokens = 8196;
            event.payload.max_completion_tokens = 8196;
            event.payload.parallel_tool_calls = true;
        }
    });

    pi.registerProvider("m33", {
        name: "m.33",
        baseUrl: "http://m33.lan:11434/v1",
        apiKey: "asdf",
        api: "openai-completions",
        models: [
            {
                id: "qwen3.6:35b",
                name: "Qwen3.6 35B",
                reasoning: true,
                input: ["text", "image"],
                cost: {
                    input: 0,
                    output: 0,
                    cacheRead: 0,
                    cacheWrite: 0,
                },
                contextWindow: 262144,
                maxTokens: 8192,
            },
            {
                id: "qwen3.6:27b",
                name: "Qwen3.6 27B",
                reasoning: true,
                input: ["text", "image"],
                cost: {
                    input: 0,
                    output: 0,
                    cacheRead: 0,
                    cacheWrite: 0,
                },
                contextWindow: 262144,
                maxTokens: 8192,
            },
            {
                id: "richardyoung/qwen3.6-27b-abliterated:latest",
                name: "Qwen3.6 27B Uncensored",
                reasoning: false,
                input: ["text", "image"],
                cost: {
                    input: 0,
                    output: 0,
                    cacheRead: 0,
                    cacheWrite: 0,
                },
                contextWindow: 262144,
                maxTokens: 8192,
            },
            {
                id: "gemma4:31b",
                name: "Gemma 4",
                reasoning: true,
                input: ["text"],
                cost: {
                    input: 0,
                    output: 0,
                    cacheRead: 0,
                    cacheWrite: 0,
                },
                contextWindow: 262144,
                maxTokens: 8192,
            },
        ]
    });
}
