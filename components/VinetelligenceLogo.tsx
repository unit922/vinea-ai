
import React from 'react';
import { motion } from 'motion/react';

interface VinetelligenceLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  withText?: boolean;
  accentColor?: string;
  orientation?: 'vertical' | 'horizontal';
}

const VinetelligenceLogo: React.FC<VinetelligenceLogoProps> = ({ 
  className = "", 
  size = "md", 
  withText = true,
  accentColor = "#0ea5e9", // Sky Blue / Azure Caribbean
  orientation = 'vertical'
}) => {
  const sizes = {
    sm: "h-8",
    md: "h-12",
    lg: "h-20",
    xl: "h-40"
  };

  const containerClasses = orientation === 'horizontal' 
    ? `flex items-center gap-3 ${className}`
    : `flex flex-col items-center justify-center gap-2 ${className}`;

  return (
    <div className={containerClasses}>
      <motion.svg 
        viewBox="0 0 160 120" 
        className={`${sizes[size]} w-auto aspect-[4/3]`}
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
      >
        <defs>
          <linearGradient id="caribbeanGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="50%" stopColor="#7dd3fc" />
            <stop offset="100%" stopColor="#0ea5e9" />
          </linearGradient>
          <filter id="azureGlow">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* Dynamic V-Frame inspired by nautical/vinea architecture */}
        <motion.path 
          d="M40,30 L75,30 L65,95 L30,95 Z" 
          fill="url(#caribbeanGrad)"
          stroke={accentColor}
          strokeWidth="0.5"
          initial={{ x: -5, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
        />
        <motion.path 
          d="M85,30 L120,30 L130,95 L95,95 Z" 
          fill="url(#caribbeanGrad)"
          stroke={accentColor}
          strokeWidth="0.5"
          initial={{ x: 5, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.4 }}
        />
        
        {/* Coastal Reef / Sand Accent */}
        <motion.path 
          d="M30,95 L130,95 L132,98 L28,98 Z" 
          fill="#fef08a" 
          filter="url(#azureGlow)"
          animate={{ opacity: [0.3, 0.6, 0.3] }}
          transition={{ repeat: Infinity, duration: 4 }}
        />

        {/* Central Pulse / Neural Vinea Core */}
        <motion.path 
          d="M72,60 L80,72 L88,60" 
          fill="none" 
          stroke="white" 
          strokeWidth="3"
          strokeLinecap="round"
          animate={{ 
            opacity: [0.6, 1, 0.6],
            scale: [0.95, 1.05, 0.95]
          }}
          transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
        />
      </motion.svg>

      {withText && (
        <div className="flex flex-col items-center">
          <span className="font-sans font-black text-white uppercase tracking-tight leading-none" style={{ fontSize: size === 'xl' ? '2.2rem' : size === 'lg' ? '1.4rem' : '1.1rem' }}>
            VINETELLIGENCE AI
          </span>
          <span 
            className="text-[6px] md:text-[8px] uppercase tracking-[0.6em] font-black mt-1"
            style={{ color: accentColor }}
          >
            VINEA CARIBBEAN NODES
          </span>
        </div>
      )}
    </div>
  );
};

export default VinetelligenceLogo;
