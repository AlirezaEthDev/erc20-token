const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("ERC20 Contract", function () {
    let ERC20;
    let erc20;
    let owner;
    let addr1;
    let addr2;
    const initialSupply = 1000;

    beforeEach(async function () {
        // Get the ContractFactory and Signers here.
        ERC20 = await ethers.getContractFactory("ERC20");
        [owner, addr1, addr2] = await ethers.getSigners();

        // Deploy the contract
        erc20 = await ERC20.deploy("MyToken", "MTK", 18, initialSupply);
        await erc20.deployed();
    });

    describe("Deployment", function () {
        it("Should set the right owner", async function () {
            expect(await erc20.owner()).to.equal(owner.address);
        });

        it("Should assign the total supply of tokens to the owner", async function () {
            const ownerBalance = await erc20.balanceOf(owner.address);
            expect(ownerBalance).to.equal(initialSupply);
        });
    });

    describe("Transactions", function () {
        it("Should transfer tokens between accounts", async function () {
            await erc20.transfer(addr1.address, 100);
            const addr1Balance = await erc20.balanceOf(addr1.address);
            expect(addr1Balance).to.equal(100);
            
            // Transfer tokens from addr1 to addr2
            await erc20.connect(addr1).approve(addr2.address, 50);
            await erc20.connect(addr2).transferFrom(addr1.address, addr2.address, 50);
            
            const addr2Balance = await erc20.balanceOf(addr2.address);
            expect(addr2Balance).to.equal(50);
        });

        it("Should fail if sender doesn’t have enough tokens", async function () {
            const initialOwnerBalance = await erc20.balanceOf(owner.address);

            // Try to send 1 token from addr1 (0 tokens) to owner (1000 tokens)
            await expect(
                erc20.connect(addr1).transfer(owner.address, 1)
            ).to.be.revertedWith("02"); // "The balance is not enough to transfer or approve"
            
            // Owner balance should still be the same
            expect(await erc20.balanceOf(owner.address)).to.equal(initialOwnerBalance);
        });

        it("Should update balances after transfers", async function () {
            const initialOwnerBalance = await erc20.balanceOf(owner.address);

            // Transfer 100 tokens from owner to addr1
            await erc20.transfer(addr1.address, 100);

            // Check balances
            const finalOwnerBalance = await erc20.balanceOf(owner.address);
            expect(finalOwnerBalance).to.equal(initialOwnerBalance - 100);

            const addr1Balance = await erc20.balanceOf(addr1.address);
            expect(addr1Balance).to.equal(100);
        });
        
        it("Should approve tokens for spending", async function () {
            await erc20.approve(addr1.address, 500);
            expect(await erc20.allowance(owner.address, addr1.address)).to.equal(500);
        });
        
        it("Should fail if trying to transfer more than approved amount", async function () {
            await erc20.approve(addr1.address, 50);

            // Attempting to transfer more than allowed
            await expect(
                erc20.connect(addr1).transferFrom(owner.address, addr2.address, 100)
            ).to.be.revertedWith("03"); // "Your approved value to transfer is less than value you want."
        });
    });
});