"use client";

import { Shield, Lock, Heart } from "lucide-react";

export const Footer = () => {
  return (
    <footer className="py-10 px-6 border-t border-border/50 bg-card/50">
      <div className="container mx-auto max-w-5xl">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center">
              <Shield className="w-4 h-4 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground text-sm">Secret Chain Deal</h3>
              <p className="text-xs text-muted-foreground">Encrypted Negotiation</p>
            </div>
          </div>

          {/* Features */}
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-primary/70" />
              <span className="text-xs">FHE Encrypted</span>
            </div>
            <span className="text-border">|</span>
            <span className="text-xs">Powered by <span className="font-medium text-primary">Zama FHEVM</span></span>
          </div>

          {/* Copyright */}
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <span>Built with</span>
            <Heart className="w-3 h-3 text-red-400 fill-red-400" />
            <span>for privacy</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
