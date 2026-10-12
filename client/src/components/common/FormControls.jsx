import React from 'react';
import { renderIcon } from './iconHelper';

/**
 * Shared Doulos Design System: Form Controls
 * - Input: Standard styled text input
 * - Select: Styled dropdown
 * - Textarea: Multi-line editor
 * - FormGroup: Label, description, validation error wrapper
 */

export const FormGroup = ({
    label,
    description,
    error,
    required = false,
    children,
    style = {}
}) => {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', ...style }}>
            {label && (
                <label style={{
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    color: 'var(--ds-text-secondary, #475569)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.25rem'
                }}>
                    {label}
                    {required && <span style={{ color: '#EF4444' }}>*</span>}
                </label>
            )}

            {children}

            {description && !error && (
                <span style={{ fontSize: '0.74rem', color: 'var(--ds-text-muted, #64748B)' }}>
                    {description}
                </span>
            )}

            {error && (
                <span style={{ fontSize: '0.74rem', color: '#DC2626', fontWeight: 600 }}>
                    {error}
                </span>
            )}
        </div>
    );
};

export const Input = ({
    value,
    onChange,
    placeholder,
    type = 'text',
    disabled = false,
    error,
    icon: Icon,
    className = '',
    style = {},
    ...props
}) => {
    return (
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center', width: '100%' }}>
            {Icon && (
                <div style={{
                    position: 'absolute',
                    left: '0.85rem',
                    color: 'var(--ds-text-muted, #94A3B8)',
                    display: 'flex',
                    alignItems: 'center',
                    pointerEvents: 'none'
                }}>
                    {renderIcon(Icon, 16)}
                </div>
            )}
            <input
                type={type}
                value={value}
                onChange={onChange}
                placeholder={placeholder}
                disabled={disabled}
                style={{
                    width: '100%',
                    height: '42px',
                    padding: Icon ? '0 0.85rem 0 2.4rem' : '0 0.85rem',
                    borderRadius: 'var(--ds-radius-md, 10px)',
                    border: `1.5px solid ${error ? '#EF4444' : 'var(--ds-border, #CBD5E1)'}`,
                    backgroundColor: 'var(--ds-surface, #FFFFFF)',
                    color: 'var(--ds-text-primary, #0F172A)',
                    fontSize: '0.86rem',
                    fontWeight: 500,
                    outline: 'none',
                    transition: 'border-color 0.15s ease, box-shadow 0.15s ease',
                    boxSizing: 'border-box',
                    ...style
                }}
                onFocus={e => {
                    if (!error) {
                        e.target.style.borderColor = 'var(--ds-primary, #1D4ED8)';
                        e.target.style.boxShadow = '0 0 0 3px var(--ds-primary-glow, rgba(29, 78, 216, 0.15))';
                    }
                }}
                onBlur={e => {
                    if (!error) {
                        e.target.style.borderColor = 'var(--ds-border, #CBD5E1)';
                        e.target.style.boxShadow = 'none';
                    }
                }}
                {...props}
            />
        </div>
    );
};

export const Select = ({
    value,
    onChange,
    options = [],
    disabled = false,
    error,
    style = {},
    children,
    ...props
}) => {
    return (
        <select
            value={value}
            onChange={onChange}
            disabled={disabled}
            style={{
                width: '100%',
                height: '42px',
                padding: '0 0.85rem',
                borderRadius: 'var(--ds-radius-md, 10px)',
                border: `1.5px solid ${error ? '#EF4444' : 'var(--ds-border, #CBD5E1)'}`,
                backgroundColor: 'var(--ds-surface, #FFFFFF)',
                color: 'var(--ds-text-primary, #0F172A)',
                fontSize: '0.86rem',
                fontWeight: 600,
                outline: 'none',
                boxSizing: 'border-box',
                cursor: 'pointer',
                ...style
            }}
            {...props}
        >
            {options.length > 0
                ? options.map(opt => (
                    <option key={opt.value} value={opt.value}>
                        {opt.label}
                    </option>
                ))
                : children}
        </select>
    );
};

export default Input;
