import { useState, useEffect } from 'react';

const IMAGES = [
    '3X0A0001.jpg', '3X0A0004.jpg', '3X0A0005.jpg', '3X0A0006.jpg', '3X0A0008.jpg',
    '3X0A0011.jpg', '3X0A0013.jpg', '3X0A0016.jpg', '3X0A0018.jpg', '3X0A0019.jpg',
    '3X0A0022.jpg', '3X0A0024.jpg', '3X0A0025.jpg', '3X0A0027.jpg', '3X0A0028.jpg',
    '3X0A7266.jpg', '3X0A7270.jpg', '3X0A7274.jpg', '3X0A7277.jpg', '3X0A7280.jpg',
    'DSC_7189.jpg', 'DSC_7192.jpg', 'DSC_7225.jpg', 'DSC_7238.jpg', 'DSC_7241.jpg'
];

const FOLDER_PATH = '/Doulos Training 1 October 2025-3-001/Doulos Training 1 October 2025/';

const BackgroundGallery = () => {
    const [currentImage, setCurrentImage] = useState('');
    const [fade, setFade] = useState(true);

    useEffect(() => {
        const changeImage = () => {
            setFade(false);
            setTimeout(() => {
                const randomImg = IMAGES[Math.floor(Math.random() * IMAGES.length)];
                setCurrentImage(FOLDER_PATH + randomImg);
                setFade(true);
            }, 1000);
        };

        changeImage();
        const interval = setInterval(changeImage, 15000); // Change every 15 seconds

        return () => clearInterval(interval);
    }, []);

    return (
        <div className="bg-gallery-container">
            {currentImage && (
                <div
                    className={`bg-gallery-image ${fade ? 'fade-in' : 'fade-out'}`}
                    style={{ backgroundImage: `url("${currentImage}")` }}
                />
            )}
            <div className="bg-gallery-overlay" />
        </div>
    );
};

export default BackgroundGallery;
