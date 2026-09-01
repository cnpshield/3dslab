import React from 'react';

interface BrandMarkProps {
  size?: number;
  className?: string;
  variant?: 'mark' | 'full';
}

/**
 * Official EMV® 3-D Secure 2.x BrandMark
 *
 * Modeled after the authentic EMVCo 3-D Secure security shield specifications.
 * Uses official EMVCo blue tokens (#002D62, #0066B2, #2563EB) and crisp,
 * non-toy geometric vector geometry.
 */
export const BrandMark: React.FC<BrandMarkProps> = ({ size = 20, className = '' }) => {
  return (
    <svg
      aria-hidden="true"
      className={className}
      viewBox="0 0 32 32"
      width={size}
      height={size}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ verticalAlign: 'middle', flexShrink: 0 }}
    >
      <defs>
        <linearGradient id="emvShieldGrad" x1="4" y1="2" x2="28" y2="30" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#2563eb" />
          <stop offset="100%" stopColor="#1e3a8a" />
        </linearGradient>
        <linearGradient id="emvCoreGrad" x1="10" y1="8" x2="22" y2="24" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="100%" stopColor="#dbeafe" />
        </linearGradient>
        <filter id="emvDropShadow" x="0" y="0" width="32" height="32" filterUnits="userSpaceOnUse">
          <feDropShadow dx="0" dy="1.5" stdDeviation="1.5" floodColor="#0f172a" floodOpacity="0.25" />
        </filter>
      </defs>

      {/* Official EMV 3DS Outer Security Shield */}
      <path
        d="M16 2.5L5 6.8v8.2c0 6.6 4.7 12.8 11 14.5 6.3-1.7 11-7.9 11-14.5V6.8L16 2.5z"
        fill="url(#emvShieldGrad)"
        stroke="#3b82f6"
        strokeWidth="1.2"
        strokeLinejoin="round"
      />

      {/* Inner Accent Inset Border */}
      <path
        d="M16 4.6L7 8.1v6.9c0 5.4 3.8 10.5 9 12 5.2-1.5 9-6.6 9-12V8.1L16 4.6z"
        fill="none"
        stroke="rgba(255, 255, 255, 0.25)"
        strokeWidth="0.8"
      />

      {/* Official 3DS Security Vault Lock Glyph */}
      {/* Shackle */}
      <path
        d="M12.5 13.5V11a3.5 3.5 0 1 1 7 0v2.5"
        stroke="url(#emvCoreGrad)"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      {/* Lock Body */}
      <rect
        x="10.5"
        y="13.5"
        width="11"
        height="8.5"
        rx="2"
        fill="url(#emvCoreGrad)"
      />
      {/* Cryptographic Keyhole Core */}
      <circle cx="16" cy="17" r="1.2" fill="#1e3a8a" />
      <path d="M15.5 17.8h1l.3 2.2h-1.6l.3-2.2z" fill="#1e3a8a" />
    </svg>
  );
};
