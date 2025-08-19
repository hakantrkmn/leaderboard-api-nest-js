import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { LoggingInterceptor } from './logger/interceptor/logging.interceptor';
import { AppLogger } from './logger/logger.service';
import { PrometheusService } from './prometheus/prometheus.service';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const logger = app.get(AppLogger);
  const prometheusService = app.get(PrometheusService);
  app.useLogger(logger);
  app.useGlobalInterceptors(new LoggingInterceptor(logger, prometheusService));

  // Swagger konfigürasyonu - sadece development ortamında
  if (process.env.NODE_ENV !== 'production') {
    const config = new DocumentBuilder()
      .setTitle('Leaderboard API')
      .setDescription('Leaderboard API dokümantasyonu')
      .setVersion('1.0')
      .addBearerAuth()
      .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api', app, document);
  }

  await app.listen(process.env.API_PORT ?? 3000);
}
bootstrap();
