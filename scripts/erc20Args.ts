type TokenName = string;
type TokenSymb = string;
type TokenDeci = number;

interface TokenArgs {
    name: TokenName,
    symbol: TokenSymb,
    decimals: TokenDeci
}

const tokenArgs: TokenArgs = {
    name: 'Sample Token',
    symbol: 'STN',
    decimals: 18
}

export default tokenArgs;