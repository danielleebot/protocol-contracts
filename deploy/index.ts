import { ethers } from "hardhat";
import { Contract, parseEther } from "ethers";
import {
  deployAgentFactoryV5,
  deployAgentToken,
  deployAgentVeToken,
  deployBonding,
  deployFFactory,
  deployFRouter,
  deployVirtualToken,
} from "./contracts";

const PROXY_ADMIN = "0xcD6B0a358190fB04A01860419c5F5e8e8CC28cB0"; // account1
const TREASURY_ADDRESS = "0xDb1d10f6e60Fe6e72072b220520e93bb5444B1D3"; // account2 fee receiver account

// VirtualToken
const VIRTUAL_TOKEN_INITIAL_SUPPLY = parseEther("50000"); // 50k

// ServiceNft
const DATASET_SHARES = 7000;

// AgentFactoryV3
const APPLICATION_THRESHOLD = parseEther("125000"); // 125k
const TBA_REGISTRY = "0x0000000000000000000000000000000000000000"; // TODO
const UNISWAP_ROUTER = "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D";

// AgentFactoryV3 -> setTokenSupplyParams
const AGENT_TOKEN_SUPPLY = parseEther("1000000000"); // 1 billion
const AGENT_TOKEN_LP_SUPPLY = parseEther("1000000000"); // 1 billion
const AGENT_TOKEN_VAULT_SUPPLY = 0;
const MAX_TOKENS_PER_WALLET = parseEther("1000000"); // 1 million
const MAX_TOKENS_PER_TXN = parseEther("100000"); // 100k
const BOT_PROTECTION_DURATION_IN_SECONDS = 3600; // 1 hour
const VAULT_ADDRESS = "0x0000000000000000000000000000000000000000"; // if AGENT_TOKEN_VAULT_SUPPLY is 0, this will be ignored

// AgentFactoryV3 -> setTokenTaxParams: AgentToken buy/sell tax
const PROJECT_BUY_TAX_BASIS_POINTS = 100; // buy tax: 1%
const PROJECT_SELL_TAX_BASIS_POINTS = 100; // sell tax: 1%
const TAX_SWAP_THRESHOLD_BASIS_POINTS = 1; // swap tax: 0.01%

// FFactory: FERC20 Token buy/sell tax
const BUY_TAX = 0;
const SELL_TAX = 0;

// Bonding
const LAUNCH_FEE = 100000; // 100 VirtualToken
const INITIAL_SUPPLY = "1000000000"; // 1 billion FERC20 Token
const ASSET_RATE = 5000; // 2K
const MAX_TX = 100; // maxTxAmount = (MAX_TX * totalSupply) / 100;
const GRAD_THRESHOLD = parseEther("125000000"); // 0.125 billion FERC20 Token

const genesisInput = {
  name: "Jessica",
  symbol: "JSC",
  tokenURI: "http://jessica",
  daoName: "Jessica DAO",
  cores: [0, 1, 2],
  tbaSalt: "0xa7647ac9429fdce477ebd9a95510385b756c757c26149e740abbab0ad1be2f16",
  tbaImplementation: "0x0000000000000000000000000000000000000000",
  daoVotingPeriod: 600,
  daoThreshold: 1000000000000000000000n,
};

(async () => {
  const [deployer] = await ethers.getSigners();

  const virtualToken = await deployVirtualToken();

  // const { agentNft } = await deployAgentNft();
  // const { contributionNft } = await deployContributionNft(agentNft);
  // const { serviceNft } = await deployServiceNft(agentNft, contributionNft);

  // // configuration
  // const agentNftProxy = await ethers.getContractAt(
  //   "AgentNftV2",
  //   agentNft.target
  // );
  // await agentNftProxy.setContributionService(
  //   contributionNft.target,
  //   serviceNft.target
  // );
  // console.log("AgentNftV2 setContributionService done.");

  const agentToken = await deployAgentToken();
  const agentVeToken = await deployAgentVeToken();
  // const agentDAO = await deployAgentDAO();

  // const { agentFactory } = await deployAgentFactoryV3({
  //   agentToken,
  //   agentVeToken,
  //   agentDAO,
  //   agentNft,
  //   virtualTokenAddress: virtualToken.target,
  // });

  const { agentFactoryV5: agentFactory } = await deployAgentFactoryV5({
    agentToken,
    agentVeToken,
    virtualTokenAddress: virtualToken.target,
  });

  // await agentNftProxy.grantRole(
  //   await agentNftProxy.MINTER_ROLE(),
  //   agentFactory.target
  // );
  // console.log("AgentNftV2 grantRole done.");

  const agentFactoryProxy = await ethers.getContractAt(
    "AgentFactoryV3",
    agentFactory.target
  );
  await agentFactoryProxy.setMaturityDuration(86400 * 365 * 10); // 10years
  await agentFactoryProxy.setUniswapRouter(UNISWAP_ROUTER);
  await agentFactoryProxy.setTokenAdmin(deployer.address);
  await agentFactoryProxy.setTokenSupplyParams(
    AGENT_TOKEN_SUPPLY,
    AGENT_TOKEN_LP_SUPPLY,
    AGENT_TOKEN_VAULT_SUPPLY,
    MAX_TOKENS_PER_WALLET,
    MAX_TOKENS_PER_TXN,
    BOT_PROTECTION_DURATION_IN_SECONDS,
    VAULT_ADDRESS
  );

  await agentFactoryProxy.setTokenTaxParams(
    PROJECT_BUY_TAX_BASIS_POINTS,
    PROJECT_SELL_TAX_BASIS_POINTS,
    TAX_SWAP_THRESHOLD_BASIS_POINTS,
    TREASURY_ADDRESS
  );

  const { fFactory } = await deployFFactory();
  const { fRouter } = await deployFRouter(fFactory, virtualToken.target);

  const fFactoryProxy = await ethers.getContractAt("FFactory", fFactory.target);
  await fFactoryProxy.setRouter(fRouter.target);
  console.log("FFactory setRouter done.");

  const { bonding } = await deployBonding({
    fFactory,
    fRouter,
    agentFactory,
  });

  await fFactoryProxy.grantRole(
    await fFactoryProxy.CREATOR_ROLE(),
    bonding.target
  );

  const fRouterProxy = await ethers.getContractAt("FRouter", fRouter.target);
  await fRouterProxy.grantRole(
    await fRouterProxy.EXECUTOR_ROLE(),
    bonding.target
  );
  await agentFactoryProxy.grantRole(
    await agentFactoryProxy.BONDING_ROLE(),
    bonding.target
  );
})();
