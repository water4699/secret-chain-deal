"use client";

import { Card } from "@/components/ui/card";
import { FileText, Lock, CheckCircle, Unlock, ArrowRight } from "lucide-react";
import { useState } from "react";

const steps = [
  {
    icon: FileText,
    title: "Create Offer",
    description: "Draft your diplomatic proposal with terms and conditions",
    detail: "Define your negotiation terms privately before encryption",
  },
  {
    icon: Lock,
    title: "Encrypt & Submit",
    description: "Your offer is encrypted on-chain, invisible to other parties",
    detail: "FHE ensures your data stays private even on public blockchain",
  },
  {
    icon: CheckCircle,
    title: "All Parties Finalize",
    description: "Each party submits their encrypted offer independently",
    detail: "No party can see others' offers until everyone commits",
  },
  {
    icon: Unlock,
    title: "Simultaneous Reveal",
    description: "All offers decrypt simultaneously when everyone finalizes",
    detail: "Fair revelation prevents strategic advantage from timing",
  },
];

export const HowItWorks = () => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  return (
    <section className="relative py-14 sm:py-16 px-4 sm:px-6">
      <div className="container mx-auto max-w-5xl relative z-10">
        {/* Section Header */}
        <div className="text-center mb-10 sm:mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold mb-3 text-foreground">
            How It <span className="text-primary">Works</span>
          </h2>
          <p className="text-base text-muted-foreground max-w-xl mx-auto">
            Secure, encrypted negotiations that ensure fairness for all parties
          </p>
        </div>

        {/* Steps Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {steps.map((step, index) => {
            const isHovered = hoveredIndex === index;
            
            return (
              <div key={index} className="relative">
                <Card
                  className={`relative p-5 bg-card border transition-all duration-300 cursor-pointer
                    ${isHovered 
                      ? "border-primary/50 shadow-card -translate-y-1" 
                      : "border-border/50 shadow-soft hover:border-primary/30"
                    }
                  `}
                  onMouseEnter={() => setHoveredIndex(index)}
                  onMouseLeave={() => setHoveredIndex(null)}
                >
                  {/* Step number */}
                  <div className={`absolute top-3 right-3 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-colors duration-300
                    ${isHovered ? "bg-primary text-white" : "bg-muted text-muted-foreground"}
                  `}>
                    {index + 1}
                  </div>

                  <div className="flex flex-col items-center text-center space-y-3">
                    {/* Icon */}
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-300
                      ${isHovered ? "bg-primary/15 scale-105" : "bg-muted"}
                    `}>
                      <step.icon className={`w-6 h-6 transition-colors duration-300
                        ${isHovered ? "text-primary" : "text-muted-foreground"}
                      `} />
                    </div>

                    {/* Content */}
                    <div className="space-y-1.5">
                      <h3 className="text-base font-bold text-foreground">{step.title}</h3>
                      <p className={`text-xs leading-relaxed transition-colors duration-300
                        ${isHovered ? "text-foreground/80" : "text-muted-foreground"}
                      `}>
                        {isHovered ? step.detail : step.description}
                      </p>
                    </div>
                  </div>
                </Card>
                
                {/* Connector arrow */}
                {index < steps.length - 1 && (
                  <div className="hidden lg:flex absolute -right-2 top-1/2 -translate-y-1/2 z-10">
                    <ArrowRight className={`w-4 h-4 transition-colors duration-300
                      ${hoveredIndex === index || hoveredIndex === index + 1 
                        ? "text-primary" 
                        : "text-muted-foreground/30"
                      }
                    `} />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
