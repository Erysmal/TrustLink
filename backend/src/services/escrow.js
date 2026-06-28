"use strict";

const { ethers } = require("ethers");
require("dotenv").config();

// ─── ABI (only the functions and events the backend needs) ────────────────────

const ESCROW_ABI = [
  // createDeal(address buyer, uint256 amount, uint64 deliveryDeadline, string description, string channel)
  "function createDeal(address buyer, uint256 amount, uint64 deliveryDeadline, string description, string channel) external returns (uint256 dealId)",

  // fundDeal(uint256 dealId)
  "function fundDeal(uint256 dealId) external",

  // confirmDelivery(uint256 dealId)
  "function confirmDelivery(uint256 dealId) external",

  // autoRelease(uint256 dealId)
  "function autoRelease(uint256 dealId) external",

  // raiseDispute(uint256 dealId)
  "function raiseDispute(uint256 dealId) external",

  // resolveDispute(uint256 dealId, uint256 buyerAmount, uint256 sellerAmount)
  "function resolveDispute(uint256 dealId, uint256 buyerAmount, uint256 sellerAmount) external",

  // withdrawFees(address recipient, uint256 amount)
  "function withdrawFees(address recipient, uint256 amount) external",

  // deals(uint256) public getter
  "function deals(uint256 dealId) external view returns (address buyer, address seller, uint256 amount, uint256 fee, uint64 createdAt, uint64 deliveryDeadline, uint64 autoReleaseAt, string description, string channel, uint8 status)",

  // nextDealId
  "function nextDealId() external view returns (uint256)",

  // accruedFees
  "function accruedFees() external view returns (uint256)",

  // Events
  "event DealCreated(uint256 indexed dealId, address indexed seller, address indexed buyer, uint256 amount, uint256 fee, uint64 deliveryDeadline, uint64 autoReleaseAt, string description, string channel)",
  "event DealFunded(uint256 indexed dealId, address indexed buyer, uint256 amount)",
  "event DeliveryConfirmed(uint256 indexed dealId, uint256 sellerAmount, uint256 fee)",
  "event DealAutoReleased(uint256 indexed dealId, uint256 sellerAmount, uint256 fee)",
  "event DisputeRaised(uint256 indexed dealId, address indexed raisedBy)",
  "event DisputeResolved(uint256 indexed dealId, uint256 buyerAmount, uint256 sellerAmount, uint256 fee)",
  "event FeesWithdrawn(address indexed recipient, uint256 amount)",
];

const USDC_ABI = [
  "function approve(address spender, uint256 amount) external returns (bool)",
  "function allowance(address owner, address spender) external view returns (uint256)",
  "function balanceOf(address account) external view returns (uint256)",
];

// ─── Constants ────────────────────────────────────────────────────────────────

const ESCROW_ADDRESS = process.env.ESCROW_ADDRESS || "0x1f4505F6d26320ba1157424Abd349a54Ebc9eD90";
const USDC_ADDRESS   = process.env.USDC_ADDRESS   || "0x75faf114eafb1BDbe2F0316DF893fd58CE46AA4d";
const RPC_URL        = process.env.ARBITRUM_SEPOLIA_RPC_URL;

// DealStatus enum matching the contract
const DealStatus = {
  0: "Created",
  1: "Funded",
  2: "Completed",
  3: "Disputed",
  4: "Resolved",
};

// ─── Provider (read-only, no private key needed) ──────────────────────────────

function getProvider() {
  if (!RPC_URL) throw new Error("ARBITRUM_SEPOLIA_RPC_URL is not set");
  return new ethers.JsonRpcProvider(RPC_URL);
}

/**
 * Returns a signer from a raw private key.
 * Used when the backend wallet signs transactions (e.g. autoRelease, resolveDispute).
 */
function getBackendSigner() {
  const provider = getProvider();
  const key = process.env.PRIVATE_KEY;
  if (!key) throw new Error("PRIVATE_KEY is not set");
  return new ethers.Wallet(key, provider);
}

/**
 * Returns a signer from an externally provided private key.
 * Used when a user's key is passed in (Particle / Magic session key).
 * In production this should be replaced with a session key / AA wallet approach.
 */
function getSignerFromKey(privateKey) {
  return new ethers.Wallet(privateKey, getProvider());
}

// ─── Contract instances ───────────────────────────────────────────────────────

function getEscrowReadonly() {
  return new ethers.Contract(ESCROW_ADDRESS, ESCROW_ABI, getProvider());
}

function getEscrowWithSigner(signer) {
  return new ethers.Contract(ESCROW_ADDRESS, ESCROW_ABI, signer);
}

