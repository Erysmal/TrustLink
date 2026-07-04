import type { Eip1193Provider } from "ethers";
import type { MagicUserMetadata } from "@magic-sdk/types";

// Typed surface we actually use from the magic instance
export interface MagicClient {
  rpcProvider: Eip1193Provider;
  auth: {
    loginWithEmailOTP: (config: { email: string }) => Promise<void>;
  };
  user: {
    isLoggedIn: () => Promise<boolean>;
    getInfo: () => Promise<MagicUserMetadata>;
    logout: () => Promise<boolean>;
  };
  oauth: {
    loginWithRedirect: (config: { provider: string; redirectURI: string }) => Promise<void>;
    getRedirectResult: (lifespan?: number) => Promise<unknown>;
  };
}

let magic: MagicClient | null = null;

export async function getMagic(): Promise<MagicClient | null> {
  if (typeof window === "undefined") return null;
  if (!magic) {
    const { Magic } = await import("magic-sdk");
    const { OAuthExtension } = await import("@magic-ext/oauth");
    magic = new Magic(process.env.NEXT_PUBLIC_MAGIC_PUBLISHABLE_KEY!, {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      extensions: [new OAuthExtension() as any],
      network: {
        rpcUrl: process.env.NEXT_PUBLIC_ARBITRUM_SEPOLIA_RPC_URL!,
        chainId: 421614,
      },
    }) as unknown as MagicClient;
  }
  return magic;
}
