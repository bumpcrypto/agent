import { defineChain, Hex } from "viem";

export const virtual_base = defineChain({
    id: 8453,
    name: "Virtual Base",
    nativeCurrency: { name: "VETH", symbol: "vETH", decimals: 18 },
    rpcUrls: {
        default: {
            http: [
                process.env.TENDERLY_BASE_RPC_URL ||
                    "https://virtual.base.rpc.tenderly.co/66aec041-88fa-4eac-8a03-70e6bf68590c",
            ],
        },
    },
    blockExplorers: {
        default: {
            name: "Tenderly Explorer",
            url:
                process.env.TENDERLY_BASE_EXPLORER_URL ||
                "https://virtual.base.rpc.tenderly.co/fd788d22-a447-4118-a7cb-abe656057dbe",
        },
    },
});

export type TSetBalanceRpc = {
    method: "tenderly_setBalance";
    Parameters: [addresses: Hex[], value: Hex];
    ReturnType: Hex;
};

export type TSetErc20BalanceRpc = {
    method: "tenderly_setErc20Balance";
    Parameters: [erc20: Hex, to: Hex, value: Hex];
    ReturnType: Hex;
};
