import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useRef } from 'react';
import { useColorMode } from './useColorMode';
const QuantumWebBackground = ({ quantumColor: propQuantumColor, normalColor: propNormalColor, densityDivisor = 5000, velocityMultiplier = 0.5, speedRange = [0.01, 0.05], phaseNoise = 0.01, velocityDamping = 0.98, quantumRadiusRange = [1, 3], normalRadiusRange = [0.5, 2], opacityRange = [0.2, 0.6], trailMaxRange = [5, 15], mouseRadius = 150, attractionForceFactor = 0.01, repulsionForceFactor = 0.05, connectionDistance = 150, connectionBaseOpacity = 0.7, connectionPulseRate = 3, connectionStrengthRange = [0.01, 0.06], connectionLineWidth = 1, glowMultiplier = 3 } = {}) => {
    const mode = useColorMode();
    // Theme-aware color defaults
    const quantumColor = propQuantumColor || (mode === 'dark' ? '#7f5af0' : '#3f2d78');
    const normalColor = propNormalColor || (mode === 'dark' ? '#2cb67d' : '#165b3e');
    const canvasRef = useRef(null);
    const animationRef = useRef(null);
    const particlesRef = useRef([]);
    const connectionsRef = useRef([]);
    const mouseRef = useRef({ x: null, y: null, radius: mouseRadius, attractionMode: false });
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas)
            return;
        const ctx = canvas.getContext('2d');
        let width = window.innerWidth;
        let height = window.innerHeight;
        // Set canvas dimensions
        const setCanvasSize = () => {
            width = window.innerWidth;
            height = window.innerHeight;
            canvas.width = width;
            canvas.height = height;
        };
        setCanvasSize();
        // Handle window resize
        const handleResize = () => {
            setCanvasSize();
            // Re-init particles on resize to keep density consistent
            initParticles();
        };
        window.addEventListener('resize', handleResize);
        // Helper: random in range
        const randRange = (min, max) => Math.random() * (max - min) + min;
        // Initialize particles
        const initParticles = () => {
            particlesRef.current = [];
            const particleCount = Math.max(10, Math.floor((width * height) / densityDivisor));
            for (let i = 0; i < particleCount; i++) {
                const isQuantum = Math.random() > 0.85;
                const radius = isQuantum
                    ? randRange(quantumRadiusRange[0], quantumRadiusRange[1])
                    : randRange(normalRadiusRange[0], normalRadiusRange[1]);
                const opacity = randRange(opacityRange[0], opacityRange[1]);
                particlesRef.current.push({
                    x: Math.random() * width,
                    y: Math.random() * height,
                    vx: (Math.random() - 0.5) * velocityMultiplier,
                    vy: (Math.random() - 0.5) * velocityMultiplier,
                    radius,
                    opacity,
                    baseColor: isQuantum ? quantumColor : normalColor,
                    trail: [],
                    maxTrail: Math.floor(randRange(trailMaxRange[0], trailMaxRange[1])),
                    isQuantum,
                    phase: Math.random() * Math.PI * 2,
                    speed: randRange(speedRange[0], speedRange[1]),
                    lastX: 0,
                    lastY: 0
                });
            }
        };
        // Mouse interaction
        const handleMouseMove = (e) => {
            mouseRef.current.x = e.clientX;
            mouseRef.current.y = e.clientY;
        };
        const handleMouseLeave = () => {
            mouseRef.current.x = null;
            mouseRef.current.y = null;
        };
        const handleKeyDown = (e) => {
            if (e.key === 'Shift')
                mouseRef.current.attractionMode = true;
        };
        const handleKeyUp = (e) => {
            if (e.key === 'Shift')
                mouseRef.current.attractionMode = false;
        };
        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseleave', handleMouseLeave);
        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);
        // Update particle positions and physics
        const updateParticles = () => {
            const mouse = mouseRef.current;
            particlesRef.current.forEach(particle => {
                // Store current position for trail calculation
                particle.lastX = particle.x;
                particle.lastY = particle.y;
                // Add current position to trail
                particle.trail.push({ x: particle.x, y: particle.y });
                if (particle.trail.length > particle.maxTrail) {
                    particle.trail.shift();
                }
                // Random movement with noise
                particle.phase += particle.speed;
                particle.vx += Math.sin(particle.phase) * phaseNoise;
                particle.vy += Math.cos(particle.phase) * phaseNoise;
                // Velocity damping
                particle.vx *= velocityDamping;
                particle.vy *= velocityDamping;
                // Mouse interaction
                if (mouse.x !== null && mouse.y !== null) {
                    const dx = particle.x - mouse.x;
                    const dy = particle.y - mouse.y;
                    const distance = Math.sqrt(dx * dx + dy * dy);
                    if (distance < mouse.radius) {
                        const force = (mouse.radius - distance) / mouse.radius;
                        const angle = Math.atan2(dy, dx);
                        const tx = mouse.x + Math.cos(angle) * mouse.radius;
                        const ty = mouse.y + Math.sin(angle) * mouse.radius;
                        if (mouse.attractionMode) {
                            // Attract particles to mouse
                            particle.vx += (mouse.x - particle.x) * force * attractionForceFactor;
                            particle.vy += (mouse.y - particle.y) * force * attractionForceFactor;
                        }
                        else {
                            // Repel particles from mouse
                            particle.vx += (particle.x - tx) * force * repulsionForceFactor;
                            particle.vy += (particle.y - ty) * force * repulsionForceFactor;
                        }
                    }
                }
                // Boundary checks with tunneling effect
                if (particle.x < -particle.radius)
                    particle.x = width + particle.radius;
                if (particle.x > width + particle.radius)
                    particle.x = -particle.radius;
                if (particle.y < -particle.radius)
                    particle.y = height + particle.radius;
                if (particle.y > height + particle.radius)
                    particle.y = -particle.radius;
                // Update position
                particle.x += particle.vx;
                particle.y += particle.vy;
            });
        };
        // Create and update connections
        const updateConnections = () => {
            connectionsRef.current = [];
            const particles = particlesRef.current;
            const time = Date.now() * 0.001;
            for (let i = 0; i < particles.length; i++) {
                for (let j = i + 1; j < particles.length; j++) {
                    const dx = particles[i].x - particles[j].x;
                    const dy = particles[i].y - particles[j].y;
                    const distance = Math.sqrt(dx * dx + dy * dy);
                    // Create connection if particles are close enough
                    if (distance < connectionDistance) {
                        const opacity = connectionBaseOpacity * (1 - distance / connectionDistance);
                        const pulse = Math.sin(time * connectionPulseRate) * 0.3 + 0.7;
                        connectionsRef.current.push({
                            particles: [particles[i], particles[j]],
                            distance,
                            opacity: opacity * pulse,
                            strength: randRange(connectionStrengthRange[0], connectionStrengthRange[1])
                        });
                    }
                }
            }
        };
        // Draw everything
        const render = () => {
            if (!ctx)
                return;
            // Clear canvas with transparent background
            ctx.clearRect(0, 0, width, height);
            // Draw particle trails
            particlesRef.current.forEach(particle => {
                if (particle.trail.length > 1) {
                    const velocity = Math.sqrt(Math.pow(particle.x - particle.lastX, 2) +
                        Math.pow(particle.y - particle.lastY, 2));
                    const trailIntensity = Math.min(velocity * 20, 1);
                    if (trailIntensity > 0.05) {
                        ctx.beginPath();
                        ctx.moveTo(particle.trail[0].x, particle.trail[0].y);
                        for (let i = 1; i < particle.trail.length; i++) {
                            ctx.lineTo(particle.trail[i].x, particle.trail[i].y);
                        }
                        const gradient = ctx.createLinearGradient(particle.trail[0].x, particle.trail[0].y, particle.x, particle.y);
                        gradient.addColorStop(0, `${particle.baseColor}00`);
                        gradient.addColorStop(1, `${particle.baseColor}${Math.floor(trailIntensity * 80).toString(16).padStart(2, '0')}`);
                        ctx.strokeStyle = gradient;
                        ctx.lineWidth = particle.isQuantum ? 1.5 : 1;
                        ctx.stroke();
                    }
                }
            });
            // Draw connections with entanglement effect
            connectionsRef.current.forEach(connection => {
                const [p1, p2] = connection.particles;
                // Create gradient for connection
                const gradient = ctx.createLinearGradient(p1.x, p1.y, p2.x, p2.y);
                gradient.addColorStop(0, p1.isQuantum ? quantumColor : normalColor);
                gradient.addColorStop(1, p2.isQuantum ? quantumColor : normalColor);
                ctx.beginPath();
                ctx.moveTo(p1.x, p1.y);
                ctx.lineTo(p2.x, p2.y);
                ctx.strokeStyle = gradient;
                ctx.globalAlpha = connection.opacity;
                ctx.lineWidth = connectionLineWidth;
                ctx.stroke();
                ctx.globalAlpha = 1;
            });
            // Draw particles
            particlesRef.current.forEach(particle => {
                ctx.beginPath();
                ctx.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
                ctx.fillStyle = particle.baseColor;
                ctx.fill();
                // Glow effect for quantum particles
                if (particle.isQuantum) {
                    ctx.beginPath();
                    ctx.arc(particle.x, particle.y, particle.radius * glowMultiplier, 0, Math.PI * 2);
                    const gradient = ctx.createRadialGradient(particle.x, particle.y, 0, particle.x, particle.y, particle.radius * glowMultiplier);
                    gradient.addColorStop(0, `${particle.baseColor}80`);
                    gradient.addColorStop(1, `${particle.baseColor}00`);
                    ctx.fillStyle = gradient;
                    ctx.fill();
                }
            });
        };
        // Animation loop
        const animate = () => {
            updateParticles();
            updateConnections();
            render();
            animationRef.current = requestAnimationFrame(animate);
        };
        // Initialize and start animation
        initParticles();
        animate();
        // Cleanup
        return () => {
            window.removeEventListener('resize', handleResize);
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseleave', handleMouseLeave);
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('keyup', handleKeyUp);
            if (animationRef.current !== null) {
                cancelAnimationFrame(animationRef.current);
            }
        };
    }, [
        mode,
        densityDivisor,
        velocityMultiplier,
        speedRange,
        phaseNoise,
        velocityDamping,
        quantumRadiusRange,
        normalRadiusRange,
        opacityRange,
        trailMaxRange,
        mouseRadius,
        attractionForceFactor,
        repulsionForceFactor,
        connectionDistance,
        connectionBaseOpacity,
        connectionPulseRate,
        connectionStrengthRange,
        connectionLineWidth,
        glowMultiplier,
        quantumColor,
        normalColor
    ]);
    return (_jsx("div", { className: "absolute inset-0 overflow-hidden pointer-events-none", children: _jsx("canvas", { ref: canvasRef, className: "w-full h-full" }) }));
};
export default QuantumWebBackground;
