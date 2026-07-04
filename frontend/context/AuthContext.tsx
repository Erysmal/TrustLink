"use client";

import { createContext, useContext, useEffect, useState } from "react";
import type { ReactNode } from "react";
import type { MagicUserMetadata } from "magic-sdk";
import { getMagic } from "../lib/magic";

export type MagicUser = Pick<MagicUserMetadata, "issuer" | "email">;

interface AuthContextValue {
  user: MagicUser | null;
  loading: boolean;
  walletAddress: string | null;
  login: (email: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<MagicUser | null>(null);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getMagic()
      .then(async (magic) => {
        if (!magic) return;
        const isLoggedIn = await magic.user.isLoggedIn();
        if (isLoggedIn) {
          const info = await magic.user.getInfo();
          setUser({ issuer: info.issuer, email: info.email });
          setWalletAddress(info.wallets?.ethereum?.publicAddress ?? null);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  async function login(email: string) {
    const magic = await getMagic();
    if (!magic) throw new Error("Magic not initialized");
    await magic.auth.loginWithEmailOTP({ email });
    const info = await magic.user.getInfo();
    setUser({ issuer: info.issuer, email: info.email });
    setWalletAddress(info.wallets?.ethereum?.publicAddress ?? null);
  }

  async function loginWithGoogle() {
    const magic = await getMagic();
    if (!magic) throw new Error("Magic not initialized");
    await magic.oauth.loginWithRedirect({
      provider: "google",
      redirectURI: `${window.location.origin}/login`,
    });
  }

  async function logout() {
    const magic = await getMagic();
    if (!magic) throw new Error("Magic not initialized");
    await magic.user.logout();
    setUser(null);
    setWalletAddress(null);
  }

  return (
    <AuthContext.Provider value={{ user, loading, walletAddress, login, loginWithGoogle, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}
