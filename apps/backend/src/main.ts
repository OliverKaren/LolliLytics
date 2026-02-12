import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  // Global prefix
  app.setGlobalPrefix('api/v1');

  // CORS
  app.enableCors({
    origin: configService.get<string>('CORS_ORIGIN', 'http://localhost:5173'),
    credentials: true,
  });

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  // Swagger / OpenAPI
  const swaggerConfig = new DocumentBuilder()
    .setTitle('LoL Analytics API')
    .setDescription(
      'Draft Intelligence · Performance Benchmarking · Tilt Detection · Smurf Detection',
    )
    .setVersion('1.0')
    .addBearerAuth()
    .addTag('auth', 'Authentication')
    .addTag('users', 'User management')
    .addTag('draft-intelligence', 'Draft Intelligence module')
    .addTag('performance', 'Advanced Performance Benchmarking')
    .addTag('tilt-detection', 'Tilt & Consistency Detection')
    .addTag('smurf-detection', 'Smurf / Hidden MMR Detection')
    .addTag('riot-api', 'Riot Games API proxy')
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, document);

  const port = configService.get<number>('BACKEND_PORT', 3001);
  await app.listen(port);

  logger.log(`🚀 Backend running on http://localhost:${port}`);
  logger.log(`📖 Swagger docs at http://localhost:${port}/api/docs`);
}

bootstrap();
