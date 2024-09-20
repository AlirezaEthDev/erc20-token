// SPDX-License-Identifier: MIT
const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("ERC20 Contract", function () {
    let ERC20;
    let erc20;
    let owner;
    let addr1;
    let addr2;

    const initialSupply = 1000;
    const tokenName = "MyToken";
    const tokenSymbol = "MTK";
    const decimals = 18;

    beforeEach(async function () {
        // Get the ContractFactory and Signers here.
        ERC20 = await ethers.getContractFactory("ERC20");
        [owner, addr1, addr2] = await ethers.getSigners();

        // Deploy a new ERC20 contract for each test
        erc20 = await ERC20.deploy(
            ethers.utils.toUtf8Bytes(tokenName),
            ethers.utils.toUtf8Bytes(tokenSymbol),
            decimals,
            initialSupply
        );
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

        it("Should have the correct name and symbol", async function () {
            expect(await erc20.name()).to.equal(ethers.utils.toUtf8Bytes(tokenName));
            expect(await erc20.symbol()).to.equal(ethers.utils.toUtf8Bytes(tokenSymbol));
        });
    });

    describe("Transactions", function () {
        it("Should transfer tokens between accounts", async function () {
            await erc20.transfer(addr1.address, 100);
            const addr1Balance = await erc20.balanceOf(addr1.address);
            expect(addr1Balance).to.equal(100);

            await erc20.connect(addr1).transfer(addr2.address, 50);
            const addr2Balance = await erc20.balanceOf(addr2.address);
            expect(addr2Balance).to.equal(50);
        });

        it("Should fail if sender doesn’t have enough tokens", async function () {
            const initialOwnerBalance = await erc20.balanceOf(owner.address);

            // Try to send 1 token from addr1 (0 tokens) to owner (1000 tokens).
            await expect(
                erc20.connect(addr1).transfer(owner.address, 1)
            ).to.be.revertedWith("theBalanceIsNotEnoughToTransferOrApprove()");
            
            // Owner balance shouldn't have changed.
            expect(await erc20.balanceOf(owner.address)).to.equal(initialOwnerBalance);
        });

        it("Should approve tokens for delegated transfer", async function () {
            await erc20.approve(addr1.address, 100);
            expect(await erc20.allowance(owner.address, addr1.address)).to.equal(100);
        });

        it("Should transfer tokens on behalf of another account", async function () {
            await erc20.approve(addr1.address, 100);
            await erc20.connect(addr1).transferFrom(owner.address, addr2.address, 100);

            expect(await erc20.balanceOf(addr2.address)).to.equal(100);
        });
    });

    describe("Minting and Burning", function () {
        it("Should mint new tokens", async function () {
            await erc20.mintOrBurn(500, true); // Minting
            expect(await erc20.totalSupply()).to.equal(initialSupply + 500);
            expect(await erc20.balanceOf(owner.address)).to.equal(initialSupply + 500);
        });

        it("Should burn tokens", async function () {
            await erc20.mintOrBurn(500, false); // Burning
            expect(await erc20.totalSupply()).to.equal(initialSupply - 500);
            expect(await erc20.balanceOf(owner.address)).to.equal(initialSupply - 500);
        });
    });
});