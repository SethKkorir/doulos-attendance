import React from 'react';
import { Inbox } from 'lucide-react';

export const EmptyState = ({
    icon: Icon = Inbox,
    title = 'No Records Found',
    description = 'There are no active records in this view right now.',
    actionLabel,
    onAction
}) => (
    <div style={{
        background: '#F8FAFC',
        border: '1.5px dashed #CBD5E1',
        borderRadius: '16px',
        padding: '2.5rem 1.5rem',
        textAlign: 'center',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '0.65rem',
        margin: '1.25rem 0'
    }}>
        <div style={{
            width: '48px',
            height: '48px',
            borderRadius: '14px',
            background: '#EFF6FF',
            color: '#1D4ED8',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
        }}>
            <Icon size={24} />
        </div>
        <div>
            <h4 style={{ margin: '0 0 0.25rem 0', color: '#0F172A', fontSize: '0.96rem', fontWeight: 800 }}>
                {title}
            </h4>
            <p style={{ margin: 0, color: '#64748B', fontSize: '0.82rem', maxWidth: '420px', lineHeight: 1.5 }}>
                {description}
            </p>
        </div>
        {actionLabel && onAction && (
            <button
                type="button"
                onClick={onAction}
                style={{
                    marginTop: '0.65rem',
                    background: '#1D4ED8',
                    color: '#FFFFFF',
                    border: 'none',
                    borderRadius: '999px',
                    padding: '0.5rem 1.25rem',
                    fontSize: '0.82rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    boxShadow: '0 2px 8px rgba(29, 78, 216, 0.25)'
                }}
            >
                {actionLabel}
            </button>
        )}
    </div>
);

export default EmptyState;
