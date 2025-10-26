import { wagmiConfig } from '@/wagmi.config';
import { writeContract } from '@wagmi/core';
import { parseUnits } from 'viem';
import { REAL_ESTATE_DAPP_ADDRESS, REAL_ESTATE_DAPP } from '../config/contract.config';


export async function createAsset(tokenURI, priceInHBAR) {
  const hash = await writeContract(wagmiConfig, {
    address: REAL_ESTATE_DAPP_ADDRESS,
    abi: REAL_ESTATE_DAPP,
    functionName: 'createAsset',
    args: [tokenURI, parseUnits(priceInHBAR, 6)],
  });
  
  return hash;
}

