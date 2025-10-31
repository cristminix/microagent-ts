/**
 * Core functionality for the microAgents framework.
 */

import { LLM } from '../llm';
import { getPostfixSystemPrompt } from '../llm';
import { BaseMessageStore, Message } from './message_store';
import { create } from 'xmlbuilder2';

export interface ParameterInfo {
    type: string; // Using string to represent type names since TypeScript doesn't have runtime type info like Python
    required: boolean;
}

export interface ToolSchema {
    [key: string]: {
        description: string;
        parameters: { [key: string]: ParameterInfo };
    };
}

export interface ToolCall {
    name: string;
    params: { [key: string]: any };
}

export interface ToolConfig {
    description: string;
    func: Function;
    name?: string;
    parameters?: { [key: string]: ParameterInfo };
}

export class Tool {
    name: string;
    description: string;
    func: Function;
    parameters: { [key: string]: ParameterInfo };

    constructor(config: ToolConfig) {
        this.name = config.name || config.func.name;
        this.description = config.description;
        this.func = config.func;
        this.parameters = config.parameters || {};
    }

    execute(...args: any[]): any {
        return this.func(...args);
    }
}

export class MicroAgent {
    tools: { [key: string]: Tool };
    llm: LLM;
    initialPrompt: string;

    constructor(llm: LLM, prompt: string, toolsList: Tool[]) {
        this.tools = {};
        this.llm = llm;
        this.initialPrompt = prompt;

        // Register provided tools
        for (const tool of toolsList) {
            this.registerTool(tool);
        }
    }

    async executeAgent(userInput: string, messageStore: BaseMessageStore): Promise<string> {
        // Prepare messages for LLM interaction
        const messages: Message[] = [
            {
                role: "system",
                content: this.initialPrompt + "\n" + getPostfixSystemPrompt(this.getToolsSchema()),
            },
        ];

        // Add the new user input to message store
        if (userInput) {
            messageStore.addMessage({
                role: "user",
                content: userInput,
            });
        }

        // Add conversation history
        messages.push(...messageStore.getMessages());
        // Get LLM response
        const response = await this.llm.chat(messages);

        // If response contains tool calls, execute them and get results
        if (response.includes("<TOOL_CALLS_NEEDED>")) {
            const toolCalls = this._parseToolCalls(response);
            const results: string[] = [];

            for (const call of toolCalls) {
                try {
                    const result = await this.executeTool(call.name, call.params);
                    // Convert result to string representation to handle objects properly

                    results.push(`Tool ${call.name} result: ${result}`);
                } catch (e) {
                    const error = e as Error;
                    results.push(`Tool ${call.name} error: ${error.message}`);
                }
            }

            // Add tool call results to message store
            for (const result of results) {
                messageStore.addMessage({
                    role: "user",
                    content: result,
                });
            }

            // Recursively call executeAgent with the same input to get final response
            return await this.executeAgent("", messageStore);
        } else {
            // No tool calls needed, just return the response
            messageStore.addMessage({
                role: "assistant",
                content: response,
            });
            return response;
        }
    }

    registerTool(tool: Tool): void {
        this.tools[tool.name] = tool;
    }

    getToolsSchema(): ToolSchema {
        const schema: ToolSchema = {};
        for (const [name, tool] of Object.entries(this.tools)) {
            schema[name] = {
                description: tool.description,
                parameters: tool.parameters,
            };
        }
        return schema;
    }

    async executeTool(toolName: string, params: { [key: string]: any }): Promise<any> {
        if (!(toolName in this.tools)) {
            throw new Error(`Tool '${toolName}' not found`);
        }

        const tool = this.tools[toolName];

        // Check if the function has parameters defined
        const expectedParamCount = Object.keys(tool.parameters).length;

        try {
            let result;
            // Execute the tool with the provided parameters
            // If the function expects no parameters, call it without arguments
            if (expectedParamCount === 0) {
                result = await tool.func();
            } else {
                // For functions with parameters, we need to determine the correct calling approach
                // Try calling with individual parameters first (most common for functions like addNumbers(a, b))
                const paramNames = Object.keys(tool.parameters);
                const paramValues = paramNames.map(name => params[name]);

                try {
                    result = await tool.func(...paramValues);
                } catch (firstError) {
                    // If that fails, try the params object approach (for functions that expect an object)
                    try {
                        result = await tool.func(params);
                    } catch (secondError) {
                        // If both approaches fail, throw the original error from the first attempt
                        throw firstError;
                    }
                }
            }

            // Ensure the result is properly handled (not returning problematic string representations)
            if (typeof result === 'object' && result !== null) {
                // If result is an object with a toString method that might cause issues
                // return a safe representation
                if (result.toString && result.toString() === '[object Object]') {
                    try {
                        // Try to return a proper JSON representation instead of default [object Object]
                        return JSON.parse(JSON.stringify(result));
                    } catch (e) {
                        // If serialization fails, return a basic representation
                        return result;
                    }
                }
            }

            return result;
        } catch (error) {
            // If there's an error during function execution, throw it
            throw error;
        }
    }

