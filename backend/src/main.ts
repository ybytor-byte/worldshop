import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: (origin, callback) => {
      console.log('CORS check origin:', JSON.stringify(origin));
      if (!origin ||
        origin === 'http://localhost:3000' ||
        origin === 'https://world-shop.online' ||
        origin.endsWith('.vercel.app')
      ) {
        console.log('CORS allowed');
        callback(null, true);
      } else {
        console.log('CORS denied');
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  

  const config = new DocumentBuilder()
    .setTitle('WorldShop API')
    .setDescription('Product comparison API with AI processing')
    .setVersion('1.0')
    .addBearerAuth()
    .addTag('auth', 'Authentication')
    .addTag('products', 'Product management')
    .addTag('scans', 'Product scans from extension')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document);

  const port = process.env.PORT || 3001;
  await app.listen(port);
  console.log(`🚀 Server running on http://localhost:${port}`);
  console.log(`📚 Swagger docs: http://localhost:${port}/docs`);
}

bootstrap();