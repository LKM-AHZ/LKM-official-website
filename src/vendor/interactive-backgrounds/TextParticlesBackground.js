import { jsx as _jsx } from "react/jsx-runtime";
import { useEffect, useRef } from 'react';
import { useColorMode } from './useColorMode';
const TextParticlesBackground = ({ text = '理科迷', fontSize = 120, density = 4, color: propColor, className = '', }) => {
    const mode = useColorMode();
    const color = propColor || (mode === 'dark' ? 'rgba(255,255,255,0.9)' : 'rgba(0,0,0,0.7)');
    const canvasRef = useRef(null);
    const animationRef = useRef(null);
    const particlesRef = useRef([]);
    const mouseRef = useRef({ x: 0, y: 0, radius: 80 });
    useEffect(() => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        const resize = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
            createTextParticles();
        };
        const createTextParticles = () => {
            const width = canvas.width;
            const height = canvas.height;
            ctx.clearRect(0, 0, width, height);
            ctx.font = `${fontSize}px Space Grotesk`;
            ctx.textAlign = 'center';
            ctx.fillStyle = '#ffffff';
            ctx.fillText(text, width / 2, height / 2);
            const imageData = ctx.getImageData(0, 0, width, height);
            const data = imageData.data;
            particlesRef.current = [];
            for (let y = 0; y < height; y += density) {
                for (let x = 0; x < width; x += density) {
                    const index = (y * width + x) * 4;
                    const alpha = data[index + 3];
                    if (alpha > 128) {
                        particlesRef.current.push({
                            x: x + Math.random() * 10 - 5,
                            y: y + Math.random() * 10 - 5,
                            baseX: x,
                            baseY: y,
                            vx: 0,
                            vy: 0,
                            size: 1.5,
                            opacity: 1,
                        });
                    }
                }
            }
            // Scatter background particles in empty space
            const bgParticleCount = 200;
            for (let i = 0; i < bgParticleCount; i++) {
                const px = Math.random() * width;
                const py = Math.random() * height;
                // Skip if too close to text particles
                const tooClose = particlesRef.current.some(
                    p => Math.hypot(p.baseX - px, p.baseY - py) < 15
                );
                if (!tooClose) {
                    particlesRef.current.push({
                        x: px,
                        y: py,
                        baseX: px,
                        baseY: py,
                        vx: 0,
                        vy: 0,
                        size: 1 + Math.random() * 1.5,
                        opacity: 0.4 + Math.random() * 0.3,
                    });
                }
            }
        };
        const animate = () => {
            const width = canvas.width;
            const height = canvas.height;
            ctx.clearRect(0, 0, width, height);
            particlesRef.current.forEach(p => {
                const dx = mouseRef.current.x - p.x;
                const dy = mouseRef.current.y - p.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                const force = mouseRef.current.radius / dist;
                if (dist < mouseRef.current.radius) {
                    const angle = Math.atan2(dy, dx);
                    p.vx -= Math.cos(angle) * force * 0.5;
                    p.vy -= Math.sin(angle) * force * 0.5;
                }
                // Ease back to original position
                const dxBase = p.baseX - p.x;
                const dyBase = p.baseY - p.y;
                p.vx += dxBase * 0.01;
                p.vy += dyBase * 0.01;
                // Friction
                p.vx *= 0.9;
                p.vy *= 0.9;
                // Update position
                p.x += p.vx;
                p.y += p.vy;
                // Draw
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                ctx.fillStyle = color.replace(/[\d.]+(?=\))/, p.opacity.toFixed(2));
                ctx.fill();
            });
            animationRef.current = requestAnimationFrame(animate);
        };
        const handleMouseMove = (e) => {
            const rect = canvas.getBoundingClientRect();
            const scaleX = canvas.width / rect.width;
            const scaleY = canvas.height / rect.height;
            mouseRef.current.x = (e.clientX - rect.left) * scaleX;
            mouseRef.current.y = (e.clientY - rect.top) * scaleY;
        };
        resize();
        animate();
        window.addEventListener('resize', resize);
        window.addEventListener('mousemove', handleMouseMove);
        return () => {
            if (animationRef.current)
                cancelAnimationFrame(animationRef.current);
            window.removeEventListener('resize', resize);
            window.removeEventListener('mousemove', handleMouseMove);
        };
    }, [text, fontSize, density, color]);
    return (_jsx("canvas", { ref: canvasRef, className: `absolute inset-0 pointer-events-none ${className}`, style: { zIndex: 0 } }));
};
export default TextParticlesBackground;
