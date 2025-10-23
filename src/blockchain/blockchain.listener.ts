import { Injectable, Inject, OnModuleInit, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';

@Injectable()
export class BlockchainListener implements OnModuleInit {
  private readonly logger = new Logger(BlockchainListener.name);

  constructor(
    private readonly eventEmitter: EventEmitter2,
    @Inject('BLOCKCHAIN_CONNECTION') private readonly conn,
  ) {}

  onModuleInit() {
    const { realEstate } = this.conn;

    realEstate.on('AssetCreated', (assetId, seller) => {
      this.logger.debug(`Event: AssetCreated [${assetId}] by ${seller}`);
      this.eventEmitter.emit('asset.created', {
        assetId: Number(assetId),
        seller,
      });
    });

    realEstate.on('SellerRegistered', (seller) => {
      this.logger.debug(`Event: SellerRegistered [${seller}]`);
      this.eventEmitter.emit('seller.registered', { seller });
    });
  }
}
