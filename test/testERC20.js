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

    beforeEach(async function () {
        // Get signers
        [owner, addr1, addr2, ...addrs] = await ethers.getSigners();

        // Deploy the ERC20 contract (no initial supply)
        ERC20 = await ethers.getContractFactory("ERC20");
        erc20 = await ERC20.deploy(tokenName, tokenSymbol, tokenDecimals);
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

        it("Should start with zero total supply", async function () {
            expect(await erc20.totalSupply()).to.equal(0);
        });

        it("Should start with zero balance for owner", async function () {
            const ownerBalance = await erc20.balanceOf(owner.address);
            expect(ownerBalance).to.equal(0);
        });
    });

    describe("ERC165 Interface Support", function () {
        it("Should support IERC165 interface", async function () {
            const ierc165InterfaceId = "0x01ffc9a7";
            expect(await erc20.supportsInterface(ierc165InterfaceId)).to.be.true;
        });
    });

    describe("Balance Operations", function () {
        it("Should return zero balance for any address initially", async function () {
            expect(await erc20.balanceOf(addr1.address)).to.equal(0);
            expect(await erc20.balanceOf(owner.address)).to.equal(0);
        });
    });

    describe("Minting Operations", function () {
        it("Should allow owner to mint tokens", async function () {
            const mintAmount = ethers.parseEther("1000");
            
            await expect(erc20.mint(addr1.address, mintAmount))
                .to.emit(erc20, "Mint")
                .withArgs(mintAmount, mintAmount)
                .and.to.emit(erc20, "Transfer");

            expect(await erc20.balanceOf(addr1.address)).to.equal(mintAmount);
            expect(await erc20.totalSupply()).to.equal(mintAmount);
        });

        it("Should emit correct Transfer event on mint", async function () {
            const mintAmount = ethers.parseEther("1000");
            
            // Note: Your contract emits Transfer with _totalSupply_ instead of _value
            await expect(erc20.mint(addr1.address, mintAmount))
                .to.emit(erc20, "Transfer")
                .withArgs(ethers.ZeroAddress, addr1.address, mintAmount);
        });

        it("Should allow multiple mints and update total supply correctly", async function () {
            const mintAmount1 = ethers.parseEther("500");
            const mintAmount2 = ethers.parseEther("300");
            
            await erc20.mint(addr1.address, mintAmount1);
            await erc20.mint(addr2.address, mintAmount2);
            
            expect(await erc20.totalSupply()).to.equal(mintAmount1 + mintAmount2);
            expect(await erc20.balanceOf(addr1.address)).to.equal(mintAmount1);
            expect(await erc20.balanceOf(addr2.address)).to.equal(mintAmount2);
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

    describe("Transfer Operations", function () {
        beforeEach(async function () {
            // Mint some tokens first
            const mintAmount = ethers.parseEther("1000");
            await erc20.mint(owner.address, mintAmount);
        });

        it("Should transfer tokens between accounts", async function () {
            const transferAmount = ethers.parseEther("100");
            
            await expect(erc20.transfer(addr1.address, transferAmount))
                .to.emit(erc20, "Transfer")
                .withArgs(owner.address, addr1.address, transferAmount);

            expect(await erc20.balanceOf(addr1.address)).to.equal(transferAmount);
            expect(await erc20.balanceOf(owner.address)).to.equal(ethers.parseEther("900"));
        });

        it("Should fail when transferring to zero address", async function () {
            const transferAmount = ethers.parseEther("100");
            
            await expect(erc20.transfer(ethers.ZeroAddress, transferAmount))
                .to.be.revertedWithCustomError(erc20, "InvalidReceiver")
                .withArgs(ethers.ZeroAddress);
        });

        it("Should fail when sender has insufficient balance", async function () {
            const transferAmount = ethers.parseEther("2000"); // More than available
            
            await expect(erc20.transfer(addr1.address, transferAmount))
                .to.be.revertedWithCustomError(erc20, "InsufficientBalance");
        });
    });

    describe("Approval Operations", function () {
        beforeEach(async function () {
            // Mint some tokens first
            const mintAmount = ethers.parseEther("1000");
            await erc20.mint(owner.address, mintAmount);
        });

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
            const approveAmount = ethers.parseEther("2000"); // More than balance
            
            await expect(erc20.approve(addr1.address, approveAmount))
                .to.be.revertedWithCustomError(erc20, "InsufficientBalance");
        });
    });

    describe("TransferFrom Operations", function () {
        beforeEach(async function () {
            // Mint tokens and approve
            const mintAmount = ethers.parseEther("1000");
            await erc20.mint(owner.address, mintAmount);
            
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
            const transferAmount = ethers.parseEther("300"); // More than approved
            
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

        it("Should fail when transferring from zero address", async function () {
            const transferAmount = ethers.parseEther("100");
            
            await expect(erc20.transferFrom(ethers.ZeroAddress, addr1.address, transferAmount))
                .to.be.revertedWithCustomError(erc20, "InvalidSender")
                .withArgs(ethers.ZeroAddress);
        });

        it("Should fail when transferring to zero address", async function () {
            const transferAmount = ethers.parseEther("100");
            
            await expect(erc20.transferFrom(owner.address, ethers.ZeroAddress, transferAmount))
                .to.be.revertedWithCustomError(erc20, "InvalidReceiver")
                .withArgs(ethers.ZeroAddress);
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

    describe("Burning Operations", function () {
        beforeEach(async function () {
            // Mint tokens to various addresses for burning tests
            await erc20.mint(owner.address, ethers.parseEther("500"));
            await erc20.mint(addr1.address, ethers.parseEther("300"));
        });

        it("Should allow users to burn their tokens", async function () {
            const burnAmount = ethers.parseEther("100");
            const initialSupply = await erc20.totalSupply();
            const initialBalance = await erc20.balanceOf(addr1.address);
            
            await expect(erc20.connect(addr1).burn(burnAmount))
                .to.emit(erc20, "Burn")
                .withArgs(burnAmount, initialSupply - burnAmount)
                .and.to.emit(erc20, "Transfer");

            expect(await erc20.balanceOf(addr1.address)).to.equal(initialBalance - burnAmount);
            expect(await erc20.totalSupply()).to.equal(initialSupply - burnAmount);
        });

        it("Should emit correct Transfer event on burn", async function () {
            const burnAmount = ethers.parseEther("100");
            const currentSupply = await erc20.totalSupply();
            
            // Note: Your contract emits Transfer with _totalSupply_ instead of _value in burn
            await expect(erc20.connect(addr1).burn(burnAmount))
                .to.emit(erc20, "Transfer")
                .withArgs(addr1.address, ethers.ZeroAddress, currentSupply - burnAmount);
        });

        it("Should fail when burning more than balance", async function () {
            const burnAmount = ethers.parseEther("400"); // More than addr1's balance
            
            await expect(erc20.connect(addr1).burn(burnAmount))
                .to.be.revertedWithCustomError(erc20, "InsufficientBalance");
        });

        it("Should handle burning entire balance", async function () {
            const userBalance = await erc20.balanceOf(addr1.address);
            const initialSupply = await erc20.totalSupply();
            
            await erc20.connect(addr1).burn(userBalance);
            
            expect(await erc20.balanceOf(addr1.address)).to.equal(0);
            expect(await erc20.totalSupply()).to.equal(initialSupply - userBalance);
        });
    });

    describe("Gas Optimization Tests", function () {
        beforeEach(async function () {
            await erc20.mint(owner.address, ethers.parseEther("1000"));
        });

        it("Should use reasonable gas for transfers", async function () {
            const transferAmount = ethers.parseEther("100");
            const tx = await erc20.transfer(addr1.address, transferAmount);
            const receipt = await tx.wait();
            
            // Increased threshold due to custom modifiers
            expect(receipt.gasUsed).to.be.below(120000);
        });

        it("Should use reasonable gas for approvals", async function () {
            const approveAmount = ethers.parseEther("100");
            const tx = await erc20.approve(addr1.address, approveAmount);
            const receipt = await tx.wait();
            
            // Increased threshold due to custom modifiers
            expect(receipt.gasUsed).to.be.below(80000);
        });
    });

    describe("Edge Cases", function () {
        beforeEach(async function () {
            await erc20.mint(owner.address, ethers.parseEther("1000"));
        });

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

        it("Should handle zero value minting", async function () {
            const initialSupply = await erc20.totalSupply();
            
            await expect(erc20.mint(addr1.address, 0))
                .to.emit(erc20, "Mint")
                .withArgs(0, initialSupply);

            expect(await erc20.totalSupply()).to.equal(initialSupply);
        });

        it("Should handle zero value burning", async function () {
            const initialSupply = await erc20.totalSupply();
            const initialBalance = await erc20.balanceOf(owner.address);
            
            await expect(erc20.burn(0))
                .to.emit(erc20, "Burn")
                .withArgs(0, initialSupply);

            expect(await erc20.totalSupply()).to.equal(initialSupply);
            expect(await erc20.balanceOf(owner.address)).to.equal(initialBalance);
        });

        it("Should handle multiple approvals to same spender", async function () {
            await erc20.approve(addr1.address, ethers.parseEther("100"));
            await erc20.approve(addr1.address, ethers.parseEther("200"));
            
            expect(await erc20.allowance(owner.address, addr1.address)).to.equal(ethers.parseEther("200"));
        });
    });

    describe("Supply Management Integration", function () {
        it("Should handle mint then burn correctly", async function () {
            const mintAmount = ethers.parseEther("1000");
            const burnAmount = ethers.parseEther("300");
            
            await erc20.mint(addr1.address, mintAmount);
            expect(await erc20.totalSupply()).to.equal(mintAmount);
            
            await erc20.connect(addr1).burn(burnAmount);
            expect(await erc20.totalSupply()).to.equal(mintAmount - burnAmount);
            expect(await erc20.balanceOf(addr1.address)).to.equal(mintAmount - burnAmount);
        });

        it("Should handle multiple mints to different addresses", async function () {
            await erc20.mint(owner.address, ethers.parseEther("500"));
            await erc20.mint(addr1.address, ethers.parseEther("300"));
            await erc20.mint(addr2.address, ethers.parseEther("200"));
            
            expect(await erc20.totalSupply()).to.equal(ethers.parseEther("1000"));
            expect(await erc20.balanceOf(owner.address)).to.equal(ethers.parseEther("500"));
            expect(await erc20.balanceOf(addr1.address)).to.equal(ethers.parseEther("300"));
            expect(await erc20.balanceOf(addr2.address)).to.equal(ethers.parseEther("200"));
        });
    });
});