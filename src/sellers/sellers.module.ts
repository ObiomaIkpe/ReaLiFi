import { Module } from '@nestjs/common';
import { SellersService } from './sellers.service';
import { SellersController } from './sellers.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Seller } from './seller.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Seller])],
  providers: [SellersService],
  controllers: [SellersController]
})
export class SellersModule {}
