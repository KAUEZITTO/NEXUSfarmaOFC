
'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { Balloon } from 'lucide-react';

const colors = [
    'text-red-500', 'text-blue-500', 'text-green-500', 'text-yellow-500', 
    'text-purple-500', 'text-pink-500', 'text-indigo-500', 'text-teal-500'
];

const BalloonComponent = ({ id, onAnimationEnd }: { id: number, onAnimationEnd: (id: number) => void }) => {
    const duration = Math.random() * 5 + 8; // 8-13 seconds
    const delay = Math.random() * 5; // 0-5 seconds
    const left = Math.random() * 90; // 0-90%
    const size = Math.floor(Math.random() * 40) + 40; // 40-80px
    const color = colors[Math.floor(Math.random() * colors.length)];

    return (
        <div
            onAnimationEnd={() => onAnimationEnd(id)}
            className="absolute bottom-[-100px] animate-float"
            style={{ 
                left: `${left}%`, 
                animationDuration: `${duration}s`,
                animationDelay: `${delay}s`,
            }}
        >
            <Balloon className={color} size={size} strokeWidth={1} />
        </div>
    );
};


export default function BirthdayBalloons() {
    const { data: session } = useSession();
    const [isBirthday, setIsBirthday] = useState(false);
    const [balloons, setBalloons] = useState<number[]>([]);

    useEffect(() => {
        if (session?.user?.birthdate) {
            const birthdate = new Date(session.user.birthdate);
            const today = new Date();
            // Compare month and day, ignoring year and timezone
            if (birthdate.getUTCMonth() === today.getUTCMonth() && birthdate.getUTCDate() === today.getUTCDate()) {
                setIsBirthday(true);
            }
        }
    }, [session]);

    useEffect(() => {
        if (isBirthday) {
            const initialBalloons = Array.from({ length: 15 }, (_, i) => i + 1);
            setBalloons(initialBalloons);
        }
    }, [isBirthday]);

    const handleAnimationEnd = (id: number) => {
        // Create a new balloon to replace the one that finished
        setBalloons(prev => [...prev.filter(b => b !== id), Date.now()]);
    };

    if (!isBirthday) {
        return null;
    }

    return (
        <div className="fixed inset-0 pointer-events-none z-[9999] overflow-hidden">
            <style>
                {`
                    @keyframes float {
                        0% {
                            bottom: -100px;
                            transform: translateX(0);
                        }
                        50% {
                            transform: translateX(100px);
                        }
                        100% {
                            bottom: 110vh;
                            transform: translateX(-50px);
                        }
                    }
                    .animate-float {
                        animation-name: float;
                        animation-timing-function: linear;
                        animation-iteration-count: 1;
                    }
                `}
            </style>
            {balloons.map(id => (
                <BalloonComponent key={id} id={id} onAnimationEnd={handleAnimationEnd} />
            ))}
        </div>
    );
}
