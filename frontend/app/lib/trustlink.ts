export type DealStatus = "Created" | "Funded" | "Completed" | "Disputed";
export type DealChannel = "telegram" | "whatsapp" | "web";
export type DealSide = "Selling" | "Buying";

export interface TrustLinkDeal {
  id: string;
  title: string;
  side: DealSide;
  status: DealStatus;
  amount: number;
  fee?: number;
  buyerAddress: string;
  sellerAddress: string;
  deadline: string;
  autoReleaseAt?: string;
  description: string;
  channel: DealChannel;
  createdAt?: string;
  fundedAt?: string;
  completedAt?: string;
  disputedAt?: string;
  disputeReason?: string;
  escrowAddress?: string;
}

const STATUS_ORDER: DealStatus[] = ["Created", "Funded", "Completed", "Disputed"];

export const sampleDeals: TrustLinkDeal[] = [
  {
    id: "TL-1001",
    title: "Website redesign escrow",
    side: "Selling",
    status: "Created",
    amount: 2500,
    buyerAddress: "0x7d91b1F7fA6c91B0F8fE8C4bB3f1bE4F02e8C901",
    sellerAddress: "0x1a0f4C38b0f1B2d8c3dD4918b2A9Ff88C8f4B2C1",
    deadline: "2026-07-05T16:00:00.000Z",
    description: "Landing page and dashboard refresh for the first release.",
    channel: "web",
    createdAt: "2026-06-27T08:25:00.000Z",
    escrowAddress: "0x8EcC5b7F3E4B742dA5cD1C1D2f6aA8C1f2B3C4D5",
  },
  {
    id: "TL-1002",
    title: "Design system sprint",
    side: "Buying",
    status: "Funded",
    amount: 1800,
    buyerAddress: "0x6f40A0B6f67B4d40Dd4c0F7A6710b2A5dC20f83f",
    sellerAddress: "0x2B5Ff7Af2E6e6a5db6F11Fb5F0b7e8E5A3F0dD11",
    deadline: "2026-07-01T12:00:00.000Z",
    description: "Component polish and responsive audit for launch screens.",
    channel: "telegram",
    createdAt: "2026-06-24T10:10:00.000Z",
    fundedAt: "2026-06-25T15:40:00.000Z",
    escrowAddress: "0xB9f7f7B0C2f5D1e6a1C4D2C1E5b8a9A7d6F3e2C1",
  },
  {
    id: "TL-1003",
    title: "Ops onboarding package",
    side: "Selling",
    status: "Completed",
    amount: 4200,
    buyerAddress: "0xD3d5Bf5B7e3fC4b0E7c8aE9A4D0A3e5fA3bC8bE1",
    sellerAddress: "0xC7c1c5D9B7b2e9c8A5f2e1A7b4f9D1e6C7d8F0a1",
    deadline: "2026-06-30T18:00:00.000Z",
    description: "Training materials, process docs, and handoff notes.",
    channel: "whatsapp",
    createdAt: "2026-06-18T14:05:00.000Z",
    fundedAt: "2026-06-19T11:00:00.000Z",
    completedAt: "2026-06-22T17:20:00.000Z",
    escrowAddress: "0x1D2A3B4C5D6E7F8090a1B2C3D4E5F60718293A4B",
  },
  {
    id: "TL-1004",
    title: "Mobile analytics setup",
    side: "Buying",
    status: "Disputed",
    amount: 950,
    buyerAddress: "0x4b01aA1C7e4A2A1b6F0a5bC3dE9f8A0C2B4D6e7F",
    sellerAddress: "0x9A8b7C6d5E4f3210A9b8C7d6E5f4A3B2C1d0E9f8",
    deadline: "2026-06-29T09:30:00.000Z",
    description: "Instrumented event tracking for product analytics.",
    channel: "web",
    createdAt: "2026-06-20T09:50:00.000Z",
    fundedAt: "2026-06-21T13:15:00.000Z",
    disputedAt: "2026-06-23T16:45:00.000Z",
    disputeReason: "Delivery scope changed after funding.",
    escrowAddress: "0x6A7B8C9D0E1F2031425364758697A8B9C0D1E2F3",
  },
  {
    id: "TL-1005",
    title: "Product launch copy",
    side: "Selling",
    status: "Funded",
    amount: 1200,
    buyerAddress: "0xF3d2C1b0A9E8d7C6B5A4F3210e9D8C7B6A5f4E3D",
    sellerAddress: "0xA1B2c3D4E5F60718293A4B5C6D7E8F9012345678",
    deadline: "2026-07-03T20:00:00.000Z",
    description: "Homepage, email campaign, and product announcement copy.",
    channel: "telegram",
    createdAt: "2026-06-26T07:45:00.000Z",
    fundedAt: "2026-06-26T13:30:00.000Z",
    escrowAddress: "0xC0ffee254729296a45a3885639AC7E10F9d54979",
  },
];

