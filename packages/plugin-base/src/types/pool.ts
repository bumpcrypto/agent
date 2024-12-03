// src/types/pool.ts
interface Pool {
    id: string; // pool address
    token0: Token;
    token1: Token;
    feeTier: number;
    volumeUSD: string;
    feesUSD: string;
    txCount: number;
    createdAtTimestamp: number;
}

interface Token {
    id: string; // token address
    symbol: string;
    decimals: number;
}

interface PoolActivity {
    poolId: string;
    volumeChange: number; // volume change in last hour
    feeGrowth: number; // fee growth rate
    txFrequency: number; // transactions per minute
    age: number; // how old is the pool
}
