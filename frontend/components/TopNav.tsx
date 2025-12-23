"use client";

import { ConnectButton } from "@rainbow-me/rainbowkit";
import { Shield, Wifi, WifiOff } from "lucide-react";
import { useChainId, useAccount } from "wagmi";

const NETWORK_NAMES: Record<number, string> = {
  31337: "Hardhat",
  11155111: "Sepolia",
  1: "Ethereum",
};

const NETWORK_COLORS: Record<number, string> = {
  31337: "bg-amber-500",
  11155111: "bg-blue-500",
  1: "bg-emerald-500",
};

export const TopNav = () => {
  const chainId = useChainId();
  const { isConnected } = useAccount();

  const networkName = NETWORK_NAMES[chainId] || `Chain ${chainId}`;
  const networkColor = NETWORK_COLORS[chainId] || "bg-gray-500";

  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b border-border/50 glass-effect">
      <div className="container mx-auto px-4 sm:px-6 py-3">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-primary flex items-center justify-center shadow-soft">
              <Shield className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </div>
            <div className="hidden sm:block">
              <h1 className="text-lg font-bold text-foreground tracking-tight">Secret Chain Deal</h1>
              <p className="text-xs text-muted-foreground">Encrypted Negotiation</p>
            </div>
          </div>

          {/* Right Side */}
          <div className="flex items-center gap-2 sm:gap-3">
            {isConnected && (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-card border border-border/50 shadow-sm">
                <Wifi className="w-3.5 h-3.5 text-emerald-500" />
                <span className={`w-2 h-2 rounded-full ${networkColor}`} />
                <span className="text-xs font-medium text-muted-foreground hidden sm:inline">
                  {networkName}
                </span>
              </div>
            )}
            <ConnectButton />
          </div>
        </div>
      </div>
    </header>
  );
};