export const statusOrder = STATUS_ORDER;

export function normalizeDeal(rawInput: Record<string, unknown> | null | undefined, fallbackId: string): TrustLinkDeal {
  const raw = rawInput && typeof rawInput.deal === "object" && rawInput.deal !== null
    ? (rawInput.deal as Record<string, unknown>)
    : rawInput;
  const id = toString(raw?.dealId ?? raw?.id ?? fallbackId) || fallbackId;
  const amount = toNumber(
    raw?.amount ?? raw?.usdcAmount ?? raw?.value ?? raw?.escrowAmount ?? raw?.total,
  );
  const fee = toNumber(raw?.fee ?? raw?.platformFee ?? raw?.escrowFee);
  const channel = normalizeChannel(raw?.channel ?? raw?.deliveryChannel ?? raw?.platform);
  const side = normalizeSide(raw?.side ?? raw?.direction ?? raw?.role);
  const status = normalizeStatus(raw?.status ?? raw?.state ?? raw?.dealStatus);
  const deadline = toString(
    raw?.deliveryDeadline ?? raw?.deadline ?? raw?.dueDate ?? raw?.targetDate,
  );
  const autoReleaseAt = toString(raw?.autoReleaseAt ?? raw?.autoRelease ?? raw?.releaseAt);
  const description = toString(raw?.description ?? raw?.details ?? raw?.memo ?? raw?.notes);
  const title = toString(raw?.title ?? raw?.name ?? raw?.label) || `Deal ${id}`;

  return {
    id,
    title,
    side,
    status,
    amount,
    fee,
    buyerAddress:
      toString(raw?.buyer ?? raw?.buyerAddress ?? raw?.counterpartyAddress ?? raw?.clientAddress) ||
      "0x0000000000000000000000000000000000000000",
    sellerAddress:
      toString(raw?.seller ?? raw?.sellerAddress ?? raw?.merchantAddress ?? raw?.providerAddress) ||
      "0x0000000000000000000000000000000000000000",
    deadline: deadline || new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
    autoReleaseAt,
    description: description || "Escrow deal details will appear here once the backend responds.",
    channel,
    createdAt: toString(raw?.createdAt ?? raw?.created_at ?? raw?.openedAt),
    fundedAt: toString(raw?.fundedAt ?? raw?.funded_at),
    completedAt: toString(raw?.completedAt ?? raw?.completed_at),
    disputedAt: toString(raw?.disputedAt ?? raw?.disputed_at),
    disputeReason: toString(raw?.disputeReason ?? raw?.issue ?? raw?.reason),
    escrowAddress: toString(raw?.escrowAddress ?? raw?.escrow ?? raw?.vaultAddress),
  };
}

export function getDealById(id: string) {
  return sampleDeals.find((deal) => deal.id === id);
}

export function normalizeStatus(value: unknown): DealStatus {
  const normalized = toString(value).toLowerCase();
  if (normalized === "1" || normalized === "funded") return "Funded";
  if (normalized === "2" || normalized === "4" || normalized === "completed" || normalized === "complete" || normalized === "released" || normalized === "resolved") {
    return "Completed";
  }
  if (normalized === "3" || normalized === "disputed" || normalized === "dispute" || normalized === "challenged") {
    return "Disputed";
  }
  return "Created";
}

export function normalizeChannel(value: unknown): DealChannel {
  const normalized = toString(value).toLowerCase();
  if (normalized === "whatsapp") return "whatsapp";
  if (normalized === "web") return "web";
  return "telegram";
}

export function normalizeSide(value: unknown): DealSide {
  const normalized = toString(value).toLowerCase();
  if (normalized === "buying" || normalized === "buy") return "Buying";
  return "Selling";
}

export function formatAmount(amount: number) {
  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: amount % 1 === 0 ? 0 : 2,
    minimumFractionDigits: amount % 1 === 0 ? 0 : 2,
  }).format(amount);
}

export function formatAddress(address: string) {
  if (!address) return "-";
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}

export function formatDateTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function getStageIndex(status: DealStatus) {
  if (status === "Completed") return 3;
  if (status === "Funded") return 1;
  if (status === "Disputed") return 1;
  return 0;
}

function toString(value: unknown) {
  return typeof value === "string" ? value : value == null ? "" : String(value);
}

function toNumber(value: unknown) {
  const numeric = Number(value);
  return Number.isFinite(numeric) && numeric > 0 ? numeric : 0;
}
