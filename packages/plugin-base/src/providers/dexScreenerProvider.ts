// src/providers/dexScreenerProvider.ts
import { IAgentRuntime, Memory, Provider, State } from "@ai16z/eliza";
import NodeCache from "node-cache";
import axios from "axios";
import * as cheerio from "cheerio"; // For scraping

interface DexScreenerPair {
    chainId: string;
    dexId: string;
    url: string;
    pairAddress: string;
    baseToken: {
        address: string;
        name: string;
        symbol: string;
    };
    quoteToken: {
        address: string;
        name: string;
        symbol: string;
    };
    priceUsd: string;
    priceNative: string;
    priceDiff: {
        m5: number;
        h1: number;
        h6: number;
        h24: number;
    };
    volume: {
        m5: number;
        h1: number;
        h6: number;
        h24: number;
    };
    txns: {
        m5: { buys: number; sells: number };
        h1: { buys: number; sells: number };
        h6: { buys: number; sells: number };
        h24: { buys: number; sells: number };
    };
    liquidity: {
        usd: number;
        base: number;
        quote: number;
    };
    fdv: number; // Fully Diluted Valuation
    pairCreatedAt: number;
}

interface TrendingData {
    timeframe: string; // "5m" | "1h" | "6h" | "24h"
    pairs: Array<{
        pairAddress: string;
        baseToken: string;
        quoteToken: string;
        trendingScore: number;
        buys: number;
        sells: number;
    }>;
}

export class DexScreenerProvider {
    private cache: NodeCache;
    private API_URL = "https://api.dexscreener.com/latest/dex";
    private TRENDING_URLS = {
        "5m": "https://dexscreener.com/base?rankBy=trendingScoreM5&order=desc",
        "1h": "https://dexscreener.com/base?rankBy=trendingScoreH1&order=desc",
        "6h": "https://dexscreener.com/base?rankBy=trendingScoreH6&order=desc",
        "24h": "https://dexscreener.com/base?rankBy=trendingScoreH24&order=desc",
    };

    constructor() {
        this.cache = new NodeCache({ stdTTL: 60 }); // 1 minute cache
    }

    async getPairsByTokenAddress(
        tokenAddress: string
    ): Promise<DexScreenerPair[]> {
        const cacheKey = `token-${tokenAddress}`;
        const cached = this.cache.get<DexScreenerPair[]>(cacheKey);
        if (cached) return cached;

        const response = await axios.get(
            `${this.API_URL}/tokens/${tokenAddress}`
        );
        const pairs = response.data.pairs;

        this.cache.set(cacheKey, pairs);
        return pairs;
    }

    async getTrendingPairs(
        timeframe: "5m" | "1h" | "6h" | "24h"
    ): Promise<TrendingData> {
        const cacheKey = `trending-${timeframe}`;
        const cached = this.cache.get<TrendingData>(cacheKey);
        if (cached) return cached;

        // Scrape the trending page
        const response = await axios.get(this.TRENDING_URLS[timeframe]);
        const $ = cheerio.load(response.data);

        // Need to implement scraping logic based on DexScreener's HTML structure
        // This would extract trending pairs data from the page
        const pairs = []; // Implement scraping logic

        const trendingData = {
            timeframe,
            pairs,
        };

        this.cache.set(cacheKey, trendingData);
        return trendingData;
    }

    async getBuySellActivity(): Promise<any> {
        // Similar implementation for buy/sell rankings
    }

    private formatDataForAgent(data: any): string {
        return `
🔥 TRENDING PAIRS (Last 5 Minutes)
    ${this.formatTrendingSection(data.trending5m)}

📈 TRENDING PAIRS (Last Hour)
${this.formatTrendingSection(data.trending1h)}

💰 HIGH VOLUME PAIRS (24H)
${this.formatVolumeSection(data.highVolume)}

🚀 MOST BUYS (Last Hour)
${this.formatTradeSection(data.highBuys)}

📉 MOST SELLS (Last Hour)
${this.formatTradeSection(data.highSells)}

⚡ NEW PAIRS WITH MOMENTUM
${this.formatNewPairsSection(data.newPairs)}
`;
    }

