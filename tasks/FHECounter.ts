import { FhevmType } from "@fhevm/hardhat-plugin";
import { task } from "hardhat/config";
import type { TaskArguments } from "hardhat/types";

/**
 * Tutorial: Deploy and Interact Locally (--network localhost)
 * ===========================================================
 *
 * 1. From a separate terminal window:
 *
 *   npx hardhat node
 *
 * 2. Deploy the FHECounter contract
 *
 *   npx hardhat --network localhost deploy
 *
 * 3. Interact with the FHECounter contract
 *
 *   npx hardhat --network localhost task:decrypt-count
 *   npx hardhat --network localhost task:increment --value 2
 *   npx hardhat --network localhost task:decrement --value 1
 *   npx hardhat --network localhost task:decrypt-count
 *
 *
 * Tutorial: Deploy and Interact on Sepolia (--network sepolia)
 * ===========================================================
 *
 * 1. Deploy the FHECounter contract
 *
 *   npx hardhat --network sepolia deploy
 *
 * 2. Interact with the FHECounter contract
 *
 *   npx hardhat --network sepolia task:decrypt-count
 *   npx hardhat --network sepolia task:increment --value 2
 *   npx hardhat --network sepolia task:decrement --value 1
 *   npx hardhat --network sepolia task:decrypt-count
 *
 */

/**
 * Example:
 *   - npx hardhat --network localhost task:address
 *   - npx hardhat --network sepolia task:address
 */
task("task:address", "Prints the FHECounter address").setAction(async function (_taskArguments: TaskArguments, hre) {
  const { deployments } = hre;

  const fheCounter = await deployments.get("FHECounter");

  console.log("FHECounter address is " + fheCounter.address);
});

/**
 * Example:
 *   - npx hardhat --network localhost task:decrypt-count
 *   - npx hardhat --network sepolia task:decrypt-count
 */
task("task:decrypt-count", "Calls the getCount() function of Counter Contract")
  .addOptionalParam("address", "Optionally specify the Counter contract address")
  .setAction(async function (taskArguments: TaskArguments, hre) {
    const { ethers, deployments, fhevm } = hre;

    await fhevm.initializeCLIApi();

    const FHECounterDeployement = taskArguments.address
      ? { address: taskArguments.address }
      : await deployments.get("FHECounter");
    console.log(`FHECounter: ${FHECounterDeployement.address}`);

    const signers = await ethers.getSigners();

    const fheCounterContract = await ethers.getContractAt("FHECounter", FHECounterDeployement.address);

    const encryptedCount = await fheCounterContract.getCount();
    if (encryptedCount === ethers.ZeroHash) {
      console.log(`encrypted count: ${encryptedCount}`);
      console.log("clear count    : 0");
      return;
    }

    const clearCount = await fhevm.userDecryptEuint(
      FhevmType.euint32,
      encryptedCount,
      FHECounterDeployement.address,
      signers[0],
    );
    console.log(`Encrypted count: ${encryptedCount}`);
    console.log(`Clear count    : ${clearCount}`);
  });

/**
 * Example:
 *   - npx hardhat --network localhost task:increment --value 1
 *   - npx hardhat --network sepolia task:increment --value 1
 */
task("task:increment", "Calls the increment() function of FHECounter Contract")
  .addOptionalParam("address", "Optionally specify the FHECounter contract address")
  .addParam("value", "The increment value")
  .setAction(async function (taskArguments: TaskArguments, hre) {
    const { ethers, deployments, fhevm } = hre;

    const value = parseInt(taskArguments.value);
    if (!Number.isInteger(value)) {
      throw new Error(`Argument --value is not an integer`);
    }

    await fhevm.initializeCLIApi();

    const FHECounterDeployement = taskArguments.address
      ? { address: taskArguments.address }
      : await deployments.get("FHECounter");
    console.log(`FHECounter: ${FHECounterDeployement.address}`);

    const signers = await ethers.getSigners();

    const fheCounterContract = await ethers.getContractAt("FHECounter", FHECounterDeployement.address);

    // Encrypt the value passed as argument
    const encryptedValue = await fhevm
      .createEncryptedInput(FHECounterDeployement.address, signers[0].address)
      .add32(value)
      .encrypt();

    const tx = await fheCounterContract
      .connect(signers[0])
      .increment(encryptedValue.handles[0], encryptedValue.inputProof);
    console.log(`Wait for tx:${tx.hash}...`);

    const receipt = await tx.wait();
    console.log(`tx:${tx.hash} status=${receipt?.status}`);

    const newEncryptedCount = await fheCounterContract.getCount();
    console.log("Encrypted count after increment:", newEncryptedCount);

    console.log(`FHECounter increment(${value}) succeeded!`);
  });

