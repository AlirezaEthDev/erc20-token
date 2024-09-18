import { expect } from "chai";
    describe('Sample', function(){
        it('Getting author name', async function(){
            const sampleContract = await hre.ethers.getContractFactory('Sample');
            const sampleContractDeployed = await sampleContract.deploy();
            await sampleContractDeployed.deployed();
            expect(await sampleContractDeployed.getAuthor()).to.equal("AlirezaEthDev");
        })
    })