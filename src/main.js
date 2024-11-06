const Web3 = require('web3');
const web3 = new Web3('wss://ethereum-sepolia-rpc.publicnode.com');
const fs = require('fs');

const usdtObject = JSON.parse(fs.readFileSync('C:/fakeWallet/erc20-token/build/contracts/ERC20.json'))
const usdtAbi = usdtObject.abi;
const usdtBytecode = usdtObject.bytecode;
const tokenName = Buffer.from("USD Token","utf-8");
const tokenSymbol = Buffer.from("USDT","utf-8");
const unitDecimals = 18;
const totalSupplyAmount = BigInt(1000000000000000000000000000);
const privateKey = '6382c2b661c50702aa34d5c00442fb3f0e51c9d930cc22f0bd4adeeef47c27c6'
const account = web3.eth.accounts.privateKeyToAccount(privateKey);
web3.eth.accounts.wallet.add(account);
const mainAddress = account.address;
let usdtAddress = '0x74646eb513074Bb63a66Ef735F3632f95F423aE2';

async function deployContract(){
    try{
        const usdtInstance = new web3.eth.Contract(usdtAbi);
        const deployInstance = await usdtInstance.deploy({
            data: usdtBytecode,
            arguments: [tokenName, tokenSymbol, unitDecimals, totalSupplyAmount]
        }).send({
            from: mainAddress,
            gas: 2000000
        })
        usdtAddress = deployInstance.options.address;
        console.info("Contract deployed at: \n %s", deployInstance.options.address);
    }catch(err){
        throw err;
    }
}

async function transferUSDT(toAddress, value){
    try{
        const usdt = new web3.eth.Contract(usdtAbi, usdtAddress);
        const transferResult = await usdt.methods.transfer(toAddress, web3.utils.toWei(value)).send({
            from: mainAddress,
            gas: 100000
        });
        console.info(transferResult);
    }catch(err){
        const errObject = {
            name: err.name,
            message: err.message
        }
        console.info(errObject);
    }
}

if(require.main === module){
    const args = process.argv.slice(2);
    const command = args[0];
    console.info('Availabe commands: deploy, transfer');
    if(command == 'deploy'){
        console.info(deployContract());
    }
    if(command == 'transfer'){
        console.info(transferUSDT(args[1], args[2]))
    }
}


