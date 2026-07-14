import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useRef } from 'react';
const DreamyHaloBackground = ({ baseHue = 280, className = '', blurOverlay = true, overlayOpacity = 0.3, haloCount = 20, haloRadiusMin = 50, haloRadiusMax = 150, pulseAmplitude = 20, saturation = 100, lightness = 85, }) => {
    const canvasRef = useRef(null);
    const animationRef = useRef(null);
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
        const generateHalos = () => {
            const halos = [];
            for (let i = 0; i < haloCount; i++) {
                halos.push({
                    x: Math.random() * canvas.width,
                    y: Math.random() * canvas.height,
                    r: Math.random() * (haloRadiusMax - haloRadiusMin) + haloRadiusMin,
                    phase: Math.random() * Math.PI * 2,
                });
            }
            return halos;
        };
        const halos = generateHalos();
        const animate = () => {
            const time = Date.now() * 0.001;
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            halos.forEach((halo, index) => {
                const pulse = Math.sin(time + halo.phase) * pulseAmplitude;
                const gradient = ctx.createRadialGradient(halo.x, halo.y, 0, halo.x, halo.y, halo.r + pulse);
                const hueShift = (baseHue + index * 10 + time * 10) % 360;
                gradient.addColorStop(0, `hsla(${hueShift}, ${saturation}%, ${lightness}%, 0.25)`);
                gradient.addColorStop(1, `hsla(${hueShift}, ${saturation}%, ${lightness}%, 0)`);
                ctx.beginPath();
                ctx.fillStyle = gradient;
                ctx.arc(halo.x, halo.y, halo.r + pulse, 0, Math.PI * 2);
                ctx.fill();
            });
            animationRef.current = requestAnimationFrame(animate);
        };
        resize();
        animate();
        window.addEventListener('resize', resize);
        return () => {
            if (animationRef.current)
                cancelAnimationFrame(animationRef.current);
            window.removeEventListener('resize', resize);
        };
    }, [baseHue, haloCount, haloRadiusMin, haloRadiusMax, pulseAmplitude, saturation, lightness]);
    return (_jsxs(_Fragment, { children: [_jsx("canvas", { ref: canvasRef, className: `absolute inset-0 pointer-events-none ${className}`, style: { zIndex: 0 } }), blurOverlay && (_jsx("div", { className: "absolute inset-0 backdrop-blur-md pointer-events-none", style: { zIndex: 1, backgroundColor: `rgba(255,255,255,${overlayOpacity})` } }))] }));
};
export default DreamyHaloBackground;