function getUsdcWithSigner(signer) {
  return new ethers.Contract(USDC_ADDRESS, USDC_ABI, signer);
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Convert USDC human amount (e.g. "10.5") to raw units (6 decimals) */
function toUsdcUnits(humanAmount) {
  return ethers.parseUnits(String(humanAmount), 6);
}

/** Convert raw USDC units to human-readable string */
function fromUsdcUnits(raw) {
  return ethers.formatUnits(raw, 6);
}

/** Format a deal object returned from the contract into something readable */
function formatDeal(dealId, raw) {
  return {
    dealId:           Number(dealId),
    buyer:            raw.buyer,
    seller:           raw.seller,
    amount:           fromUsdcUnits(raw.amount),
    fee:              fromUsdcUnits(raw.fee),
    createdAt:        new Date(Number(raw.createdAt) * 1000).toISOString(),
    deliveryDeadline: new Date(Number(raw.deliveryDeadline) * 1000).toISOString(),
    autoReleaseAt:    new Date(Number(raw.autoReleaseAt) * 1000).toISOString(),
    description:      raw.description,
    channel:          raw.channel,
    status:           DealStatus[raw.status] || "Unknown",
  };
}

// ─── Read functions (no signer needed) ───────────────────────────────────────

/**
 * Fetch a single deal by ID.
 */
async function getDeal(dealId) {
  const escrow = getEscrowReadonly();
  const raw = await escrow.deals(dealId);
  return formatDeal(dealId, raw);
}

/**
 * Get total number of deals created so far.
 */
async function getDealCount() {
  const escrow = getEscrowReadonly();
  return Number(await escrow.nextDealId());
}

/**
 * Get accrued platform fees (in USDC human units).
 */
async function getAccruedFees() {
  const escrow = getEscrowReadonly();
  return fromUsdcUnits(await escrow.accruedFees());
}

// ─── Write functions ──────────────────────────────────────────────────────────

/**
 * Seller creates a deal.
 * @param {string} sellerPrivateKey  Seller's private key (from Particle/Magic session)
 * @param {string} buyerAddress      Buyer's wallet address
 * @param {string|number} usdcAmount Human USDC amount e.g. "10" or 10
 * @param {number} deadlineTimestamp Unix timestamp for delivery deadline
 * @param {string} description       Item/service description
 * @param {string} channel           "telegram" | "whatsapp" | "web"
 * @returns {object} { dealId, txHash }
 */
async function createDeal(sellerPrivateKey, buyerAddress, usdcAmount, deadlineTimestamp, description, channel) {
  const signer = getSignerFromKey(sellerPrivateKey);
  const escrow = getEscrowWithSigner(signer);

  const amount = toUsdcUnits(usdcAmount);
  const deadline = BigInt(deadlineTimestamp);

  const tx = await escrow.createDeal(buyerAddress, amount, deadline, description, channel);
  const receipt = await tx.wait();

  // Extract dealId from DealCreated event
  const iface = new ethers.Interface(ESCROW_ABI);
  let dealId = null;
  for (const log of receipt.logs) {
    try {
      const parsed = iface.parseLog(log);
      if (parsed && parsed.name === "DealCreated") {
        dealId = Number(parsed.args.dealId);
        break;
      }
    } catch (_) {}
  }

  return { dealId, txHash: receipt.hash };
}

/**
 * Buyer approves USDC spend then funds the deal.
 * @param {string} buyerPrivateKey  Buyer's private key (from Particle/Magic session)
 * @param {number} dealId           Deal ID to fund
 * @returns {object} { txHash }
 */
async function fundDeal(buyerPrivateKey, dealId) {
  const signer = getSignerFromKey(buyerPrivateKey);
  const escrow = getEscrowWithSigner(signer);
  const usdc   = getUsdcWithSigner(signer);

  // Fetch deal amount
  const raw = await getEscrowReadonly().deals(dealId);
  const amount = raw.amount;

  // Check and set allowance if needed
  const allowance = await usdc.allowance(await signer.getAddress(), ESCROW_ADDRESS);
  if (allowance < amount) {
    const approveTx = await usdc.approve(ESCROW_ADDRESS, amount);
    await approveTx.wait();
  }

  const tx = await escrow.fundDeal(dealId);
  const receipt = await tx.wait();
  return { txHash: receipt.hash };
}

/**
 * Buyer confirms delivery — releases funds to seller.
 */
async function confirmDelivery(buyerPrivateKey, dealId) {
  const signer = getSignerFromKey(buyerPrivateKey);
  const escrow = getEscrowWithSigner(signer);
  const tx = await escrow.confirmDelivery(dealId);
  const receipt = await tx.wait();
  return { txHash: receipt.hash };
}

/**
 * Anyone can trigger auto-release after deadline + 48h.
 * Called by the backend cron job using the platform wallet.
 */
async function autoRelease(dealId) {
  const signer = getBackendSigner();
  const escrow = getEscrowWithSigner(signer);
  const tx = await escrow.autoRelease(dealId);
  const receipt = await tx.wait();
  return { txHash: receipt.hash };
}

/**
 * Buyer or seller raises a dispute.
 */
async function raiseDispute(userPrivateKey, dealId) {
  const signer = getSignerFromKey(userPrivateKey);
  const escrow = getEscrowWithSigner(signer);
  const tx = await escrow.raiseDispute(dealId);
  const receipt = await tx.wait();
  return { txHash: receipt.hash };
}

/**
 * Owner resolves a dispute.
 * @param {string} buyerAmount  USDC human amount to refund to buyer (can be "0")
 * @param {string} sellerAmount USDC human amount to release to seller (can be "0")
 * Note: buyerAmount + sellerAmount + fee must equal deal.amount
 */
async function resolveDispute(dealId, buyerAmount, sellerAmount) {
  const signer = getBackendSigner();
  const escrow = getEscrowWithSigner(signer);
  const tx = await escrow.resolveDispute(
    dealId,
    toUsdcUnits(buyerAmount),
    toUsdcUnits(sellerAmount)
  );
  const receipt = await tx.wait();
  return { txHash: receipt.hash };
}

/**
 * Owner withdraws accrued platform fees.
 * @param {string} recipient  Address to send fees to
 * @param {string} amount     USDC human amount to withdraw
 */
async function withdrawFees(recipient, amount) {
  const signer = getBackendSigner();
  const escrow = getEscrowWithSigner(signer);
  const tx = await escrow.withdrawFees(recipient, toUsdcUnits(amount));
  const receipt = await tx.wait();
  return { txHash: receipt.hash };
}

// ─── Event listener (for bot notifications) ───────────────────────────────────

/**
 * Listen for escrow events and call handler with formatted data.
 * Use this to notify buyers/sellers via Telegram or WhatsApp.
 *
 * @param {function} onEvent  Called with (eventName, data)
 */
function listenForEvents(onEvent) {
  const escrow = getEscrowReadonly();

  escrow.on("DealCreated", (dealId, seller, buyer, amount, fee, deadline, autoReleaseAt, description, channel) => {
    onEvent("DealCreated", {
      dealId: Number(dealId),
      seller, buyer,
      amount: fromUsdcUnits(amount),
      fee: fromUsdcUnits(fee),
      deadline: new Date(Number(deadline) * 1000).toISOString(),
      description, channel,
    });
  });

  escrow.on("DealFunded", (dealId, buyer, amount) => {
    onEvent("DealFunded", { dealId: Number(dealId), buyer, amount: fromUsdcUnits(amount) });
  });

  escrow.on("DeliveryConfirmed", (dealId, sellerAmount, fee) => {
    onEvent("DeliveryConfirmed", { dealId: Number(dealId), sellerAmount: fromUsdcUnits(sellerAmount), fee: fromUsdcUnits(fee) });
  });

  escrow.on("DealAutoReleased", (dealId, sellerAmount, fee) => {
    onEvent("DealAutoReleased", { dealId: Number(dealId), sellerAmount: fromUsdcUnits(sellerAmount), fee: fromUsdcUnits(fee) });
  });

  escrow.on("DisputeRaised", (dealId, raisedBy) => {
    onEvent("DisputeRaised", { dealId: Number(dealId), raisedBy });
  });

  escrow.on("DisputeResolved", (dealId, buyerAmount, sellerAmount, fee) => {
    onEvent("DisputeResolved", {
      dealId: Number(dealId),
      buyerAmount: fromUsdcUnits(buyerAmount),
      sellerAmount: fromUsdcUnits(sellerAmount),
      fee: fromUsdcUnits(fee),
    });
  });
}

// ─── Exports ──────────────────────────────────────────────────────────────────

module.exports = {
  getDeal,
  getDealCount,
  getAccruedFees,
  createDeal,
  fundDeal,
  confirmDelivery,
  autoRelease,
  raiseDispute,
  resolveDispute,
  withdrawFees,
  listenForEvents,
  toUsdcUnits,
  fromUsdcUnits,
  DealStatus,
};

