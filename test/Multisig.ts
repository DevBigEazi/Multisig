import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { expect } from "chai";
import hre from "hardhat";

describe("Multisig", async function () {
  async function deployMultisigFixture() {
    const [owner, signer1, signer2, signer3, newOwner, receiver, nonSigner] =
      await hre.ethers.getSigners();

    const validSigners: string[] = [
      signer1.address,
      signer2.address,
      signer3.address,
    ];
    const quorum = 2; // Set quorum to 2 approvals required

    // Deploy the MultiSig contract and fund it with ethers
    const MultiSig = await hre.ethers.getContractFactory("MultiSig");
    const multiSig = await MultiSig.deploy(validSigners, quorum, {
      value: hre.ethers.parseUnits("10", 18),
    });

    return {
      owner,
      validSigners,
      signer1,
      signer2,
      signer3,
      quorum,
      newOwner,
      receiver,
      nonSigner,
      multiSig,
    };
  }

  describe("Deployment", function () {
    it("should deploy the contract with the correct initial values", async function () {
      const { multiSig, validSigners, quorum } = await loadFixture(
        deployMultisigFixture
      );

      //   expect(await multiSig.signers(validSigners)).to.equal(3);
      expect(await hre.ethers.provider.getBalance(multiSig)).to.equal(
        hre.ethers.parseUnits("10", 18)
      );
    });
  });

  describe("Transaction initiation", function () {
    it("should allow a valid signer to initiate a transaction", async function () {
      const { multiSig, owner, signer1, signer2, signer3 } = await loadFixture(
        deployMultisigFixture
      );

      const amount = hre.ethers.parseUnits("1", 18);

      await expect(multiSig.connect(signer1)).to.equal(
        multiSig.initiateTransaction(amount, signer3)
      );

      expect(multiSig.connect(signer1)).to.equal(
        multiSig.initiateTransaction(amount, signer3)
      );
      expect(multiSig.connect(signer2)).to.equal(
        multiSig.initiateTransaction(amount, signer1)
      );
      expect(multiSig.connect(signer3)).to.equal(
        multiSig.initiateTransaction(amount, signer2)
      );
    });

    it("should revert if a non-signer tries to initiate a transaction", async function () {
      const { multiSig, nonSigner, signer3 } = await loadFixture(
        deployMultisigFixture
      );

      const amount = hre.ethers.parseUnits("1", 18);

      await expect(
        multiSig.connect(nonSigner).initiateTransaction(amount, signer3)
      ).to.be.revertedWith("not valid signer");
    });
  });

  //   describe("Transaction approval", function () {
  //     beforeEach(async function () {
  //       await multiSig
  //         .connect(signer1)
  //         .initiateTransaction(ethers.utils.parseEther("1"), receiver.address);
  //     });

  //     it("should allow multiple valid signers to approve a transaction", async function () {
  //       await expect(multiSig.connect(signer2).approveTransaction(1)).to.emit(
  //         multiSig,
  //         "ApproveTransaction"
  //       );

  //       const transaction = await multiSig.transactions(1);
  //       expect(transaction.signersCount).to.equal(2);
  //     });

  //     it("should execute the transaction when quorum is reached", async function () {
  //       const receiverInitialBalance = await ethers.provider.getBalance(
  //         receiver.address
  //       );

  //       await multiSig.connect(signer1).approveTransaction(1);
  //       await multiSig.connect(signer2).approveTransaction(1);

  //       const receiverFinalBalance = await ethers.provider.getBalance(
  //         receiver.address
  //       );
  //       expect(receiverFinalBalance.sub(receiverInitialBalance)).to.equal(
  //         ethers.utils.parseEther("1")
  //       );
  //     });

  //     it("should revert if a non-signer tries to approve a transaction", async function () {
  //       await expect(
  //         multiSig.connect(nonSigner).approveTransaction(1)
  //       ).to.be.revertedWith("not valid signer");
  //     });

  //     it("should prevent double-signing by the same signer", async function () {
  //       await multiSig.connect(signer1).approveTransaction(1);
  //       await expect(
  //         multiSig.connect(signer1).approveTransaction(1)
  //       ).to.be.revertedWith("can't sign twice");
  //     });
  //   });

  //   describe("Ownership transfer", function () {
  //     it("should allow the owner to set a new owner", async function () {
  //       await multiSig.connect(owner).transferOwnership(newOwner.address);
  //       expect(await multiSig.nextOwner()).to.equal(newOwner.address);
  //     });

  //     it("should allow the new owner to claim ownership", async function () {
  //       await multiSig.connect(owner).transferOwnership(newOwner.address);
  //       await multiSig.connect(newOwner).claimOwnership();
  //       expect(await multiSig.owner()).to.equal(newOwner.address);
  //     });

  //     it("should revert if a non-designated address tries to claim ownership", async function () {
  //       await multiSig.connect(owner).transferOwnership(newOwner.address);
  //       await expect(
  //         multiSig.connect(nonSigner).claimOwnership()
  //       ).to.be.revertedWith("not next owner");
  //     });
  //   });

  //   describe("Adding and removing valid signers", function () {
  //     it("should allow the owner to add a new signer", async function () {
  //       await multiSig.connect(owner).addValidSigner(nonSigner.address);
  //       expect(await multiSig.isValidSigner(nonSigner.address)).to.be.true;
  //     });

  //     it("should allow the owner to remove a signer", async function () {
  //       await multiSig.connect(owner).removeSigner(1); // Remove signer2
  //       expect(await multiSig.isValidSigner(signer2.address)).to.be.false;
  //     });

  //     it("should revert if a non-owner tries to add a signer", async function () {
  //       await expect(
  //         multiSig.connect(signer1).addValidSigner(nonSigner.address)
  //       ).to.be.revertedWith("not owner");
  //     });

  //     it("should revert if a non-owner tries to remove a signer", async function () {
  //       await expect(
  //         multiSig.connect(signer1).removeSigner(1)
  //       ).to.be.revertedWith("not owner");
  //     });
  //   });

  //   describe("Invalid operations", function () {
  //     beforeEach(async function () {
  //       await multiSig
  //         .connect(signer1)
  //         .initiateTransaction(ethers.utils.parseEther("1"), receiver.address);
  //     });

  //     it("should revert if the transaction is already executed", async function () {
  //       await multiSig.connect(signer1).approveTransaction(1);
  //       await multiSig.connect(signer2).approveTransaction(1); // Quorum reached, transaction executed

  //       await expect(
  //         multiSig.connect(signer3).approveTransaction(1)
  //       ).to.be.revertedWith("transaction already executed");
  //     });

  //     it("should revert if a non-signer tries to initiate or approve a transaction", async function () {
  //       await expect(
  //         multiSig
  //           .connect(nonSigner)
  //           .initiateTransaction(ethers.utils.parseEther("1"), receiver.address)
  //       ).to.be.revertedWith("not valid signer");
  //       await expect(
  //         multiSig.connect(nonSigner).approveTransaction(1)
  //       ).to.be.revertedWith("not valid signer");
  //     });

  //     it("should revert if a signer tries to double-sign a transaction", async function () {
  //       await multiSig.connect(signer1).approveTransaction(1);
  //       await expect(
  //         multiSig.connect(signer1).approveTransaction(1)
  //       ).to.be.revertedWith("can't sign twice");
  //     });
  //   });
});