    private formatTrendingSection(pairs: any[]): string {
        return pairs
            .map(
                (pair) => `
${pair.baseToken}/${pair.quoteToken}
- Price: $${pair.priceUsd}
- Price Change (1H): ${pair.priceChange.h1}%
- Volume (1H): $${this.formatNumber(pair.volume.h1)}
- Buys/Sells: ${pair.txns.h1.buys}/${pair.txns.h1.sells}
- Trending Score: ${pair.trendingScore}
- Liquidity: $${this.formatNumber(pair.liquidity.usd)}
`
            )
            .join("\n");
    }

    async scrapeTrendingPairs(
        timeframe: "5m" | "1h" | "6h" | "24h"
    ): Promise<TrendingData> {
        const response = await axios.get(this.TRENDING_URLS[timeframe]);
        const $ = cheerio.load(response.data);

        const pairs = [];

        // DexScreener's table structure
        $(".table-row").each((_, element) => {
            const $row = $(element);

            const pair = {
                pairAddress:
                    $row
                        .find('[data-column="pair"]')
                        .attr("href")
                        ?.split("/")
                        .pop() || "",
                baseToken: $row.find(".token-symbol").first().text(),
                quoteToken: $row.find(".token-symbol").last().text(),
                trendingScore: parseFloat(
                    $row.find('[data-column="trending"]').text()
                ),
                priceUsd: $row.find('[data-column="price"]').text(),
                priceChange: {
                    h1: parseFloat($row.find('[data-column="h1"]').text()),
                    h24: parseFloat($row.find('[data-column="h24"]').text()),
                },
                volume: parseFloat(
                    $row
                        .find('[data-column="volume"]')
                        .text()
                        .replace("$", "")
                        .replace(",", "")
                ),
                liquidity: parseFloat(
                    $row
                        .find('[data-column="liquidity"]')
                        .text()
                        .replace("$", "")
                        .replace(",", "")
                ),
                buys: parseInt($row.find('[data-column="buys"]').text()),
                sells: parseInt($row.find('[data-column="sells"]').text()),
            };

            pairs.push(pair);
        });

        return {
            timeframe,
            pairs,
        };
    }

    async getHighBuyPairs(): Promise<DexScreenerPair[]> {
        const cacheKey = "high-buys";
        const cached = this.cache.get<DexScreenerPair[]>(cacheKey);
        if (cached) return cached;

        const response = await axios.get(
            `${this.DEXSCREENER_URL}/base?rankBy=buys&order=desc`
        );
        const $ = cheerio.load(response.data);
        const pairs = this.scrapeTableData($);

        this.cache.set(cacheKey, pairs, 60); // 1 minute cache
        return pairs;
    }

    async getHighSellPairs(): Promise<DexScreenerPair[]> {
        const cacheKey = "high-sells";
        const cached = this.cache.get<DexScreenerPair[]>(cacheKey);
        if (cached) return cached;

        const response = await axios.get(
            `${this.DEXSCREENER_URL}/base?rankBy=sells&order=desc`
        );
        const $ = cheerio.load(response.data);
        const pairs = this.scrapeTableData($);

        this.cache.set(cacheKey, pairs, 60);
        return pairs;
    }
}

export const dexScreenerProvider: Provider = {
    get: async (
        runtime: IAgentRuntime,
        message: Memory,
        state?: State
    ): Promise<string> => {
        try {
            const provider = new DexScreenerProvider();

            // Get data from multiple timeframes
            const [trending5m, trending1h] = await Promise.all([
                provider.getTrendingPairs("5m"),
                provider.getTrendingPairs("1h"),
            ]);

            // Format all the data for the agent
            return provider.formatDataForAgent({
                trending: trending5m,
                highActivity: trending1h,
            });
        } catch (error) {
            console.error("Error in dex screener provider:", error);
            return "";
        }
    },
};
