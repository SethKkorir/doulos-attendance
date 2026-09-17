import React from 'react';

export const StatCardSkeleton = () => (
    <div style={{
        background: '#FFFFFF',
        borderRadius: '16px',
        padding: '1.25rem 1.35rem',
        border: '1px solid #E2E8F0',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.65rem',
        boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
        animation: 'g-pulse 1.5s infinite ease-in-out'
    }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ width: '45%', height: '14px', background: '#E2E8F0', borderRadius: '4px' }} />
            <div style={{ width: '32px', height: '32px', background: '#E2E8F0', borderRadius: '8px' }} />
        </div>
        <div style={{ width: '35%', height: '30px', background: '#E2E8F0', borderRadius: '6px' }} />
        <div style={{ width: '60%', height: '12px', background: '#F1F5F9', borderRadius: '4px' }} />
    </div>
);

export const TableRowSkeleton = ({ columns = 5 }) => (
    <tr style={{ animation: 'g-pulse 1.5s infinite ease-in-out' }}>
        {Array.from({ length: columns }).map((_, i) => (
            <td key={i} style={{ padding: '1rem', borderBottom: '1px solid #E2E8F0' }}>
                <div style={{
                    height: '14px',
                    background: '#F1F5F9',
                    borderRadius: '4px',
                    width: i === 0 ? '70%' : i === 1 ? '50%' : '80%'
                }} />
            </td>
        ))}
    </tr>
);

export const CardSkeleton = ({ height = 140 }) => (
    <div style={{
        background: '#FFFFFF',
        borderRadius: '16px',
        padding: '1.25rem',
        border: '1px solid #E2E8F0',
        height: `${height}px`,
        boxSizing: 'border-box',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.85rem',
        animation: 'g-pulse 1.5s infinite ease-in-out'
    }}>
        <div style={{ width: '30%', height: '18px', background: '#E2E8F0', borderRadius: '4px' }} />
        <div style={{ width: '80%', height: '14px', background: '#F1F5F9', borderRadius: '4px' }} />
        <div style={{ width: '60%', height: '14px', background: '#F1F5F9', borderRadius: '4px' }} />
    </div>
);

export const ListSkeleton = ({ count = 3 }) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {Array.from({ length: count }).map((_, i) => (
            <div key={i} style={{
                background: '#FFFFFF',
                borderRadius: '12px',
                padding: '1rem 1.25rem',
                border: '1px solid #E2E8F0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                animation: 'g-pulse 1.5s infinite ease-in-out'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1 }}>
                    <div style={{ width: '36px', height: '36px', borderRadius: '999px', background: '#E2E8F0' }} />
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', flex: 1 }}>
                        <div style={{ width: '40%', height: '14px', background: '#E2E8F0', borderRadius: '4px' }} />
                        <div style={{ width: '25%', height: '11px', background: '#F1F5F9', borderRadius: '4px' }} />
                    </div>
                </div>
                <div style={{ width: '80px', height: '28px', background: '#E2E8F0', borderRadius: '8px' }} />
            </div>
        ))}
    </div>
);

export default {
    StatCardSkeleton,
    TableRowSkeleton,
    CardSkeleton,
    ListSkeleton
};
