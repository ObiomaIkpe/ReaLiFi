import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MulterModule } from '@nestjs/platform-express';
import { PinataController } from './pinata.controller';
import { PinataService } from './pinata.service';

@Module({
  imports: [
    ConfigModule,
    MulterModule.register({
      limits: {
        fileSize: 50 * 1024 * 1024, // 50MB limit
      },
    }),
  ],
  controllers: [PinataController],
  providers: [PinataService],
  exports: [PinataService],
})
export class PinataModule {}