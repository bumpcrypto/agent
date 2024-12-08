import { config } from "dotenv";
import { resolve } from "path";

// Load environment variables from parent directory's .env file
config({ path: resolve(__dirname, "../../../../.env") });

export const getEnvConfig = () => ({
    tenderlyBaseRpcUrl: process.env.TENDERLY_BASE_RPC_URL,
    tenderlyBaseExplorerUrl: process.env.TENDERLY_BASE_EXPLORER_URL,
    tenderlyChainId: process.env.TENDERLY_CHAIN_ID
        ? parseInt(process.env.TENDERLY_CHAIN_ID)
        : 8453,
});

// Validate required environment variables
export const validateEnvConfig = () => {
    const required = ["TENDERLY_BASE_RPC_URL"];
    const missing = required.filter((key) => !process.env[key]);

    if (missing.length > 0) {
        throw new Error(
            `Missing required environment variables: ${missing.join(", ")}`
        );
    }
};
