
import React from 'react';
import { motion } from 'motion/react';
import { getPublicBrand } from '../utils/branding';

interface VinetelligenceLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  withText?: boolean;
  accentColor?: string;
}

const VinetelligenceLogo: React.FC<VinetelligenceLogoProps> = ({ 
  className = "", 
  size = "md", 
  withText = true,
  accentColor
}) => {
  const brand = getPublicBrand();
  const actualAccentColor = accentColor || (brand.theme === 'vinea' ? "#d97706" : "#4f46e5"); // amber-600 or indigo-600

  const sizes = {
    sm: "h-8",
    md: "h-12",
    lg: "h-20",
    xl: "h-40"
  };

  return (
    <div className={`flex flex-col items-center justify-center gap-2 ${className}`}>
      <motion.svg 
        viewBox="0 0 160 120" 
        className={`${sizes[size]} w-auto aspect-[4/3]`}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1, ease: "easeOut" }}
      >
        <defs>
          <linearGradient id="chromeGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="50%" stopColor="#94a3b8" />
            <stop offset="100%" stopColor="#475569" />
          </linearGradient>
          <filter id="accentGlow">
            <feGaussianBlur stdDeviation="2" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* stylized metallic "V" plates based on the draft */}
        {/* Left Plate */}
        <motion.path 
          d="M40,30 L75,30 L60,85 L25,85 Z" 
          fill="url(#chromeGrad)"
          stroke={actualAccentColor}
          strokeWidth="0.5"
          initial={{ x: -10, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
        />
        {/* Right Plate */}
        <motion.path 
          d="M85,30 L120,30 L135,85 L100,85 Z" 
          fill="url(#chromeGrad)"
          stroke={actualAccentColor}
          strokeWidth="0.5"
          initial={{ x: 10, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.4 }}
        />
        
        {/* Glow Accents / Undersides */}
        <path d="M25,85 L60,85 L58,88 L23,88 Z" fill={actualAccentColor} filter="url(#accentGlow)" />
        <path d="M100,85 L135,85 L137,88 L102,88 Z" fill={actualAccentColor} filter="url(#accentGlow)" />

        {/* Central Neural Core / Small V */}
        <motion.path 
          d="M75,55 L80,65 L85,55" 
          fill="none" 
          stroke="white" 
          strokeWidth="3"
          strokeLinecap="round"
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ repeat: Infinity, duration: 2 }}
        />
      </motion.svg>

      {withText && (
        <div className="flex flex-col items-center" id="logo-branding-wrapper">
          <span className="font-sans font-black text-white italic tracking-[-0.05em] leading-none text-center" style={{ fontSize: size === 'xl' ? '2.5rem' : size === 'lg' ? '1.5rem' : '1.1rem' }}>
            {brand.name.toUpperCase()}
          </span>
          <span 
            className="text-[7px] md:text-[9px] uppercase tracking-[0.6em] font-black mt-1 text-center"
            style={{ color: actualAccentColor }}
          >
            {brand.theme === 'vinea' ? "HOSPITALITY SERVICE OS" : "BEVERAGES INTELLIGENCE"}
          </span>
        </div>
      )}
    </div>
  );
};

export default VinetelligenceLogo;