    _parseToolCalls(content: string): ToolCall[] {
        const calls: ToolCall[] = [];
        const pattern = /<TOOL_CALLS_NEEDED>(.*?)<\/TOOL_CALLS_NEEDED>/gs;
        const matches = content.match(pattern);

        if (matches) {
            for (const match of matches) {
                // Extract the content between the TOOL_CALLS_NEEDED tags
                let innerContent = match
                    .replace(/<TOOL_CALLS_NEEDED>/, "")
                    .replace(/<\/TOOL_CALLS_NEEDED>/, "")
                    .trim();

                // Clean up the content to handle potential formatting issues
                // Remove any extra whitespace, newlines, or formatting that might interfere with XML parsing
                innerContent = innerContent.replace(/\n/g, '').replace(/\s+/g, ' ').trim();

                if (innerContent) {
                    try {
                        // Parse the XML content using xmlbuilder2
                        // First wrap the inner content in a root element to make it valid XML
                        const wrappedContent = `<root>${innerContent}</root>`;
                        const doc = create(wrappedContent);

                        // Get the root element and traverse its children (which should be tool calls)
                        const root = doc.root();
                        if (root) {
                            // Use the each method to iterate through child elements which represent tool calls
                            root.each((child, index, level) => {
                                if (child.node.nodeType === 1) { // Node.ELEMENT_NODE
                                    const toolName = (child.node as any).localName || (child.node as any).nodeName;

                                    // Only process elements that are registered tools
                                    if (toolName in this.tools) {
                                        const tool = this.tools[toolName];

                                        // Extract parameters from child elements (the parameters are nested inside the tool element)
                                        const params: { [key: string]: any } = {};

                                        // Use the each method on the tool element to get its parameters
                                        child.each((paramElement, paramIndex, paramLevel) => {
                                            if (paramElement.node.nodeType === 1) { // Node.ELEMENT_NODE
                                                const paramName = (paramElement.node as any).localName || (paramElement.node as any).nodeName;
                                                const paramValue = paramElement.node.textContent || ''; // Get the text content of the element

                                                // Convert the parameter value to the correct type if type information is available
                                                if (paramName in tool.parameters) {
                                                    const paramType = tool.parameters[paramName].type;

                                                    try {
                                                        // Basic type conversion based on type name
                                                        switch (paramType) {
                                                            case 'number':
                                                            case 'float':
                                                            case 'int':
                                                                params[paramName] = parseFloat(paramValue);
                                                                break;
                                                            case 'boolean':
                                                                params[paramName] = paramValue.toLowerCase() === 'true';
                                                                break;
                                                            case 'string':
                                                            default:
                                                                params[paramName] = paramValue;
                                                                break;
                                                        }
                                                    } catch (e) {
                                                        throw new Error(`Failed to convert parameter '${paramName}' value '${paramValue}' to type ${paramType}: ${(e as Error).message}`);
                                                    }
                                                } else {
                                                    // If no type information, use the string value
                                                    params[paramName] = paramValue;
                                                }
                                            }
                                        }, false, false); // self=false, recursive=false for immediate children only

                                        calls.push({
                                            name: toolName,
                                            params: params,
                                        });
                                    } else {
                                        // If the element is not a known tool, throw an error
                                        throw new Error(`Unknown tool: ${toolName}`);
                                    }
                                }
                            }, false, false); // self=false, recursive=false for immediate children only
                        }
                    } catch (error) {
                        // If XML parsing fails, throw a descriptive error
                        throw new Error(`Failed to parse tool calls XML: ${(error as Error).message}`);
                    }
                }
            }
        }

        return calls;
    }
}