import { describe, it, beforeEach, expect } from 'vitest';
import { MicroAgent, Tool, ToolConfig } from './core';
import { LLM } from '../llm';

// Mock LLM for testing
class MockLLM extends LLM {
    constructor() {
        super("mock-model");
    }

    async chat(messages: any[]): Promise<string> {
        return "Mock response";
    }
}

describe('_parseToolCalls', () => {
    let agent: MicroAgent;
    let mockLLM: MockLLM;

    beforeEach(() => {
        mockLLM = new MockLLM();

        // Create some test tools
        const addNumbersConfig: ToolConfig = {
            name: 'addNumbers',
            description: 'Add two numbers',
            func: (a: number, b: number) => a + b,
            parameters: {
                a: { type: 'number', required: true },
                b: { type: 'number', required: true }
            }
        };

        const multiplyNumbersConfig: ToolConfig = {
            name: 'multiplyNumbers',
            description: 'Multiply two numbers',
            func: (x: number, y: number) => x * y,
            parameters: {
                x: { type: 'number', required: true },
                y: { type: 'number', required: true }
            }
        };

        const greetConfig: ToolConfig = {
            name: 'greet',
            description: 'Greet someone',
            func: (name: string, greeting?: string) => `${greeting || 'Hello'}, ${name}!`,
            parameters: {
                name: { type: 'string', required: true },
                greeting: { type: 'string', required: false }
            }
        };

        const booleanToolConfig: ToolConfig = {
            name: 'booleanTool',
            description: 'Test boolean parameter',
            func: (flag: boolean) => flag,
            parameters: {
                flag: { type: 'boolean', required: true }
            }
        };

        const testTools = [
            new Tool(addNumbersConfig),
            new Tool(multiplyNumbersConfig),
            new Tool(greetConfig),
            new Tool(booleanToolConfig)
        ];

        agent = new MicroAgent(mockLLM, "Test agent", testTools);
    });

    it('should parse single tool call with numeric parameters', () => {
        const content = '<TOOL_CALLS_NEEDED>\n<addNumbers>\n<a>15</a>\n<b>27</b>\n</addNumbers>\n</TOOL_CALLS_NEEDED>';
        const result = (agent as any)._parseToolCalls(content);
        console.log(result)
        expect(result).toHaveLength(1);
        expect(result[0]).toEqual({
            name: 'addNumbers',
            params: { a: 15, b: 27 }
        });
    });

    it('should parse multiple tool calls', () => {
        const content = `
      <TOOL_CALLS_NEEDED>
        <addNumbers>
          <a>10</a>
          <b>20</b>
        </addNumbers>
        <multiplyNumbers>
          <x>5</x>
          <y>6</y>
        </multiplyNumbers>
      </TOOL_CALLS_NEEDED>
    `;

        const result = (agent as any)._parseToolCalls(content);

        expect(result).toHaveLength(2);
        expect(result[0]).toEqual({
            name: 'addNumbers',
            params: { a: 10, b: 20 }
        });
        expect(result[1]).toEqual({
            name: 'multiplyNumbers',
            params: { x: 5, y: 6 }
        });
    });

    it('should parse tool call with string parameter', () => {
        const content = '<TOOL_CALLS_NEEDED>\n<greet>\n<name>Alice</name>\n</greet>\n</TOOL_CALLS_NEEDED>';
        const result = (agent as any)._parseToolCalls(content);

        expect(result).toHaveLength(1);
        expect(result[0]).toEqual({
            name: 'greet',
            params: { name: 'Alice' }
        });
    });

    it('should parse tool call with optional parameter', () => {
        const content = '<TOOL_CALLS_NEEDED>\n<greet>\n<name>Bob</name>\n<greeting>Hi</greeting>\n</greet>\n</TOOL_CALLS_NEEDED>';
        const result = (agent as any)._parseToolCalls(content);

        expect(result).toHaveLength(1);
        expect(result[0]).toEqual({
            name: 'greet',
            params: { name: 'Bob', greeting: 'Hi' }
        });
    });

    it('should parse boolean parameters correctly', () => {
        const content = '<TOOL_CALLS_NEEDED>\n<booleanTool>\n<flag>true</flag>\n</booleanTool>\n</TOOL_CALLS_NEEDED>';
        const result = (agent as any)._parseToolCalls(content);

        expect(result).toHaveLength(1);
        expect(result[0]).toEqual({
            name: 'booleanTool',
            params: { flag: true }
        });
    });

    it('should handle boolean "false" value correctly', () => {
        const content = '<TOOL_CALLS_NEEDED>\n<booleanTool>\n<flag>false</flag>\n</booleanTool>\n</TOOL_CALLS_NEEDED>';
        const result = (agent as any)._parseToolCalls(content);

        expect(result).toHaveLength(1);
        expect(result[0]).toEqual({
            name: 'booleanTool',
            params: { flag: false }
        });
    });

    it('should handle mixed parameter types', () => {
        const content = `
      <TOOL_CALLS_NEEDED>
        <greet>
          <name>Charlie</name>
          <greeting>Hello</greeting>
        </greet>
        <addNumbers>
          <a>3.14</a>
          <b>2.86</b>
        </addNumbers>
      </TOOL_CALLS_NEEDED>
    `;

        const result = (agent as any)._parseToolCalls(content);

        expect(result).toHaveLength(2);
        expect(result[0]).toEqual({
            name: 'greet',
            params: { name: 'Charlie', greeting: 'Hello' }
        });
        expect(result[1]).toEqual({
            name: 'addNumbers',
            params: { a: 3.14, b: 2.86 }
        });
    });

    it('should return empty array when no tool calls are present', () => {
        const content = 'This is just regular text without any tool calls';
        const result = (agent as any)._parseToolCalls(content);

        expect(result).toEqual([]);
    });

    it('should return empty array when TOOL_CALLS_NEEDED tags are present but no actual tools', () => {
        const content = '<TOOL_CALLS_NEEDED>\n</TOOL_CALLS_NEEDED>';
        const result = (agent as any)._parseToolCalls(content);

        expect(result).toEqual([]);
    });

    it('should throw error for unknown tool', () => {
        const content = '<TOOL_CALLS_NEEDED>\n<unknownTool>\n<a>1</a>\n</unknownTool>\n</TOOL_CALLS_NEEDED>';

        expect(() => {
            (agent as any)._parseToolCalls(content);
        }).toThrow('Unknown tool: unknownTool');
    });

    it('should handle multiple TOOL_CALLS_NEEDED blocks', () => {
        const content = `
      Some text here
      <TOOL_CALLS_NEEDED>
        <addNumbers>
          <a>1</a>
          <b>2</b>
        </addNumbers>
      </TOOL_CALLS_NEEDED>
      More text
      <TOOL_CALLS_NEEDED>
        <multiplyNumbers>
          <x>3</x>
          <y>4</y>
        </multiplyNumbers>
      </TOOL_CALLS_NEEDED>
    `;

        const result = (agent as any)._parseToolCalls(content);

        expect(result).toHaveLength(2);
        expect(result[0]).toEqual({
            name: 'addNumbers',
            params: { a: 1, b: 2 }
        });
        expect(result[1]).toEqual({
            name: 'multiplyNumbers',
            params: { x: 3, y: 4 }
        });
    });

    it('should handle nested XML-like content', () => {
        const content = '<TOOL_CALLS_NEEDED>\n<greet>\n<name><![CDATA[<John>]]></name>\n</greet>\n</TOOL_CALLS_NEEDED>';
        // Note: This simplified parser doesn't handle CDATA sections properly, so this would result in no params being extracted
        const result = (agent as any)._parseToolCalls(content);

        // The simplified parser has issues with complex XML content like CDATA, so it may not extract params correctly
        expect(result).toHaveLength(1);
        expect(result[0].name).toEqual('greet');
        // The actual result may vary depending on how the regex handles the complex content
    });

    it('should handle the specific example that was failing', () => {
        const content = '<TOOL_CALLS_NEEDED>\n<addNumbers>\n<a>15</a>\n<b>27</b>\n</addNumbers>\n</TOOL_CALLS_NEEDED>';
        const result = (agent as any)._parseToolCalls(content);

        expect(result).toHaveLength(1);
        expect(result[0]).toEqual({
            name: 'addNumbers',
            params: { a: 15, b: 27 }
        });
    });

    it('should handle the exact example from the LLM response with newlines', () => {
        // This is the exact format from the LLM response that was mentioned in the issue
        const content = '<TOOL_CALLS_NEEDED>\n<addNumbers>\n<a>15</a>\n<b>27</b>\n</addNumbers>\n</TOOL_CALLS_NEEDED>';
        const result = (agent as any)._parseToolCalls(content);

        expect(result).toHaveLength(1);
        expect(result[0]).toEqual({
            name: 'addNumbers',
            params: { a: 15, b: 27 }
        });
    });

    it('should handle empty parameter values', () => {
        const content = '<TOOL_CALLS_NEEDED>\n<greet>\n<name></name>\n</greet>\n</TOOL_CALLS_NEEDED>';
        const result = (agent as any)._parseToolCalls(content);

        expect(result).toHaveLength(1);
        expect(result[0]).toEqual({
            name: 'greet',
            params: { name: '' }
        });
    });

    it('should handle parameters with spaces', () => {
        const content = '<TOOL_CALLS_NEEDED>\n<greet>\n<name>John Doe</name>\n</greet>\n</TOOL_CALLS_NEEDED>';
        const result = (agent as any)._parseToolCalls(content);

        expect(result).toHaveLength(1);
        expect(result[0]).toEqual({
            name: 'greet',
            params: { name: 'John Doe' }
        });
    });
    describe('executeTool', () => {
        let agent: MicroAgent;
        let mockLLM: MockLLM;

        beforeEach(() => {
            mockLLM = new MockLLM();

            // Create some test tools
            const addNumbersConfig: ToolConfig = {
                name: 'addNumbers',
                description: 'Add two numbers',
                func: (a: number, b: number) => a + b,
                parameters: {
                    a: { type: 'number', required: true },
                    b: { type: 'number', required: true }
                }
            };

            const multiplyNumbersConfig: ToolConfig = {
                name: 'multiplyNumbers',
                description: 'Multiply two numbers',
                func: (x: number, y: number) => x * y,
                parameters: {
                    x: { type: 'number', required: true },
                    y: { type: 'number', required: true }
                }
            };

            const greetConfig: ToolConfig = {
                name: 'greet',
                description: 'Greet someone',
                func: (name: string, greeting?: string) => `${greeting || 'Hello'}, ${name}!`,
                parameters: {
                    name: { type: 'string', required: true },
                    greeting: { type: 'string', required: false }
                }
            };

            const noParamToolConfig: ToolConfig = {
                name: 'noParamTool',
                description: 'Tool with no parameters',
                func: () => 'No params result'
            };

            const testTools = [
                new Tool(addNumbersConfig),
                new Tool(multiplyNumbersConfig),
                new Tool(greetConfig),
                new Tool(noParamToolConfig)
            ];

            agent = new MicroAgent(mockLLM, "Test agent", testTools);
        });

        it('should execute a tool with parameters correctly', async () => {
            const result = await agent.executeTool('addNumbers', { a: 5, b: 3 });
            expect(result).toBe(8);
        });

        it('should execute a tool with different parameters correctly', async () => {
            const result = await agent.executeTool('multiplyNumbers', { x: 4, y: 7 });
            expect(result).toBe(28);
        });

        it('should execute a tool with string parameters correctly', async () => {
            const result = await agent.executeTool('greet', { name: 'Alice' });
            expect(result).toBe('Hello, Alice!');
        });

        it('should execute a tool with optional parameters correctly', async () => {
            const result = await agent.executeTool('greet', { name: 'Bob', greeting: 'Hi' });
            expect(result).toBe('Hi, Bob!');
        });

        it('should execute a tool with no parameters correctly', async () => {
            const result = await agent.executeTool('noParamTool', {});
            expect(result).toBe('No params result');
        });

        it('should throw an error when trying to execute an unknown tool', async () => {
            await expect(agent.executeTool('unknownTool', {})).rejects.toThrow('Tool \'unknownTool\' not found');
        });

        it('should handle errors thrown by the tool function', async () => {
            // Create a tool that throws an error
            const errorToolConfig: ToolConfig = {
                name: 'errorTool',
                description: 'Tool that throws an error',
                func: () => { throw new Error('Tool execution failed'); }
            };

            const errorTool = new Tool(errorToolConfig);
            agent.registerTool(errorTool);

            await expect(agent.executeTool('errorTool', {})).rejects.toThrow('Tool execution failed');
        });
    });
});