import { Injectable, Logger } from '@nestjs/common';

export interface McpToolSchema {
  name: string;
  description: string;
  inputSchema: Record<string, any>;
}

export interface McpToolResult {
  content: Array<{ type: string; text?: string; data?: string; mimeType?: string }>;
  isError?: boolean;
}

export interface McpTool {
  schema: McpToolSchema;
  execute(args: Record<string, any>): Promise<McpToolResult>;
}

@Injectable()
export class McpProtocolService {
  private readonly logger = new Logger(McpProtocolService.name);
  private tools = new Map<string, McpTool>();

  registerTool(tool: McpTool) {
    this.tools.set(tool.schema.name, tool);
    this.logger.log(`MCP tool registered: ${tool.schema.name}`);
  }

  getTools() {
    return Array.from(this.tools.values()).map(t => t.schema);
  }

  async callTool(name: string, args: Record<string, any>): Promise<McpToolResult> {
    const tool = this.tools.get(name);
    if (!tool) {
      return {
        content: [{ type: 'text', text: `Unknown tool: ${name}` }],
        isError: true,
      };
    }
    try {
      return await tool.execute(args);
    } catch (err: any) {
      this.logger.error(`Tool ${name} failed: ${err.message}`);
      return {
        content: [{ type: 'text', text: `Error: ${err.message}` }],
        isError: true,
      };
    }
  }

  handleJsonRpc(body: any): any {
    if (!body || body.jsonrpc !== '2.0') {
      return { jsonrpc: '2.0', error: { code: -32600, message: 'Invalid Request' }, id: null };
    }

    const { method, params, id } = body;

    switch (method) {
      case 'initialize':
        return {
          jsonrpc: '2.0',
          result: {
            protocolVersion: params?.protocolVersion || '2025-03-26',
            capabilities: { tools: {} },
            serverInfo: { name: 'worldshop-mcp', version: '1.0.0' },
          },
          id,
        };

      case 'notifications/initialized':
        return null;

      case 'tools/list':
        return {
          jsonrpc: '2.0',
          result: { tools: this.getTools() },
          id,
        };

      case 'tools/call':
        return {
          jsonrpc: '2.0',
          result: this.callTool(params?.name, params?.arguments || {}),
          id,
        };

      default:
        return {
          jsonrpc: '2.0',
          error: { code: -32601, message: `Method not found: ${method}` },
          id,
        };
    }
  }
}
