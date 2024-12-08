// src/providers/dexDataProvider.ts
import { IAgentRuntime, Memory, Provider, State } from "@ai16z/eliza";
import { createClient } from "@urql/core";
import NodeCache from "node-cache";
import { Pool, PoolActivity } from "../types/pool";

// GraphQL queries
const NEW_POOLS_QUERY = `
  query NewPools {
    pools(
      orderBy: createdAtTimestamp,
      orderDirection: desc,
      first: 20
    ) {
      id
      token0 {
        id
        symbol
        decimals
      }
      token1 {
        id
        symbol
        decimals
      }
      feeTier
      volumeUSD
      feesUSD
      txCount
      createdAtTimestamp
    }
  }
`;

const HIGH_FEE_POOLS_QUERY = `
  query HighFeePools {
    pools(
      orderBy: feesUSD,
      orderDirection: desc,
      first: 50
    ) {
      id
      token0 {
        id
        symbol
        decimals
      }
      token1 {
        id
        symbol
        decimals
      }
      feeTier
      volumeUSD
      feesUSD
      txCount
      createdAtTimestamp
    }
  }
`;

export class DexDataProvider {
    private cache: NodeCache;
    private uniswapClient;
    private aerodromeClient;

    constructor() {
        this.cache = new NodeCache({ stdTTL: 300 }); // 5 minute cache

        this.uniswapClient = createClient({
            url: "https://api.thegraph.com/subgraphs/name/uniswap/uniswap-v3-base",
        });

        this.aerodromeClient = createClient({
            url: "https://api.thegraph.com/subgraphs/name/aerodrome/base",
        });
    }

    private async getHighFeeGenerators(): Promise<Pool[]> {
        const cacheKey = "high-fee-pools";
        const cached = this.cache.get<Pool[]>(cacheKey);
        if (cached) return cached;

        const response = await this.uniswapClient
            .query(HIGH_FEE_POOLS_QUERY)
            .toPromise();
        const pools = response.data.pools;

        this.cache.set(cacheKey, pools);
        return pools;
    }

    private async getNewPools(): Promise<Pool[]> {
        const cacheKey = "new-pools";
        const cached = this.cache.get<Pool[]>(cacheKey);
        if (cached) return cached;

        const response = await this.uniswapClient
            .query(NEW_POOLS_QUERY)
            .toPromise();
        const pools = response.data.pools;

        this.cache.set(cacheKey, pools);
        return pools;
    }

    private formatPoolDataForAgent(pools: Pool[]): string {
        return pools
            .map((pool) => {
                const age = Date.now() / 1000 - pool.createdAtTimestamp;
                const ageHours = Math.floor(age / 3600);

                return `Pool ${pool.token0.symbol}/${pool.token1.symbol}:
- Fee Tier: ${pool.feeTier / 10000}%
- Volume USD: $${Number(pool.volumeUSD).toLocaleString()}
- Fees USD: $${Number(pool.feesUSD).toLocaleString()}
- Transactions: ${pool.txCount}
- Age: ${ageHours} hours
`;
            })
            .join("\n");
    }

    async getFormattedPoolData(runtime: IAgentRuntime): Promise<string> {
        try {
            const [highFeePools, newPools] = await Promise.all([
                this.getHighFeeGenerators(),
                this.getNewPools(),
            ]);

            return `
High Fee Generating Pools:
${this.formatPoolDataForAgent(highFeePools)}

Recently Created Pools:
${this.formatPoolDataForAgent(newPools)}
`;
        } catch (error) {
            console.error("Error fetching pool data:", error);
            return "";
        }
    }
}

// The provider that the agent will use
export const dexDataProvider: Provider = {
    get: async (
        runtime: IAgentRuntime,
        message: Memory,
        state?: State
    ): Promise<string> => {
        try {
            const provider = new DexDataProvider();
            return await provider.getFormattedPoolData(runtime);
        } catch (error) {
            console.error("Error in dex data provider:", error);
            return "";
        }
    },
};
