import { NestFactory } from '@nestjs/core';
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
  await app.listen(process.env.API_PORT ?? 3000);
}
bootstrap();
