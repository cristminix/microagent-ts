# microAgents Framework (TypeScript)

A lightweight LLM orchestration framework for building Multi-Agent AI systems in TypeScript. The framework provides an easy way to create and orchestrate multiple AI agents with XML-style tool calls.

## Key Features

🚀 **Universal Tool Calling Support**
- Works with ANY LLM API that follows OpenAI-compatible format
- **Unique Feature**: Enables function/tool calling even with models that don't natively support it
- XML-based tool calling format that's intuitive and human-readable
- **Type Safety**: Full TypeScript support with proper type definitions

## Framework Comparison

| Framework   | Core Abstractions | Size & Complexity | Dependencies & Integration | Key Advantages | Limitations/Trade-offs |
|------------|------------------|-------------------|---------------------------|----------------|----------------------|
| LangChain  | Agent, Chain    | 405K LOC<br>+166MB | Many vendor wrappers<br>(OpenAI, Pinecone, etc)<br>Many app wrappers (QA, Summarization) | Rich ecosystem<br>Extensive tooling<br>Large community | Heavy footprint<br>Complex setup<br>JSON schema based |
| CrewAI     | Agent, Chain    | 18K LOC<br>+173MB | Many vendor & app wrappers<br>(OpenAI, Anthropic, etc) | Role-based agents<br>Built-in collaboration | Complex hierarchies<br>Heavy dependencies |
| SmolAgent  | Agent           | 8K LOC<br>+198MB | Some integrations<br>(DuckDuckGo, HuggingFace) | Simplified agent design | Limited tool ecosystem<br>Large package size |
| LangGraph  | Agent, Graph    | 37K LOC<br>+51MB | Some DB integrations<br>(PostgresStore, SqliteSaver) | Graph-based flows<br>DAG support | Complex DAG definitions<br>JSON schema based |
| AutoGen    | Agent           | 7K LOC<br>+26MB (core) | Optional integrations<br>(OpenAI, Pinecone) | Lightweight core<br>Modular design | Limited built-in tools |
| microAgents| Agent, Tool     | ~2K LOC<br><1MB | Minimal<br>(node-fetch) | ✓ Universal tool calling<br>✓ XML-based format<br>✓ Ultra lightweight<br>✓ Simple integration<br>✓ Any OpenAI-compatible LLM<br>✓ TypeScript type safety | Bring your own tools<br>No built-in vendors |

### Key Differentiators

- **Ultra Lightweight**: microAgents is <1MB, compared to hundreds of MB for other frameworks
- **Universal Compatibility**: Works with any OpenAI-compatible API endpoint
- **XML Tool Calls**: More readable and intuitive than JSON schemas
- **Minimal Dependencies**: Only core HTTP libraries required
- **Simple Integration**: Direct function integration without wrapper classes
- **LLM Agnostic**: Works with any LLM that follows OpenAI's API format, including those without native function calling
- **Type Safety**: Full TypeScript support with proper type definitions

## Installation

1. Install dependencies:
   ```bash
   pnpm install
   ```

## Quick Start

Here's a complete example showing how to create a multi-agent math system in TypeScript:

```typescript
import { LLM, MicroAgent, Tool, BaseMessageStore } from './microAgents/core';

// Initialize LLM with your API
const llm = new LLM(
    "https://api.hyperbolic.xyz/v1",
    "your-api-key-here",
    "Qwen/Qwen2.5-Coder-32B-Instruct",
    4000,
    0.8,
    0.9
);

// Define tools for basic math operations with proper type information
const addNumbers = (a: number, b: number): number => {
    return a + b;
};

const multiplyNumbers = (a: number, b: number): number => {
    return a * b;
};

// Create specialized agent with properly typed tools
const mathAgent = new MicroAgent(
    llm,
    "You are a math assistant. Handle basic arithmetic operations.",
    [
        new Tool({
            description: "Add two numbers",
            func: addNumbers,
            parameters: {
                a: { type: 'number', required: true },
                b: { type: 'number', required: true }
            }
        }),
        new Tool({
            description: "Multiply two numbers",
            func: multiplyNumbers,
            parameters: {
                a: { type: 'number', required: true },
                b: { type: 'number', required: true }
            }
        })
    ]
);

// Create message store for conversation history
const messageStore = new BaseMessageStore();

// Use the agent
(async () => {
    const response = await mathAgent.executeAgent(
        "First add 3 and 5, then multiply the result by 2",
        messageStore
    );
    console.log(response);
})();
```

## Multi-Agent Orchestration Example

Here's an example of creating multiple specialized agents and orchestrating them in TypeScript:

```typescript
import { LLM, MicroAgent, Tool, BaseMessageStore } from './microAgents/core';

// Initialize LLM
const mathLLM = new LLM(
    "https://api.hyperbolic.xyz/v1",
    "your-api-key-here",
    "Qwen/Qwen2.5-Coder-32B-Instruct",
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

main().catch(console.error);
```

This example demonstrates:
- Creating multiple specialized agents with different tools
- Building an orchestrator agent to route queries
- Using a message store to maintain conversation history
- Coordinating multiple agents to handle different types of tasks
- Full TypeScript type safety throughout the system

## Demos

### Math Demo
The math demo demonstrates:
- Simple math operations (addition, multiplication)
- Advanced math operations (factorial)
- Agent orchestration to route between simple and advanced agents
- Tool calling with XML-style syntax

Run with: `tsx math_demo.ts`

### Chatbot Demo
The chatbot demo demonstrates:
- Order management system
- Customer concern handling
- Multi-agent orchestration
- Interactive chat interface

Run with: `tsx chatbot_demo.ts`

## Project Structure

```
microAgents/
├── core/                 # Core agent functionality
│   ├── core.ts          # Tool and MicroAgent classes
│   ├── message_store.ts # Message store management
│   └── index.ts         # Module exports
└── llm/                 # LLM integration
    ├── llm.ts           # LLM client
    ├── prompt.ts        # System prompt generation
    └── index.ts         # Module exports
```

## Dependencies

- node-fetch: For HTTP requests to LLM APIs
- TypeScript: For type safety
- tsx: For running TypeScript files directly

## License

MIT
