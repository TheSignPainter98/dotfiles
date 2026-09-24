import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";

export default function (pi: ExtensionAPI) {
    // Sampling overrides: guarded on provider "m33" which is not any of the
    // registered providers (m33-vllm / m33-llama-cpp / m33-ollama), so this
    // hook currently never fires. Re-enable once the guard is fixed.
    // pi.on("before_provider_request", (event, _ctx) => {
    //     if (event.model?.provider === "m33" && event.payload) {
    //         event.payload.temperature = 0.6;
    //         event.payload.top_k = 20;
    //         event.payload.top_p = 0.95;
    //         event.payload.presence_penalty = 0.0;
    //         event.payload.repeat_penalty = 1.0;
    //         event.payload.max_tokens = 8192;
    //         event.payload.max_completion_tokens = 8192;
    //         event.payload.parallel_tool_calls = true;
    //     }
    // });

    pi.registerProvider("m33-vllm", {
        name: "m.33 (vllm)",
        baseUrl: "http://m33.lan:41110/v1",
        apiKey: "asdf",
        api: "openai-completions",
        models: [
            {
                id: "poolside/Laguna-S-2.1",
                name: "Laguna S 2.1",
                reasoning: true,
                input: ["text"],
                cost: {
                    input: 0.05,
                    output: 1.0,
                    cacheRead: 0.01,
                    cacheWrite: 0.01,
                },
                contextWindow: 2**17, // 131072 = vLLM max-model-len
                maxTokens: 8192,
            },
            {
                id: "Qwen/Qwen3.6-35B-A3B",
                name: "Qwen3.6 35B A3B",
                reasoning: true,
                input: ["text", "image"],
                cost: {
                    input: 0.01,
                    output: 0.01,
                    cacheRead: 0.01,
                    cacheWrite: 0.01,
                },
                contextWindow: 262144,
                maxTokens: 8192,
            },
        ]
    });

    pi.registerProvider("m33-llama-cpp", {
        name: "m.33 (llama.cpp)",
        baseUrl: "http://m33.lan:30000/v1",
        apiKey: "asdf",
        api: "openai-completions",
        models: [
            {
                id: "unsloth/Qwen3.6-35B-A3B-MTP-GGUF:UD-Q4_K_XL",
                name: "Qwen3.6 35B A3B MTP",
                reasoning: true,
                input: ["text", "image"],
                cost: {
                    input: 0.01,
                    output: 0.01,
                    cacheRead: 0.01,
                    cacheWrite: 0.01,
                },
                contextWindow: 262144,
                maxTokens: 8192,
            },
            {
                id: "unsloth/Laguna-S-2.1-GGUF:UD-Q4_K_XL",
                name: "Laguna S 2.1",
                reasoning: true,
                input: ["text"],
                cost: {
                    input: 0.05,
                    output: 1.0,
                    cacheRead: 0.01,
                    cacheWrite: 0.01,
                },
                contextWindow: 2**18,
                maxTokens: 8192,
            },
            {
                id: "unsloth/Laguna-S-2.1-GGUF:UD-Q5_K_XL",
                name: "Laguna S 2.1",
                reasoning: true,
                input: ["text"],
                cost: {
                    input: 0.05,
                    output: 1.0,
                    cacheRead: 0.01,
                    cacheWrite: 0.01,
                },
                contextWindow: 2**18,
                maxTokens: 8192,
            },
            {
                id: "unsloth/Laguna-XS-2.1-GGUF:Q4_K_M",
                name: "Laguna XS 2.1",
                reasoning: true,
                input: ["text"],
                cost: {
                    input: 0.05,
                    output: 1.0,
                    cacheRead: 0.01,
                    cacheWrite: 0.01,
                },
                contextWindow: 2**18,
                maxTokens: 8192,
            }
        ]
    });

    pi.registerProvider("m33-ollama", {
        name: "m.33 (ollama)",
        baseUrl: "http://m33.lan:11434/v1",
        apiKey: "asdf",
        api: "openai-completions",
        models: [
            {
                id: "laguna-s-2.1",
                name: "Laguna S 2.1 (ollama)",
                reasoning: false,
                input: ["text"],
                cost: {
                    input: 0.05,
                    output: 1.0,
                    cacheRead: 0.01,
                    cacheWrite: 0.01,
                },
                contextWindow: 1048576,
                maxTokens: 8192,
            },
            {
                id: "qwen3.6:35b-a3b-q8_0",
                name: "Qwen3.6 35B Q8_0",
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
