import { NestFactory } from '@nestjs/core';
import { WorkerBootstrapModule } from './worker-bootstrap.module.js';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(WorkerBootstrapModule);
  app.enableShutdownHooks();
}
await bootstrap();