/**
 * Example:
 *   - npx hardhat --network localhost task:decrement --value 1
 *   - npx hardhat --network sepolia task:decrement --value 1
 */
task("task:decrement", "Calls the decrement() function of FHECounter Contract")
  .addOptionalParam("address", "Optionally specify the FHECounter contract address")
  .addParam("value", "The decrement value")
  .setAction(async function (taskArguments: TaskArguments, hre) {
    const { ethers, deployments, fhevm } = hre;

    const value = parseInt(taskArguments.value);
    if (!Number.isInteger(value)) {
      throw new Error(`Argument --value is not an integer`);
    }

    await fhevm.initializeCLIApi();

    const FHECounterDeployement = taskArguments.address
      ? { address: taskArguments.address }
      : await deployments.get("FHECounter");
    console.log(`FHECounter: ${FHECounterDeployement.address}`);

    const signers = await ethers.getSigners();

    const fheCounterContract = await ethers.getContractAt("FHECounter", FHECounterDeployement.address);

    // Encrypt the value passed as argument
    const encryptedValue = await fhevm
      .createEncryptedInput(FHECounterDeployement.address, signers[0].address)
      .add32(value)
      .encrypt();

    const tx = await fheCounterContract
      .connect(signers[0])
      .decrement(encryptedValue.handles[0], encryptedValue.inputProof);
    console.log(`Wait for tx:${tx.hash}...`);

    const receipt = await tx.wait();
    console.log(`tx:${tx.hash} status=${receipt?.status}`);

    const newEncryptedCount = await fheCounterContract.getCount();
    console.log("Encrypted count after decrement:", newEncryptedCount);

    console.log(`FHECounter decrement(${value}) succeeded!`);
  });

/**
 * Example:
 *   - npx hardhat --network localhost task:batch-increment --values "1,2,3"
 *   - npx hardhat --network sepolia task:batch-increment --values "5,10,15"
 */
task("task:batch-increment", "Performs multiple increments in sequence")
  .addOptionalParam("address", "Optionally specify the FHECounter contract address")
  .addParam("values", "Comma-separated list of increment values")
  .setAction(async function (taskArguments: TaskArguments, hre) {
    const { ethers, deployments, fhevm } = hre;

    const valuesString = taskArguments.values as string;
    const values = valuesString.split(",").map((v: string) => {
      const parsed = parseInt(v.trim());
      if (!Number.isInteger(parsed) || parsed <= 0) {
        throw new Error(`Invalid value in list: ${v}`);
      }
      return parsed;
    });

    console.log(`Batch increment with ${values.length} values: [${values.join(", ")}]`);

    await fhevm.initializeCLIApi();

    const FHECounterDeployement = taskArguments.address
      ? { address: taskArguments.address }
      : await deployments.get("FHECounter");
    console.log(`FHECounter: ${FHECounterDeployement.address}`);

    const signers = await ethers.getSigners();
    const fheCounterContract = await ethers.getContractAt("FHECounter", FHECounterDeployement.address);

    let totalIncremented = 0;
    for (let i = 0; i < values.length; i++) {
      const value = values[i];
      console.log(`\n[${i + 1}/${values.length}] Encrypting value ${value}...`);

      const encryptedValue = await fhevm
        .createEncryptedInput(FHECounterDeployement.address, signers[0].address)
        .add32(value)
        .encrypt();

      console.log(`[${i + 1}/${values.length}] Calling increment(${value})...`);
      const tx = await fheCounterContract
        .connect(signers[0])
        .increment(encryptedValue.handles[0], encryptedValue.inputProof);
      
      console.log(`[${i + 1}/${values.length}] Waiting for tx:${tx.hash}...`);
      const receipt = await tx.wait();
      console.log(`[${i + 1}/${values.length}] tx confirmed, status=${receipt?.status}`);

      totalIncremented += value;
    }

    const finalEncryptedCount = await fheCounterContract.getCount();
    console.log(`\n✅ Batch increment completed!`);
    console.log(`   Total incremented: ${totalIncremented}`);
    console.log(`   Final encrypted count handle: ${finalEncryptedCount}`);
  });