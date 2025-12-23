import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import { ethers, fhevm } from "hardhat";
import { SecretDeal, SecretDeal__factory } from "../types";
import { expect } from "chai";

type Signers = {
  deployer: HardhatEthersSigner;
  alice: HardhatEthersSigner;
  bob: HardhatEthersSigner;
  charlie: HardhatEthersSigner;
};

async function deployFixture() {
  const factory = (await ethers.getContractFactory("SecretDeal")) as SecretDeal__factory;
  const secretDealContract = (await factory.deploy()) as SecretDeal;
  const secretDealContractAddress = await secretDealContract.getAddress();

  return { secretDealContract, secretDealContractAddress };
}

describe("SecretDeal", function () {
  let signers: Signers;
  let secretDealContract: SecretDeal;
  let secretDealContractAddress: string;

  before(async function () {
    const ethSigners: HardhatEthersSigner[] = await ethers.getSigners();
    signers = {
      deployer: ethSigners[0],
      alice: ethSigners[1],
      bob: ethSigners[2],
      charlie: ethSigners[3],
    };
  });

  beforeEach(async function () {
    // Check whether the tests are running against an FHEVM mock environment
    if (!fhevm.isMock) {
      console.warn(`This hardhat test suite cannot run on Sepolia Testnet`);
      this.skip();
    }

    ({ secretDealContract, secretDealContractAddress } = await deployFixture());
  });

  describe("Deal Creation", function () {
    it("should create a new deal successfully", async function () {
      const dealName = "Test Deal";
      const requiredParties = 2;

      const tx = await secretDealContract
        .connect(signers.alice)
        .createDeal(dealName, requiredParties);
      await tx.wait();

      const dealId = 0;
      const deal = await secretDealContract.getDeal(dealId);

      expect(deal.dealName).to.equal(dealName);
      expect(deal.requiredParties).to.equal(requiredParties);
      expect(deal.finalized).to.be.false;
      expect(deal.cancelled).to.be.false;
    });

    it("should increment deal counter", async function () {
      await secretDealContract.connect(signers.alice).createDeal("Deal 1", 2);
      await secretDealContract.connect(signers.alice).createDeal("Deal 2", 3);

      const counter = await secretDealContract.dealCounter();
      expect(counter).to.equal(2);
    });

    it("should emit DealCreated event", async function () {
      await expect(secretDealContract.connect(signers.alice).createDeal("Event Test", 2))
        .to.emit(secretDealContract, "DealCreated")
        .withArgs(0, "Event Test", 2, signers.alice.address);
    });

    it("should revert with empty deal name", async function () {
      await expect(secretDealContract.connect(signers.alice).createDeal("", 2)).to.be.revertedWith(
        "Deal name cannot be empty",
      );
    });

    it("should revert with zero required parties", async function () {
      await expect(
        secretDealContract.connect(signers.alice).createDeal("Test", 0),
      ).to.be.revertedWith("At least one party required");
    });
  });

  describe("Offer Submission", function () {
    let dealId: number;

    beforeEach(async function () {
      await secretDealContract.connect(signers.deployer).createDeal("Negotiation Deal", 2);
      dealId = 0;
    });

    it("should submit an encrypted offer successfully", async function () {
      const title = "My Offer";
      const description = "Offering 1000 tokens";
      const clearValue = 1000;

      // Encrypt the offer value
      const encryptedValue = await fhevm
        .createEncryptedInput(secretDealContractAddress, signers.alice.address)
        .add32(clearValue)
        .encrypt();

      const tx = await secretDealContract
        .connect(signers.alice)
        .submitOffer(dealId, encryptedValue.handles[0], encryptedValue.inputProof, title, description);
      await tx.wait();

      const offer = await secretDealContract.getOfferByParty(dealId, signers.alice.address);
      expect(offer.partyAddress).to.equal(signers.alice.address);
      expect(offer.title).to.equal(title);
      expect(offer.description).to.equal(description);
      expect(offer.revealed).to.be.false;
    });

    it("should emit OfferSubmitted event", async function () {
      const encryptedValue = await fhevm
        .createEncryptedInput(secretDealContractAddress, signers.alice.address)
        .add32(500)
        .encrypt();

      await expect(
        secretDealContract
          .connect(signers.alice)
          .submitOffer(dealId, encryptedValue.handles[0], encryptedValue.inputProof, "Event Offer", "Description"),
      )
        .to.emit(secretDealContract, "OfferSubmitted")
        .withArgs(dealId, signers.alice.address, "Event Offer");
    });

    it("should not allow duplicate offers from same party", async function () {
      const encryptedValue1 = await fhevm
        .createEncryptedInput(secretDealContractAddress, signers.alice.address)
        .add32(100)
        .encrypt();

      await secretDealContract
        .connect(signers.alice)
        .submitOffer(dealId, encryptedValue1.handles[0], encryptedValue1.inputProof, "First Offer", "First");

      const encryptedValue2 = await fhevm
        .createEncryptedInput(secretDealContractAddress, signers.alice.address)
        .add32(200)
        .encrypt();

      await expect(
        secretDealContract
          .connect(signers.alice)
          .submitOffer(dealId, encryptedValue2.handles[0], encryptedValue2.inputProof, "Second Offer", "Second"),
      ).to.be.revertedWith("Offer already submitted");
    });

    it("should increment offer count", async function () {
      const encryptedValue1 = await fhevm
        .createEncryptedInput(secretDealContractAddress, signers.alice.address)
        .add32(100)
        .encrypt();

      await secretDealContract
        .connect(signers.alice)
        .submitOffer(dealId, encryptedValue1.handles[0], encryptedValue1.inputProof, "Alice Offer", "Alice");

      const encryptedValue2 = await fhevm
        .createEncryptedInput(secretDealContractAddress, signers.bob.address)
        .add32(200)
        .encrypt();

      await secretDealContract
        .connect(signers.bob)
        .submitOffer(dealId, encryptedValue2.handles[0], encryptedValue2.inputProof, "Bob Offer", "Bob");

      const partyCount = await secretDealContract.getPartyCount(dealId);
      expect(partyCount).to.equal(2);
    });
  });

  describe("Offer Revelation", function () {
    let dealId: number;

    beforeEach(async function () {
      await secretDealContract.connect(signers.deployer).createDeal("Reveal Deal", 2);
      dealId = 0;

      const encryptedValue = await fhevm
        .createEncryptedInput(secretDealContractAddress, signers.alice.address)
        .add32(500)
        .encrypt();

      await secretDealContract
        .connect(signers.alice)
        .submitOffer(dealId, encryptedValue.handles[0], encryptedValue.inputProof, "Alice Offer", "Terms");
    });

    it("should reveal offer successfully", async function () {
      const tx = await secretDealContract.connect(signers.alice).revealOffer(dealId);
      await tx.wait();

      const offer = await secretDealContract.getOfferByParty(dealId, signers.alice.address);
      expect(offer.revealed).to.be.true;
    });

    it("should emit OfferRevealed event", async function () {
      await expect(secretDealContract.connect(signers.alice).revealOffer(dealId))
        .to.emit(secretDealContract, "OfferRevealed")
        .withArgs(dealId, signers.alice.address);
    });

    it("should not allow revealing non-existent offer", async function () {
      await expect(secretDealContract.connect(signers.bob).revealOffer(dealId)).to.be.revertedWith(
        "No offer found for this address",
      );
    });

    it("should not allow double reveal", async function () {
      await secretDealContract.connect(signers.alice).revealOffer(dealId);

      await expect(secretDealContract.connect(signers.alice).revealOffer(dealId)).to.be.revertedWith(
        "Offer already revealed",
      );
    });
  });

  describe("Deal Finalization", function () {
    let dealId: number;

    beforeEach(async function () {
      await secretDealContract.connect(signers.deployer).createDeal("Finalize Deal", 2);
      dealId = 0;

      // Alice submits offer
      const encryptedValue1 = await fhevm
        .createEncryptedInput(secretDealContractAddress, signers.alice.address)
        .add32(1000)
        .encrypt();
      await secretDealContract
        .connect(signers.alice)
        .submitOffer(dealId, encryptedValue1.handles[0], encryptedValue1.inputProof, "Alice Offer", "Alice terms");

      // Bob submits offer
      const encryptedValue2 = await fhevm
        .createEncryptedInput(secretDealContractAddress, signers.bob.address)
        .add32(1500)
        .encrypt();
      await secretDealContract
        .connect(signers.bob)
        .submitOffer(dealId, encryptedValue2.handles[0], encryptedValue2.inputProof, "Bob Offer", "Bob terms");
    });

    it("should not finalize if not all offers revealed", async function () {
      // Only Alice reveals
      await secretDealContract.connect(signers.alice).revealOffer(dealId);

      await expect(secretDealContract.connect(signers.deployer).finalizeDeal(dealId)).to.be.revertedWith(
        "Not all offers revealed",
      );
    });

    it("should finalize when all offers revealed", async function () {
      await secretDealContract.connect(signers.alice).revealOffer(dealId);
      await secretDealContract.connect(signers.bob).revealOffer(dealId);

      const tx = await secretDealContract.connect(signers.deployer).finalizeDeal(dealId);
      await tx.wait();

      const deal = await secretDealContract.getDeal(dealId);
      expect(deal.finalized).to.be.true;
    });

    it("should emit DealFinalized event", async function () {
      await secretDealContract.connect(signers.alice).revealOffer(dealId);
      await secretDealContract.connect(signers.bob).revealOffer(dealId);

      await expect(secretDealContract.connect(signers.deployer).finalizeDeal(dealId)).to.emit(
        secretDealContract,
        "DealFinalized",
      );
    });

    it("should not allow double finalization", async function () {
      await secretDealContract.connect(signers.alice).revealOffer(dealId);
      await secretDealContract.connect(signers.bob).revealOffer(dealId);
      await secretDealContract.connect(signers.deployer).finalizeDeal(dealId);

      await expect(secretDealContract.connect(signers.deployer).finalizeDeal(dealId)).to.be.revertedWith(
        "Deal already finalized",
      );
    });
  });

  describe("Deal Cancellation", function () {
    let dealId: number;

    beforeEach(async function () {
      await secretDealContract.connect(signers.deployer).createDeal("Cancel Deal", 2);
      dealId = 0;
    });

    it("should cancel deal successfully", async function () {
      const tx = await secretDealContract.connect(signers.deployer).cancelDeal(dealId);
      await tx.wait();

      const deal = await secretDealContract.getDeal(dealId);
      expect(deal.cancelled).to.be.true;
    });

    it("should emit DealCancelled event", async function () {
      await expect(secretDealContract.connect(signers.deployer).cancelDeal(dealId))
        .to.emit(secretDealContract, "DealCancelled")
        .withArgs(dealId, signers.deployer.address);
    });

    it("should not allow submitting offers to cancelled deal", async function () {
      await secretDealContract.connect(signers.deployer).cancelDeal(dealId);

      const encryptedValue = await fhevm
        .createEncryptedInput(secretDealContractAddress, signers.alice.address)
        .add32(100)
        .encrypt();

      await expect(
        secretDealContract
          .connect(signers.alice)
          .submitOffer(dealId, encryptedValue.handles[0], encryptedValue.inputProof, "Offer", "Desc"),
      ).to.be.revertedWith("Deal has been cancelled");
    });

    it("should not allow double cancellation", async function () {
      await secretDealContract.connect(signers.deployer).cancelDeal(dealId);

      await expect(secretDealContract.connect(signers.deployer).cancelDeal(dealId)).to.be.revertedWith(
        "Deal already cancelled",
      );
    });
  });

  describe("View Functions", function () {
    let dealId: number;

    beforeEach(async function () {
      await secretDealContract.connect(signers.deployer).createDeal("View Deal", 3);
      dealId = 0;

      const encryptedValue = await fhevm
        .createEncryptedInput(secretDealContractAddress, signers.alice.address)
        .add32(777)
        .encrypt();

      await secretDealContract
        .connect(signers.alice)
        .submitOffer(dealId, encryptedValue.handles[0], encryptedValue.inputProof, "Test Title", "Test Description");
    });

    it("should check areAllOffersRevealed correctly", async function () {
      expect(await secretDealContract.areAllOffersRevealed(dealId)).to.be.false;

      await secretDealContract.connect(signers.alice).revealOffer(dealId);

      expect(await secretDealContract.areAllOffersRevealed(dealId)).to.be.true;
    });

    it("should return correct party count", async function () {
      expect(await secretDealContract.getPartyCount(dealId)).to.equal(1);

      const encryptedValue = await fhevm
        .createEncryptedInput(secretDealContractAddress, signers.bob.address)
        .add32(888)
        .encrypt();

      await secretDealContract
        .connect(signers.bob)
        .submitOffer(dealId, encryptedValue.handles[0], encryptedValue.inputProof, "Bob Title", "Bob Desc");

      expect(await secretDealContract.getPartyCount(dealId)).to.equal(2);
    });

    it("should return correct offer data via getOffer", async function () {
      const offer = await secretDealContract.getOffer(dealId, signers.alice.address);

      expect(offer.partyAddress).to.equal(signers.alice.address);
      expect(offer.title).to.equal("Test Title");
      expect(offer.description).to.equal("Test Description");
      expect(offer.revealed).to.be.false;
    });
  });

  describe("Boundary Conditions", function () {
    it("should reject deal name exceeding max length", async function () {
      const longName = "A".repeat(257); // MAX_DEAL_NAME_LENGTH is 256
      await expect(
        secretDealContract.connect(signers.alice).createDeal(longName, 2)
      ).to.be.revertedWith("Deal name too long");
    });

    it("should accept deal name at max length", async function () {
      const maxLengthName = "B".repeat(256);
      const tx = await secretDealContract.connect(signers.alice).createDeal(maxLengthName, 2);
      await tx.wait();

      const dealId = (await secretDealContract.dealCounter()) - 1n;
      const deal = await secretDealContract.getDeal(dealId);
      expect(deal.dealName).to.equal(maxLengthName);
    });

    it("should reject required parties exceeding max limit", async function () {
      await expect(
        secretDealContract.connect(signers.alice).createDeal("Test Deal", 101) // MAX_PARTIES_PER_DEAL is 100
      ).to.be.revertedWith("Too many required parties");
    });

    it("should accept required parties at max limit", async function () {
      const tx = await secretDealContract.connect(signers.alice).createDeal("Max Parties Deal", 100);
      await tx.wait();

      const dealId = (await secretDealContract.dealCounter()) - 1n;
      const deal = await secretDealContract.getDeal(dealId);
      expect(deal.requiredParties).to.equal(100);
    });

    it("should store creator address correctly", async function () {
      const tx = await secretDealContract.connect(signers.alice).createDeal("Creator Test", 2);
      await tx.wait();

      const dealId = (await secretDealContract.dealCounter()) - 1n;
      const deal = await secretDealContract.getDeal(dealId);
      expect(deal.creator).to.equal(signers.alice.address);
    });
  });
});

