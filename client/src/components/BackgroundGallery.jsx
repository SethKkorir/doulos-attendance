import { useState, useEffect } from 'react';

const IMAGES = [
    '3X0A0001.jpg', '3X0A0004.jpg', '3X0A0005.jpg', '3X0A0006.jpg', '3X0A0008.jpg',
    '3X0A0011.jpg', '3X0A0013.jpg', '3X0A0016.jpg', '3X0A0018.jpg', '3X0A0019.jpg',
    '3X0A0022.jpg', '3X0A0024.jpg', '3X0A0025.jpg', '3X0A0027.jpg', '3X0A0028.jpg',
    '3X0A7266.jpg', '3X0A7270.jpg', '3X0A7274.jpg', '3X0A7277.jpg', '3X0A7280.jpg',
    'DSC_7189.jpg', 'DSC_7192.jpg', 'DSC_7225.jpg', 'DSC_7238.jpg', 'DSC_7241.jpg',
    '3X0A0030.jpg', '3X0A0031.jpg', '3X0A0034.jpg', '3X0A0036.jpg', '3X0A7282.jpg',
    '3X0A7256.jpg', '3X0A7294.jpg', '3X0A7306.jpg', 'DSC_7261.jpg', 'DSC_7314.jpg',
    'DSC_7319.jpg', 'DSC_7347.jpg', 'DSC_7365.jpg'
];

const FOLDER_PATH = '/gallery/';

const BackgroundGallery = () => {
    const [index, setIndex] = useState(0);
    const [fade, setFade] = useState(true);

    useEffect(() => {
        const interval = setInterval(() => {
            setFade(false); // Start cross-fade
            setTimeout(() => {
                setIndex((prev) => (prev + 1) % IMAGES.length);
                setFade(true); // Fade back in
            }, 1000);
        }, 7000);

        return () => clearInterval(interval);
    }, []);

    return (
        <div className="bg-gallery-container" style={{
            position: 'fixed',
            inset: 0,
            zIndex: -2,
            overflow: 'hidden',
            background: '#000'
        }}>
            {/* The Image - Using <img> for better sharpness/scaling on UHD/4K screens */}
            <img
                src={`${FOLDER_PATH}${IMAGES[index]}`}
                alt="Background"
                style={{
                    position: 'absolute',
                    inset: 0,
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    objectPosition: 'center',
                    transition: 'opacity 2.5s ease-in-out',
                    opacity: fade ? 1 : 0, // FULL QUALITY
                    filter: 'brightness(0.9) contrast(1.1)' // Optimized for the "Doulos" aesthetic
                }}
            />

            {/* Premium Protective Overlay - Keeps text clear while keeping images vibrant */}
            <div style={{
                position: 'absolute',
                inset: 0,
                background: 'linear-gradient(180deg, rgba(0,0,0,0) 0%, rgba(0,0,0,0.5) 100%)',
                zIndex: 1
            }} />
        </div>
    );
};

export default BackgroundGallery;
