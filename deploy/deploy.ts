import { DeployFunction } from "hardhat-deploy/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployer } = await hre.getNamedAccounts();
  const { deploy } = hre.deployments;
  const { ethers } = hre;

  console.log(`\n🚀 Starting deployment with deployer: ${deployer}`);
  console.log(`📡 Network: ${hre.network.name} (chainId: ${hre.network.config.chainId})`);

  // Deploy FHECounter contract
  const deployedFHECounter = await deploy("FHECounter", {
    from: deployer,
    log: true,
  });
  console.log(`✅ FHECounter contract deployed at: ${deployedFHECounter.address}`);

  // Verify FHECounter deployment
  const fheCounterCode = await ethers.provider.getCode(deployedFHECounter.address);
  if (fheCounterCode === "0x") {
    throw new Error("FHECounter deployment verification failed - no bytecode at address");
  }
  console.log(`   └─ Bytecode verified (${fheCounterCode.length} chars)`);

  // Deploy SecretDeal contract
  const deployedSecretDeal = await deploy("SecretDeal", {
    from: deployer,
    log: true,
  });
  console.log(`✅ SecretDeal contract deployed at: ${deployedSecretDeal.address}`);

  // Verify SecretDeal deployment
  const secretDealCode = await ethers.provider.getCode(deployedSecretDeal.address);
  if (secretDealCode === "0x") {
    throw new Error("SecretDeal deployment verification failed - no bytecode at address");
  }
  console.log(`   └─ Bytecode verified (${secretDealCode.length} chars)`);

  // Verify SecretDeal initial state
  const secretDealContract = await ethers.getContractAt("SecretDeal", deployedSecretDeal.address);
  const dealCounter = await secretDealContract.dealCounter();
  console.log(`   └─ Initial deal counter: ${dealCounter}`);

  console.log(`\n📋 Deployment Summary:`);
  console.log(`   FHECounter:  ${deployedFHECounter.address}`);
  console.log(`   SecretDeal:  ${deployedSecretDeal.address}`);
  console.log(`\n✨ All contracts deployed and verified successfully!\n`);
};

export default func;
func.id = "deploy_contracts"; // id required to prevent reexecution
func.tags = ["FHECounter", "SecretDeal"];
