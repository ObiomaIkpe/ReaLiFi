// sellers.service.ts
import { Injectable } from '@nestjs/common';
import { Repository, DataSource } from 'typeorm';
import { Seller } from './seller.entity';
import { InjectRepository } from '@nestjs/typeorm';


@Injectable()
export class SellersService {
  constructor(
    @InjectRepository(Seller)
    private sellerRepository: Repository<Seller>,
    private dataSource: DataSource,
  ) {}

  async registerSeller(walletAddress: string): Promise<Seller> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Check if seller already exists
      const existingSeller = await queryRunner.manager.findOne(Seller, {
        where: { walletAddress: walletAddress.toLowerCase() },
      });

      if (existingSeller) {
        throw new Error('Seller already registered');
      }

      // Create new seller
      const seller = queryRunner.manager.create(Seller, {
        walletAddress: walletAddress.toLowerCase(),
        isVerified: false,
        registeredAt: new Date(),
      });

      const savedSeller = await queryRunner.manager.save(seller);
      await queryRunner.commitTransaction();

      return savedSeller;
    } catch (error) {
        console.log(error)
      await queryRunner.rollbackTransaction();
      
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async isSellerRegistered(walletAddress: string): Promise<boolean> {
    const seller = await this.sellerRepository.findOne({
      where: { walletAddress: walletAddress.toLowerCase() },
    });
    return !!seller;
  }
}