import React from 'react';

const Logo = ({ size = 60, showText = true }) => {
    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{
                width: size,
                height: size,
                padding: '2px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
            }}>
                <img
                    src="/logo.png"
                    alt="Doulos Logo"
                    style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'contain',
                        filter: 'drop-shadow(0 0 8px rgba(0, 150, 255, 0.2))'
                    }}
                />
            </div>
            {showText && (
                <span style={{
                    fontSize: '1.25rem',
                    fontWeight: 900,
                    letterSpacing: '-0.03em',
                    color: 'hsl(var(--color-text))',
                    lineHeight: 1,
                    fontFamily: 'var(--font-main)'
                }}>DOULOS</span>
            )}
        </div>
    );
};

export default Logo;
