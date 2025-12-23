import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import { ethers, fhevm } from "hardhat";
import { FHECounter, FHECounter__factory } from "../types";
import { expect } from "chai";
import { FhevmType } from "@fhevm/hardhat-plugin";

type Signers = {
  deployer: HardhatEthersSigner;
  alice: HardhatEthersSigner;
  bob: HardhatEthersSigner;
};

async function deployFixture() {
  const factory = (await ethers.getContractFactory("FHECounter")) as FHECounter__factory;
  const fheCounterContract = (await factory.deploy()) as FHECounter;
  const fheCounterContractAddress = await fheCounterContract.getAddress();

  return { fheCounterContract, fheCounterContractAddress };
}

describe("FHECounter", function () {
  let signers: Signers;
  let fheCounterContract: FHECounter;
  let fheCounterContractAddress: string;

  before(async function () {
    const ethSigners: HardhatEthersSigner[] = await ethers.getSigners();
    signers = { deployer: ethSigners[0], alice: ethSigners[1], bob: ethSigners[2] };
  });

  beforeEach(async function () {
    // Check whether the tests are running against an FHEVM mock environment
    if (!fhevm.isMock) {
      console.warn(`This hardhat test suite cannot run on Sepolia Testnet`);
      this.skip();
    }

    ({ fheCounterContract, fheCounterContractAddress } = await deployFixture());
  });

  it("encrypted count should be uninitialized after deployment", async function () {
    const encryptedCount = await fheCounterContract.getCount();
    // Expect initial count to be bytes32(0) after deployment,
    // (meaning the encrypted count value is uninitialized)
    expect(encryptedCount).to.eq(ethers.ZeroHash);
  });

  it("increment the counter by 1", async function () {
    const encryptedCountBeforeInc = await fheCounterContract.getCount();
    expect(encryptedCountBeforeInc).to.eq(ethers.ZeroHash);
    const clearCountBeforeInc = 0;

    // Encrypt constant 1 as a euint32
    const clearOne = 1;
    const encryptedOne = await fhevm
      .createEncryptedInput(fheCounterContractAddress, signers.alice.address)
      .add32(clearOne)
      .encrypt();

    const tx = await fheCounterContract
      .connect(signers.alice)
      .increment(encryptedOne.handles[0], encryptedOne.inputProof);
    await tx.wait();

    const encryptedCountAfterInc = await fheCounterContract.getCount();
    const clearCountAfterInc = await fhevm.userDecryptEuint(
      FhevmType.euint32,
      encryptedCountAfterInc,
      fheCounterContractAddress,
      signers.alice,
    );

    expect(clearCountAfterInc).to.eq(clearCountBeforeInc + clearOne);
  });

  it("decrement the counter by 1", async function () {
    // Encrypt constant 1 as a euint32
    const clearOne = 1;
    const encryptedOne = await fhevm
      .createEncryptedInput(fheCounterContractAddress, signers.alice.address)
      .add32(clearOne)
      .encrypt();

    // First increment by 1, count becomes 1
    let tx = await fheCounterContract
      .connect(signers.alice)
      .increment(encryptedOne.handles[0], encryptedOne.inputProof);
    await tx.wait();

    // Then decrement by 1, count goes back to 0
    tx = await fheCounterContract.connect(signers.alice).decrement(encryptedOne.handles[0], encryptedOne.inputProof);
    await tx.wait();

    const encryptedCountAfterDec = await fheCounterContract.getCount();
    const clearCountAfterInc = await fhevm.userDecryptEuint(
      FhevmType.euint32,
      encryptedCountAfterDec,
      fheCounterContractAddress,
      signers.alice,
    );

    expect(clearCountAfterInc).to.eq(0);
  });

  it("increment with larger value", async function () {
    // Encrypt a larger value
    const largeValue = 1000;
    const encryptedLarge = await fhevm
      .createEncryptedInput(fheCounterContractAddress, signers.alice.address)
      .add32(largeValue)
      .encrypt();

    const tx = await fheCounterContract
      .connect(signers.alice)
      .increment(encryptedLarge.handles[0], encryptedLarge.inputProof);
    await tx.wait();

    const encryptedCount = await fheCounterContract.getCount();
    const clearCount = await fhevm.userDecryptEuint(
      FhevmType.euint32,
      encryptedCount,
      fheCounterContractAddress,
      signers.alice,
    );

    expect(clearCount).to.eq(largeValue);
  });

  it("multiple increments accumulate correctly", async function () {
    const values = [5, 10, 15];
    let expectedTotal = 0;

    for (const val of values) {
      const encrypted = await fhevm
        .createEncryptedInput(fheCounterContractAddress, signers.alice.address)
        .add32(val)
        .encrypt();

      const tx = await fheCounterContract
        .connect(signers.alice)
        .increment(encrypted.handles[0], encrypted.inputProof);
      await tx.wait();
      expectedTotal += val;
    }

    const encryptedCount = await fheCounterContract.getCount();
    const clearCount = await fhevm.userDecryptEuint(
      FhevmType.euint32,
      encryptedCount,
      fheCounterContractAddress,
      signers.alice,
    );

    expect(clearCount).to.eq(expectedTotal);
  });

  it("different users can interact with the counter", async function () {
    // Alice increments
    const encryptedAlice = await fhevm
      .createEncryptedInput(fheCounterContractAddress, signers.alice.address)
      .add32(7)
      .encrypt();

    let tx = await fheCounterContract
      .connect(signers.alice)
      .increment(encryptedAlice.handles[0], encryptedAlice.inputProof);
    await tx.wait();

    // Bob increments
    const encryptedBob = await fhevm
      .createEncryptedInput(fheCounterContractAddress, signers.bob.address)
      .add32(3)
      .encrypt();

    tx = await fheCounterContract
      .connect(signers.bob)
      .increment(encryptedBob.handles[0], encryptedBob.inputProof);
    await tx.wait();

    const encryptedCount = await fheCounterContract.getCount();
    const clearCount = await fhevm.userDecryptEuint(
      FhevmType.euint32,
      encryptedCount,
      fheCounterContractAddress,
      signers.alice,
    );

    expect(clearCount).to.eq(10); // 7 + 3
  });
});
