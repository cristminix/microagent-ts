/** Simple end-to-end demo with math agents and orchestrator. */

import { LLM } from './microAgents/llm/llm';
import { MicroAgent, Tool, BaseMessageStore } from './microAgents/core';

// Initialize LLM
const mathLLM = new LLM(
    // "http://127.0.0.1:4567/v1",
    "http://127.0.0.1:3003/v1",
    "sk-1234",
    // "qwen-portal,qwen3-coder-plus",
    "gemini-2.5-flash",
    4000,
    0.8,
    0.9
);

// Define tools with proper type information
const addNumbers = (a: number, b: number): number => {
    /** Adds two numbers together. */
    return a + b;
};

const multiplyNumbers = (a: number, b: number): number => {
    /** Multiplies two numbers together. */
    return a * b;
};

const factorial = (n: number): number => {
    /** Calculates factorial of a number. */
    if (n === 0 || n === 1) {
        return 1;
    }
    return n * factorial(n - 1);
};

// Create agents with properly typed tools
const simpleMathAgent = new MicroAgent(
    mathLLM,
    "You are a simple math assistant. Handle basic arithmetic operations.",
    [
        new Tool({
            description: "Adds two numbers",
            func: addNumbers,
            parameters: {
                a: { type: 'number', required: true },
                b: { type: 'number', required: true }
            }
        }),
        new Tool({
            description: "Multiplies two numbers",
            func: multiplyNumbers,
            parameters: {
                a: { type: 'number', required: true },
                b: { type: 'number', required: true }
            }
        })
    ]
);

const advancedMathAgent = new MicroAgent(
    mathLLM,
    "You are an advanced math assistant. Handle complex math operations.",
    [
        new Tool({
            description: "Calculates factorial",
            func: factorial,
            parameters: {
                n: { type: 'number', required: true }
            }
        })
    ]
);

class Orchestrator extends MicroAgent {
    simpleMathAgent: MicroAgent;
    advancedMathAgent: MicroAgent;

    constructor() {
        super(
            mathLLM,
            `You are a math query analyzer. For each query:
1. If it contains basic arithmetic (addition, subtraction, multiplication, division), output exactly: SIMPLE_MATHS NEEDED
2. If it contains advanced math (factorials, exponents, logarithms, derivatives, integrals), output exactly: ADVANCED_MATHS NEEDED
3. If unsure, output exactly: UNKNOWN_MATH_TYPE

Examples:
- "What is 5 plus 3?" → SIMPLE_MATHS NEEDED
- "Calculate 10 factorial" → ADVANCED_MATHS NEEDED
- "Solve x^2 + 2x + 1 = 0" → UNKNOWN_MATH_TYPE

Always output exactly one of these three options, nothing else.`,
            []
        );
        this.simpleMathAgent = simpleMathAgent;
        this.advancedMathAgent = advancedMathAgent;
    }

    async executeAgent(query: string, messageStore: BaseMessageStore): Promise<string> {
        /** Handle full query flow through orchestrator. */
        console.log(`\nDebug: Orchestrator analyzing query: ${query}`);

        // Get initial analysis from orchestrator
        const analysis = await super.executeAgent(query, messageStore);
        console.log(`Debug: Orchestrator analysis result: ${analysis}`);

        if (analysis.includes("SIMPLE_MATHS NEEDED")) {
            console.log("Debug: Routing to Simple Math Agent");
            const result = await this.simpleMathAgent.executeAgent(query, messageStore);
            console.log(`Debug: Simple Math Agent result: ${result}`);
            return this._formatResult("Simple Math Agent", result);
        } else if (analysis.includes("ADVANCED_MATHS NEEDED")) {
            console.log("Debug: Routing to Advanced Math Agent");
            const result = await this.advancedMathAgent.executeAgent(query, messageStore);
            console.log(`Debug: Advanced Math Agent result: ${result}`);
            return this._formatResult("Advanced Math Agent", result);
        } else {
            return "Orchestrator: Unable to determine the appropriate agent for this query.";
        }
    }

    _formatResult(agentName: string, result: string): string {
        /** Format the final result from an agent. */
        return `Orchestrator: Result from ${agentName}:\n${result}`;
    }
}

async function main() {
    const messageStore = new BaseMessageStore();
    const orchestrator = new Orchestrator();

    // Example queries that demonstrate XML-style tool calls
    const queries = [
        "What is 15 plus 27?",
        "Calculate 5 factorial",
        "Multiply 8 by 9",
        "First add 3 and 5, then multiply the result by 2"
    ];

    for (const query of queries) {
        console.log(`\nUser: ${query}`);
        const response = await orchestrator.executeAgent(query, messageStore);
        console.log(`${response}`);
    }
}

if (require.main === module) {
    main().catch(console.error);
}