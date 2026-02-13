import { useEffect, useRef } from 'react';

interface Particle {
    x: number;
    y: number;
    vx: number;
    vy: number;
    radius: number;
    opacity: number;
    life: number;      // current life (counts down)
    maxLife: number;    // total lifespan
    phase: 'in' | 'alive' | 'out'; // fade-in, alive, fade-out
}

interface ParticleCanvasProps {
    className?: string;
    particleCount?: number;
    particleColor?: string;
    lineColor?: string;
    maxDistance?: number;
}

export function ParticleCanvas({
    className = '',
    particleCount = 60,
    particleColor = '249, 115, 22', // orange-500 RGB
    lineColor = '249, 115, 22',
    maxDistance = 120,
}: ParticleCanvasProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const particlesRef = useRef<Particle[]>([]);
    const animationRef = useRef<number>(0);
    const mouseRef = useRef({ x: -1000, y: -1000 });

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const FADE_FRAMES = 60; // ~1 second fade in/out at 60fps

        const createParticle = (w: number, h: number): Particle => {
            const maxLife = 300 + Math.random() * 400; // live 5–12 seconds
            return {
                x: Math.random() * w,
                y: Math.random() * h,
                vx: (Math.random() - 0.5) * 0.5,
                vy: (Math.random() - 0.5) * 0.5,
                radius: Math.random() * 2.5 + 1.2,
                opacity: Math.random() * 0.5 + 0.5,
                life: maxLife,
                maxLife,
                phase: 'in',
            };
        };

        const resize = () => {
            canvas.width = canvas.offsetWidth * window.devicePixelRatio;
            canvas.height = canvas.offsetHeight * window.devicePixelRatio;
            ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
        };

        const initParticles = () => {
            const w = canvas.offsetWidth;
            const h = canvas.offsetHeight;
            particlesRef.current = Array.from({ length: particleCount }, () => {
                const p = createParticle(w, h);
                // Stagger initial lifetimes so they don't all die at once
                p.life = Math.random() * p.maxLife;
                p.phase = 'alive';
                return p;
            });
        };

        const draw = () => {
            const w = canvas.offsetWidth;
            const h = canvas.offsetHeight;
            ctx.clearRect(0, 0, w, h);

            let particles = particlesRef.current;
            const mouse = mouseRef.current;
            const repelRadius = maxDistance * 1.5;

            // Update & draw particles
            for (const p of particles) {
                // Lifecycle
                p.life -= 1;

                // Determine phase
                if (p.life <= 0) {
                    p.phase = 'out';
                } else if (p.life > p.maxLife - FADE_FRAMES) {
                    p.phase = 'in';
                } else if (p.life < FADE_FRAMES) {
                    p.phase = 'out';
                } else {
                    p.phase = 'alive';
                }

                // Calculate display opacity based on phase
                let displayOpacity = p.opacity;
                if (p.phase === 'in') {
                    const progress = (p.maxLife - p.life) / FADE_FRAMES;
                    displayOpacity = p.opacity * Math.min(progress, 1);
                } else if (p.phase === 'out') {
                    const progress = Math.max(p.life, 0) / FADE_FRAMES;
                    displayOpacity = p.opacity * Math.max(progress, 0);
                }

                // Mouse repulsion
                const mdx = p.x - mouse.x;
                const mdy = p.y - mouse.y;
                const mDist = Math.sqrt(mdx * mdx + mdy * mdy);
                if (mDist < repelRadius && mDist > 0) {
                    const force = (1 - mDist / repelRadius) * 0.1;
                    p.vx += (mdx / mDist) * force;
                    p.vy += (mdy / mDist) * force;
                }

                // Dampen velocity
                p.vx *= 0.97;
                p.vy *= 0.97;

                // Keep minimum drift
                const speed = Math.sqrt(p.vx * p.vx + p.vy * p.vy);
                if (speed < 0.15) {
                    p.vx += (Math.random() - 0.5) * 0.1;
                    p.vy += (Math.random() - 0.5) * 0.1;
                }

                p.x += p.vx;
                p.y += p.vy;

                // Bounce off edges
                if (p.x < 0 || p.x > w) p.vx *= -1;
                if (p.y < 0 || p.y > h) p.vy *= -1;
                p.x = Math.max(0, Math.min(w, p.x));
                p.y = Math.max(0, Math.min(h, p.y));

                // Draw
                if (displayOpacity > 0.01) {
                    ctx.beginPath();
                    ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
                    ctx.fillStyle = `rgba(${particleColor}, ${displayOpacity})`;
                    ctx.fill();
                }
            }

            // Remove dead particles & spawn new ones (capped at particleCount)
            particles = particles.filter(p => p.life > -FADE_FRAMES);

            // Spawn new particles to maintain count
            while (particles.length < particleCount) {
                particles.push(createParticle(w, h));
            }

            particlesRef.current = particles;

            // Draw lines between nearby particles
            for (let i = 0; i < particles.length; i++) {
                for (let j = i + 1; j < particles.length; j++) {
                    const dx = particles[i].x - particles[j].x;
                    const dy = particles[i].y - particles[j].y;
                    const dist = Math.sqrt(dx * dx + dy * dy);

                    if (dist < maxDistance) {
                        // Factor in both particles' display opacity for line
                        const lifeA = Math.min(Math.max(particles[i].life, 0) / FADE_FRAMES, 1);
                        const lifeB = Math.min(Math.max(particles[j].life, 0) / FADE_FRAMES, 1);
                        const opacity = (1 - dist / maxDistance) * 0.4 * lifeA * lifeB;
                        if (opacity > 0.01) {
                            ctx.beginPath();
                            ctx.moveTo(particles[i].x, particles[i].y);
                            ctx.lineTo(particles[j].x, particles[j].y);
                            ctx.strokeStyle = `rgba(${lineColor}, ${opacity})`;
                            ctx.lineWidth = 1;
                            ctx.stroke();
                        }
                    }
                }
            }

            animationRef.current = requestAnimationFrame(draw);
        };

        const handleMouseMove = (e: MouseEvent) => {
            const rect = canvas.getBoundingClientRect();
            mouseRef.current = {
                x: e.clientX - rect.left,
                y: e.clientY - rect.top,
            };
        };

        const handleMouseLeave = () => {
            mouseRef.current = { x: -1000, y: -1000 };
        };

        resize();
        initParticles();
        draw();

        window.addEventListener('resize', () => {
            resize();
            initParticles();
        });
        canvas.addEventListener('mousemove', handleMouseMove);
        canvas.addEventListener('mouseleave', handleMouseLeave);

        return () => {
            cancelAnimationFrame(animationRef.current);
            window.removeEventListener('resize', resize);
            canvas.removeEventListener('mousemove', handleMouseMove);
            canvas.removeEventListener('mouseleave', handleMouseLeave);
        };
    }, [particleCount, particleColor, lineColor, maxDistance]);

    return (
        <canvas
            ref={canvasRef}
            className={className}
            style={{ width: '100%', height: '100%' }}
        />
    );
}
