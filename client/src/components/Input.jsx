import React from 'react';

const Input = ({
    label,
    type = 'text',
    value,
    onChange,
    placeholder = '',
    name,
    required = false
}) => {
    const containerStyle = {
        marginBottom: 'var(--spacing-md)',
        display: 'flex',
        flexDirection: 'column',
        textAlign: 'left',
    };

    const labelStyle = {
        marginBottom: '0.5rem',
        color: 'var(--text-secondary)',
        fontSize: '0.9rem',
        fontWeight: '500',
    };

    const inputStyle = {
        background: 'rgba(15, 23, 42, 0.6)',
        border: '1px solid var(--text-secondary)',
        borderRadius: 'var(--radius-md)',
        padding: '0.75rem',
        color: 'var(--text-primary)',
        fontSize: '1rem',
        outline: 'none',
        transition: 'border-color var(--transition-fast)',
        width: '100%',
    };

    return (
        <div style={containerStyle}>
            {label && <label htmlFor={name} style={labelStyle}>{label}</label>}
            <input
                id={name}
                name={name}
                type={type}
                value={value}
                onChange={onChange}
                placeholder={placeholder}
                required={required}
                style={inputStyle}
                onFocus={(e) => e.target.style.borderColor = 'var(--accent-gold)'}
                onBlur={(e) => e.target.style.borderColor = 'var(--text-secondary)'}
            />
        </div>
    );
};

export default Input;
