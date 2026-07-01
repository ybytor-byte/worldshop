import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { join } from 'path';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { ProductsModule } from './products/products.module';
import { ScansModule } from './scans/scans.module';
import { QueueModule } from './queue/queue.module';
import { AiModule } from './ai/ai.module';
import { SearchModule } from './search/search.module';
import { HermesModule } from './hermes/hermes.module';
import { SearchByImageModule } from './search-by-image/search-by-image.module';
import { CpaModule } from './cpa/cpa.module';
import { YandexModule } from './yandex/yandex.module';
import { SupportModule } from './support/support.module';
import { McpModule } from './mcp/mcp.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    GraphQLModule.forRootAsync<ApolloDriverConfig>({
      driver: ApolloDriver,
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        typePaths: [join(process.cwd(), 'src', 'common', 'graphql', '*.gql')],
        playground: configService.get<string>('NODE_ENV') !== 'production',
        introspection: true,
      }),
    }),
    PrismaModule,
    AuthModule,
    ProductsModule,
    ScansModule,
    QueueModule,
    AiModule,
    SearchModule,
    HermesModule,
    SearchByImageModule,
    CpaModule,
    YandexModule,
    SupportModule,
    McpModule,
  ],
})
export class AppModule {}