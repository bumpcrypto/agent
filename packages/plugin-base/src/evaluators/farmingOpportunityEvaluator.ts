import { Evaluator, IAgentRuntime, Memory, State } from "@ai16z/eliza";

interface FarmingMetrics {
    volumeToLiquidity: number;
    feeAPR: number;
    priceVolatility: number;
    buyToSellRatio: number;
    ageHours: number;
}

export const farmingOpportunityEvaluator: Evaluator = {
    name: "FARMING_OPPORTUNITY",
    similes: ["YIELD_FARMING", "LP_OPPORTUNITY"],
    description:
        "Evaluates memecoin farming opportunities based on volume, fees, and momentum",

    validate: async (runtime: IAgentRuntime, message: Memory) => {
        const state = message.state as State;
        return !!(state?.dexScreenerData || state?.uniswapData);
    },

    handler: async (runtime: IAgentRuntime, message: Memory, state?: State) => {
        try {
            // Get data from our providers
            const dexScreenerData = state?.dexScreenerData;
            const uniswapData = state?.uniswapData;

            // Score each potential opportunity
            const opportunities = await evaluateOpportunities(
                runtime,
                dexScreenerData,
                uniswapData
            );

            // Store evaluation results in memory
            await storeOpportunities(runtime, opportunities);

            return opportunities;
        } catch (error) {
            console.error("Failed to evaluate farming opportunities:", error);
            return [];
        }
    },
};

async function evaluateOpportunities(
    runtime: IAgentRuntime,
    dexScreenerData: any,
    uniswapData: any
) {
    const opportunities = [];

    for (const pair of dexScreenerData.pairs) {
        const metrics = calculateMetrics(pair);

        // Score based on our strategy
        const score = scoreOpportunity(metrics);

        if (score > 0.7) {
            // High potential opportunity
            opportunities.push({
                pairAddress: pair.pairAddress,
                score,
                suggestedRange: calculateOptimalRange(pair),
                metrics,
                reasoning: generateReasoning(metrics),
            });
        }
    }

    return opportunities;
}

function calculateMetrics(pair: any): FarmingMetrics {
    return {
        volumeToLiquidity: pair.volume24h / pair.liquidity,
        feeAPR: calculateFeeAPR(pair),
        priceVolatility: calculateVolatility(pair),
        buyToSellRatio: pair.txns.h24.buys / pair.txns.h24.sells,
        ageHours: (Date.now() - pair.pairCreatedAt) / (1000 * 60 * 60),
    };
}

function calculateOptimalRange(pair: any) {
    const currentPrice = parseFloat(pair.priceUsd);
    return {
        lower: currentPrice * 0.75, // 25% below current price
        upper: currentPrice * 2.5, // 2.5x above current price
    };
}

async function storeOpportunities(
    runtime: IAgentRuntime,
    opportunities: any[]
) {
    for (const opp of opportunities) {
        await runtime.messageManager.createMemory({
            type: "farming_opportunity",
            content: {
                pairAddress: opp.pairAddress,
                score: opp.score,
                suggestedRange: opp.suggestedRange,
                metrics: opp.metrics,
                reasoning: opp.reasoning,
                timestamp: Date.now(),
            },
            roomId: "farming", // We can organize by strategy
            agentId: runtime.agentId,
        });
    }
}

function calculateFeeAPR(pair: any): number {
    const dailyVolume = pair.volume24h;
    const feeRate = 0.003; // 0.3% fee rate for most pools
    const dailyFees = dailyVolume * feeRate;
    const annualFees = dailyFees * 365;
    return (annualFees / pair.liquidity) * 100;
}

function calculateVolatility(pair: any): number {
    // Calculate price volatility using high/low range
    const priceHigh =
        parseFloat(pair.priceUsd) * (1 + pair.priceChange.h24 / 100);
    const priceLow =
        parseFloat(pair.priceUsd) * (1 - pair.priceChange.h24 / 100);
    return (priceHigh - priceLow) / parseFloat(pair.priceUsd);
}

function scoreOpportunity(metrics: FarmingMetrics): number {
    let score = 0;

    // Volume to liquidity ratio (0-30 points)
    // Higher ratio means more trading activity relative to pool size
    const vtlScore = Math.min(metrics.volumeToLiquidity * 100, 30);
    score += vtlScore;

    // Fee APR (0-25 points)
    // Higher APR from fees is better
    const feeScore = Math.min(metrics.feeAPR / 4, 25);
    score += feeScore;

    // Buy/Sell ratio (0-20 points)
    // We want more buys than sells (bullish momentum)
    const bsrScore =
        metrics.buyToSellRatio > 1
            ? Math.min((metrics.buyToSellRatio - 1) * 10, 20)
            : 0;
    score += bsrScore;

    // Age penalty (0-15 points)
    // Newer pools are riskier but have more potential
    const ageScore = Math.min(15, metrics.ageHours / 24);
    score += ageScore;

    // Volatility score (0-10 points)
    // Some volatility is good for range trading
    const volScore =
        metrics.priceVolatility < 0.5
            ? metrics.priceVolatility * 20
            : Math.max(0, 10 - (metrics.priceVolatility - 0.5) * 10);
    score += volScore;

    // Normalize to 0-1 range
    return score / 100;
}

function generateReasoning(metrics: FarmingMetrics): string {
    const reasons = [];

    if (metrics.volumeToLiquidity > 0.3) {
        reasons.push("High trading volume relative to liquidity");
    }
    if (metrics.feeAPR > 50) {
        reasons.push("Strong fee APR potential");
    }
    if (metrics.buyToSellRatio > 1.2) {
        reasons.push("Bullish buy pressure");
    }
    if (metrics.ageHours < 48) {
        reasons.push("New pool with growth potential");
    }
    if (metrics.priceVolatility > 0.2 && metrics.priceVolatility < 0.5) {
        reasons.push("Healthy volatility for range trading");
    }

    return reasons.join(". ") + ".";
}
