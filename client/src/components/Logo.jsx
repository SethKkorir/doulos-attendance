import React from 'react';

const Logo = ({ size = 60, color = "white", showText = true }) => {
    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <svg width={size} height={size} viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="100" cy="100" r="95" stroke={color} strokeWidth="2" fill="none" opacity="0.2" />

                {/* The Star in the center */}
                <path
                    d="M100 40L112 85L160 85L120 115L135 160L100 130L65 160L80 115L40 85L88 85L100 40Z"
                    fill={color}
                />

                {/* DOULOS Text on Top Curve */}
                <path id="topCurve" d="M40,100 a60,60 0 1,1 120,0" fill="none" />
                <text fill={color} fontSize="28" fontWeight="bold" letterSpacing="4">
                    <textPath xlinkHref="#topCurve" startOffset="50%" textAnchor="middle">
                        DOULOS
                    </textPath>
                </text>

                {/* LEADERS IN SERVICE on Bottom Curve */}
                <path id="bottomCurve" d="M40,100 a60,60 0 0,0 120,0" fill="none" />
                <text fill={color} fontSize="14" fontWeight="600" opacity="0.8">
                    <textPath xlinkHref="#bottomCurve" startOffset="50%" textAnchor="middle" side="right">
                        LEADERS IN SERVICE
                    </textPath>
                </text>
            </svg>
            {showText && (
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{ fontSize: '1.25rem', fontWeight: 800, letterSpacing: '-0.02em', color: 'white', lineHeight: 1 }}>DOULOS</span>
                    <span style={{ fontSize: '0.65rem', fontWeight: 600, color: 'var(--color-text-dim)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Fellowship</span>
                </div>
            )}
        </div>
    );
};

export default Logo;
