import React from 'react';

/**
 * Universal safe icon renderer for Doulos design system.
 * Gracefully handles:
 * - Lucide forwardRef components: { $$typeof: Symbol(react.forward_ref), render: ... }
 * - Function components: () => <svg ... />
 * - Already-instantiated JSX elements: <Activity size={20} />
 * - null / undefined
 */
export const renderIcon = (icon, defaultSize = 16, extraProps = {}) => {
    if (!icon) return null;

    // 1. If it's already an instantiated React element:
    if (React.isValidElement(icon) || (typeof icon === 'object' && 'props' in icon && 'type' in icon)) {
        return icon;
    }

    // 2. If it's a component (function or forwardRef / memo object with render / $$typeof):
    if (typeof icon === 'function' || (typeof icon === 'object' && ('render' in icon || '$$typeof' in icon))) {
        const IconComponent = icon;
        return <IconComponent size={defaultSize} {...extraProps} />;
    }

    return null;
};

export default renderIcon;
