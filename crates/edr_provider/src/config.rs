use std::{path::PathBuf, time::SystemTime};

use edr_eth::{block::BlobGas, AccountInfo, Address, HashMap, SpecId, B256, U256};
use edr_evm::MineOrdering;
use rand::Rng;
use rpc_hardhat::config::ForkConfig;

/// Configuration for interval mining.
#[derive(Clone)]
pub enum IntervalConfig {
    Fixed(u64),
    Range { min: u64, max: u64 },
}

impl IntervalConfig {
    /// Generates a (random) interval based on the configuration.
    pub fn generate_interval(&self) -> u64 {
        match self {
            IntervalConfig::Fixed(interval) => *interval,
            IntervalConfig::Range { min, max } => rand::thread_rng().gen_range(*min..=*max),
        }
    }
}

/// Configuration for the provider's mempool.
pub struct MemPoolConfig {
    pub order: MineOrdering,
}

/// Configuration for the provider's miner.
pub struct MiningConfig {
    pub auto_mine: bool,
    pub interval: Option<IntervalConfig>,
    pub mem_pool: MemPoolConfig,
}

/// Configuration for the provider
pub struct ProviderConfig {
    pub allow_blocks_with_same_timestamp: bool,
    pub allow_unlimited_contract_size: bool,
    pub accounts: Vec<AccountConfig>,
    pub block_gas_limit: u64,
    pub cache_dir: PathBuf,
    pub chain_id: u64,
    pub coinbase: Address,
    pub fork: Option<ForkConfig>,
    // Genesis accounts in addition to accounts. Useful for adding impersonated accounts for tests.
    pub genesis_accounts: HashMap<Address, AccountInfo>,
    pub hardfork: SpecId,
    pub initial_base_fee_per_gas: Option<U256>,
    pub initial_blob_gas: Option<BlobGas>,
    pub initial_date: Option<SystemTime>,
    pub initial_parent_beacon_block_root: Option<B256>,
    pub mining: MiningConfig,
    pub network_id: u64,
}

/// Configuration input for a single account
pub struct AccountConfig {
    /// the secret key of the account
    pub secret_key: k256::SecretKey,
    /// the balance of the account
    pub balance: U256,
}

impl Default for MemPoolConfig {
    fn default() -> Self {
        Self {
            order: MineOrdering::Priority,
        }
    }
}

impl Default for MiningConfig {
    fn default() -> Self {
        Self {
            auto_mine: true,
            interval: None,
            mem_pool: MemPoolConfig::default(),
        }
    }
}