import React from 'react';

const Button = ({
    children,
    onClick,
    variant = 'primary',
    type = 'button',
    className = '',
    disabled = false,
    fullWidth = false
}) => {
    const baseStyle = {
        padding: '0.75rem 1.5rem',
        borderRadius: 'var(--radius-md)',
        fontWeight: '600',
        fontSize: '1rem',
        transition: 'all var(--transition-normal)',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: fullWidth ? '100%' : 'auto',
        opacity: disabled ? 0.6 : 1,
        cursor: disabled ? 'not-allowed' : 'pointer',
        position: 'relative',
        overflow: 'hidden',
    };

    const variants = {
        primary: {
            background: 'linear-gradient(135deg, var(--accent-gold) 0%, var(--accent-gold-dark) 100%)',
            color: '#0f172a', // Dark text on gold
            boxShadow: '0 4px 14px 0 rgba(251, 191, 36, 0.39)',
        },
        secondary: {
            background: 'transparent',
            border: '1px solid var(--text-secondary)',
            color: 'var(--text-primary)',
        },
        danger: {
            background: 'var(--danger)',
            color: 'white',
        }
    };

    // Hover logic would ideally be in CSS, but for inline styles we can use onMouseEnter/Leave or CSS modules/styled-components.
    // Since we are using Vanilla CSS primarily, I'll add a class and style it in index.css OR keep it simple here.
    // Let's rely on the className 'btn' and 'btn-primary' etc for hover effects in index.css for better practice, 
    // but to keep it self contained I'll stick to a mixed approach or update index.css later.
    // Actually, for "Vanilla CSS" request, I really should put these styles in a CSS file.

    // STRATEGY CHANGE: I will create a Button.css and Card.css or just put them in index.css for simplicity as requested?
    // "Use Vanilla CSS for maximum flexibility". I'll put classes in index.css in a moment.

    return (
        <button
            type={type}
            className={`btn btn-${variant} ${className}`}
            onClick={onClick}
            disabled={disabled}
            style={{ ...baseStyle, ...variants[variant] }}
        >
            {children}
        </button>
    );
};

export default Button;
