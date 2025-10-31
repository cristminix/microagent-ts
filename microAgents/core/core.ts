/**
 * Core functionality for the microAgents framework.
 */

import { LLM } from '../llm';
import { getPostfixSystemPrompt } from '../llm';
import { BaseMessageStore, Message } from './message_store';

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

        // Execute the tool with the provided parameters
        // For now, we'll call the function directly with the params object
        // In a more advanced implementation, you might want to match parameters to function signature
        // Check if the function has parameters defined
        const expectedParamCount = Object.keys(tool.parameters).length;

        // Execute the tool with the provided parameters
        // If the function expects no parameters, call it without arguments
        if (expectedParamCount === 0) {
            return tool.func();
        } else {
            // For functions with parameters, call with the params object
            // For functions that expect named parameters, we might need to destructure
            return tool.func(params);
        }
    }

    _parseToolCalls(content: string): ToolCall[] {
        const calls: ToolCall[] = [];
        const pattern = /<TOOL_CALLS_NEEDED>(.*?)<\/TOOL_CALLS_NEEDED>/gs;
        const matches = content.match(pattern);

        if (matches) {
            for (const match of matches) {
                // Extract the content between the TOOL_CALLS_NEEDED tags
                const innerContent = match
                    .replace(/<TOOL_CALLS_NEEDED>/, "")
                    .replace(/<\/TOOL_CALLS_NEEDED>/, "");

                // Parse XML-style tool calls
                // This is a simplified implementation - a full implementation would require an XML parser
                const toolMatches = innerContent.match(/<(\w+)>(.*?)<\/\1>/gs);

                if (toolMatches) {
                    for (const toolMatch of toolMatches) {
                        // Extract tool name
                        const toolNameMatch = toolMatch.match(/<(\w+)>/);
                        if (!toolNameMatch) continue;

                        const toolName = toolNameMatch[1];
                        if (!(toolName in this.tools)) {
                            throw new Error(`Unknown tool: ${toolName}`);
                        }

                        const tool = this.tools[toolName];

                        // Extract parameters
                        const params: { [key: string]: any } = {};
                        const paramPattern = /<(\w+)>([^<]*)<\/\1>/g;
                        let paramMatch;

                        while ((paramMatch = paramPattern.exec(toolMatch)) !== null) {
                            const paramName = paramMatch[1];
                            const paramValue = paramMatch[2].trim();

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

                        calls.push({
                            name: toolName,
                            params: params,
                        });
                    }
                }
            }
        }

        return calls;
    }
}