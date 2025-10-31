import * as Joi from 'joi';
import databaseConfig from './config.joi'; // ADD THIS IMPORT
import blockchainConfig from './blockchain/blockchain.config';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { PinataModule } from './pinata/pinata.module';
import { SellersModule } from './sellers/sellers.module';
import { AssetsModule } from './assets/assets.module';
import { BlockchainModule } from './blockchain/blockchain.module';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
      load: [blockchainConfig, databaseConfig],
      validationSchema: Joi.object({
        // Blockchain config
        RPC_URL: Joi.string().required(),
        CHAIN_ID: Joi.number().required(),
        REAL_ESTATE_CONTRACT_ADDRESS: Joi.string().required(),
        FRACTIONAL_CONTRACT_ADDRESS: Joi.string().required(),
        USDC_CONTRACT_ADDRESS: Joi.string().required(),
        
        // Database config
        DB_HOST: Joi.string().required(),
        DB_PORT: Joi.number().default(5432),
        DB_USERNAME: Joi.string().required(),
        DB_PASSWORD: Joi.string().required(),
        DB_NAME: Joi.string().required(),
        DATABASE_URL: Joi.string().required(),
        
        // Pinata config
        PINATA_API_KEY: Joi.string().required(),
        PINATA_API_SECRET: Joi.string().required(),
        PINATA_JWT: Joi.string().required(),
        PINATA_GATEWAY_URL: Joi.string().required(),
      }),
    }),
    
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        // host: configService.get('database.host'),
        // port: configService.get('database.port'),
        // username: configService.get('database.username'),
        // password: configService.get('database.password'),
        // database: configService.get('database.database'),
        url: configService.get<string>('DATABASE_URL'),
        entities: [__dirname + '/**/*.entity{.ts,.js}'],
        synchronize: process.env.NODE_ENV !== 'production',
        ssl: {
      rejectUnauthorized: false, // required for Render PostgreSQL
        },
      }),
    }),
    
    BlockchainModule,
    AssetsModule,
    SellersModule,
    PinataModule,
  ],
})
export class AppModule {}