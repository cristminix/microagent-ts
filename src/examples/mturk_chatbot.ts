import { LLM } from "../microagents/llm/llm"
import { MicroAgent, Tool, BaseMessageStore } from "../microagents/core"
import * as readline from "readline"

// Initialize LLM
const chatLLM = new LLM(
  "https://llm.ponpeskanzululumcirebon.com/v1",
  "sk-f6825e70c7904bbeb944850e6084500e",
  "gemini-2.5-flash",
  4000,
  0.8,
  0.9
)

// Global in-memory databases
const ordersDb: { [key: string]: { items: string[]; status: string } } = {
  "1001": { items: ["Large Pepperoni"], status: "Delivered" },
  "1002": { items: ["Medium Veggie"], status: "Preparing" },
}

const concernsDb: { [key: string]: any } = {}
let nextConcernId = 1

// Define tools with proper type information
const orderDetails = (order_id: string): any => {
  /** Returns details for a specific order */
  return ordersDb[order_id] || { error: "Order not found" }
}

const orderHistory = (): any[] => {
  /** Returns order history for the single user */
  return Object.values(ordersDb)
}

const createConcern = (description: string): any => {
  /** Creates and stores a new customer concern for the single user */
  const concernId = `CON-${nextConcernId}`
  concernsDb[concernId] = {
    id: concernId,
    description: description,
    status: "Open",
    timestamp: new Date().toISOString(),
  }
  nextConcernId++
  return concernsDb[concernId]
}

const getConcernDetails = (concern_id: string): any => {
  /** Returns details for a specific concern */
  return concernsDb[concern_id] || { error: "Concern not found" }
}

// Create agents with properly typed tools
const orderAgent = new MicroAgent(
  chatLLM,
  "You are an order management assistant. Handle order details and history.",
  [
    new Tool({
      description: "Returns order details",
      func: orderDetails,
      parameters: {
        order_id: { type: "string", required: true },
      },
    }),
    new Tool({
      description: "Returns order history",
      func: orderHistory,
      parameters: {},
    }),
  ]
)

const concernAgent = new MicroAgent(
  chatLLM,
  "You are a customer concern assistant. Handle customer issues and concerns.",
  [
    new Tool({
      description: "Creates a new concern",
      func: createConcern,
      parameters: {
        description: { type: "string", required: true },
      },
    }),
    new Tool({
      description: "Returns concern details",
      func: getConcernDetails,
      parameters: {
        concern_id: { type: "string", required: true },
      },
    }),
  ]
)

class Orchestrator extends MicroAgent {
  orderAgent: MicroAgent
  concernAgent: MicroAgent

  constructor() {
    super(
      chatLLM,
      `You are an Amazon Mechanical Turk worker completing a $2 communication task.

You are motivated by this task’s payment—you value every cent you earn.
Act naturally as the person in <persona>—think and respond the way they would, including their quirks, beliefs, biases, and reasoning.
Complete the communication task outlined in <scenario> exactly as that persona would naturally respond.
Respond in a real-time chat interface. Keep each response under 20 words, conversational, and authentic—avoid formal, robotic, or repetitive language.
Output only your reply to your chat partner—do not explain your reasoning.`,
      []
    )
    this.orderAgent = orderAgent
    this.concernAgent = concernAgent
  }

  async executeAgent(
    query: string,
    messageStore: BaseMessageStore
  ): Promise<string> {
    /** Handle full query flow through orchestrator. */
    // console.log(`\nDebug: Orchestrator analyzing query: ${query}`);

    // Get initial analysis from orchestrator
    const analysis = await super.executeAgent(query, messageStore)
    // console.log(`Debug: Orchestrator analysis result: ${analysis}`);

    // The orchestrator in this specific task is not routing to other agents,
    // but directly responding based on the system prompt.
    // So, we just return the analysis as the response.
    return analysis
  }
}

// Create readline interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
})

async function main() {
  const messageStore = new BaseMessageStore()
  const orchestrator = new Orchestrator()

  console.log("Welcome to the MTurk Chatbot!")
  console.log(
    "I am an Amazon Mechanical Turk worker completing a $2 communication task."
  )
  console.log("Type 'quit' to exit.\n")

  const askQuestion = (): Promise<string> => {
    return new Promise((resolve) => {
      rl.question("\nYou: ", (answer) => {
        resolve(answer)
      })
    })
  }

  while (true) {
    const userInput = await askQuestion()
    if (userInput.toLowerCase() === "quit") {
      break
    }

    const response = await orchestrator.executeAgent(userInput, messageStore)
    console.log(`Agent: ${response}`)
    // console.log("Debug: Orchestrator routing complete");
  }

  rl.close()
}

if (require.main === module) {
  main().catch(console.error)
}
