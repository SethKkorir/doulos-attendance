import React from 'react';
import Button from './Button';

const LocationSelector = ({ currentLocation, onLocationChange }) => {
    return (
        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', marginBottom: '2rem' }}>
            <Button
                variant={currentLocation === 'athi' ? 'primary' : 'secondary'}
                onClick={() => onLocationChange('athi')}
            >
                Athi River
            </Button>
            <Button
                variant={currentLocation === 'valley' ? 'primary' : 'secondary'}
                onClick={() => onLocationChange('valley')}
            >
                Valley Road
            </Button>
        </div>
    );
};

export default LocationSelector;
