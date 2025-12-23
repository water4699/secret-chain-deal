"use client";

import { Shield, Lock, Users, FileKey } from "lucide-react";

export const Hero = () => {
  return (
    <section className="relative pt-20 sm:pt-28 md:pt-32 pb-12 sm:pb-16 px-4 sm:px-6">
      <div className="container mx-auto text-center relative z-10">
        <div className="flex flex-col items-center space-y-6 sm:space-y-8">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-card border border-border/50 shadow-soft animate-fade-up">
            <Lock className="h-4 w-4 text-primary" />
            <span className="text-sm text-primary font-medium">Fully Homomorphic Encryption</span>
          </div>

          {/* Main Heading */}
          <div className="space-y-3 animate-fade-up" style={{ animationDelay: "100ms" }}>
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold leading-tight text-foreground">
              Secret Chain Deal
            </h1>
            <p className="text-xl sm:text-2xl text-primary font-medium">
              Encrypted Negotiation Platform
            </p>
          </div>
          
          <p className="text-base sm:text-lg text-muted-foreground max-w-xl sm:max-w-2xl mx-auto px-2 animate-fade-up" style={{ animationDelay: "200ms" }}>
            Submit and manage encrypted deal offers on-chain using FHEVM technology.
            Your offers remain completely private until all parties reveal.
          </p>
          
          {/* Feature Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-5 w-full max-w-3xl mx-auto mt-8 sm:mt-10">
            <FeatureCard
              icon={Lock}
              title="Encrypted Offers"
              description="Offers encrypted on-chain using FHE"
              delay={300}
            />
            <FeatureCard
              icon={Shield}
              title="Private Processing"
              description="Compute without decryption"
              delay={400}
            />
            <FeatureCard
              icon={Users}
              title="Multi-Party Deals"
              description="Fair multi-party negotiation"
              delay={500}
            />
          </div>

          {/* Decorative Seal */}
          <div className="mt-10 sm:mt-12 animate-float">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full wax-seal flex items-center justify-center animate-glow-pulse">
              <FileKey className="w-7 h-7 sm:w-9 sm:h-9 text-white/90" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

interface FeatureCardProps {
  icon: React.ElementType;
  title: string;
  description: string;
  delay: number;
}

const FeatureCard = ({ icon: Icon, title, description, delay }: FeatureCardProps) => {
  return (
    <div 
      className="p-5 rounded-xl bg-card border border-border/50 shadow-soft hover:shadow-card 
        transition-all duration-300 hover:-translate-y-1 animate-fade-up"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="w-11 h-11 rounded-lg bg-primary/10 flex items-center justify-center mb-3 mx-auto">
        <Icon className="w-5 h-5 text-primary" />
      </div>
      <h3 className="text-base font-semibold mb-1 text-foreground">{title}</h3>
      <p className="text-xs text-muted-foreground">{description}</p>
    </div>
  );
};
