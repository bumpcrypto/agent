import { Provider, IAgentRuntime, Memory, State } from "@ai16z/eliza";

interface PortfolioPosition {
    pairAddress: string;
    tier: number;
    allocatedAmount: number;
    entryPrice: number;
    range: {
        lower: number;
        upper: number;
    };
}

interface PortfolioState {
    totalTVL: number;
    positions: PortfolioPosition[];
    tierAllocations: {
        [key: number]: number;
    };
}

function formatPortfolio(portfolio?: PortfolioState): string {
    if (!portfolio) return "No active positions";

    const tierSummary = Object.entries(portfolio.tierAllocations)
        .map(
            ([tier, amount]) =>
                `Tier ${tier}: $${amount.toLocaleString()} (${((amount / portfolio.totalTVL) * 100).toFixed(1)}%)`
        )
        .join("\n");

    const positions = portfolio.positions
        .map(
            (pos) =>
                `${pos.pairAddress}: $${pos.allocatedAmount.toLocaleString()} (Tier ${pos.tier})`
        )
        .join("\n");

    return `
TVL: $${portfolio.totalTVL.toLocaleString()}

Tier Allocations:
${tierSummary}

Active Positions:
${positions}
    `.trim();
}

function formatOpportunities(opportunities?: any[]): string {
    if (!opportunities?.length) return "No current opportunities";

    return opportunities
        .map((opp) =>
            `
${opp.pairAddress}:
- Score: ${(opp.score * 100).toFixed(1)}%
- Suggested Range: $${opp.suggestedRange.lower.toFixed(4)} - $${opp.suggestedRange.upper.toFixed(4)}
- Reasoning: ${opp.reasoning}
        `.trim()
        )
        .join("\n\n");
}

export const farmingStrategyProvider: Provider = {
    get: async (runtime: IAgentRuntime, message: Memory, state?: State) => {
        return `
As Brian Farmstrong, you manage a $1M TVL vault with these core principles:

Portfolio Structure:
- Tier 1 (40%): Blue chip memecoins, proven volume
- Tier 2 (35%): Momentum plays, <1 month old
- Tier 3 (25%): High-risk alpha opportunities

Risk Rules:
- Max position size: 15% TVL ($150,000)
- Min positions: 8-10 active
- New position size: Start at 5% TVL ($50,000)

Exit Conditions:
- Volume drop >70%
- Buy/sell ratio <0.8 for 48h
- Signs of rugpull
- Fee APR below tier minimum (Tier 1: 30%, Tier 2: 50%, Tier 3: 100%)

Current Portfolio State:
${formatPortfolio(state?.portfolioData)}

Recent Evaluations:
${formatOpportunities(state?.farmingOpportunities)}

Make decisions based on:
1. Current tier allocations vs targets
2. Opportunity scores and metrics
3. Risk exposure and diversification
4. Market conditions and momentum
        `.trim();
    },
};
