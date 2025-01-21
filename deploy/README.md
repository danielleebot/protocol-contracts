## FFactory

FERC20 Token buy/sell tax

- BUY_TAX: 1,
- SELL_TAX: 1,

## Bonding

- FERC20 Token Name: "discover [name]"
- AgentToken Name: "[name] by Sidekick"

- LAUNCH_FEE: 100000, // 100 VirtualToken
- INITIAL_SUPPLY: "1000000000", // 1 billion FERC20 Token
- ASSET_RATE: 5000, // 2K, K=3_000_000_000_000
- MAX_TX: 100, // maxTxAmount: (MAX_TX \* totalSupply) / 100,
- GRAD_THRESHOLD: parseEther("125000000"), // 0.125 billion FERC20 Token

## AgentFactoryV5

<!-- - APPLICATION_THRESHOLD: parseEther("125000"), // : 125k -->

### setTokenSupplyParams

- AGENT_TOKEN_SUPPLY: parseEther("1000000000"), // 1 billion
- AGENT_TOKEN_LP_SUPPLY: parseEther("1000000000"), // 1 billion
- AGENT_TOKEN_VAULT_SUPPLY: 0,
- MAX_TOKENS_PER_WALLET: parseEther("1000000"), // 1 million
- MAX_TOKENS_PER_TXN: parseEther("100000"), // 100k
- BOT_PROTECTION_DURATION_IN_SECONDS: 3600, // 1 hour
- VAULT_ADDRESS: "0x0000000000000000000000000000000000000000", // if AGENT_TOKEN_VAULT_SUPPLY is 0, this will be ignored

### setTokenTaxParams

AgentToken buy/sell tax

- PROJECT_BUY_TAX_BASIS_POINTS: 100, // buy tax: 1%
- PROJECT_SELL_TAX_BASIS_POINTS: 100, // sell tax: 1%
- TAX_SWAP_THRESHOLD_BASIS_POINTS: 1, // (\_totalSupply \* swapThresholdBasisPoints) / BP_DENOM;

### setMaturityDuration

- MATURITY*DURATION: 86400 * 365 \_ 10, // 10 years
