// Particle Network Universal Accounts — EIP-7702 configuration
// Required packages: npm install @particle-network/connectkit @particle-network/aa
//
// EIP-7702 lets an EOA temporarily delegate execution to a smart contract, enabling
// account abstraction features (batched txs, gas sponsorship) without deploying a
// separate smart contract wallet.

export const PARTICLE_PROJECT_ID = process.env.NEXT_PUBLIC_PARTICLE_PROJECT_ID!;
export const PARTICLE_CLIENT_KEY = process.env.NEXT_PUBLIC_PARTICLE_CLIENT_KEY!;
export const PARTICLE_APP_ID = process.env.NEXT_PUBLIC_PARTICLE_APP_ID!;

export const PARTICLE_CHAIN_CONFIG = {
  id: 421614,
  name: "Arbitrum Sepolia",
  rpcUrl: "https://sepolia-rollup.arbitrum.io/rpc",
};

export const PARTICLE_AA_CONFIG = {
  name: "BICONOMY" as const,
  version: "2.0.0",
};

// EIP-7702 delegation config — passed to Particle's AA provider
export const EIP7702_CONFIG = {
  enabled: true,
  delegationType: "EIP7702" as const,
  chainId: PARTICLE_CHAIN_CONFIG.id,
};

// Full config object for @particle-network/connectkit's ParticleConnectKit
export function buildParticleConfig() {
  return {
    projectId: PARTICLE_PROJECT_ID,
    clientKey: PARTICLE_CLIENT_KEY,
    appId: PARTICLE_APP_ID,
    chains: [PARTICLE_CHAIN_CONFIG],
    aa: {
      ...PARTICLE_AA_CONFIG,
      eip7702: EIP7702_CONFIG,
    },
  };
}
