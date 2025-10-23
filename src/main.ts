import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  console.log('ENV TEST →', process.env.PINATA_JWT ? 'Loaded ✅' : 'Missing ❌');

  app.enableCors({
    origin: 'http://localhost:5173', 
    credentials: true,
  });
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
