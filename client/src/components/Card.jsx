import React from 'react';

const Card = ({ children, className = '', style = {} }) => {
    const cardStyle = {
        background: 'var(--bg-card)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: 'var(--radius-lg)',
        padding: 'var(--spacing-lg)',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        color: 'var(--text-primary)',
        ...style,
    };

    return (
        <div className={`glass-card ${className}`} style={cardStyle}>
            {children}
        </div>
    );
};

export default Card;
