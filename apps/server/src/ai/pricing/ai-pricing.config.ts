// Source: https://openrouter.ai/models (prices verified 2026-04-29)
// Update this file and redeploy when OpenRouter changes prices.
// Historical logs (costUsd = null) can be recomputed via: npm run backfill:costs

export interface ModelPricing {
    modelId: string;
    inputPricePerMillion: number;
    outputPricePerMillion: number;
    notes?: string;
}

export const MODEL_PRICING: ModelPricing[] = [
    {
        modelId: 'anthropic/claude-sonnet-4',
        inputPricePerMillion: 3.0,
        outputPricePerMillion: 15.0,
    },
    {
        modelId: 'anthropic/claude-haiku-4-5',
        inputPricePerMillion: 0.8,
        outputPricePerMillion: 4.0,
    },
    {
        modelId: 'google/gemini-2.0-flash-001',
        inputPricePerMillion: 0.1,
        outputPricePerMillion: 0.4,
    },
    {
        modelId: 'openai/gpt-4o',
        inputPricePerMillion: 2.5,
        outputPricePerMillion: 10.0,
    },
    {
        modelId: 'openai/gpt-4o-mini',
        inputPricePerMillion: 0.15,
        outputPricePerMillion: 0.6,
    },
    {
        modelId: 'anthropic/claude-opus-4',
        inputPricePerMillion: 15.0,
        outputPricePerMillion: 75.0,
    },
    {
        modelId: 'anthropic/claude-haiku-4-5-20251001',
        inputPricePerMillion: 0.8,
        outputPricePerMillion: 4.0,
        notes: 'Versioned alias of claude-haiku-4-5',
    },
    {
        modelId: 'google/gemini-2.5-pro',
        inputPricePerMillion: 1.25,
        outputPricePerMillion: 10.0,
    },
    {
        modelId: 'google/gemini-2.5-flash',
        inputPricePerMillion: 0.15,
        outputPricePerMillion: 0.6,
    },
];

/**
 * Calculates the USD cost for an AI interaction.
 * Returns null if the model is not in the pricing table — never throws.
 */
export function calculateCostUsd(
    modelId: string,
    promptTokens: number,
    completionTokens: number,
): number | null {
    const pricing = MODEL_PRICING.find((p) => p.modelId === modelId);
    if (!pricing) return null;

    const inputCost = (promptTokens / 1_000_000) * pricing.inputPricePerMillion;
    const outputCost = (completionTokens / 1_000_000) * pricing.outputPricePerMillion;

    return Number((inputCost + outputCost).toFixed(8));
}

export function getModelPricing(modelId: string): ModelPricing | null {
    return MODEL_PRICING.find((p) => p.modelId === modelId) ?? null;
}

export function usdToBrl(usd: number): number {
    const rate = parseFloat(process.env['EXCHANGE_RATE_USD_BRL'] ?? '5.80');
    return Number((usd * rate).toFixed(4));
}
