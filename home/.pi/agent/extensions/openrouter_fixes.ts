import type { ExtensionAPI, ProviderModelConfig } from "@earendil-works/pi-coding-agent";

const EXTRA_MODELS: ProviderModelConfig[] = [
    {
        id: "z-ai/glm-5.2",
        name: "Z.ai: GLM 5.2",
        reasoning: true,
        thinkingLevelMap: { minimal: null, low: null, medium: null, high: "high", xhigh: "xhigh" },
        input: ["text"],
        cost: { input: 0.93, output: 3.0, cacheRead: 0.18, cacheWrite: 0 },
        contextWindow: 1048576,
        maxTokens: 32768,
        compat: { supportsDeveloperRole: false, thinkingFormat: "openrouter" },
    },
];

export default function (pi: ExtensionAPI) {
    pi.on("session_start", async (_event, ctx) => {
        const existing = ctx.modelRegistry
            .getAll()
            .filter((m) => m.provider === "openrouter")
            .map(
                (m): ProviderModelConfig => ({
                    id: m.id,
                    name: m.name,
                    api: m.api,
                    baseUrl: m.baseUrl,
                    reasoning: m.reasoning,
                    thinkingLevelMap: m.thinkingLevelMap,
                    input: m.input as ("text" | "image")[],
                    cost: m.cost,
                    contextWindow: m.contextWindow,
                    maxTokens: m.maxTokens,
                    compat: m.compat,
                }),
            );

        const builtin_openrouter = ctx.modelRegistry.getAll().find((m) => m.provider === "openrouter");
        const apiKey = await ctx.modelRegistry.getApiKeyForProvider("openrouter");

        pi.registerProvider("openrouter", {
            name: ctx.modelRegistry.getProviderDisplayName("openrouter"),
            baseUrl: builtin_openrouter?.baseUrl,
            apiKey,
            api: builtin_openrouter?.api,
            models: [...existing, ...EXTRA_MODELS],
        });
    });
}
