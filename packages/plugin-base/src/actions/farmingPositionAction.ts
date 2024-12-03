import { Action, IAgentRuntime, Memory, State } from "@ai16z/eliza";
import { MemoryManager } from "@ai16z/eliza";
import { ethers } from "ethers";
import {
    Pool,
    Position,
    nearestUsableTick,
    NonfungiblePositionManager,
    SwapRouter,
} from "@uniswap/v3-sdk";
import { Token, CurrencyAmount, Percent, Fraction } from "@uniswap/sdk-core";
import { AlphaRouter } from "@uniswap/smart-order-router";

// Contract addresses for Base
const WETH_ADDRESS = "0x4200000000000000000000000000000000000006";
const V3_SWAP_ROUTER_ADDRESS = "0x2626664c2603336E57B271c5C0b26F421741e481";
const NONFUNGIBLE_POSITION_MANAGER_ADDRESS =
    "0x03a520b32C04BF3bE5F46662AE1bD8C0C1b133B0";
const POOL_FACTORY_ADDRESS = "0x33128a8fC17869897dcE68Ed026d694621f6FDfD";

interface PositionDecision {
    type: "ENTER" | "EXIT" | "ADJUST";
    pairAddress: string;
    amount?: number;
    range?: {
        lower: number;
        upper: number;
    };
    reasoning: string;
}

async function executePosition(
    runtime: IAgentRuntime,
    decision: PositionDecision,
    provider: ethers.Provider,
    signer: ethers.Signer
) {
    // 1. Get pool info and create tokens
    const poolInfo = await getPoolInfo(decision.pairAddress);
    const token0 = new Token(8453, poolInfo.token0, poolInfo.decimals0);
    const token1 = new Token(8453, poolInfo.token1, poolInfo.decimals1);

    // 2. Setup router for optimal swap
    const router = new AlphaRouter({ chainId: 8453, provider });

    // 3. Create pool instance
    const pool = new Pool(
        token0,
        token1,
        poolInfo.fee,
        poolInfo.sqrtPriceX96.toString(),
        poolInfo.liquidity.toString(),
        poolInfo.tick
    );

    // 4. Calculate amounts for position
    const wethAmount = ethers.parseEther((decision.amount! / 2).toString());
    const token0Amount = CurrencyAmount.fromRawAmount(
        token0,
        wethAmount.toString()
    );
    const token1Amount = CurrencyAmount.fromRawAmount(
        token1,
        wethAmount.toString()
    );

    // 5. Create position instance
    const position = Position.fromAmounts({
        pool,
        tickLower:
            nearestUsableTick(pool.tickCurrent, pool.tickSpacing) -
            pool.tickSpacing * 2,
        tickUpper:
            nearestUsableTick(pool.tickCurrent, pool.tickSpacing) +
            pool.tickSpacing * 2,
        amount0: token0Amount.quotient,
        amount1: token1Amount.quotient,
        useFullPrecision: true,
    });

    // 6. Get approval for tokens
    const token0Contract = new ethers.Contract(
        token0.address,
        [
            "function approve(address spender, uint256 amount) public returns (bool)",
        ],
        signer
    );
    const token1Contract = new ethers.Contract(
        token1.address,
        [
            "function approve(address spender, uint256 amount) public returns (bool)",
        ],
        signer
    );

    await token0Contract.approve(
        NONFUNGIBLE_POSITION_MANAGER_ADDRESS,
        ethers.MaxUint256
    );
    await token1Contract.approve(
        NONFUNGIBLE_POSITION_MANAGER_ADDRESS,
        ethers.MaxUint256
    );

    // 7. Setup minting parameters
    const mintOptions = {
        recipient: await signer.getAddress(),
        deadline: Math.floor(Date.now() / 1000) + 1200, // 20 min
        slippageTolerance: new Percent(50, 10_000), // 0.5%
    };

    // 8. Get calldata for minting
    const { calldata, value } = NonfungiblePositionManager.addCallParameters(
        position,
        mintOptions
    );

    // 9. Execute transaction
    const transaction = {
        data: calldata,
        to: NONFUNGIBLE_POSITION_MANAGER_ADDRESS,
        value: value,
        from: await signer.getAddress(),
        gasLimit: ethers.parseUnits("500000", "wei"), // Adjust as needed
    };

    const tx = await signer.sendTransaction(transaction);
    await tx.wait();

    return tx.hash;
}

async function getPoolInfo(poolAddress: string) {
    // TODO: Implement getting pool info from Uniswap subgraph
    // Should return: token0, token1, decimals0, decimals1, fee, sqrtPriceX96, liquidity, tick
    return {
        token0: "",
        token1: "",
        decimals0: 18,
        decimals1: 18,
        fee: 3000,
        sqrtPriceX96: "0",
        liquidity: "0",
        tick: 0,
    };
}

async function executeStrategy(
    runtime: IAgentRuntime,
    strategy: string,
    portfolio: any,
    opportunities: any[]
): Promise<PositionDecision[]> {
    const decisions: PositionDecision[] = [];
    const positionManager = new MemoryManager({
        runtime,
        tableName: "farming_positions",
    });

    // Execute each decision
    for (const decision of decisions) {
        try {
            const provider = new ethers.JsonRpcProvider(
                "https://mainnet.base.org"
            );
            // TODO: Get signer from runtime securely
            const signer = new ethers.Wallet("PRIVATE_KEY", provider);

            const txHash = await executePosition(
                runtime,
                decision,
                provider,
                signer
            );

            await positionManager.createMemory({
                type: decision.type.toLowerCase(),
                content: {
                    pairAddress: decision.pairAddress,
                    amount: decision.amount,
                    range: decision.range,
                    reasoning: decision.reasoning,
                    txHash,
                    timestamp: Date.now(),
                },
                roomId: "farming",
                agentId: runtime.agentId,
            });
        } catch (error) {
            console.error(
                `Failed to execute position for ${decision.pairAddress}:`,
                error
            );
        }
    }

    return decisions;
}

export const farmingPositionAction: Action = {
    name: "MANAGE_FARMING_POSITION",
    similes: ["FARM_LP", "MANAGE_LP", "ADJUST_POSITION"],
    description:
        "Manages LP farming positions based on strategy and market conditions",

    validate: async (runtime: IAgentRuntime, message: Memory) => {
        const state = message.state as State;
        return !!(state?.dexScreenerData && state?.portfolioData);
    },

    handler: async (runtime: IAgentRuntime, message: Memory, state?: State) => {
        try {
            const strategyProvider = runtime.getProvider("FARMING_STRATEGY");
            const strategy = await strategyProvider.get(
                runtime,
                message,
                state
            );

            const decisions = await executeStrategy(
                runtime,
                strategy,
                state?.portfolioData,
                state?.farmingOpportunities
            );

            return decisions.length > 0;
        } catch (error) {
            console.error("Failed to execute farming strategy:", error);
            return false;
        }
    },
};
