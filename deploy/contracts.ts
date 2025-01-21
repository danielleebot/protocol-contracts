import { ethers } from "hardhat";
import { Contract, parseEther } from "ethers";

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

// // AgentFactoryV3 -> setTokenSupplyParams
// const AGENT_TOKEN_SUPPLY = parseEther("1000000000"); // 1 billion
// const AGENT_TOKEN_LP_SUPPLY = parseEther("1000000000"); // 1 billion
// const AGENT_TOKEN_VAULT_SUPPLY = 0;
// const MAX_TOKENS_PER_WALLET = parseEther("1000000"); // 1 million
// const MAX_TOKENS_PER_TXN = parseEther("100000"); // 100k
// const BOT_PROTECTION_DURATION_IN_SECONDS = 3600; // 1 hour
// const VAULT_ADDRESS = "0x0000000000000000000000000000000000000000"; // if AGENT_TOKEN_VAULT_SUPPLY is 0, this will be ignored

// // AgentFactoryV3 -> setTokenTaxParams: AgentToken buy/sell tax
// const PROJECT_BUY_TAX_BASIS_POINTS = 100; // buy tax: 1%
// const PROJECT_SELL_TAX_BASIS_POINTS = 100; // sell tax: 1%
// const TAX_SWAP_THRESHOLD_BASIS_POINTS = 1; // swap tax: 0.01%

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

export async function deployVirtualToken() {
  const [deployer] = await ethers.getSigners();
  const VirtualToken = await ethers.deployContract(
    "VirtualToken",
    [VIRTUAL_TOKEN_INITIAL_SUPPLY, deployer.address],
    {}
  );
  const virtualToken = await VirtualToken.waitForDeployment();

  console.log("VirtualToken deployed to:", virtualToken.target);

  return virtualToken;
}

export async function deployAgentNft() {
  const [deployer] = await ethers.getSigners();

  // 1. deploy logic
  const logic = await ethers.deployContract("AgentNftV2");
  await logic.waitForDeployment();
  console.log("AgentNftV2 Logic deployed to:", logic.target);

  // 2. deploy proxy
  const proxy = await ethers.deployContract("TransparentUpgradeableProxy", [
    logic.target,
    PROXY_ADMIN,
    Buffer.from(""),
  ]);
  await proxy.waitForDeployment();
  console.log("AgentNftV2 Proxy deployed to:", proxy.target);

  // 3. initialize
  const agentNftV2 = await ethers.getContractAt("AgentNftV2", proxy.target);
  await (await agentNftV2.initialize(deployer.address)).wait();
  console.log("AgentNftV2 initialize done.");

  return { agentNft: proxy };
}

export async function deployContributionNft(agentNft: Contract) {
  // 1. deploy logic
  const logic = await ethers.deployContract("ContributionNft");
  await logic.waitForDeployment();
  console.log("ContributionNft Logic deployed to:", logic.target);

  // 2. deploy proxy
  const proxy = await ethers.deployContract("TransparentUpgradeableProxy", [
    logic.target,
    PROXY_ADMIN,
    Buffer.from(""),
  ]);
  await proxy.waitForDeployment();
  console.log("ContributionNft Proxy deployed to:", proxy.target);

  // 3. initialize
  const contributionNft = await ethers.getContractAt(
    "ContributionNft",
    proxy.target
  );
  await (await contributionNft.initialize(agentNft.target)).wait();
  console.log("ContributionNft initialize done.");

  return { contributionNft: proxy };
}

export async function deployServiceNft(
  agentNft: Contract,
  contributionNft: Contract
) {
  // 1. deploy logic
  const logic = await ethers.deployContract("ServiceNft");
  await logic.waitForDeployment();
  console.log("ServiceNft Logic deployed to:", logic.target);

  // 2. deploy proxy
  const proxy = await ethers.deployContract("TransparentUpgradeableProxy", [
    logic.target,
    PROXY_ADMIN,
    Buffer.from(""),
  ]);
  await proxy.waitForDeployment();
  console.log("ServiceNft Proxy deployed to:", proxy.target);

  // 3. initialize
  const serviceNft = await ethers.getContractAt("ServiceNft", proxy.target);
  await (
    await serviceNft.initialize(
      agentNft.target,
      contributionNft.target,
      DATASET_SHARES
    )
  ).wait();
  console.log("ServiceNft initialize done.");

  return { serviceNft: proxy };
}

export async function deployAgentToken() {
  const agentToken = await ethers.deployContract("AgentToken");
  await agentToken.waitForDeployment();

  console.log("AgentToken deployed to:", agentToken.target);
  return agentToken;
}

export async function deployAgentVeToken() {
  const agentVeToken = await ethers.deployContract("AgentVeToken");
  await agentVeToken.waitForDeployment();

  console.log("AgentVeToken deployed to:", agentVeToken.target);
  return agentVeToken;
}

export async function deployAgentDAO() {
  const agentDAO = await ethers.deployContract("AgentDAO");
  await agentDAO.waitForDeployment();

  console.log("AgentDAO deployed to:", agentDAO.target);
  return agentDAO;
}

