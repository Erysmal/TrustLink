import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const EscrowModule = buildModule("EscrowModule", (m) => {
  const usdc = "0x75faf114eafb1BDbe2F0316DF893fd58CE46AA4d";
  const owner = process.env.OWNER_ADDRESS;

  if (!owner) {
    throw new Error("OWNER_ADDRESS environment variable is required");
  }

  const escrow = m.contract("Escrow", [usdc, owner, 50]); // 50 bps = 0.5% fee

  return { escrow };
});

export default EscrowModule;
