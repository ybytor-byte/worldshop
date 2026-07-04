import { Module, OnModuleInit } from '@nestjs/common';
import { McpController } from './mcp.controller';
import { McpProtocolController } from './mcp-protocol.controller';
import { McpProtocolService } from './mcp-protocol.service';
import { FetchGlobalMarketDataTool } from './tools/fetch-global-market-data.tool';
import { NormalizeAndCalculateTool } from './tools/normalize-and-calculate.tool';
import { WriteToWorldshopStoragesTool } from './tools/write-to-worldshop-storages.tool';
import { CloudinaryModule } from '../cloudinary/cloudinary.module';
import { SearchModule } from '../search/search.module';
import { LogisticsModule } from '../logistics/logistics.module';
import { SearchApiLensProvider } from '../search/providers/searchapi-lens.provider';
import { SerperProvider } from '../search/providers/serper.provider';

@Module({
  imports: [CloudinaryModule, SearchModule, LogisticsModule],
  controllers: [McpController, McpProtocolController],
  providers: [
    SearchApiLensProvider, SerperProvider, McpProtocolService,
    FetchGlobalMarketDataTool, NormalizeAndCalculateTool, WriteToWorldshopStoragesTool,
  ],
})
export class McpModule implements OnModuleInit {
  constructor(
    private mcpProtocol: McpProtocolService,
    private fetchGlobalMarketData: FetchGlobalMarketDataTool,
    private normalizeAndCalculate: NormalizeAndCalculateTool,
    private writeToWorldshopStorages: WriteToWorldshopStoragesTool,
  ) {}

  onModuleInit() {
    this.mcpProtocol.registerTool(this.fetchGlobalMarketData);
    this.mcpProtocol.registerTool(this.normalizeAndCalculate);
    this.mcpProtocol.registerTool(this.writeToWorldshopStorages);
  }
}
