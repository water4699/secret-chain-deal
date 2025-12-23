"use client";

import "@rainbow-me/rainbowkit/styles.css";
import type { ReactNode } from "react";
import { useState } from "react";

import { MetaMaskProvider } from "@/hooks/metamask/useMetaMaskProvider";
import { InMemoryStorageProvider } from "@/hooks/useInMemoryStorage";
import { MetaMaskEthersSignerProvider } from "@/hooks/metamask/useMetaMaskEthersSigner";
import { RainbowKitProvider, darkTheme } from "@rainbow-me/rainbowkit";
import { createConfig, http, WagmiProvider } from "wagmi";
import { injected } from "wagmi/connectors";
import { hardhat, sepolia } from "wagmi/chains";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

type Props = {
  children: ReactNode;
};

// Configuration constants for better reliability
const RETRY_COUNT = 3;
const RETRY_DELAY = 1000;
const REQUEST_TIMEOUT = 30000;

export function Providers({ children }: Props) {
  // Configure QueryClient with retry and stale time settings
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        retry: RETRY_COUNT,
        retryDelay: (attemptIndex) => Math.min(RETRY_DELAY * 2 ** attemptIndex, 30000),
        staleTime: 5000,
        gcTime: 10 * 60 * 1000, // 10 minutes
        refetchOnWindowFocus: false,
      },
      mutations: {
        retry: RETRY_COUNT - 1,
        retryDelay: RETRY_DELAY,
      },
    },
  }));

  // Build readonly RPC map for FHEVM usage (avoid routing reads via wallet)
  const localUrl = process.env.NEXT_PUBLIC_LOCAL_RPC_URL || "http://127.0.0.1:8545";
  // Prefer public Sepolia RPC that typically works in more regions.
  // Can be overridden via NEXT_PUBLIC_SEPOLIA_RPC_URL.
  const sepoliaUrl =
    process.env.NEXT_PUBLIC_SEPOLIA_RPC_URL ||
    "https://rpc.sepolia.org";
  const readonlyRpcs: Record<number, string> = {
    // Only map Hardhat to direct JSON-RPC in browser to avoid MetaMask caching on dev
    // Do NOT map Sepolia here to prevent browser-side CORS issues; use wallet for reads instead
    31337: localUrl,
  };

  // Wagmi + RainbowKit
  // Important: Provide transports for the full union of possible chain ids
  // even if Sepolia is not included in `chains`, to satisfy Wagmi's typing.
  // Configure transports with retry and timeout settings
  const transports = {
    [hardhat.id]: http(localUrl, {
      retryCount: RETRY_COUNT,
      retryDelay: RETRY_DELAY,
      timeout: REQUEST_TIMEOUT,
    }),
    [sepolia.id]: http(sepoliaUrl, {
      retryCount: RETRY_COUNT,
      retryDelay: RETRY_DELAY,
      timeout: REQUEST_TIMEOUT,
      batch: {
        batchSize: 100,
        wait: 20,
      },
    }),
  } as const;

  // Always include Sepolia in chain list so RainbowKit modal shows both
  const chains = [hardhat, sepolia] as const;

  const wagmiConfig = createConfig({
    chains,
    connectors: [injected()],
    transports,
    ssr: true,
    batch: {
      multicall: {
        batchSize: 1024,
        wait: 16,
      },
    },
  });

  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider
          theme={darkTheme({
            accentColor: "#00D4AA",
            accentColorForeground: "#0A0F14",
            borderRadius: "medium",
          })}
        >
          <MetaMaskProvider>
            <MetaMaskEthersSignerProvider initialMockChains={readonlyRpcs}>
              <InMemoryStorageProvider>{children}</InMemoryStorageProvider>
            </MetaMaskEthersSignerProvider>
          </MetaMaskProvider>
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
