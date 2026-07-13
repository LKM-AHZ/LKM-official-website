import { jsx as _jsx } from "react/jsx-runtime";
import { useEffect, useRef } from 'react';
import { useColorMode } from './useColorMode';
const NebulaBackground = ({ baseColor: propBaseColor, glowColor: propGlowColor, intensity = 1, className = '', blobCount = 10, blobRadiusMin = 40, blobRadiusMax = 140, gradientSpread = 0.75, }) => {
    const mode = useColorMode();
    const baseColor = propBaseColor || (mode === 'dark' ? 'rgba(20,0,40,0.3)' : 'rgba(255,255,255,0.7)');
    const glowColor = propGlowColor || (mode === 'dark' ? 'rgba(255,100,200,0.08)' : 'rgba(0,0,0,0.08)');
    const canvasRef = useRef(null);
    const animationRef = useRef(null);
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
        };
        const drawNebula = (time) => {
            const { width, height } = canvas;
            ctx.clearRect(0, 0, width, height);
            // Background wash
            const gradient = ctx.createRadialGradient(mouseRef.current.x, mouseRef.current.y, 0, width / 2, height / 2, Math.max(width, height) * 0.75);
            gradient.addColorStop(0, glowColor);
            gradient.addColorStop(1, baseColor);
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, width, height);
            // Nebula blobs
            for (let i = 0; i < Math.max(1, Math.floor(blobCount * intensity)); i++) {
                const x = Math.sin(time + i) * width * 0.5 + width / 2;
                const y = Math.cos(time * 0.7 + i * 0.3) * height * 0.4 + height / 2;
                const radius = Math.abs(Math.sin(time * 0.5 + i)) * (blobRadiusMax - blobRadiusMin) + blobRadiusMin;
                const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius * gradientSpread);
                gradient.addColorStop(0, glowColor);
                gradient.addColorStop(1, 'transparent');
                ctx.beginPath();
                ctx.fillStyle = gradient;
                ctx.arc(x, y, radius, 0, Math.PI * 2);
                ctx.fill();
            }
        };
        const animate = () => {
            const time = Date.now() * 0.001;
            drawNebula(time);
            animationRef.current = requestAnimationFrame(animate);
        };
        const handleMouseMove = (e) => {
            mouseRef.current.x = e.clientX;
            mouseRef.current.y = e.clientY;
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
    }, [baseColor, glowColor, intensity]);
    return (_jsx("canvas", { ref: canvasRef, className: `absolute inset-0 pointer-events-none ${className}`, style: { zIndex: 0 } }));
};
export default NebulaBackground;
