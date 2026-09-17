import React from 'react';
import { Award, Shield } from 'lucide-react';

/**
 * RankBadge: Cadre insignia chip consistent with Douloid OS and Student Portal.
 * - Shadow Douloid: Slate Gray
 * - Basic Douloid: Cyan / Blue
 * - Intermediate Douloid: Teal / Emerald
 * - Lead Douloid: Amber / Gold
 */
export default function RankBadge({ rank, showIcon = true }) {
    const r = (rank || 'None').trim();

    let bg = '#F3F4F6';
    let text = '#4B5563';
    let border = '#E5E7EB';
    let label = r;

    if (r === 'Lead Douloid' || r === 'Lead Facilitator' || r === 'Lead') {
        bg = '#FEF3C7';
        text = '#B45309';
        border = '#FDE68A';
        label = 'Lead Facilitator';
    } else if (r === 'Intermediate Douloid' || r === 'Intermediate Facilitator' || r === 'Intermediate') {
        bg = '#E0F2FE';
        text = '#0284C7';
        border = '#BAE6FD';
        label = 'Intermediate Facilitator';
    } else if (r === 'Basic Douloid' || r === 'Basic Facilitator' || r === 'Basic') {
        bg = '#E0E7FF';
        text = '#4338CA';
        border = '#C7D2FE';
        label = 'Basic Facilitator';
    } else if (r === 'Shadow Douloid' || r === 'Shadow Facilitator' || r === 'Shadow') {
        bg = '#F3E8FF';
        text = '#7E22CE';
        border = '#E9D5FF';
        label = 'Shadow Facilitator';
    } else if (r.toLowerCase().includes('lead')) {
        bg = '#FEF3C7';
        text = '#B45309';
        border = '#FDE68A';
        label = 'Lead Facilitator';
    } else if (r.toLowerCase().includes('intermediate')) {
        bg = '#E0F2FE';
        text = '#0284C7';
        border = '#BAE6FD';
        label = 'Intermediate Facilitator';
    } else if (r.toLowerCase().includes('basic')) {
        bg = '#E0E7FF';
        text = '#4338CA';
        border = '#C7D2FE';
        label = 'Basic Facilitator';
    } else if (r.toLowerCase().includes('shadow')) {
        bg = '#F3E8FF';
        text = '#7E22CE';
        border = '#E9D5FF';
        label = 'Shadow Facilitator';
    } else if (r === 'None' || !r) {
        bg = '#F9FAFB';
        text = '#9CA3AF';
        border = '#E5E7EB';
        label = 'Douloid';
    }

    return (
        <span
            style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem',
                padding: '0.22rem 0.65rem',
                borderRadius: '6px',
                backgroundColor: bg,
                color: text,
                border: `1px solid ${border}`,
                fontSize: '0.72rem',
                fontWeight: 800,
                letterSpacing: '0.3px',
                whiteSpace: 'nowrap'
            }}
            title={`Cadre Rank: ${rank || 'Douloid'}`}
        >
            {showIcon && <Award size={12} style={{ opacity: 0.85 }} />}
            {label}
        </span>
    );
}
