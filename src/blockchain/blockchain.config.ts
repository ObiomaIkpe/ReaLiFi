import * as Joi from 'joi';

export default () => ({
  blockchain: {
    rpcUrl: process.env.RPC_URL,
    chainId: parseInt(process.env.CHAIN_ID ?? '11155111'),
    realEstateAddress: process.env.REAL_ESTATE_CONTRACT_ADDRESS,
    fractionalTokenAddress: process.env.FRACTIONAL_CONTRACT_ADDRESS,
    usdcAddress: process.env.USDC_CONTRACT_ADDRESS,
  },

  // 👇 Put Pinata config at top-level (not inside blockchain)
  pinata: {
    apiKey: process.env.PINATA_API_KEY,
    apiSecret: process.env.PINATA_API_SECRET,
    jwt: process.env.PINATA_JWT,
  },
});

export const blockchainValidationSchema = Joi.object({
  RPC_URL: Joi.string().uri().required(),
  CHAIN_ID: Joi.number().default(11155111),
  REAL_ESTATE_CONTRACT_ADDRESS: Joi.string()
    .pattern(/^0x[a-fA-F0-9]{40}$/)
    .required(),
  FRACTIONAL_CONTRACT_ADDRESS: Joi.string()
    .pattern(/^0x[a-fA-F0-9]{40}$/)
    .required(),
  USDC_CONTRACT_ADDRESS: Joi.string()
    .pattern(/^0x[a-fA-F0-9]{40}$/)
    .required(),

  // 👇 Add Pinata keys here so they’re not filtered out
  PINATA_API_KEY: Joi.string().required(),
  PINATA_API_SECRET: Joi.string().required(),
  PINATA_JWT: Joi.string().required(),
});
