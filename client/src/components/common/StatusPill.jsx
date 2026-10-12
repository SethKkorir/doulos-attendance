import React from 'react';

/**
 * Shared Doulos Design System: StatusPill
 * - Active: Emerald Green (#ECFDF5 / #047857)
 * - Recruit / Pending: Warm Amber (#FFFBEB / #B45309)
 * - Inactive / Blocked: Soft Red (#FEF2F2 / #B91C1C)
 * - Probation: Soft Red (#FEF2F2 / #B91C1C)
 * - Archived: Neutral Gray (#F1F5F9 / #475569)
 * - Visitor: Light Blue / Violet (#EFF6FF / #1D4ED8)
 */

export const StatusPill = ({
    status,
    label: explicitLabel,
    variant,
    size = 'md',
    children,
    className = '',
    style = {}
}) => {
    const rawText = explicitLabel || children || status || 'Active';
    const s = String(rawText).toLowerCase();

    const variants = {
        success: {
            bg: 'var(--ds-status-success-bg, #ECFDF5)',
            text: 'var(--ds-status-success-text, #047857)',
            border: 'var(--ds-status-success-border, #A7F3D0)'
        },
        warning: {
            bg: 'var(--ds-status-warning-bg, #FFFBEB)',
            text: 'var(--ds-status-warning-text, #B45309)',
            border: 'var(--ds-status-warning-border, #FDE68A)'
        },
        danger: {
            bg: 'var(--ds-status-danger-bg, #FEF2F2)',
            text: 'var(--ds-status-danger-text, #B91C1C)',
            border: 'var(--ds-status-danger-border, #FECACA)'
        },
        info: {
            bg: 'var(--ds-status-info-bg, #EFF6FF)',
            text: 'var(--ds-status-info-text, #1D4ED8)',
            border: 'var(--ds-status-info-border, #BFDBFE)'
        },
        primary: {
            bg: 'var(--ds-status-info-bg, #EFF6FF)',
            text: 'var(--ds-status-info-text, #1D4ED8)',
            border: 'var(--ds-status-info-border, #BFDBFE)'
        },
        neutral: {
            bg: 'var(--ds-status-neutral-bg, #F1F5F9)',
            text: 'var(--ds-status-neutral-text, #475569)',
            border: 'var(--ds-status-neutral-border, #E2E8F0)'
        },
        purple: {
            bg: '#F5F3FF',
            text: '#7C3AED',
            border: '#DDD6FE'
        }
    };

    let scheme = variant && variants[variant] ? variants[variant] : null;

    if (!scheme) {
        if (s.includes('active') || s.includes('connected') || s.includes('operational') || s.includes('accepted')) {
            scheme = variants.success;
        } else if (s.includes('recruit') || s.includes('pending') || s.includes('invited') || s.includes('warning') || s.includes('maintenance')) {
            scheme = variants.warning;
        } else if (s.includes('inactive') || s.includes('blocked') || s.includes('critical') || s.includes('probation') || s.includes('danger') || s.includes('suspended') || s.includes('disconnected')) {
            scheme = variants.danger;
        } else if (s.includes('visitor') || s.includes('admin') || s.includes('info')) {
            scheme = variants.info;
        } else {
            scheme = variants.neutral;
        }
    }

    const sizeStyles = {
        sm: {
            padding: '0.15rem 0.55rem',
            fontSize: '0.68rem',
            fontWeight: 800
        },
        md: {
            padding: '0.24rem 0.75rem',
            fontSize: '0.74rem',
            fontWeight: 700
        }
    };

    const currentSize = sizeStyles[size] || sizeStyles.md;

    return (
        <span
            className={`ds-status-pill ${className}`}
            style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: 'var(--ds-radius-pill, 999px)',
                backgroundColor: scheme.bg,
                color: scheme.text,
                border: `1px solid ${scheme.border}`,
                letterSpacing: '0.3px',
                whiteSpace: 'nowrap',
                ...currentSize,
                ...style
            }}
        >
            {rawText}
        </span>
    );
};

export default StatusPill;
