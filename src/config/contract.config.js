
import RealifiFractionalTokenArtifact from '../contracts/RealiFiFractionalToken.json';
import RealEstateDapp from "../contracts/RealEstateDApp.json"
import MockUsdc from "../contracts/MockUSDC.json"

export const FRACTIONAL_TOKEN_ABI = RealifiFractionalTokenArtifact;
export const REAL_ESTATE_DAPP = RealEstateDapp;
export const MOCK_USDC = MockUsdc;

export const CONTRACTS = {
  RealEstateDApp: /** @type {`0x${string}`} */ ('0x356edA5558641C70E39fA4920B63d88Bcc12b1C2'),
  MockUSDC: /** @type {`0x${string}`} */ ('0xfdE0f97F78A74E788E5Ea61e91D8cEAB396A5f95'),
  RealiFiFractionalToken: /** @type {`0x${string}`} */ ('0xA53860Ff96067c0632fB498bf777807D8B55Da8a')
};

export const FRACTIONAL_TOKEN_ADDRESS = CONTRACTS.RealiFiFractionalToken;
export const REAL_ESTATE_DAPP_ADDRESS = CONTRACTS.RealEstateDApp;
export const MOCK_USDC_ADDRESS = CONTRACTS.MockUSDC;