import { parseEther } from "ethers";
import { network } from "hardhat";

const addressConfig = {
  hardhat: {
    PROXY_ADMIN: "0xBFf244a57a1b132004D43eCeC94D8b1ebB011ec3", // account2
    TREASURY_ADDRESS: "0xDb1d10f6e60Fe6e72072b220520e93bb5444B1D3", // account3 fee receiver account
    UNISWAP_ROUTER: "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D",
  },
  sepolia: {
    PROXY_ADMIN: "0xBFf244a57a1b132004D43eCeC94D8b1ebB011ec3", // account2
    TREASURY_ADDRESS: "0xDb1d10f6e60Fe6e72072b220520e93bb5444B1D3", // account3 fee receiver account
    UNISWAP_ROUTER: "0xeE567Fe1712Faf6149d80dA1E6934E354124CfE3", // AgentFactoryV5 -> setUniswapRouter
  },
  mainnet: {
    PROXY_ADMIN: "",
    TREASURY_ADDRESS: "",
    UNISWAP_ROUTER: "",
  },
};

const baseConfig = {
  // FFactory: FERC20 Token buy/sell tax
  BUY_TAX: 0,
  SELL_TAX: 0,

  // Bonding
  LAUNCH_FEE: 100000, // 100 VirtualToken
  INITIAL_SUPPLY: "1000000000", // 1 billion FERC20 Token
  ASSET_RATE: 5000, // 2K
  MAX_TX: 100, // maxTxAmount: (MAX_TX * totalSupply) / 100,
  GRAD_THRESHOLD: parseEther("125000000"), // 0.125 billion FERC20 Token

  APPLICATION_THRESHOLD: parseEther("125000"), // AgentFactoryV5: 125k
  // AgentFactoryV5 -> setTokenSupplyParams
  AGENT_TOKEN_SUPPLY: parseEther("1000000000"), // 1 billion
  AGENT_TOKEN_LP_SUPPLY: parseEther("1000000000"), // 1 billion
  AGENT_TOKEN_VAULT_SUPPLY: 0,
  MAX_TOKENS_PER_WALLET: parseEther("1000000"), // 1 million
  MAX_TOKENS_PER_TXN: parseEther("100000"), // 100k
  BOT_PROTECTION_DURATION_IN_SECONDS: 3600, // 1 hour
  VAULT_ADDRESS: "0x0000000000000000000000000000000000000000", // if AGENT_TOKEN_VAULT_SUPPLY is 0, this will be ignored

  // AgentFactoryV5 -> setTokenTaxParams: AgentToken buy/sell tax
  PROJECT_BUY_TAX_BASIS_POINTS: 100, // buy tax: 1%
  PROJECT_SELL_TAX_BASIS_POINTS: 100, // sell tax: 1%
  TAX_SWAP_THRESHOLD_BASIS_POINTS: 1, // swap tax: 0.01%

  // AgentFactoryV5 -> setMaturityDuration
  MATURITY_DURATION: 86400 * 365 * 10, // 10 years
};

const networkName: string = network.name;
console.log("networkName", networkName);

const constants = {
  ...addressConfig[networkName],
  ...baseConfig,
};
export default constants;
