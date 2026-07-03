import { Controller, Post, Body, UseGuards, Headers } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { McpGuard } from './mcp.guard';
import { McpProtocolService } from './mcp-protocol.service';

@ApiTags('mcp')
@Controller('mcp/v1')
@UseGuards(McpGuard)
export class McpProtocolController {
  constructor(private mcpProtocol: McpProtocolService) {}

  @Post()
  @ApiOperation({ summary: 'MCP JSON-RPC 2.0 endpoint for Hermes Agent integration' })
  async handleMcp(@Body() body: any, @Headers('content-type') contentType: string) {
    const result = this.mcpProtocol.handleJsonRpc(body);

    if (result === null) {
      return { jsonrpc: '2.0', result: {}, id: body?.id ?? null };
    }

    if (result?.result && typeof result.result.then === 'function') {
      const resolved = await result.result;
      return { jsonrpc: '2.0', result: resolved, id: result.id };
    }

    return result;
  }
}
