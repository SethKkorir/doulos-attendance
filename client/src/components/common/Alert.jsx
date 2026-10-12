import React from 'react';
import { CheckCircle2, AlertTriangle, AlertCircle, Info, X } from 'lucide-react';
import { renderIcon } from './iconHelper';

/**
 * Shared Doulos Design System: Alert & Toast
 * - Alert: Inline banner notification
 * - Toast: Floating ephemeral notification
 */

export const Alert = ({
    type = 'info', // 'success' | 'warning' | 'error' | 'info'
    variant,
    title,
    message,
    children,
    action,
    onClose,
    className = '',
    style = {}
}) => {
    const config = {
        success: {
            bg: 'var(--ds-status-success-bg, #ECFDF5)',
            border: 'var(--ds-status-success-border, #A7F3D0)',
            text: 'var(--ds-status-success-text, #047857)',
            icon: CheckCircle2
        },
        warning: {
            bg: 'var(--ds-status-warning-bg, #FFFBEB)',
            border: 'var(--ds-status-warning-border, #FDE68A)',
            text: 'var(--ds-status-warning-text, #B45309)',
            icon: AlertTriangle
        },
        error: {
            bg: 'var(--ds-status-danger-bg, #FEF2F2)',
            border: 'var(--ds-status-danger-border, #FECACA)',
            text: 'var(--ds-status-danger-text, #B91C1C)',
            icon: AlertCircle
        },
        info: {
            bg: 'var(--ds-status-info-bg, #EFF6FF)',
            border: 'var(--ds-status-info-border, #BFDBFE)',
            text: 'var(--ds-status-info-text, #1D4ED8)',
            icon: Info
        }
    };

    const alertType = variant || type;
    const current = config[alertType] || (alertType === 'danger' ? config.error : config.info);
    const Icon = current.icon;

    return (
        <div
            className={`ds-alert ds-alert-${alertType} ${className}`}
            style={{
                backgroundColor: current.bg,
                border: `1.5px solid ${current.border}`,
                color: current.text,
                borderRadius: 'var(--ds-radius-md, 10px)',
                padding: '0.85rem 1.15rem',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '0.75rem',
                fontSize: '0.86rem',
                lineHeight: 1.45,
                position: 'relative',
                ...style
            }}
        >
            {renderIcon(Icon, 18, { style: { flexShrink: 0, marginTop: '2px' } })}
            <div style={{ flex: 1 }}>
                {title && (
                    <div style={{ fontWeight: 800, marginBottom: '0.2rem' }}>
                        {title}
                    </div>
                )}
                <div>{message || children}</div>
                {action && (
                    <div style={{ marginTop: '0.65rem' }}>
                        {action}
                    </div>
                )}
            </div>
            {onClose && (
                <button
                    type="button"
                    onClick={onClose}
                    style={{
                        background: 'transparent',
                        border: 'none',
                        color: current.text,
                        cursor: 'pointer',
                        padding: 0,
                        opacity: 0.7,
                        display: 'flex',
                        alignItems: 'center'
                    }}
                    onMouseEnter={e => e.currentTarget.style.opacity = '1'}
                    onMouseLeave={e => e.currentTarget.style.opacity = '0.7'}
                >
                    <X size={16} />
                </button>
            )}
        </div>
    );
};

export const Toast = ({
    message,
    type = 'info',
    variant,
    onClose,
    duration = 4000
}) => {
    const toastType = variant || type;

    React.useEffect(() => {
        if (!duration || !onClose) return;
        const timer = setTimeout(() => {
            onClose();
        }, duration);
        return () => clearTimeout(timer);
    }, [duration, onClose]);

    if (!message) return null;

    const icons = {
        success: <CheckCircle2 size={18} color="#10B981" />,
        warning: <AlertTriangle size={18} color="#F59E0B" />,
        error: <AlertCircle size={18} color="#EF4444" />,
        info: <Info size={18} color="#1D4ED8" />
    };

    return (
        <div className={`ds-toast ${toastType}`}>
            {icons[toastType] || icons.info}
            <span style={{ flex: 1 }}>{message}</span>
            {onClose && (
                <button
                    type="button"
                    onClick={onClose}
                    style={{
                        background: 'transparent',
                        border: 'none',
                        cursor: 'pointer',
                        color: 'var(--ds-text-muted)',
                        padding: 0
                    }}
                >
                    <X size={15} />
                </button>
            )}
        </div>
    );
};

export default Alert;
