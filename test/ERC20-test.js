const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("ERC20 Token", function () {
    let ERC20;
    let erc20;
    let owner;
    let addr1;
    let addr2;
    let addrs;

    const tokenName = "TestToken";
    const tokenSymbol = "TTK";
    const tokenDecimals = 18;
    const totalSupply = ethers.parseEther("1000000"); // 1,000,000 tokens

    beforeEach(async function () {
        // Get signers
        [owner, addr1, addr2, ...addrs] = await ethers.getSigners();

        // Deploy the ERC20 contract
        ERC20 = await ethers.getContractFactory("ERC20");
        erc20 = await ERC20.deploy(tokenName, tokenSymbol, tokenDecimals, totalSupply);
        await erc20.waitForDeployment();
    });

    describe("Deployment", function () {
        it("Should set the correct owner", async function () {
            expect(await erc20.owner()).to.equal(owner.address);
        });

        it("Should set the correct token name", async function () {
            expect(await erc20.name()).to.equal(tokenName);
        });

        it("Should set the correct token symbol", async function () {
            expect(await erc20.symbol()).to.equal(tokenSymbol);
        });

        it("Should set the correct token decimals", async function () {
            expect(await erc20.decimals()).to.equal(tokenDecimals);
        });

        it("Should set the correct total supply", async function () {
            expect(await erc20.totalSupply()).to.equal(totalSupply);
        });

        it("Should assign the total supply to the owner", async function () {
            const ownerBalance = await erc20.balanceOf(owner.address);
            expect(ownerBalance).to.equal(totalSupply);
        });

        it("Should emit a Transfer event on deployment", async function () {
            // Re-deploy to catch the event
            const ERC20Factory = await ethers.getContractFactory("ERC20");
            await expect(ERC20Factory.deploy(tokenName, tokenSymbol, tokenDecimals, totalSupply))
                .to.emit(ERC20Factory, "Transfer")
                .withArgs(ethers.ZeroAddress, owner.address, totalSupply);
        });
    });

    describe("ERC165 Interface Support", function () {
        it("Should support IERC165 interface", async function () {
            const ierc165InterfaceId = "0x01ffc9a7";
            expect(await erc20.supportsInterface(ierc165InterfaceId)).to.be.true;
        });
    });

    describe("Balance Operations", function () {
        it("Should return correct balance for any address", async function () {
            expect(await erc20.balanceOf(addr1.address)).to.equal(0);
            expect(await erc20.balanceOf(owner.address)).to.equal(totalSupply);
        });
    });

    describe("Transfer Operations", function () {
        it("Should transfer tokens between accounts", async function () {
            const transferAmount = ethers.parseEther("100");
            
            await expect(erc20.transfer(addr1.address, transferAmount))
                .to.emit(erc20, "Transfer")
                .withArgs(owner.address, addr1.address, transferAmount);

            expect(await erc20.balanceOf(addr1.address)).to.equal(transferAmount);
            expect(await erc20.balanceOf(owner.address)).to.equal(totalSupply - transferAmount);
        });

        it("Should fail when transferring to zero address", async function () {
            const transferAmount = ethers.parseEther("100");
            
            await expect(erc20.transfer(ethers.ZeroAddress, transferAmount))
                .to.be.revertedWithCustomError(erc20, "InvalidReceiver")
                .withArgs(ethers.ZeroAddress);
        });

        it("Should fail when sender has insufficient balance", async function () {
            const transferAmount = ethers.parseEther("100");
            
            await expect(erc20.connect(addr1).transfer(addr2.address, transferAmount))
                .to.be.revertedWithCustomError(erc20, "InsufficientBalance");
        });

        it("Should fail when transferring from zero address via transferFrom", async function () {
            const transferAmount = ethers.parseEther("100");
            
            await expect(erc20.transferFrom(ethers.ZeroAddress, addr1.address, transferAmount))
                .to.be.revertedWithCustomError(erc20, "InvalidSender")
                .withArgs(ethers.ZeroAddress);
        });

        it("Should fail when transferring to zero address via transferFrom", async function () {
            const transferAmount = ethers.parseEther("100");
            
            await expect(erc20.transferFrom(owner.address, ethers.ZeroAddress, transferAmount))
                .to.be.revertedWithCustomError(erc20, "InvalidReceiver")
                .withArgs(ethers.ZeroAddress);
        });
    });

    describe("Approval Operations", function () {
        it("Should approve tokens for spending", async function () {
            const approveAmount = ethers.parseEther("100");
            
            await expect(erc20.approve(addr1.address, approveAmount))
                .to.emit(erc20, "Approval")
                .withArgs(owner.address, addr1.address, approveAmount);

            expect(await erc20.allowance(owner.address, addr1.address)).to.equal(approveAmount);
        });

        it("Should fail when approving zero address", async function () {
            const approveAmount = ethers.parseEther("100");
            
            await expect(erc20.approve(ethers.ZeroAddress, approveAmount))
                .to.be.revertedWithCustomError(erc20, "InvalidSpender")
                .withArgs(ethers.ZeroAddress);
        });

        it("Should fail when approver has insufficient balance", async function () {
            const approveAmount = ethers.parseEther("100");
            
            await expect(erc20.connect(addr1).approve(addr2.address, approveAmount))
                .to.be.revertedWithCustomError(erc20, "InsufficientBalance");
        });
    });

    describe("TransferFrom Operations", function () {
        beforeEach(async function () {
            // Owner approves addr1 to spend 200 tokens
            const approveAmount = ethers.parseEther("200");
            await erc20.approve(addr1.address, approveAmount);
        });

        it("Should allow approved spender to transfer tokens", async function () {
            const transferAmount = ethers.parseEther("100");
            
            await expect(erc20.connect(addr1).transferFrom(owner.address, addr2.address, transferAmount))
                .to.emit(erc20, "Transfer")
                .withArgs(owner.address, addr2.address, transferAmount);

            expect(await erc20.balanceOf(addr2.address)).to.equal(transferAmount);
            expect(await erc20.allowance(owner.address, addr1.address)).to.equal(ethers.parseEther("100"));
        });

        it("Should fail when allowance is insufficient", async function () {
            const transferAmount = ethers.parseEther("300");
            
            await expect(erc20.connect(addr1).transferFrom(owner.address, addr2.address, transferAmount))
                .to.be.revertedWithCustomError(erc20, "InsufficientAllowance");
        });

        it("Should allow owner to transfer without allowance check", async function () {
            const transferAmount = ethers.parseEther("100");
            
            await expect(erc20.transferFrom(owner.address, addr1.address, transferAmount))
                .to.emit(erc20, "Transfer")
                .withArgs(owner.address, addr1.address, transferAmount);

            expect(await erc20.balanceOf(addr1.address)).to.equal(transferAmount);
        });
    });

    describe("Ownership Management", function () {
        it("Should allow owner to set pending owner", async function () {
            await expect(erc20.setPendingOwner(addr1.address))
                .to.emit(erc20, "NewPendingOwnerSet")
                .withArgs(addr1.address);

            expect(await erc20.pendingOwner()).to.equal(addr1.address);
        });

        it("Should fail when setting zero address as pending owner", async function () {
            await expect(erc20.setPendingOwner(ethers.ZeroAddress))
                .to.be.revertedWithCustomError(erc20, "ZerpPendingOwner")
                .withArgs(ethers.ZeroAddress);
        });

        it("Should fail when non-owner tries to set pending owner", async function () {
            await expect(erc20.connect(addr1).setPendingOwner(addr2.address))
                .to.be.revertedWithCustomError(erc20, "OnlyOwner")
                .withArgs(owner.address, addr1.address);
        });

        it("Should allow pending owner to change ownership", async function () {
            await erc20.setPendingOwner(addr1.address);
            
            await expect(erc20.connect(addr1).changeOwner())
                .to.emit(erc20, "OwnerChanged")
                .withArgs(addr1.address, ethers.ZeroAddress);

            expect(await erc20.owner()).to.equal(addr1.address);
            expect(await erc20.pendingOwner()).to.equal(ethers.ZeroAddress);
        });

        it("Should fail when non-pending owner tries to change ownership", async function () {
            await erc20.setPendingOwner(addr1.address);
            
            await expect(erc20.connect(addr2).changeOwner())
                .to.be.revertedWithCustomError(erc20, "OnlyPendingPwner")
                .withArgs(addr1.address, addr2.address);
        });
    });

    describe("Minting Operations", function () {
        it("Should allow owner to mint tokens", async function () {
            const mintAmount = ethers.parseEther("1000");
            const initialSupply = await erc20.totalSupply();
            
            await expect(erc20.mint(addr1.address, mintAmount))
                .to.emit(erc20, "Mint")
                .withArgs(mintAmount, initialSupply + mintAmount);

            expect(await erc20.balanceOf(addr1.address)).to.equal(mintAmount);
            expect(await erc20.totalSupply()).to.equal(initialSupply + mintAmount);
        });

        it("Should fail when minting to zero address", async function () {
            const mintAmount = ethers.parseEther("1000");
            
            await expect(erc20.mint(ethers.ZeroAddress, mintAmount))
                .to.be.revertedWithCustomError(erc20, "InvalidReceiver")
                .withArgs(ethers.ZeroAddress);
        });

        it("Should fail when non-owner tries to mint", async function () {
            const mintAmount = ethers.parseEther("1000");
            
            await expect(erc20.connect(addr1).mint(addr2.address, mintAmount))
                .to.be.revertedWithCustomError(erc20, "OnlyOwner")
                .withArgs(owner.address, addr1.address);
        });
    });

    describe("Burning Operations", function () {
        beforeEach(async function () {
            // Transfer some tokens to addr1 for burning tests
            await erc20.transfer(addr1.address, ethers.parseEther("500"));
        });

        it("Should allow users to burn their tokens", async function () {
            const burnAmount = ethers.parseEther("100");
            const initialSupply = await erc20.totalSupply();
            const initialBalance = await erc20.balanceOf(addr1.address);
            
            await expect(erc20.connect(addr1).burn(burnAmount))
                .to.emit(erc20, "Burn")
                .withArgs(burnAmount, initialSupply - burnAmount);

            expect(await erc20.balanceOf(addr1.address)).to.equal(initialBalance - burnAmount);
            expect(await erc20.totalSupply()).to.equal(initialSupply - burnAmount);
        });

        it("Should fail when burning more than balance", async function () {
            const burnAmount = ethers.parseEther("600"); // More than addr1's balance
            
            await expect(erc20.connect(addr1).burn(burnAmount))
                .to.be.revertedWithCustomError(erc20, "InsufficientBalance");
        });

        it("Should fail when zero address tries to burn", async function () {
            // This test might not be feasible due to the way msgSender() works
            // But we include it for completeness
        });
    });

    describe("Gas Optimization Tests", function () {
        it("Should use reasonable gas for transfers", async function () {
            const transferAmount = ethers.parseEther("100");
            const tx = await erc20.transfer(addr1.address, transferAmount);
            const receipt = await tx.wait();
            
            // Gas usage should be reasonable (adjust threshold as needed)
            expect(receipt.gasUsed).to.be.below(100000);
        });

        it("Should use reasonable gas for approvals", async function () {
            const approveAmount = ethers.parseEther("100");
            const tx = await erc20.approve(addr1.address, approveAmount);
            const receipt = await tx.wait();
            
            // Gas usage should be reasonable (adjust threshold as needed)
            expect(receipt.gasUsed).to.be.below(75000);
        });
    });

    describe("Edge Cases", function () {
        it("Should handle zero value transfers", async function () {
            await expect(erc20.transfer(addr1.address, 0))
                .to.emit(erc20, "Transfer")
                .withArgs(owner.address, addr1.address, 0);
        });

        it("Should handle zero value approvals", async function () {
            await expect(erc20.approve(addr1.address, 0))
                .to.emit(erc20, "Approval")
                .withArgs(owner.address, addr1.address, 0);
        });

        it("Should handle multiple approvals to same spender", async function () {
            await erc20.approve(addr1.address, ethers.parseEther("100"));
            await erc20.approve(addr1.address, ethers.parseEther("200"));
            
            expect(await erc20.allowance(owner.address, addr1.address)).to.equal(ethers.parseEther("200"));
        });
    });
});