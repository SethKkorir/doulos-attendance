import React from 'react';
import { X } from 'lucide-react';

/**
 * Shared Doulos Design System: Modal
 * - Backdrop with blur
 * - High-contrast accessible header
 * - Flexible body with scroll containment
 * - Action footer
 */

export const Modal = ({
    isOpen = false,
    onClose,
    title,
    subtitle,
    children,
    footer,
    maxWidth = '540px',
    className = ''
}) => {
    if (!isOpen) return null;

    return (
        <div 
            className={`ds-modal-backdrop ${className}`}
            onClick={onClose}
        >
            <div
                className="ds-modal"
                style={{ maxWidth }}
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="ds-modal-header">
                    <div>
                        {title && (
                            <h3 style={{
                                margin: 0,
                                fontSize: '1.2rem',
                                fontWeight: 800,
                                color: 'var(--ds-text-primary)'
                            }}>
                                {title}
                            </h3>
                        )}
                        {subtitle && (
                            <p style={{
                                margin: '0.25rem 0 0',
                                fontSize: '0.8rem',
                                color: 'var(--ds-text-muted)'
                            }}>
                                {subtitle}
                            </p>
                        )}
                    </div>
                    {onClose && (
                        <button
                            type="button"
                            onClick={onClose}
                            style={{
                                background: 'transparent',
                                border: 'none',
                                color: 'var(--ds-text-muted)',
                                cursor: 'pointer',
                                padding: '4px',
                                borderRadius: '6px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                            }}
                        >
                            <X size={18} />
                        </button>
                    )}
                </div>

                {/* Body */}
                <div className="ds-modal-body">
                    {children}
                </div>

                {/* Footer */}
                {footer && (
                    <div className="ds-modal-footer">
                        {footer}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Modal;