export async function deployAgentFactoryV3({
  agentToken,
  agentVeToken,
  agentDAO,
  agentNft,
  virtualTokenAddress,
}: any) {
  const [deployer] = await ethers.getSigners();

  // 1. deploy logic
  const logic = await ethers.deployContract("AgentFactoryV3");
  await logic.waitForDeployment();
  console.log("AgentFactoryV3 Logic deployed to:", logic.target);

  // 2. deploy proxy
  const proxy = await ethers.deployContract("TransparentUpgradeableProxy", [
    logic.target,
    PROXY_ADMIN,
    Buffer.from(""),
  ]);
  await proxy.waitForDeployment();
  console.log("AgentFactoryV3 Proxy deployed to:", proxy.target);

  // 3. initialize
  const agentFactoryV3 = await ethers.getContractAt(
    "AgentFactoryV3",
    proxy.target
  );
  await (
    await agentFactoryV3.initialize(
      agentToken.target,
      agentVeToken.target,
      agentDAO.target,
      TBA_REGISTRY,
      virtualTokenAddress,
      agentNft.target,
      APPLICATION_THRESHOLD,
      deployer.address,
      1001
    )
  ).wait();
  console.log("AgentFactoryV3 initialize done.");

  return { agentFactory: proxy };
}

export async function deployAgentFactoryV5({
  agentToken,
  agentVeToken,
  virtualTokenAddress,
}: any) {
  const [deployer] = await ethers.getSigners();

  // 1. deploy logic
  const logic = await ethers.deployContract("AgentFactoryV5");
  await logic.waitForDeployment();
  console.log("AgentFactoryV5 Logic deployed to:", logic.target);

  // 2. deploy proxy
  const proxy = await ethers.deployContract("TransparentUpgradeableProxy", [
    logic.target,
    PROXY_ADMIN,
    Buffer.from(""),
  ]);
  await proxy.waitForDeployment();
  console.log("AgentFactoryV5 Proxy deployed to:", proxy.target);

  // 3. initialize
  const agentFactoryV5 = await ethers.getContractAt(
    "AgentFactoryV5",
    proxy.target
  );
  await (
    await agentFactoryV5.initialize(
      agentToken.target,
      agentVeToken.target,
      virtualTokenAddress,
      APPLICATION_THRESHOLD,
      1001
    )
  ).wait();
  console.log("AgentFactoryV5 initialize done.");

  return { agentFactoryV5: proxy };
}

export async function deployFFactory() {
  const [deployer] = await ethers.getSigners();

  // 1. deploy logic
  const logic = await ethers.deployContract("FFactory");
  await logic.waitForDeployment();
  console.log("FFactory Logic deployed to:", logic.target);

  // 2. deploy proxy
  const proxy = await ethers.deployContract("TransparentUpgradeableProxy", [
    logic.target,
    PROXY_ADMIN,
    Buffer.from(""),
  ]);
  await proxy.waitForDeployment();
  console.log("FFactory Proxy deployed to:", proxy.target);

  // 3. initialize
  const fFactory = await ethers.getContractAt("FFactory", proxy.target);
  await (await fFactory.initialize(TREASURY_ADDRESS, BUY_TAX, SELL_TAX)).wait();
  console.log("FFactory initialize done.");

  await fFactory.grantRole(await fFactory.ADMIN_ROLE(), deployer.address);
  console.log("FFactory grant ADMIN_ROLE done.");

  return { fFactory: proxy };
}

export async function deployFRouter(
  fFactory: Contract,
  virtualTokenAddress: string
) {
  // 1. deploy logic
  const logic = await ethers.deployContract("FRouter");
  await logic.waitForDeployment();
  console.log("FRouter Logic deployed to:", logic.target);

  // 2. deploy proxy
  const proxy = await ethers.deployContract("TransparentUpgradeableProxy", [
    logic.target,
    PROXY_ADMIN,
    Buffer.from(""),
  ]);
  await proxy.waitForDeployment();
  console.log("FRouter Proxy deployed to:", proxy.target);

  // 3. initialize
  const fRouter = await ethers.getContractAt("FRouter", proxy.target);
  await (await fRouter.initialize(fFactory.target, virtualTokenAddress)).wait();
  console.log("FRouter initialize done.");

  return { fRouter: proxy };
}

export async function deployBonding({ fFactory, fRouter, agentFactory }: any) {
  // 1. deploy logic
  const logic = await ethers.deployContract("Bonding");
  await logic.waitForDeployment();
  console.log("Bonding Logic deployed to:", logic.target);

  // 2. deploy proxy
  const proxy = await ethers.deployContract("TransparentUpgradeableProxy", [
    logic.target,
    PROXY_ADMIN,
    Buffer.from(""),
  ]);
  await proxy.waitForDeployment();
  console.log("Bonding Proxy deployed to:", proxy.target);

  // 3. initialize
  const bonding = await ethers.getContractAt("Bonding", proxy.target);
  await (
    await bonding.initialize(
      fFactory.target,
      fRouter.target,
      TREASURY_ADDRESS,
      LAUNCH_FEE,
      INITIAL_SUPPLY,
      ASSET_RATE,
      MAX_TX,
      agentFactory.target,
      GRAD_THRESHOLD
    )
  ).wait();
  console.log("Bonding initialize done.");

  await (
    await bonding.setDeployParams([
      genesisInput.tbaSalt,
      genesisInput.tbaImplementation,
      genesisInput.daoVotingPeriod,
      genesisInput.daoThreshold,
    ])
  ).wait();

  return { bonding: proxy };
}
