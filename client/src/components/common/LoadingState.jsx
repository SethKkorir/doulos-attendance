import React from 'react';
import { Loader2 } from 'lucide-react';
import {
    StatCardSkeleton,
    TableRowSkeleton,
    CardSkeleton,
    ListSkeleton
} from './SkeletonLoader';

/**
 * Shared Doulos Design System: LoadingState
 * - variant 'spinner': Centered pulsing loader
 * - variant 'table': Table rows skeleton
 * - variant 'card': Card layout skeleton
 * - variant 'stat': KPI stat cards grid skeleton
 */

export const LoadingState = ({
    variant = 'spinner', // 'spinner' | 'table' | 'card' | 'stat' | 'list'
    message = 'Loading records from database...',
    count = 4,
    columns = 5,
    style = {}
}) => {
    if (variant === 'table') {
        return (
            <tbody>
                {Array.from({ length: count }).map((_, i) => (
                    <TableRowSkeleton key={i} columns={columns} />
                ))}
            </tbody>
        );
    }

    if (variant === 'card') {
        return (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem', ...style }}>
                {Array.from({ length: count }).map((_, i) => (
                    <CardSkeleton key={i} />
                ))}
            </div>
        );
    }

    if (variant === 'stat') {
        return (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', ...style }}>
                {Array.from({ length: count }).map((_, i) => (
                    <StatCardSkeleton key={i} />
                ))}
            </div>
        );
    }

    if (variant === 'list') {
        return <ListSkeleton count={count} />;
    }

    // Default: Clean centered spinner
    return (
        <div style={{
            padding: '3.5rem 1.5rem',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.85rem',
            ...style
        }}>
            <div style={{
                width: '38px',
                height: '38px',
                borderRadius: '50%',
                border: '3px solid var(--ds-primary-light, #EFF6FF)',
                borderTopColor: 'var(--ds-primary, #1D4ED8)',
                animation: 'spin 0.8s linear infinite'
            }} />
            <span style={{ fontSize: '0.84rem', color: 'var(--ds-text-muted, #64748B)', fontWeight: 600 }}>
                {message}
            </span>
        </div>
    );
};

export default LoadingState;
