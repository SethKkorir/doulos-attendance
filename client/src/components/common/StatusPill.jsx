import React from 'react';

/**
 * StatusPill component matching the reference design:
 * Active = light green (#E4F6E9 / #3CB371)
 * Recruit = light amber (#FEF3C7 / #D97706)
 * Inactive / Probation = light red (#FBE7E7 / #D9534F)
 * Archived = light gray
 */
export default function StatusPill({ status }) {
    const s = (status || 'Active').toLowerCase();

    let bg = 'var(--color-status-active-bg, #E4F6E9)';
    let text = 'var(--color-status-active-text, #3CB371)';
    let label = status || 'Active';

    if (s.includes('recruit')) {
        bg = 'var(--color-status-recruit-bg, #FEF3C7)';
        text = 'var(--color-status-recruit-text, #D97706)';
        label = 'Recruit';
    } else if (s.includes('inactive') || s.includes('blocked')) {
        bg = 'var(--color-status-inactive-bg, #FBE7E7)';
        text = 'var(--color-status-inactive-text, #D9534F)';
        label = 'Inactive';
    } else if (s.includes('probation')) {
        bg = 'var(--color-status-probation-bg, #FEE2E2)';
        text = 'var(--color-status-probation-text, #DC2626)';
        label = 'Probation';
    } else if (s.includes('archive')) {
        bg = 'var(--color-status-archived-bg, #F3F4F6)';
        text = 'var(--color-status-archived-text, #6B7280)';
        label = 'Archived';
    } else if (s.includes('visitor')) {
        bg = 'rgba(167, 139, 250, 0.15)';
        text = '#8B5CF6';
        label = 'Visitor';
    }

    return (
        <span
            style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '0.28rem 0.85rem',
                borderRadius: 'var(--radius-pill, 999px)',
                backgroundColor: bg,
                color: text,
                fontSize: '0.74rem',
                fontWeight: 700,
                letterSpacing: '0.3px',
                textTransform: 'capitalize',
                whiteSpace: 'nowrap'
            }}
        >
            {label}
        </span>
    );
}
