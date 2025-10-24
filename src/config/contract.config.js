
import RealifiFractionalTokenArtifact from '../contracts/RealiFiFractionalToken.json';
import RealEstateDapp from "../contracts/RealEstateDApp.json"
import MockUsdc from "../contracts/MockUSDC.json"

export const FRACTIONAL_TOKEN_ABI = RealifiFractionalTokenArtifact;
export const REAL_ESTATE_DAPP = RealEstateDapp;
export const MOCK_USDC = MockUsdc;

export const CONTRACTS = {
  RealEstateDApp: /** @type {`0x${string}`} */ ('0x8262dfA64c7fd013241CBAB524f2319b271F29AE'),
  MockUSDC: /** @type {`0x${string}`} */ ('0x51502AB8d26D4283078E5fd0860c0a1ACC4082EA'),
  RealiFiFractionalToken: /** @type {`0x${string}`} */ ('0xEf0762D6438577EeAEf72a8860aFd30185047B5B')
};

export const FRACTIONAL_TOKEN_ADDRESS = CONTRACTS.RealiFiFractionalToken;
export const REAL_ESTATE_DAPP_ADDRESS = CONTRACTS.RealEstateDApp;
export const MOCK_USDC_ADDRESS = CONTRACTS.MockUSDC;