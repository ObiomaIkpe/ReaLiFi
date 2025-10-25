
import RealifiFractionalTokenArtifact from '../contracts/RealiFiFractionalToken.json';
import RealEstateDapp from "../contracts/RealEstateDApp.json"
import MockUsdc from "../contracts/MockUSDC.json"

export const FRACTIONAL_TOKEN_ABI = RealifiFractionalTokenArtifact;
export const REAL_ESTATE_DAPP = RealEstateDapp;
export const MOCK_USDC = MockUsdc;

export const CONTRACTS = {
  RealEstateDApp: /** @type {`0x${string}`} */ ('0xd1a4710C80A22eBfcc531c888ecFc9f402529f6F'),
  MockUSDC: /** @type {`0x${string}`} */ (' 0x58738EEa382E0d6EA776C5110Cd11cb9C4Aa7140'),
  RealiFiFractionalToken: /** @type {`0x${string}`} */ ('0x543F4D587EBE758470b461d3adC0954C6c71f111')
};

export const FRACTIONAL_TOKEN_ADDRESS = CONTRACTS.RealiFiFractionalToken;
export const REAL_ESTATE_DAPP_ADDRESS = CONTRACTS.RealEstateDApp;
export const MOCK_USDC_ADDRESS = CONTRACTS.MockUSDC;