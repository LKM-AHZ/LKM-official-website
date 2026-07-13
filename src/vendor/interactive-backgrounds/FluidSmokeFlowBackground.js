import { jsx as _jsx } from "react/jsx-runtime";
import { useEffect, useRef } from 'react';
import { useColorMode } from './useColorMode';
const FluidSmokeFlowBackground = ({ particleColor: propParticleColor, lineWidth = 1, className = '', particleCount = 300, interactionRadius = 100, interactionStrength = 0.3, backgroundFadeAlpha = 0.08, }) => {
    const mode = useColorMode();
    const particleColor = propParticleColor || (mode === 'dark' ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.08)');
    const canvasRef = useRef(null);
    const animationRef = useRef(null);
    const particlesRef = useRef([]);
    const mouseRef = useRef({ x: 0, y: 0 });
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas)
            return;
        const ctx = canvas.getContext('2d');
        if (!ctx)
            return;
        const resize = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
            createParticles();
        };
        const createParticles = () => {
            const count = particleCount;
            const width = canvas.width;
            const height = canvas.height;
            particlesRef.current = [];
            for (let i = 0; i < count; i++) {
                particlesRef.current.push({
                    x: Math.random() * width,
                    y: Math.random() * height,
                    vx: (Math.random() - 0.5) * 0.5,
                    vy: (Math.random() - 0.5) * 0.5,
                });
            }
        };
        const drawParticles = () => {
            const { width, height } = canvas;
            // Fading trail effect
            ctx.fillStyle = `rgba(0, 0, 0, ${backgroundFadeAlpha})`;
            ctx.fillRect(0, 0, width, height);
            ctx.lineWidth = lineWidth;
            ctx.strokeStyle = particleColor;
            particlesRef.current.forEach((p) => {
                const dx = mouseRef.current.x - p.x;
                const dy = mouseRef.current.y - p.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < interactionRadius) {
                    const force = (interactionRadius - dist) / interactionRadius;
                    const angle = Math.atan2(dy, dx);
                    p.vx -= Math.cos(angle) * force * interactionStrength;
                    p.vy -= Math.sin(angle) * force * interactionStrength;
                }
                // Friction
                p.vx *= 0.96;
                p.vy *= 0.96;
                const prevX = p.x;
                const prevY = p.y;
                p.x += p.vx;
                p.y += p.vy;
                // Wrap around edges
                if (p.x < 0)
                    p.x = width;
                if (p.y < 0)
                    p.y = height;
                if (p.x > width)
                    p.x = 0;
                if (p.y > height)
                    p.y = 0;
                // Draw trail
                ctx.beginPath();
                ctx.moveTo(prevX, prevY);
                ctx.lineTo(p.x, p.y);
                ctx.stroke();
            });
        };
        const animate = () => {
            drawParticles();
            animationRef.current = requestAnimationFrame(animate);
        };
        const handleMouseMove = (e) => {
            mouseRef.current.x = e.clientX;
            mouseRef.current.y = e.clientY;
        };
        // Initialize
        resize();
        animate();
        // Event listeners
        window.addEventListener('resize', resize);
        window.addEventListener('mousemove', handleMouseMove);
        // Cleanup
        return () => {
            if (animationRef.current)
                cancelAnimationFrame(animationRef.current);
            window.removeEventListener('resize', resize);
            window.removeEventListener('mousemove', handleMouseMove);
        };
    }, [particleColor, lineWidth, particleCount, interactionRadius, interactionStrength, backgroundFadeAlpha]);
    return (_jsx("canvas", { ref: canvasRef, className: `absolute inset-0 pointer-events-none ${className}`, style: { zIndex: 0 } }));
};
export default FluidSmokeFlowBackground;
