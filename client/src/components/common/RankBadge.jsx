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

    if (r.toLowerCase().includes('lead')) {
        bg = '#FEF3C7';
        text = '#B45309';
        border = '#FDE68A';
        label = 'Lead';
    } else if (r.toLowerCase().includes('intermediate')) {
        bg = '#CCFBF1';
        text = '#0D9488';
        border = '#99F6E4';
        label = 'Intermediate';
    } else if (r.toLowerCase().includes('basic')) {
        bg = '#E0F2FE';
        text = '#0284C7';
        border = '#BAE6FD';
        label = 'Basic';
    } else if (r.toLowerCase().includes('shadow')) {
        bg = '#F1F5F9';
        text = '#64748B';
        border = '#E2E8F0';
        label = 'Shadow';
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
