import React from 'react';

interface AHLALogoProps {
  className?: string;
  theme?: 'color' | 'light' | 'dark' | 'grayscale';
  height?: number;
}

export const AHLALogo: React.FC<AHLALogoProps> = ({ 
  className = '', 
  theme = 'color', 
  height = 24 
}) => {
  // Color configuration based on theme prop
  const colors = {
    teal: theme === 'grayscale' 
      ? 'currentColor' 
      : theme === 'dark' 
        ? '#94a3b8' // slate-400
        : theme === 'light'
          ? '#ffffff'
          : '#1e3a5f', // deep blue-teal
    redLight: theme === 'grayscale'
      ? 'currentColor'
      : theme === 'dark'
        ? '#f43f5e' // rose-500
        : theme === 'light'
          ? '#fda4af' // rose-300
          : '#cc0000', // standard classic red
    redHeavy: theme === 'grayscale'
      ? 'currentColor'
      : theme === 'dark'
        ? '#e11d48' // rose-600
        : theme === 'light'
          ? '#f43f5e'
          : '#ff0000', // high intensity red
  };

  const calculatedWidth = height * 6.5; // Aspect ratio is roughly 6.5 : 1

  return (
    <svg 
      width={calculatedWidth} 
      height={height} 
      viewBox="0 0 390 60" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className={`${className} transition-colors duration-200`}
    >
      {/* Symbol + AHLA Wordmark Area */}
      <g>
        {/* Left inner roof shape (red) */}
        <path 
          d="M 68 28 L 78 16 L 89 29 L 89 50 L 84 50 L 84 32 L 78 24 L 72 31 L 68 28 Z" 
          fill={colors.redLight} 
        />
        {/* Right outer taller roof shape (red intense) */}
        <path 
          d="M 76 19 L 88 5 L 101 21 L 101 50 L 96 50 L 96 25 L 88 15 L 80 24 L 76 19 Z" 
          fill={colors.redHeavy} 
        />
        
        {/* AHLA Bold Lettering - Teal/Teal-Gray */}
        <text 
          x="4" 
          y="49" 
          fontFamily="system-ui, -apple-system, sans-serif" 
          fontWeight="900" 
          fontSize="24" 
          letterSpacing="0.05em" 
          fill={colors.teal}
        >
          AHLA
        </text>
      </g>

      {/* Decorative vertical separator line */}
      <line 
        x1="112" 
        y1="12" 
        x2="112" 
        y2="48" 
        stroke={colors.teal} 
        strokeWidth="1.5" 
        opacity={theme === 'color' ? "0.3" : "0.5"} 
      />

      {/* AMERICAN HOTEL & LODGING ASSOCIATION text */}
      <g>
        {/* Main large text line */}
        <text 
          x="124" 
          y="35" 
          fontFamily="system-ui, -apple-system, sans-serif" 
          fontWeight="800" 
          fontSize="11" 
          letterSpacing="0.16em" 
          fill={colors.teal}
        >
          AMERICAN HOTEL & LODGING ASSOCIATION
        </text>
        
        {/* Subtitle badge indicator */}
        <text 
          x="124" 
          y="47" 
          fontFamily="system-ui, -apple-system, sans-serif" 
          fontWeight="500" 
          fontSize="8" 
          letterSpacing="0.32em" 
          fill={theme === 'color' ? '#b45309' : colors.teal} // amber-700 or slate or theme
          opacity="0.8"
        >
          OFFICIAL ALLIED MEMBER
        </text>
      </g>
    </svg>
  );
};

export default AHLALogo;
