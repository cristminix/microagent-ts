
# microAgents TypeScript Migration

This project is a TypeScript migration of the original Python microAgents framework. The migration maintains all the functionality of the original while adding type safety and better IDE support.

## Overview

The microAgents framework provides a lightweight agent system with:
- LLM integration for AI-powered agents
- Tool calling capabilities with XML-style syntax
- Agent orchestration capabilities
- Message store management

## Features

- **Type Safety**: Full TypeScript support with proper type definitions
- **Agent Orchestration**: Route queries to appropriate specialized agents
- **Tool Calling**: XML-style tool calling with parameter type conversion
- **Message Management**: Built-in message store for conversation history
- **LLM Integration**: Support for OpenAI-compatible APIs

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
```

## Quick Start

Here's a complete example showing how to create a multi-agent math system:

```python
from microAgents.llm import LLM
from microAgents.core import MicroAgent, Tool, BaseMessageStore

# Initialize LLM with your API
llm = LLM(
    base_url="https://api.hyperbolic.xyz/v1",
    api_key="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJrYW1hbHNpbmdoZ2FsbGFAZ21haWwuY29tIiwiaWF0IjoxNzM1MjI2ODIzfQ.1wZmIzTZUWLzr-uP7Qtib_kkXNZmH_yQtSn1lP9S2z0",
    model="Qwen/Qwen2.5-Coder-32B-Instruct",
    max_tokens=4000,
    temperature=0.8,
    top_p=0.9
)

# Define tools for basic math operations
def add_numbers(a: float, b: float) -> float:
    return a + b

def multiply_numbers(a: float, b: float) -> float:
    return a * b

# Create specialized agents
math_agent = MicroAgent(
    llm=llm,
    prompt="You are a math assistant. Handle basic arithmetic operations.",
    toolsList=[
        Tool(description="Add two numbers", func=add_numbers),
        Tool(description="Multiply two numbers", func=multiply_numbers)
    ]
)

# Create message store for conversation history
message_store = BaseMessageStore()

# Use the agent
response = math_agent.execute_agent(
    "First add 3 and 5, then multiply the result by 2", 
    message_store
)
print(response)
```

## Multi-Agent Orchestration Example

Here's an example of creating multiple specialized agents and orchestrating them:

```python
from microAgents.llm import LLM
from microAgents.core import MicroAgent, Tool, BaseMessageStore

# Initialize LLM
math_llm = LLM(
    base_url="https://api.hyperbolic.xyz/v1",
    api_key="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJrYW1hbHNpbmdoZ2FsbGFAZ21haWwuY29tIiwiaWF0IjoxNzM1MjI2ODIzfQ.1wZmIzTZUWLzr-uP7Qtib_kkXNZmH_yQtSn1lP9S2z0",
    model="Qwen/Qwen2.5-Coder-32B-Instruct",
    max_tokens=4000,
    temperature=0.8,
    top_p=0.9
)

# Define tools
def add_numbers(a: float, b: float) -> float:
    """Adds two numbers together."""
    return a + b

def multiply_numbers(a: float, b: float) -> float:
    """Multiplies two numbers together."""
    return a * b

def factorial(n: int) -> int:
    """Calculates factorial of a number."""
    if n == 0:
        return 1
    return n * factorial(n - 1)

# Create agents
simple_math_agent = MicroAgent(
    llm=math_llm,
    prompt="""You are a simple math assistant. Handle basic arithmetic operations.""",
    toolsList=[
        Tool(description="Adds two numbers", func=add_numbers),
        Tool(description="Multiplies two numbers", func=multiply_numbers)
    ]
)

advanced_math_agent = MicroAgent(
    llm=math_llm,
    prompt="""You are an advanced math assistant. Handle complex math operations.""",
    toolsList=[
        Tool(description="Calculates factorial", func=factorial)
    ]
)

class Orchestrator(MicroAgent):
    def __init__(self):
        super().__init__(
            llm=math_llm,
            prompt="""You are a math query analyzer. For each query:
1. If it contains basic arithmetic (addition, subtraction, multiplication, division), output exactly: SIMPLE_MATHS NEEDED
2. If it contains advanced math (factorials, exponents, logarithms, derivatives, integrals), output exactly: ADVANCED_MATHS NEEDED
3. If unsure, output exactly: UNKNOWN_MATH_TYPE

Examples:
- "What is 5 plus 3?" → SIMPLE_MATHS NEEDED
- "Calculate 10 factorial" → ADVANCED_MATHS NEEDED
- "Solve x^2 + 2x + 1 = 0" → UNKNOWN_MATH_TYPE

Always output exactly one of these three options, nothing else.""",
            toolsList=[]
        )
        self.simple_math_agent = simple_math_agent
        self.advanced_math_agent = advanced_math_agent

    def execute_agent(self, query: str, message_store: BaseMessageStore) -> str:
        """Handle full query flow through orchestrator."""
        print(f"\nDebug: Orchestrator analyzing query: {query}")
        
        # Get initial analysis from orchestrator
        analysis = super().execute_agent(query, message_store)
        print(f"Debug: Orchestrator analysis result: {analysis}")
        
        if "SIMPLE_MATHS NEEDED" in analysis:
            print("Debug: Routing to Simple Math Agent")
            result = self.simple_math_agent.execute_agent(query, message_store)
            print(f"Debug: Simple Math Agent result: {result}")
            return self._format_result("Simple Math Agent", result)
        elif "ADVANCED_MATHS NEEDED" in analysis:
            print("Debug: Routing to Advanced Math Agent")
            result = self.advanced_math_agent.execute_agent(query, message_store)
            print(f"Debug: Advanced Math Agent result: {result}")
            return self._format_result("Advanced Math Agent", result)
        else:
            return "Orchestrator: Unable to determine the appropriate agent for this query."

    def _format_result(self, agent_name: str, result: str) -> str:
        """Format the final result from an agent."""
        return f"Orchestrator: Result from {agent_name}:\n{result}"

def main():
    message_store = BaseMessageStore()
    orchestrator = Orchestrator()
    
    # Example queries that demonstrate XML-style tool calls
    queries = [
        "What is 15 plus 27?", 
        "Calculate 5 factorial",  
        "Multiply 8 by 9", 
        "First add 3 and 5, then multiply the result by 2"
    ]
    
    for query in queries:
        print(f"\nUser: {query}")
        response = orchestrator.execute_agent(query, message_store)
        print(f"{response}")

if __name__ == "__main__":
    main()
```

This example demonstrates:
- Creating multiple specialized agents with different tools
- Building an orchestrator agent to route queries
- Using a message store to maintain conversation history
- Coordinating multiple agents to handle different types of tasks

## Examples

- `math_demo.py`: Basic math operations using tool calls


## Contributors

- [prabhjots664](https://github.com/prabhjots664)
- [shera2018](https://github.com/shera2018)
- [kamaldeepzsingh](https://github.com/kamaldeepzsingh)
  

## License

MIT License
