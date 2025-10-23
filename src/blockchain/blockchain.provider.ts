import { ConfigService } from '@nestjs/config';
import { ethers } from 'ethers';
import RealEstateAbi from './types/realestate.abi.json';
import FractionalAbi from './types/token.abi.json';
import UsdcAbi from './types/usdc.abi.json';

export const blockchainProvider = {
  provide: 'BLOCKCHAIN_CONNECTION',
  inject: [ConfigService],
  useFactory: (configService: ConfigService) => {
    const rpcUrl = configService.get<string>('RPC_URL')!;
    const realEstateAddress = configService.get<string>(
      'REAL_ESTATE_CONTRACT_ADDRESS',
    )!;
    const fractionalAddress = configService.get<string>(
      'FRACTIONAL_CONTRACT_ADDRESS',
    )!;
    const usdcAddress = configService.get<string>('USDC_CONTRACT_ADDRESS')!;

    // Safe — validated via Joi, so these cannot be undefined
    const provider = new ethers.JsonRpcProvider(rpcUrl);

    const realEstate = new ethers.Contract(
      realEstateAddress,
      RealEstateAbi.abi,
      provider,
    );
    const fractional = new ethers.Contract(
      fractionalAddress,
      FractionalAbi.abi,
      provider,
    );
    const usdc = new ethers.Contract(usdcAddress, UsdcAbi.abi, provider);

    return { provider, realEstate, fractional, usdc };
  },
};
