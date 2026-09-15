import React from 'react';

/**
 * DataTable: Generic, clean, responsive data table matching the reference design layout:
 * - Upper-case tracked small-caps header in muted gray (#8E8B9F)
 * - Row dividers, hover state
 * - Customizable columns & render functions
 * - Empty & loading states
 */
export default function DataTable({
    columns = [],
    data = [],
    loading = false,
    emptyMessage = 'No records found in this view',
    keyField = '_id',
    onRowClick,
    className = ''
}) {
    if (loading) {
        return (
            <div style={{ padding: '3rem 1rem', textAlign: 'center', backgroundColor: '#FFFFFF', borderRadius: '12px' }}>
                <div
                    style={{
                        width: '32px',
                        height: '32px',
                        border: '3px solid #EBE8F8',
                        borderTop: '3px solid #4B3F8C',
                        borderRadius: '50%',
                        animation: 'spin 0.8s linear infinite',
                        margin: '0 auto 1rem'
                    }}
                />
                <span style={{ fontSize: '0.84rem', color: '#8E8B9F', fontWeight: 600 }}>Loading table records...</span>
            </div>
        );
    }

    if (!data || data.length === 0) {
        return (
            <div
                style={{
                    padding: '3.5rem 1.5rem',
                    textAlign: 'center',
                    backgroundColor: '#FAFAFC',
                    borderRadius: '12px',
                    border: '1.5px dashed #E5E5EB',
                    margin: '1rem 0'
                }}
            >
                <div style={{ fontSize: '2rem', marginBottom: '0.5rem', opacity: 0.7 }}>📋</div>
                <h4 style={{ margin: '0 0 0.35rem', fontSize: '0.98rem', fontWeight: 700, color: '#4A4560' }}>{emptyMessage}</h4>
                <p style={{ margin: 0, fontSize: '0.78rem', color: '#9E9EA7' }}>Try adjusting your search or active filter settings.</p>
            </div>
        );
    }

    return (
        <div className={`doulos-table-wrap ${className}`}>
            <table className="doulos-table">
                <thead>
                    <tr>
                        {columns.map((col, idx) => (
                            <th
                                key={col.key || idx}
                                style={{
                                    textAlign: col.align || 'left',
                                    width: col.width,
                                    ...col.headerStyle
                                }}
                            >
                                {col.header}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {data.map((row, rowIdx) => (
                        <tr
                            key={row[keyField] || rowIdx}
                            onClick={() => onRowClick && onRowClick(row)}
                            style={{ cursor: onRowClick ? 'pointer' : 'default' }}
                        >
                            {columns.map((col, colIdx) => (
                                <td
                                    key={col.key || colIdx}
                                    style={{
                                        textAlign: col.align || 'left',
                                        ...col.cellStyle
                                    }}
                                >
                                    {col.render ? col.render(row[col.key], row, rowIdx) : row[col.key]}
                                </td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
