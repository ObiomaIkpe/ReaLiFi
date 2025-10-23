import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import blockchainConfig, {
  blockchainValidationSchema,
} from './blockchain/blockchain.config';
import { BlockchainModule } from './blockchain/blockchain.module';
import { AssetsModule } from './assets/assets.module';
import { SellersModule } from './sellers/sellers.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Property } from './assets/entity/property.entity';
import { PinataModule } from './pinata/pinata.module';



@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: 'localhost',
      port: 5432,
      username: 'realifi_user',        // the user you created
      password: 'strongpassword',      // the password you set
      database: 'realifi_db',          // the database you created
      entities: [__dirname + '/**/*.entity{.ts,.js}'],            // all your entities here
      synchronize: true,               // auto-create tables (dev only)
      // logging: true,      
    }),
    TypeOrmModule.forFeature([Property]),
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
      load: [blockchainConfig],
      validationSchema: blockchainValidationSchema,
    }),
    BlockchainModule,
    AssetsModule,
    SellersModule,
    PinataModule,
  ],
})
export class AppModule {}
