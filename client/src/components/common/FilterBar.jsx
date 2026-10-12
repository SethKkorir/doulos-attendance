import React from 'react';
import { Search, X, Filter } from 'lucide-react';
import Button from './Button';

/**
 * Shared Doulos Design System: SearchBar & FilterBar
 * - SearchBar: Pill shaped search input with clear button & icon
 * - FilterBar: Grouped filter controls matching e-commerce secondary bar
 */

export const SearchBar = ({
    value,
    onChange,
    onClear,
    placeholder = 'Search name, reg...',
    width = '240px',
    className = '',
    style = {}
}) => {
    return (
        <div
            className={`ds-search-bar ${className}`}
            style={{
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
                width,
                maxWidth: '100%',
                ...style
            }}
        >
            <div style={{
                position: 'absolute',
                left: '0.85rem',
                color: 'var(--ds-text-placeholder, #94A3B8)',
                display: 'flex',
                alignItems: 'center',
                pointerEvents: 'none'
            }}>
                <Search size={15} />
            </div>

            <input
                type="text"
                value={value}
                onChange={onChange}
                placeholder={placeholder}
                style={{
                    width: '100%',
                    height: '38px',
                    padding: '0 2rem 0 2.25rem',
                    borderRadius: 'var(--ds-radius-pill, 999px)',
                    border: '1.5px solid var(--ds-border, #CBD5E1)',
                    backgroundColor: 'var(--ds-surface, #FFFFFF)',
                    color: 'var(--ds-text-primary, #0F172A)',
                    fontSize: '0.84rem',
                    fontWeight: 500,
                    outline: 'none',
                    transition: 'all 0.15s ease',
                    boxSizing: 'border-box'
                }}
                onFocus={e => {
                    e.target.style.borderColor = 'var(--ds-primary, #1D4ED8)';
                    e.target.style.boxShadow = '0 0 0 3px var(--ds-primary-glow, rgba(29, 78, 216, 0.15))';
                }}
                onBlur={e => {
                    e.target.style.borderColor = 'var(--ds-border, #CBD5E1)';
                    e.target.style.boxShadow = 'none';
                }}
            />

            {value && (
                <button
                    type="button"
                    onClick={onClear}
                    style={{
                        position: 'absolute',
                        right: '0.75rem',
                        background: 'transparent',
                        border: 'none',
                        color: 'var(--ds-text-muted, #94A3B8)',
                        cursor: 'pointer',
                        padding: '2px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}
                >
                    <X size={14} />
                </button>
            )}
        </div>
    );
};

export const FilterBar = ({
    searchValue,
    onSearchChange,
    onSearchClear,
    searchPlaceholder,
    filters = [], // Array of { id, label, value, options: [{ label, value }], onChange }
    activeCount = 0,
    onReset,
    actions,
    className = '',
    style = {}
}) => {
    return (
        <div
            className={`ds-filter-bar ${className}`}
            style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '0.85rem',
                marginBottom: '1.25rem',
                ...style
            }}
        >
            {/* Left side: Search & Select dropdowns */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap', flex: 1 }}>
                {onSearchChange && (
                    <SearchBar
                        value={searchValue}
                        onChange={onSearchChange}
                        onClear={onSearchClear}
                        placeholder={searchPlaceholder}
                    />
                )}

                {filters.map((f) => (
                    <select
                        key={f.id}
                        value={f.value}
                        onChange={e => f.onChange(e.target.value)}
                        style={{
                            height: '38px',
                            padding: '0 0.85rem',
                            borderRadius: 'var(--ds-radius-md, 10px)',
                            border: '1.5px solid var(--ds-border, #CBD5E1)',
                            backgroundColor: 'var(--ds-surface, #FFFFFF)',
                            color: 'var(--ds-text-primary, #0F172A)',
                            fontSize: '0.82rem',
                            fontWeight: 600,
                            outline: 'none',
                            cursor: 'pointer'
                        }}
                    >
                        {f.options.map(opt => (
                            <option key={opt.value} value={opt.value}>
                                {opt.label}
                            </option>
                        ))}
                    </select>
                ))}

                {activeCount > 0 && onReset && (
                    <button
                        type="button"
                        onClick={onReset}
                        style={{
                            background: 'transparent',
                            border: 'none',
                            color: 'var(--ds-primary, #1D4ED8)',
                            fontSize: '0.78rem',
                            fontWeight: 700,
                            cursor: 'pointer',
                            textDecoration: 'underline',
                            padding: '0 0.25rem'
                        }}
                    >
                        Reset ({activeCount})
                    </button>
                )}
            </div>

            {/* Right side: Action buttons (Export, Add, etc.) */}
            {actions && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexWrap: 'wrap' }}>
                    {actions}
                </div>
            )}
        </div>
    );
};

export default FilterBar;
