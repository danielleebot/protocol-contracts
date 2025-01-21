import { ethers } from "hardhat";
import { Contract, parseEther } from "ethers";
import constants from "./constants";

const {
  PROXY_ADMIN,
  TREASURY_ADDRESS,
  APPLICATION_THRESHOLD,
  BUY_TAX,
  SELL_TAX,
  LAUNCH_FEE,
  INITIAL_SUPPLY,
  ASSET_RATE,
  MAX_TX,
  GRAD_THRESHOLD,
} = constants;

export async function deployVirtualToken() {
  const [deployer] = await ethers.getSigners();

  const VIRTUAL_TOKEN_INITIAL_SUPPLY = parseEther("50000"); // 50k
  const VirtualToken = await ethers.deployContract(
    "VirtualToken",
    [VIRTUAL_TOKEN_INITIAL_SUPPLY, deployer.address],
    {}
  );
  const virtualToken = await VirtualToken.waitForDeployment();

  console.log("VirtualToken deployed to:", virtualToken.target);

  return virtualToken;
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

  const genesisInput = {
    tbaSalt:
      "0xa7647ac9429fdce477ebd9a95510385b756c757c26149e740abbab0ad1be2f16",
    tbaImplementation: "0x0000000000000000000000000000000000000000",
    daoVotingPeriod: 600,
    daoThreshold: 1000000000000000000000n,
  };
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
