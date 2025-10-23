import { Module } from '@nestjs/common';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { BlockchainService } from './blockchain.service';
import { BlockchainListener } from './blockchain.listener';
import { blockchainProvider } from './blockchain.provider';

@Module({
  imports: [EventEmitterModule.forRoot()],
  providers: [blockchainProvider, BlockchainService, BlockchainListener],
  exports: [BlockchainService],
})
export class BlockchainModule {}
