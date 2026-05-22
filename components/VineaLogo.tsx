
import React from 'react';
import { motion } from 'motion/react';

interface VineaLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  withText?: boolean;
  accentColor?: string;
}

const VineaLogo: React.FC<VineaLogoProps> = ({ 
  className = "", 
  size = "md", 
  withText = true,
  accentColor = "#f59e0b" // amber-500
}) => {
  const sizes = {
    sm: "h-8",
    md: "h-12",
    lg: "h-20",
    xl: "h-32"
  };

  return (
    <div className={`flex items-center gap-4 ${className} ${sizes[size]}`}>
      <motion.svg 
        viewBox="0 0 100 100" 
        className="h-full w-auto aspect-square"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
      >
        {/* Abstract Architectural Silhouette */}
        <defs>
          <linearGradient id="vineaGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="100%" stopColor="#ffffff" stopOpacity="0.4" />
          </linearGradient>
        </defs>
        
        {/* The "V" Silhouette - Architectural Pillar */}
        <path 
          d="M20,20 L50,80 L80,20" 
          fill="none" 
          stroke="url(#vineaGrad)" 
          strokeWidth="8" 
          strokeLinecap="round" 
          strokeLinejoin="round" 
        />
        
        {/* Neural Network / Vine Nodes */}
        <motion.circle 
          cx="20" cy="20" r="4" 
          fill={accentColor} 
          animate={{ scale: [1, 1.2, 1] }} 
          transition={{ repeat: Infinity, duration: 2 }} 
        />
        <motion.circle 
          cx="50" cy="80" r="4" 
          fill={accentColor}
          animate={{ scale: [1.2, 1, 1.2] }} 
          transition={{ repeat: Infinity, duration: 2.5 }} 
        />
        <motion.circle 
          cx="80" cy="20" r="4" 
          fill={accentColor}
          animate={{ scale: [1, 1.3, 1] }} 
          transition={{ repeat: Infinity, duration: 3 }} 
        />
        
        {/* Stylized Glass Stem */}
        <line 
          x1="50" y1="80" x2="50" y2="95" 
          stroke="white" 
          strokeWidth="2" 
          strokeOpacity="0.5" 
        />
        <path 
          d="M40,95 L60,95" 
          stroke="white" 
          strokeWidth="2" 
          strokeOpacity="0.3" 
        />

        {/* Neural Pulse Lines */}
        <motion.path 
          d="M20,20 Q35,50 50,80" 
          stroke={accentColor} 
          strokeWidth="1" 
          strokeDasharray="4 4"
          animate={{ strokeDashoffset: [0, -20] }}
          transition={{ repeat: Infinity, duration: 4, ease: "linear" }}
          fill="none"
          opacity="0.3"
        />
        <motion.path 
          d="M80,20 Q65,50 50,80" 
          stroke={accentColor} 
          strokeWidth="1" 
          strokeDasharray="4 4"
          animate={{ strokeDashoffset: [0, -20] }}
          transition={{ repeat: Infinity, duration: 4, ease: "linear" }}
          fill="none"
          opacity="0.3"
        />
      </motion.svg>

      {withText && (
        <div className="flex flex-col">
          <span className="font-serif font-black text-white italic tracking-tighter leading-none" style={{ fontSize: '120%' }}>
            VINEA
          </span>
          <span className="text-[10px] uppercase tracking-[0.4em] font-black text-stone-500 mt-1">
            Synthesized Hospitality
          </span>
        </div>
      )}
    </div>
  );
};

export default VineaLogo;
