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
    const [bubbles, setBubbles] = useState([]);

    useEffect(() => {
        // Create 24 floating bubbles
        const newBubbles = Array.from({ length: 24 }).map((_, i) => ({
            id: i,
            img: FOLDER_PATH + IMAGES[i % IMAGES.length],
            size: Math.random() * 150 + 150, // 150px to 300px
            x: Math.random() * 100,
            y: Math.random() * 100,
            duration: Math.random() * 30 + 30, // 30s to 60s
            delay: Math.random() * -60,
            opacity: 0.9,
            rotation: Math.random() * 360
        }));
        setBubbles(newBubbles);
    }, []);

    return (
        <div className="bg-gallery-container" style={{
            position: 'fixed',
            inset: 0,
            zIndex: 0,
            overflow: 'hidden',
            pointerEvents: 'none',
            background: 'hsl(var(--color-bg))'
        }}>
            {/* Subtle base gradient */}
            <div style={{
                position: 'absolute',
                inset: 0,
                background: 'var(--bg-gradient)',
                opacity: 0.2,
                zIndex: 1
            }}></div>

            {bubbles.map(bubble => (
                <div
                    key={bubble.id}
                    className="floating-bubble"
                    style={{
                        position: 'absolute',
                        width: bubble.size,
                        height: bubble.size,
                        left: `${bubble.x}%`,
                        top: `${bubble.y}%`,
                        backgroundImage: `url("${bubble.img}")`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                        borderRadius: '2rem',
                        boxShadow: '0 20px 60px rgba(0,0,0,0.6)',
                        opacity: bubble.opacity,
                        animation: `floatAndRotate ${bubble.duration}s linear infinite`,
                        animationDelay: `${bubble.delay}s`,
                        filter: 'none',
                        border: '2px solid rgba(255,255,255,0.3)',
                        zIndex: 0
                    }}
                />
            ))}

            {/* Subtler blur to unify, but not hide */}
            <div style={{
                position: 'absolute',
                inset: 0,
                backdropFilter: 'blur(10px)',
                background: 'hsla(var(--color-bg-h), var(--color-bg-s), var(--color-bg-l), 0.2)',
                zIndex: 1
            }} />
        </div>
    );
};

export default BackgroundGallery;
