import { useEffect, useState } from 'react';

const ValentineRain = () => {
    const [elements, setElements] = useState([]);
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const now = new Date();
        const month = now.getMonth(); // 0-indexed (1 is Feb)
        const day = now.getDate();

        // Check if date is between Feb 1st and Feb 14th (Ends on 15th)
        if (month === 1 && day >= 1 && day < 15) {
            setIsVisible(true);
            const icons = ['🌸', '🌹', '🌺', '💗', '💞', '🌷', '💐'];
            const count = 20;
            const newElements = Array.from({ length: count }).map((_, i) => ({
                id: i,
                icon: icons[Math.floor(Math.random() * icons.length)],
                left: Math.random() * 100,
                animationDuration: 5 + Math.random() * 10,
                delay: Math.random() * 5,
                size: 1 + Math.random() * 1.5
            }));
            setElements(newElements);
        }
    }, []);

    if (!isVisible) return null;

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            pointerEvents: 'none',
            zIndex: 50,
            overflow: 'hidden'
        }}>
            {elements.map((el) => (
                <div
                    key={el.id}
                    style={{
                        position: 'absolute',
                        top: '-10%',
                        left: `${el.left}%`,
                        fontSize: `${el.size}rem`,
                        opacity: 0.6,
                        animation: `valentineFall ${el.animationDuration}s linear infinite`,
                        animationDelay: `${el.delay}s`,
                        textShadow: '0 2px 5px rgba(0,0,0,0.1)'
                    }}
                >
                    {el.icon}
                </div>
            ))}
            <style>
                {`
                    @keyframes valentineFall {
                        0% { transform: translateY(-10vh) rotate(0deg); opacity: 0; }
                        10% { opacity: 0.8; }
                        90% { opacity: 0.8; }
                        100% { transform: translateY(110vh) rotate(360deg); opacity: 0; }
                    }
                `}
            </style>
        </div>
    );
};

export default ValentineRain;
