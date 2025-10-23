import { Controller, Post, Body, HttpException, HttpStatus } from '@nestjs/common';
import { SellersService } from './sellers.service';

@Controller('sellers')
export class SellersController {
  constructor(private readonly sellersService: SellersService) {}

  @Post('register')
  async registerSeller(@Body('walletAddress') walletAddress: string) {
    if (!walletAddress) {
      throw new HttpException('Wallet address is required', HttpStatus.BAD_REQUEST);
    }

    // Validate Ethereum address format
    const ethAddressRegex = /^0x[a-fA-F0-9]{40}$/;
    if (!ethAddressRegex.test(walletAddress)) {
      throw new HttpException('Invalid wallet address format', HttpStatus.BAD_REQUEST);
    }

    try {
      const seller = await this.sellersService.registerSeller(walletAddress);
      return {
        success: true,
        message: 'Seller registered successfully',
        data: seller,
      };
    } catch (error) {
      if (error.message === 'Seller already registered') {
        throw new HttpException('Seller already registered', HttpStatus.CONFLICT);
      }
      throw new HttpException('Registration failed', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}