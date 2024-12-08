// src/index.ts
import { Plugin } from "@ai16z/eliza";
import { farmingOpportunityEvaluator } from "./evaluators/farmingOpportunityEvaluator";
import { dexDataProvider } from "./providers/dexDataProvider";
import { dexScreenerProvider } from "./providers/dexScreenerProvider";
import { farmingStrategyProvider } from "./providers/farmingStrategyProvider";
import { farmingPositionAction } from "./actions/farmingPositionAction";

export const basePlugin: Plugin = {
    name: "base",
    description: "Base chain DeFi operations plugin",

    providers: [dexDataProvider, dexScreenerProvider, farmingStrategyProvider],

    evaluators: [farmingOpportunityEvaluator],

    actions: [farmingPositionAction],

    setup: async (runtime) => {
        // Initialize any necessary services or connections
        console.log("Base plugin initialized");
    },
};

export default basePlugin;
