import { ethers } from 'ethers';
import fs from 'fs';
import dotenv from 'dotenv';
import tokenArgs from './erc20Args.js';

dotenv.config();

/*____________________________ Constants _________________________________*/
const SONIC_BLAZE: string = process.env.SONIC_BLAZE ?? 'https://rpc.blaze.soniclabs.com';
//@ts-ignore
const OWNER_KEY: string = process.env.OWNER_KEY;
const TOKEN_NAME : string = tokenArgs.name;
const TOKEN_SYMB: string = tokenArgs.symbol;
const TOKEN_DECI: number = tokenArgs.decimals;
//@ts-ignore
const ERC20_PATH: string = process.env.TOKEN_JSON_PATH;

/*____________________________ Primitives __________________________________*/
const provider = new ethers.JsonRpcProvider(SONIC_BLAZE);
const owner = new ethers.Wallet(OWNER_KEY, provider);

/*____________________________ Load files __________________________________*/
//@ts-ignore
const erc20Obj = JSON.parse(fs.readFileSync(ERC20_PATH));

/*____________________________ Deploy _____________________________________*/
const erc20Factory = new ethers.ContractFactory(erc20Obj.abi, erc20Obj.bytecode, owner);
const erc20 = await erc20Factory.deploy(TOKEN_NAME, TOKEN_SYMB, TOKEN_DECI);
await erc20.waitForDeployment();

console.info(`ERC20 deployed at ${erc20.target}`);