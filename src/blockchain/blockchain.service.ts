import { Injectable, Inject, Logger } from '@nestjs/common';

@Injectable()
export class BlockchainService {
  private readonly logger = new Logger(BlockchainService.name);
  constructor(@Inject('BLOCKCHAIN_CONNECTION') private readonly conn) {}

  async getAssetDisplayInfo(tokenId: number) {
    return this.conn.realEstate.getAssetDisplayInfo(tokenId);
  }

  async fetchAvailableAssets() {
    return this.conn.realEstate.fetchAvailableAssets();
  }

  async getBuyerPortfolio(wallet: string) {
    return this.conn.realEstate.getBuyerPortfolio(wallet);
  }
}
