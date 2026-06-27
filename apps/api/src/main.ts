import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);

  // Enable CORS
  const corsOrigin = process.env.CORS_ORIGIN || 'http://localhost:5173';
  app.enableCors({
    origin: corsOrigin,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });

  // Global validation pipes
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  // Setup Swagger API docs
  const config = new DocumentBuilder()
    .setTitle('Check-in Inclusivo API')
    .setDescription('API for Check-in Inclusivo MVP - Social Anxiety Hotel Accommodation App')
    .setVersion('0.1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document);

  const port = process.env.API_PORT ? parseInt(process.env.API_PORT, 10) : 3001;
  const host = process.env.API_HOST || '0.0.0.0';

  await app.listen(port, host);
  logger.log(`🚀 API backend running on http://${host}:${port}`);
  logger.log(`📖 Swagger API documentation available at http://${host}:${port}/docs`);
}

bootstrap();
