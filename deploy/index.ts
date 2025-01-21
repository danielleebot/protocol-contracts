import { ethers } from "hardhat";
import {
  deployAgentFactoryV5,
  deployAgentToken,
  deployAgentVeToken,
  deployBonding,
  deployFFactory,
  deployFRouter,
  deployVirtualToken,
} from "./deployment";
import constants from "./constants";

const {
  TREASURY_ADDRESS,
  UNISWAP_ROUTER,
  AGENT_TOKEN_SUPPLY,
  AGENT_TOKEN_LP_SUPPLY,
  AGENT_TOKEN_VAULT_SUPPLY,
  MAX_TOKENS_PER_WALLET,
  MAX_TOKENS_PER_TXN,
  BOT_PROTECTION_DURATION_IN_SECONDS,
  VAULT_ADDRESS,
  PROJECT_BUY_TAX_BASIS_POINTS,
  PROJECT_SELL_TAX_BASIS_POINTS,
  TAX_SWAP_THRESHOLD_BASIS_POINTS,
  MATURITY_DURATION,
} = constants;

(async () => {
  const [deployer] = await ethers.getSigners();

  // WARN: only for testnet
  const virtualToken = await deployVirtualToken();

  const agentToken = await deployAgentToken();
  const agentVeToken = await deployAgentVeToken();

  const { agentFactoryV5: agentFactory } = await deployAgentFactoryV5({
    agentToken,
    agentVeToken,
    virtualTokenAddress: virtualToken.target,
  });

  const agentFactoryProxy = await ethers.getContractAt(
    "AgentFactoryV5",
    agentFactory.target
  );
  await agentFactoryProxy.setMaturityDuration(MATURITY_DURATION);
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
  const { fRouter } = await deployFRouter(
    fFactory,
    virtualToken.target as string
  );

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
