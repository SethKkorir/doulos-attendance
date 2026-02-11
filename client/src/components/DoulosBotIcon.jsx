import React from 'react';

const DoulosBotIcon = ({ size = 24, style = {}, className = "" }) => {
    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 100 100"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            style={style}
            className={className}
        >
            <defs>
                <linearGradient id="db_headGrad" x1="50" y1="0" x2="50" y2="100" gradientUnits="userSpaceOnUse">
                    <stop offset="0%" stopColor="#38bdf8" />
                    <stop offset="100%" stopColor="#0284c7" />
                </linearGradient>
                <linearGradient id="db_earGrad" x1="0" y1="0" x2="100" y2="0" gradientUnits="userSpaceOnUse">
                    <stop offset="0%" stopColor="#0ea5e9" />
                    <stop offset="100%" stopColor="#0369a1" />
                </linearGradient>
                <filter id="db_glow" x="-20%" y="-20%" width="140%" height="140%">
                    <feGaussianBlur stdDeviation="2" result="blur" />
                    <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
            </defs>

            {/* Antenna */}
            <line x1="50" y1="15" x2="50" y2="5" stroke="#38bdf8" strokeWidth="6" strokeLinecap="round" />
            <circle cx="50" cy="5" r="5" fill="#38bdf8" />

            {/* Left Ear/Headphone */}
            <rect x="5" y="40" width="12" height="30" rx="4" fill="url(#db_earGrad)" />
            <path d="M17 55 h-5" stroke="#0ea5e9" strokeWidth="3" />

            {/* Right Ear/Headphone */}
            <rect x="83" y="40" width="12" height="30" rx="4" fill="url(#db_earGrad)" />
            <path d="M83 55 h5" stroke="#0ea5e9" strokeWidth="3" />

            {/* Head Shape */}
            <circle cx="50" cy="55" r="35" fill="url(#db_headGrad)" />

            {/* Inner Face Screen (Dark Blue) */}
            <path d="M25 50 C 25 40, 75 40, 75 50 V 65 C 75 80, 25 80, 25 65 Z" fill="#0f172a" />

            {/* Eyes (Cyan Glowing) */}
            <circle cx="38" cy="58" r="6" fill="#00ffff" />
            <circle cx="62" cy="58" r="6" fill="#00ffff" />

            {/* Mouth (Small Line) */}
            <rect x="45" y="72" width="10" height="3" rx="1.5" fill="#00ffff" opacity="0.8" />

        </svg>
    );
};

export default DoulosBotIcon;
