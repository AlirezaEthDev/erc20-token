async function deployContract(){
    const sampleContract = await hre.ethers.getContractFactory('Sample');
    const sampleContractDeployed = await sampleContract.deploy();
    await sampleContractDeployed.deployed();
    console.log("Contract deployed to: ", sampleContractDeployed.address)
}
deployContract().then(()=>{process.exit(0)}).catch((err)=>{
    console.error(err);
    process.exit(1);
})