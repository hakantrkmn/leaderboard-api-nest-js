import { Global, Module } from '@nestjs/common';
import { PrometheusModule as PrometheusModuleWillsoto } from '@willsoto/nestjs-prometheus';
import { PrometheusService } from './prometheus.service';

@Global()
@Module({
  imports: [
    PrometheusModuleWillsoto.register({
      path: '/metrics',
      defaultMetrics: {
        enabled: false, // Custom metrics'lerimizle çakışmayı önlemek için
      },
    }),
  ],
  providers: [PrometheusService],
  exports: [PrometheusService],
})
export class PrometheusModule {}
