import React from 'react';

/**
 * PrimaryButton: Filled purple (#4B3F8C) matching the reference "Add new" button
 */
export function PrimaryButton({ children, onClick, icon: Icon, disabled = false, style = {}, className = '', ...props }) {
    return (
        <button
            onClick={onClick}
            disabled={disabled}
            className={`doulos-btn-primary ${className}`}
            style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                backgroundColor: 'var(--color-button-primary-bg, #4B3F8C)',
                color: 'var(--color-button-primary-text, #FFFFFF)',
                padding: '0.6rem 1.25rem',
                borderRadius: 'var(--radius-button, 10px)',
                border: 'none',
                fontSize: '0.85rem',
                fontWeight: 700,
                cursor: disabled ? 'not-allowed' : 'pointer',
                opacity: disabled ? 0.65 : 1,
                boxShadow: '0 4px 14px rgba(75, 63, 140, 0.25)',
                transition: 'all 0.18s ease',
                whiteSpace: 'nowrap',
                ...style
            }}
            onMouseEnter={e => {
                if (!disabled) {
                    e.currentTarget.style.backgroundColor = 'var(--color-button-primary-hover, #3D3277)';
                    e.currentTarget.style.transform = 'translateY(-1px)';
                }
            }}
            onMouseLeave={e => {
                if (!disabled) {
                    e.currentTarget.style.backgroundColor = 'var(--color-button-primary-bg, #4B3F8C)';
                    e.currentTarget.style.transform = 'translateY(0)';
                }
            }}
            {...props}
        >
            {Icon && <Icon size={16} />}
            {children}
        </button>
    );
}

/**
 * OutlineButton: Outlined button with soft border matching reference "Import members", "Export members (Excel)", and "Filter"
 */
export function OutlineButton({ children, onClick, icon: Icon, disabled = false, active = false, style = {}, className = '', ...props }) {
    return (
        <button
            onClick={onClick}
            disabled={disabled}
            className={`doulos-btn-outline ${className}`}
            style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                backgroundColor: active ? '#F1EFFF' : '#FFFFFF',
                color: active ? 'var(--color-sidebar-bg, #4B3F8C)' : 'var(--color-button-outline-text, #4A4560)',
                padding: '0.58rem 1.15rem',
                borderRadius: 'var(--radius-button, 10px)',
                border: `1.5px solid ${active ? 'var(--color-sidebar-bg, #4B3F8C)' : 'var(--color-button-outline-border, #D1D1DB)'}`,
                fontSize: '0.84rem',
                fontWeight: 600,
                cursor: disabled ? 'not-allowed' : 'pointer',
                opacity: disabled ? 0.65 : 1,
                transition: 'all 0.18s ease',
                whiteSpace: 'nowrap',
                ...style
            }}
            onMouseEnter={e => {
                if (!disabled && !active) {
                    e.currentTarget.style.backgroundColor = '#F8F8FC';
                    e.currentTarget.style.borderColor = '#B8B5C8';
                }
            }}
            onMouseLeave={e => {
                if (!disabled && !active) {
                    e.currentTarget.style.backgroundColor = '#FFFFFF';
                    e.currentTarget.style.borderColor = 'var(--color-button-outline-border, #D1D1DB)';
                }
            }}
            {...props}
        >
            {Icon && <Icon size={15} style={{ opacity: 0.85 }} />}
            {children}
        </button>
    );
}

/**
 * DarkActionButton: Near-black purple (#2E2A4D) action pill matching reference's "Login" row action button
 */
export function DarkActionButton({ children = 'View Portal', onClick, icon: Icon, disabled = false, style = {}, ...props }) {
    return (
        <button
            onClick={onClick}
            disabled={disabled}
            style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.4rem',
                backgroundColor: 'var(--color-button-dark-bg, #2E2A4D)',
                color: 'var(--color-button-dark-text, #FFFFFF)',
                padding: '0.42rem 1.1rem',
                borderRadius: 'var(--radius-button, 10px)',
                border: 'none',
                fontSize: '0.78rem',
                fontWeight: 700,
                letterSpacing: '0.3px',
                cursor: disabled ? 'not-allowed' : 'pointer',
                transition: 'all 0.18s ease',
                whiteSpace: 'nowrap',
                boxShadow: '0 2px 6px rgba(46, 42, 77, 0.2)',
                ...style
            }}
            onMouseEnter={e => {
                if (!disabled) {
                    e.currentTarget.style.backgroundColor = 'var(--color-button-dark-hover, #1F1B38)';
                    e.currentTarget.style.transform = 'translateY(-1px)';
                }
            }}
            onMouseLeave={e => {
                if (!disabled) {
                    e.currentTarget.style.backgroundColor = 'var(--color-button-dark-bg, #2E2A4D)';
                    e.currentTarget.style.transform = 'translateY(0)';
                }
            }}
            {...props}
        >
            {Icon && <Icon size={13} />}
            {children}
        </button>
    );
}
