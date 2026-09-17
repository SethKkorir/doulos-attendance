import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

export const ErrorState = ({
    title = 'Unable to Load Data',
    message = 'We encountered a momentary issue retrieving this data from the server.',
    onRetry
}) => (
    <div style={{
        background: '#FEF2F2',
        border: '1.5px solid #FECACA',
        borderRadius: '16px',
        padding: '1.75rem',
        textAlign: 'center',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '0.75rem',
        margin: '1rem 0'
    }}>
        <div style={{
            width: '44px',
            height: '44px',
            borderRadius: '50%',
            background: '#FEE2E2',
            color: '#DC2626',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
        }}>
            <AlertCircle size={24} />
        </div>
        <div>
            <h4 style={{ margin: '0 0 0.35rem 0', color: '#991B1B', fontSize: '1rem', fontWeight: 800 }}>
                {title}
            </h4>
            <p style={{ margin: 0, color: '#B91C1C', fontSize: '0.84rem', maxWidth: '440px', lineHeight: 1.5 }}>
                {message}
            </p>
        </div>
        {onRetry && (
            <button
                type="button"
                onClick={onRetry}
                style={{
                    marginTop: '0.5rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.45rem',
                    background: '#DC2626',
                    color: '#FFFFFF',
                    border: 'none',
                    borderRadius: '999px',
                    padding: '0.45rem 1.15rem',
                    fontSize: '0.82rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    boxShadow: '0 2px 6px rgba(220, 38, 38, 0.25)'
                }}
            >
                <RefreshCw size={14} /> Retry Connection
            </button>
        )}
    </div>
);

export default ErrorState;
