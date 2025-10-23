import { Module } from '@nestjs/common';
import { AssetsService } from './assets.service';
import { AssetsController } from './assets.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Property } from './entity/property.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Property])],
  providers: [AssetsService],
  controllers: [AssetsController]
})
export class AssetsModule {}
