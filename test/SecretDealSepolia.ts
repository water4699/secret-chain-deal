import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import { ethers, fhevm, deployments } from "hardhat";
import { SecretDeal } from "../types";
import { expect } from "chai";

type Signers = {
  alice: HardhatEthersSigner;
};

describe("SecretDealSepolia", function () {
  let signers: Signers;
  let secretDealContract: SecretDeal;
  let secretDealContractAddress: string;
  let step: number;
  let steps: number;

  function progress(message: string) {
    console.log(`${++step}/${steps} ${message}`);
  }

  before(async function () {
    if (fhevm.isMock) {
      console.warn(`This hardhat test suite can only run on Sepolia Testnet`);
      this.skip();
    }

    try {
      const SecretDealDeployment = await deployments.get("SecretDeal");
      secretDealContractAddress = SecretDealDeployment.address;
      secretDealContract = await ethers.getContractAt("SecretDeal", SecretDealDeployment.address);
    } catch (e) {
      (e as Error).message += ". Call 'npx hardhat deploy --network sepolia'";
      throw e;
    }

    const ethSigners: HardhatEthersSigner[] = await ethers.getSigners();
    signers = { alice: ethSigners[0] };
  });

  beforeEach(async () => {
    step = 0;
    steps = 0;
  });

  it("should create a deal and submit an encrypted offer", async function () {
    steps = 8;
    this.timeout(6 * 60000);

    progress("Creating a new deal...");
    const dealName = `Sepolia Test Deal ${Date.now()}`;
    let tx = await secretDealContract.connect(signers.alice).createDeal(dealName, 2);
    await tx.wait();

    progress("Getting deal counter...");
    const dealCounter = await secretDealContract.dealCounter();
    const dealId = dealCounter - 1n;
    console.log(`Created deal with ID: ${dealId}`);

    progress("Encrypting offer value...");
    const clearValue = 12345;
    const encryptedValue = await fhevm
      .createEncryptedInput(secretDealContractAddress, signers.alice.address)
      .add32(clearValue)
      .encrypt();

    progress(`Submitting encrypted offer for deal ${dealId}...`);
    tx = await secretDealContract
      .connect(signers.alice)
      .submitOffer(
        dealId,
        encryptedValue.handles[0],
        encryptedValue.inputProof,
        "Sepolia Test Offer",
        "This is a test offer on Sepolia testnet",
      );
    await tx.wait();

    progress("Fetching offer data...");
    const offer = await secretDealContract.getOfferByParty(dealId, signers.alice.address);
    expect(offer.partyAddress).to.equal(signers.alice.address);
    expect(offer.title).to.equal("Sepolia Test Offer");
    expect(offer.revealed).to.be.false;

    progress("Revealing offer...");
    tx = await secretDealContract.connect(signers.alice).revealOffer(dealId);
    await tx.wait();

    progress("Verifying offer revealed...");
    const offerAfterReveal = await secretDealContract.getOfferByParty(dealId, signers.alice.address);
    expect(offerAfterReveal.revealed).to.be.true;

    progress("Test completed successfully!");
  });

  it("should verify deal state correctly", async function () {
    steps = 4;
    this.timeout(3 * 60000);

    progress("Creating a new deal for state verification...");
    const dealName = `State Test Deal ${Date.now()}`;
    const tx = await secretDealContract.connect(signers.alice).createDeal(dealName, 1);
    await tx.wait();

    const dealCounter = await secretDealContract.dealCounter();
    const dealId = dealCounter - 1n;

    progress("Verifying initial deal state...");
    let deal = await secretDealContract.getDeal(dealId);
    expect(deal.dealName).to.equal(dealName);
    expect(deal.finalized).to.be.false;
    expect(deal.cancelled).to.be.false;

    progress("Checking areAllOffersRevealed (should be false with no offers)...");
    const allRevealed = await secretDealContract.areAllOffersRevealed(dealId);
    expect(allRevealed).to.be.false;

    progress("Test completed successfully!");
  });
});

