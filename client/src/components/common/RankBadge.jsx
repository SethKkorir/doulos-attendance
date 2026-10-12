import React from 'react';
import { Award } from 'lucide-react';

/**
 * Shared Doulos Design System: RankBadge
 * Authentic Doulos Cadre hierarchy badges:
 * - Shadow Douloid: Slate (#F1F5F9 / #475569)
 * - Basic Douloid: Indigo / Blue (#E0E7FF / #4338CA)
 * - Intermediate Douloid: Sky / Cyan (#E0F2FE / #0284C7)
 * - Lead Douloid: Amber / Gold (#FEF3C7 / #B45309)
 */

export const RankBadge = ({ rank, showIcon = true, className = '', style = {} }) => {
    const r = (rank || 'None').trim();

    let bg = 'var(--ds-rank-shadow-bg, #F1F5F9)';
    let text = 'var(--ds-rank-shadow-text, #475569)';
    let border = 'var(--ds-rank-shadow-border, #CBD5E1)';
    let label = r;

    if (r === 'Lead Douloid' || r === 'Lead Facilitator' || r === 'Lead' || r.toLowerCase().includes('lead')) {
        bg = 'var(--ds-rank-lead-bg, #FEF3C7)';
        text = 'var(--ds-rank-lead-text, #B45309)';
        border = 'var(--ds-rank-lead-border, #FDE68A)';
        label = 'Lead Facilitator';
    } else if (r === 'Intermediate Douloid' || r === 'Intermediate Facilitator' || r === 'Intermediate' || r.toLowerCase().includes('intermediate')) {
        bg = 'var(--ds-rank-intermediate-bg, #E0F2FE)';
        text = 'var(--ds-rank-intermediate-text, #0284C7)';
        border = 'var(--ds-rank-intermediate-border, #BAE6FD)';
        label = 'Intermediate Facilitator';
    } else if (r === 'Basic Douloid' || r === 'Basic Facilitator' || r === 'Basic' || r.toLowerCase().includes('basic')) {
        bg = 'var(--ds-rank-basic-bg, #E0E7FF)';
        text = 'var(--ds-rank-basic-text, #4338CA)';
        border = 'var(--ds-rank-basic-border, #C7D2FE)';
        label = 'Basic Facilitator';
    } else if (r === 'Shadow Douloid' || r === 'Shadow Facilitator' || r === 'Shadow' || r.toLowerCase().includes('shadow')) {
        bg = '#F3E8FF';
        text = '#7E22CE';
        border = '#E9D5FF';
        label = 'Shadow Facilitator';
    } else if (r === 'None' || !r) {
        bg = 'var(--ds-surface-subtle, #F8FAFC)';
        text = 'var(--ds-text-placeholder, #94A3B8)';
        border = 'var(--ds-border, #E2E8F0)';
        label = 'Douloid';
    }

    return (
        <span
            className={`ds-rank-badge ${className}`}
            style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem',
                padding: '0.22rem 0.65rem',
                borderRadius: 'var(--ds-radius-sm, 6px)',
                backgroundColor: bg,
                color: text,
                border: `1px solid ${border}`,
                fontSize: '0.72rem',
                fontWeight: 800,
                letterSpacing: '0.3px',
                whiteSpace: 'nowrap',
                ...style
            }}
            title={`Cadre Rank: ${rank || 'Douloid'}`}
        >
            {showIcon && <Award size={12} style={{ opacity: 0.85 }} />}
            {label}
        </span>
    );
};

export default RankBadge;
