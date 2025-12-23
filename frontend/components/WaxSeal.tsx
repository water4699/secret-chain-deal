"use client";

import { useState } from "react";
import { Lock, Unlock } from "lucide-react";

interface WaxSealProps {
  onBreak: () => void;
}

export const WaxSeal = ({ onBreak }: WaxSealProps) => {
  const [isBreaking, setIsBreaking] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const handleClick = () => {
    if (isBreaking) return;
    setIsBreaking(true);
    setTimeout(() => onBreak(), 600);
  };

  return (
    <button
      onClick={handleClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      disabled={isBreaking}
      className={`relative w-16 h-16 rounded-full cursor-pointer transition-all duration-300
        ${isBreaking ? "animate-seal-break pointer-events-none" : ""}
        ${isHovered && !isBreaking ? "scale-110" : ""}
      `}
    >
      <div className="absolute inset-0 rounded-full wax-seal flex items-center justify-center">
        <div className="absolute inset-2 rounded-full bg-gradient-to-br from-white/20 to-transparent" />
        <div className="absolute inset-2.5 rounded-full border border-white/20" />
        <div className={`relative z-10 transition-transform duration-300 ${isHovered ? "scale-110" : ""}`}>
          {isHovered ? (
            <Unlock className="w-6 h-6 text-white/90" />
          ) : (
            <Lock className="w-6 h-6 text-white/90" />
          )}
        </div>
      </div>
    </button>
  );
};
