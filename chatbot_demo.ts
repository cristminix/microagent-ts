import { LLM } from './microAgents/llm/llm';
import { MicroAgent, Tool, BaseMessageStore } from './microAgents/core';
import * as readline from 'readline';

// Initialize LLM
const chatLLM = new LLM(
    "http://127.0.0.1:4567/v1",
    "sk-1234",
    "qwen-portal,qwen3-coder-plus",
    4000,
    0.8,
    0.9
);

// Global in-memory databases
const ordersDb: { [key: string]: { items: string[]; status: string } } = {
    "1001": { items: ["Large Pepperoni"], status: "Delivered" },
    "1002": { items: ["Medium Veggie"], status: "Preparing" }
};

const concernsDb: { [key: string]: any } = {};
let nextConcernId = 1;

// Define tools with proper type information
const orderDetails = (order_id: string): any => {
    /** Returns details for a specific order */
    return ordersDb[order_id] || { error: "Order not found" };
};

const orderHistory = (): any[] => {
    /** Returns order history for the single user */
    return Object.values(ordersDb);
};

const createConcern = (description: string): any => {
    /** Creates and stores a new customer concern for the single user */
    const concernId = `CON-${nextConcernId}`;
    concernsDb[concernId] = {
        id: concernId,
        description: description,
        status: "Open",
        timestamp: new Date().toISOString()
    };
    nextConcernId++;
    return concernsDb[concernId];
};

const getConcernDetails = (concern_id: string): any => {
    /** Returns details for a specific concern */
    return concernsDb[concern_id] || { error: "Concern not found" };
};

// Create agents with properly typed tools
const orderAgent = new MicroAgent(
    chatLLM,
    "You are an order management assistant. Handle order details and history.",
    [
        new Tool({
            description: "Returns order details",
            func: orderDetails,
            parameters: {
                order_id: { type: 'string', required: true }
            }
        }),
        new Tool({
            description: "Returns order history",
            func: orderHistory,
            parameters: {}
        })
    ]
);

const concernAgent = new MicroAgent(
    chatLLM,
    "You are a customer concern assistant. Handle customer issues and concerns.",
    [
        new Tool({
            description: "Creates a new concern",
            func: createConcern,
            parameters: {
                description: { type: 'string', required: true }
            }
        }),
        new Tool({
            description: "Returns concern details",
            func: getConcernDetails,
            parameters: {
                concern_id: { type: 'string', required: true }
            }
        })
    ]
);

class Orchestrator extends MicroAgent {
    orderAgent: MicroAgent;
    concernAgent: MicroAgent;

    constructor() {
        super(
            chatLLM,
            `You are a chat orchestrator. Route messages to appropriate agents.

1. For order-related queries, output exactly: ORDER_AGENT NEEDED
2. For concern-related queries, output exactly: CONCERN_AGENT NEEDED
3. Otherwise respond like a generic chat assistant
4. Do not use any tools yourself.`,
            []
        );
        this.orderAgent = orderAgent;
        this.concernAgent = concernAgent;
    }

    async executeAgent(query: string, messageStore: BaseMessageStore): Promise<string> {
        /** Handle full query flow through orchestrator. */
        // console.log(`\nDebug: Orchestrator analyzing query: ${query}`);

        // Get initial analysis from orchestrator
        const analysis = await super.executeAgent(query, messageStore);
        // console.log(`Debug: Orchestrator analysis result: ${analysis}`);

        if (analysis.includes("ORDER_AGENT NEEDED")) {
            // console.log("Debug: Routing to Order Agent");
            const result = await this.orderAgent.executeAgent(query, messageStore);
            // console.log(`Debug: Order Agent result: ${result}`);
            return this._formatResult("Order Agent", result);
        } else if (analysis.includes("CONCERN_AGENT NEEDED")) {
            // console.log("Debug: Routing to Concern Agent");
            const result = await this.concernAgent.executeAgent(query, messageStore);
            // console.log(`Debug: Concern Agent result: ${result}`);
            return this._formatResult("Concern Agent", result);
        } else {
            return analysis;
        }
    }

    _formatResult(agentName: string, result: string): string {
        /** Format the final result from an agent. */
        return `Orchestrator: Result from ${agentName}:\n${result}`;
    }
}

// Create readline interface for user input
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

async function main() {
    const messageStore = new BaseMessageStore();
    const orchestrator = new Orchestrator();

    console.log("Welcome to Dominos Pizza Chat Support!");
    console.log("I can help with order details, order history, or concerns/issues.");
    console.log("Type 'quit' to exit.\n");

    const askQuestion = (): Promise<string> => {
        return new Promise((resolve) => {
            rl.question("\nYou: ", (answer) => {
                resolve(answer);
            });
        });
    };

    while (true) {
        const userInput = await askQuestion();
        if (userInput.toLowerCase() === 'quit') {
            break;
        }

        const response = await orchestrator.executeAgent(userInput, messageStore);
        console.log(`Agent: ${response}`);
        // console.log("Debug: Orchestrator routing complete");
    }

    rl.close();
}

if (require.main === module) {
    main().catch(console.error);
}