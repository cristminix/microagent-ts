/**
 * System prompt template for microAgents tool integration.
 */

import { ToolSchema } from '../core/core';

export function getPostfixSystemPrompt(toolsSchema: ToolSchema): string {
    /** Generate a system prompt postfix describing available tools.
     * 
     * @param toolsSchema - Object containing tool information from getToolsSchema()
     * @returns System prompt postfix describing available tools and usage
     */
    const toolsDescription: string[] = [];

    for (const [name, info] of Object.entries(toolsSchema)) {
        const paramDescriptions: string[] = [];
        for (const [param, paramInfo] of Object.entries(info.parameters)) {
            // Since TypeScript doesn't have runtime type information like Python,
            // we'll use a placeholder for the type name
            const paramType = 'string'; // Placeholder - in a real implementation you'd have proper type info
            paramDescriptions.push(`- ${param}: ${paramType}`);
        }
        toolsDescription.push(
            `- **${name}**: ${info.description}\n      Parameters:\n      ` +
            paramDescriptions.join("\n      ")
        );
    }

    const toolsDescriptionText = toolsDescription.join("\n\n");

    return `
You have access to the following tools that you can use by enclosing them in 
<TOOL_CALLS_NEEDED> tags. Each tool and its parameters should be enclosed in XML-style tags.

Available tools:
${toolsDescriptionText}

Example usage:
<TOOL_CALLS_NEEDED>
<tool_name>
<param1>value1</param1>
<param2>value2</param2>
</tool_name>
</TOOL_CALLS_NEEDED>

Multiple tool calls example:
<TOOL_CALLS_NEEDED>
<tool1>
<param1>value1</param1>
</tool1>
<tool2>
<param1>value1</param1>
<param2>value2</param2>
</tool2>
</TOOL_CALLS_NEEDED>

Important notes:
- If you are not provided any tool, don't respond with <TOOL_CALLS_NEEDED> tags
- Only use provided tools when absolutely necessary
- All parameters must be provided in their own XML tags
- Tool calls must be enclosed in <TOOL_CALLS_NEEDED> tags
- Parameters should use their exact parameter names as tag names
`;
}