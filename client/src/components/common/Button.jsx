import React from 'react';
import { Loader2 } from 'lucide-react';
import { renderIcon } from './iconHelper';

/**
 * Shared Doulos Design System: Buttons
 * - primary: Brand Royal Blue (#1D4ED8)
 * - secondary / outline: Crisp white with border (#CBD5E1)
 * - dark: Near-black slate (#0F172A) e-commerce action pill
 * - danger: Soft red (#EF4444)
 * - ghost: Transparent borderless
 */

export const Button = ({
    children,
    onClick,
    variant = 'primary', // 'primary' | 'secondary' | 'dark' | 'danger' | 'ghost'
    size = 'md', // 'sm' | 'md' | 'lg'
    icon: Icon,
    iconRight: IconRight,
    loading = false,
    disabled = false,
    className = '',
    style = {},
    type = 'button',
    ...props
}) => {
    // Sizing tokens
    const sizeStyles = {
        sm: {
            padding: '0.4rem 0.85rem',
            fontSize: '0.78rem',
            borderRadius: 'var(--ds-radius-md, 8px)',
            gap: '0.35rem'
        },
        md: {
            padding: '0.58rem 1.15rem',
            fontSize: '0.84rem',
            borderRadius: 'var(--ds-radius-md, 10px)',
            gap: '0.5rem'
        },
        lg: {
            padding: '0.75rem 1.5rem',
            fontSize: '0.92rem',
            borderRadius: 'var(--ds-radius-lg, 12px)',
            gap: '0.65rem'
        }
    };

    // Variant tokens
    const variantStyles = {
        primary: {
            backgroundColor: 'var(--ds-primary, #1D4ED8)',
            color: '#FFFFFF',
            border: 'none',
            boxShadow: '0 2px 8px var(--ds-primary-glow, rgba(29, 78, 216, 0.25))'
        },
        secondary: {
            backgroundColor: 'var(--ds-btn-secondary-bg, #FFFFFF)',
            color: 'var(--ds-btn-secondary-text, #334155)',
            border: '1.5px solid var(--ds-btn-secondary-border, #CBD5E1)',
            boxShadow: 'var(--ds-shadow-xs, 0 1px 2px rgba(0,0,0,0.05))'
        },
        dark: {
            backgroundColor: 'var(--ds-btn-dark-bg, #0F172A)',
            color: 'var(--ds-btn-dark-text, #FFFFFF)',
            border: 'none',
            boxShadow: '0 2px 8px rgba(15, 23, 42, 0.25)'
        },
        danger: {
            backgroundColor: 'var(--ds-status-danger-bg, #FEF2F2)',
            color: 'var(--ds-status-danger-text, #B91C1C)',
            border: '1.5px solid var(--ds-status-danger-border, #FECACA)'
        },
        ghost: {
            backgroundColor: 'transparent',
            color: 'var(--ds-text-secondary, #475569)',
            border: 'none'
        }
    };

    const currentSize = sizeStyles[size] || sizeStyles.md;
    const currentVariant = variantStyles[variant] || variantStyles.primary;

    return (
        <button
            type={type}
            onClick={onClick}
            disabled={disabled || loading}
            className={`ds-button ds-button-${variant} ${className}`}
            style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 700,
                cursor: disabled || loading ? 'not-allowed' : 'pointer',
                opacity: disabled ? 0.6 : 1,
                transition: 'all var(--ds-transition-fast, 0.15s ease)',
                whiteSpace: 'nowrap',
                userSelect: 'none',
                ...currentSize,
                ...currentVariant,
                ...style
            }}
            {...props}
        >
            {loading ? (
                <Loader2 size={15} className="animate-spin" style={{ animation: 'spin 1s linear infinite' }} />
            ) : (
                renderIcon(Icon, size === 'sm' ? 14 : 16)
            )}

            {children}

            {!loading && renderIcon(IconRight, size === 'sm' ? 14 : 16)}
        </button>
    );
};

export default Button;
