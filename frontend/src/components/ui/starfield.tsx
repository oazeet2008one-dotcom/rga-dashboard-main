import { useEffect, useRef } from 'react';

interface Star {
    x: number;
    y: number;
    radius: number;
    baseOpacity: number;
    opacity: number;
    // Twinkle
    twinkleSpeed: number;
    twinkleOffset: number;
    // Starburst — some stars occasionally shoot rays
    burstActive: boolean;
    burstTimer: number;
    burstCooldown: number;
    burstIntensity: number;
    burstRayCount: number;
    burstRayLength: number;
}

interface StarfieldProps {
    className?: string;
    starCount?: number;
}

export function Starfield({
    className = '',
    starCount = 120,
}: StarfieldProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const starsRef = useRef<Star[]>([]);
    const animationRef = useRef<number>(0);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const resize = () => {
            canvas.width = canvas.offsetWidth * window.devicePixelRatio;
            canvas.height = canvas.offsetHeight * window.devicePixelRatio;
            ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
        };

        const createStar = (w: number, h: number): Star => {
            const canBurst = Math.random() < 0.15; // 15% of stars can burst
            return {
                x: Math.random() * w,
                y: Math.random() * h,
                radius: Math.random() * 1.6 + 0.4,
                baseOpacity: Math.random() * 0.6 + 0.2,
                opacity: 0,
                twinkleSpeed: Math.random() * 0.02 + 0.005,
                twinkleOffset: Math.random() * Math.PI * 2,
                burstActive: false,
                burstTimer: 0,
                burstCooldown: canBurst ? 200 + Math.random() * 600 : 99999,
                burstIntensity: 0,
                burstRayCount: Math.floor(Math.random() * 2 + 4), // 4–5 rays
                burstRayLength: Math.random() * 12 + 8,
            };
        };

        const initStars = () => {
            const w = canvas.offsetWidth;
            const h = canvas.offsetHeight;
            starsRef.current = Array.from({ length: starCount }, () => {
                const s = createStar(w, h);
                s.twinkleOffset = Math.random() * Math.PI * 2;
                return s;
            });
        };

        let frame = 0;

        const draw = () => {
            const w = canvas.offsetWidth;
            const h = canvas.offsetHeight;
            ctx.clearRect(0, 0, w, h);

            frame++;
            const stars = starsRef.current;

            for (const s of stars) {
                // Twinkle — smooth sine wave
                const twinkle = Math.sin(frame * s.twinkleSpeed + s.twinkleOffset);
                s.opacity = s.baseOpacity * (0.5 + 0.5 * twinkle);

                // Starburst cooldown
                if (!s.burstActive) {
                    s.burstCooldown--;
                    if (s.burstCooldown <= 0) {
                        s.burstActive = true;
                        s.burstTimer = 60 + Math.random() * 40; // burst lasts ~1–1.7 seconds
                        s.burstIntensity = 0;
                    }
                }

                // Burst animation
                if (s.burstActive) {
                    s.burstTimer--;
                    const totalDuration = 60 + 40; // max
                    const progress = 1 - s.burstTimer / totalDuration;

                    // Ease in, hold, ease out
                    if (progress < 0.3) {
                        s.burstIntensity = progress / 0.3; // fade in
                    } else if (progress < 0.7) {
                        s.burstIntensity = 1; // hold
                    } else {
                        s.burstIntensity = (1 - progress) / 0.3; // fade out
                    }
                    s.burstIntensity = Math.max(0, Math.min(1, s.burstIntensity));

                    if (s.burstTimer <= 0) {
                        s.burstActive = false;
                        s.burstCooldown = 300 + Math.random() * 800;
                        s.burstIntensity = 0;
                    }
                }

                // Draw the star dot
                ctx.beginPath();
                ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(255, 255, 255, ${s.opacity})`;
                ctx.fill();

                // Draw subtle glow around the star
                if (s.opacity > 0.4) {
                    ctx.beginPath();
                    ctx.arc(s.x, s.y, s.radius * 2.5, 0, Math.PI * 2);
                    ctx.fillStyle = `rgba(255, 255, 255, ${s.opacity * 0.08})`;
                    ctx.fill();
                }

                // Draw starburst rays
                if (s.burstActive && s.burstIntensity > 0.01) {
                    const rayAlpha = s.burstIntensity * 0.35;
                    const rayLen = s.burstRayLength * s.burstIntensity;

                    ctx.save();
                    ctx.translate(s.x, s.y);

                    // Cross rays (+ shape)
                    for (let r = 0; r < s.burstRayCount; r++) {
                        const angle = (r / s.burstRayCount) * Math.PI * 2;

                        const gradient = ctx.createLinearGradient(
                            0, 0,
                            Math.cos(angle) * rayLen,
                            Math.sin(angle) * rayLen
                        );
                        gradient.addColorStop(0, `rgba(255, 255, 255, ${rayAlpha})`);
                        gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');

                        ctx.beginPath();
                        ctx.moveTo(0, 0);
                        ctx.lineTo(
                            Math.cos(angle) * rayLen,
                            Math.sin(angle) * rayLen
                        );
                        ctx.strokeStyle = gradient;
                        ctx.lineWidth = 0.8;
                        ctx.stroke();
                    }

                    // Bright center point during burst
                    ctx.beginPath();
                    ctx.arc(0, 0, s.radius * 1.5, 0, Math.PI * 2);
                    ctx.fillStyle = `rgba(255, 255, 255, ${s.burstIntensity * 0.6})`;
                    ctx.fill();

                    ctx.restore();
                }
            }

            animationRef.current = requestAnimationFrame(draw);
        };

        resize();
        initStars();
        draw();

        const handleResize = () => {
            resize();
            initStars();
        };
        window.addEventListener('resize', handleResize);

        return () => {
            cancelAnimationFrame(animationRef.current);
            window.removeEventListener('resize', handleResize);
        };
    }, [starCount]);

    return (
        <canvas
            ref={canvasRef}
            className={className}
            style={{ width: '100%', height: '100%' }}
        />
    );
}
