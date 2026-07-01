import { Module } from '@nestjs/common';
import { McpController } from './mcp.controller';
import { CloudinaryModule } from '../cloudinary/cloudinary.module';
import { SerperLensProvider } from '../search/providers/serper-lens.provider';
import { SerperProvider } from '../search/providers/serper.provider';

@Module({
  imports: [CloudinaryModule],
  controllers: [McpController],
  providers: [SerperLensProvider, SerperProvider],
})
export class McpModule {}
