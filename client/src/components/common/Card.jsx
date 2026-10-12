import React from 'react';
import { renderIcon } from './iconHelper';

/**
 * Shared Doulos Design System: Card & PageHeader
 * - PageHeader: Clean e-commerce title, description, actions slot
 * - Card: Floating surface container with header, body, footer slots
 * - StatCard: KPI metric card with icon badge and progress/trend indicator
 */

export const PageHeader = ({
    title,
    description,
    badge,
    actions,
    breadcrumbs,
    className = '',
    style = {}
}) => {
    return (
        <div 
            className={`ds-page-header ${className}`}
            style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                flexWrap: 'wrap',
                gap: '1rem',
                marginBottom: '1.75rem',
                ...style
            }}
        >
            <div>
                {breadcrumbs && (
                    <div style={{ fontSize: '0.74rem', color: 'var(--ds-text-muted)', marginBottom: '0.35rem', fontWeight: 600 }}>
                        {breadcrumbs}
                    </div>
                )}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                    <h1 style={{
                        fontSize: '1.5rem',
                        fontWeight: 800,
                        color: 'var(--ds-text-primary)',
                        margin: 0,
                        letterSpacing: '-0.02em',
                        lineHeight: 1.2
                    }}>
                        {title}
                    </h1>
                    {badge}
                </div>
                {description && (
                    <p style={{
                        fontSize: '0.86rem',
                        color: 'var(--ds-text-secondary)',
                        margin: '0.35rem 0 0',
                        maxWidth: '680px',
                        lineHeight: 1.5
                    }}>
                        {description}
                    </p>
                )}
            </div>

            {actions && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                    {actions}
                </div>
            )}
        </div>
    );
};

export const Card = ({
    children,
    title,
    subtitle,
    actions,
    footer,
    padding = '1.5rem',
    className = '',
    style = {}
}) => {
    return (
        <div
            className={`ds-card ${className}`}
            style={{
                backgroundColor: 'var(--ds-surface, #FFFFFF)',
                borderRadius: 'var(--ds-radius-lg, 16px)',
                border: '1px solid var(--ds-border, #E2E8F0)',
                boxShadow: 'var(--ds-shadow-sm, 0 1px 3px rgba(0,0,0,0.06))',
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
                ...style
            }}
        >
            {(title || actions) && (
                <div
                    style={{
                        padding: '1.25rem 1.5rem',
                        borderBottom: '1px solid var(--ds-border-subtle, #F1F5F9)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '1rem',
                        flexWrap: 'wrap'
                    }}
                >
                    <div>
                        {title && (
                            <h3 style={{
                                fontSize: '1.05rem',
                                fontWeight: 800,
                                color: 'var(--ds-text-primary)',
                                margin: 0
                            }}>
                                {title}
                            </h3>
                        )}
                        {subtitle && (
                            <p style={{
                                fontSize: '0.78rem',
                                color: 'var(--ds-text-muted)',
                                margin: '0.2rem 0 0'
                            }}>
                                {subtitle}
                            </p>
                        )}
                    </div>
                    {actions && <div>{actions}</div>}
                </div>
            )}

            <div style={{ padding, flex: 1 }}>
                {children}
            </div>

            {footer && (
                <div
                    style={{
                        padding: '0.85rem 1.5rem',
                        borderTop: '1px solid var(--ds-border-subtle, #F1F5F9)',
                        backgroundColor: 'var(--ds-surface-subtle, #F8FAFC)'
                    }}
                >
                    {footer}
                </div>
            )}
        </div>
    );
};

export const StatCard = ({
    title,
    value,
    subtitle,
    icon: Icon,
    trend,
    trendLabel,
    color = 'primary'
}) => {
    const iconColors = {
        primary: { bg: '#EFF6FF', text: '#1D4ED8' },
        success: { bg: '#ECFDF5', text: '#047857' },
        warning: { bg: '#FFFBEB', text: '#B45309' },
        danger: { bg: '#FEF2F2', text: '#B91C1C' }
    };

    const scheme = iconColors[color] || iconColors.primary;

    return (
        <div
            style={{
                backgroundColor: 'var(--ds-surface, #FFFFFF)',
                borderRadius: 'var(--ds-radius-lg, 16px)',
                border: '1px solid var(--ds-border, #E2E8F0)',
                padding: '1.25rem 1.5rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.75rem',
                boxShadow: 'var(--ds-shadow-xs, 0 1px 2px rgba(0,0,0,0.05))'
            }}
        >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{
                    fontSize: '0.74rem',
                    fontWeight: 800,
                    textTransform: 'uppercase',
                    letterSpacing: '0.6px',
                    color: 'var(--ds-text-muted)'
                }}>
                    {title}
                </span>
                {Icon && (
                    <div style={{
                        width: '34px',
                        height: '34px',
                        borderRadius: 'var(--ds-radius-md, 10px)',
                        backgroundColor: scheme.bg,
                        color: scheme.text,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}>
                        {renderIcon(Icon, 18)}
                    </div>
                )}
            </div>

            <div style={{
                fontSize: '1.75rem',
                fontWeight: 900,
                color: 'var(--ds-text-primary)',
                lineHeight: 1
            }}>
                {value}
            </div>

            {(subtitle || trend) && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.78rem' }}>
                    {trend && (
                        <span style={{
                            fontWeight: 800,
                            color: trend > 0 ? '#059669' : '#DC2626'
                        }}>
                            {trend > 0 ? `+${trend}%` : `${trend}%`}
                        </span>
                    )}
                    <span style={{ color: 'var(--ds-text-muted)' }}>
                        {trendLabel || subtitle}
                    </span>
                </div>
            )}
        </div>
    );
};

export default Card;
