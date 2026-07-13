import { jsx as _jsx } from "react/jsx-runtime";
import { useEffect, useRef, useState } from 'react';
import { useColorMode } from './useColorMode';
const DNASparkBackground = ({ sparkColor: propSparkColor, strandColor: propStrandColor, className = '', particleColor: propParticleColor, connectionColor: propConnectionColor, rippleColor: propRippleColor, color: propColor, _constfill = 'white', _text = '' }) => {
    const mode = useColorMode();
    const sparkColor = propSparkColor || (mode === 'dark' ? 'rgba(255,255,255,0.8)' : 'rgba(0,0,0,0.7)');
    const strandColor = propStrandColor || (mode === 'dark' ? 'rgba(64,224,208,0.6)' : 'rgba(0,0,0,0.2)');
    const particleColor = propParticleColor || (mode === 'dark' ? 'rgba(255,255,255,0.8)' : 'rgba(0,0,0,0.7)');
    const connectionColor = propConnectionColor || (mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)');
    const rippleColor = propRippleColor || (mode === 'dark' ? 'rgba(255,255,255,0.8)' : 'rgba(0,0,0,0.08)');
    const _color = propColor || (mode === 'dark' ? 'rgba(255,255,255,0.8)' : 'rgba(0,0,0,0.7)');
    const canvasRef = useRef(null);
    const animationRef = useRef();
    const particlesRef = useRef([]);
    const basePairsRef = useRef([]);
    const mouseRef = useRef({ x: 0, y: 0 });
    const clickRipples = useRef([]);
    const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
    const [initialAnimationComplete, setInitialAnimationComplete] = useState(false);
    const shatterAnimationRef = useRef(0);
    const isShatteringRef = useRef(false);
    // Base color mapping
    const baseColors = {
        A: '#1A88FF', // Adenine
        T: '#E1AD37', // Thymine
        G: '#AA88FF', // Guanine
        C: '#AA88FF', // Cytosine
    };
    const getComplementaryBase = (base) => {
        const pairs = {
            A: 'T',
            T: 'A',
            G: 'C',
            C: 'G',
        };
        return pairs[base] || 'A';
    };
    const generateOrderedSequence = (length) => {
        const pattern = ['A', 'T', 'G', 'C'];
        return Array.from({ length }, (_, i) => pattern[i % pattern.length]);
    };
    // Function to trigger shatter animation
    const triggerShatter = () => {
        if (isShatteringRef.current || !initialAnimationComplete)
            return;
        isShatteringRef.current = true;
        shatterAnimationRef.current = 0;
        basePairsRef.current.forEach(basePair => {
            // Calculate direction away from center
            const centerX = dimensions.width / 2;
            const centerY = dimensions.height / 2;
            const angle1 = Math.atan2(basePair.y1 - centerY, basePair.x1 - centerX);
            const _angle2 = Math.atan2(basePair.y2 - centerY, basePair.x2 - centerX);
            // Set initial velocity for explosion effect
            basePair.velocityX = Math.cos(angle1) * 10;
            basePair.velocityY = Math.sin(angle1) * 10;
            // Store target positions for reassembly
            basePair.startX1 = basePair.x1;
            basePair.startY1 = basePair.y1;
            basePair.startX2 = basePair.x2;
            basePair.startY2 = basePair.y2;
            // Reset animation progress
            basePair.animationProgress = 0;
            // Clear trail
            basePair.trail = [];
        });
    };
    // Function to create spark at position
    const _createSparks = (x, y, count) => {
        for (let i = 0; i < count; i++) {
            particlesRef.current.push({
                x,
                y,
                vx: (Math.random() - 0.5) * 10,
                vy: (Math.random() - 0.5) * 10,
                size: Math.random() * 2 + 1,
                opacity: Math.random() * 0.8 + 0.2,
                angle: Math.random() * Math.PI * 2,
                speed: Math.random() * 0.05 + 0.02
            });
        }
    };
    useEffect(() => {
        const updateDimensions = () => {
            setDimensions({
                width: window.innerWidth,
                height: window.innerHeight
            });
        };
        updateDimensions();
        window.addEventListener('resize', updateDimensions);
        return () => window.removeEventListener('resize', updateDimensions);
    }, []);
    useEffect(() => {
        const handleMouseMove = (e) => {
            mouseRef.current = { x: e.clientX, y: e.clientY };
        };
        const handleClick = (e) => {
            clickRipples.current.push({
                x: e.clientX,
                y: e.clientY,
                radius: 0,
                opacity: 0.8
            });
            // Trigger shatter animation on click
            triggerShatter();
        };
        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('click', handleClick);
        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('click', handleClick);
        };
    }, [dimensions]);
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas)
            return;
        const ctx = canvas.getContext('2d');
        if (!ctx)
            return;
        // Initialize particles
        const initParticles = () => {
            particlesRef.current = [];
            const numParticles = Math.floor((dimensions.width * dimensions.height) / 8000);
            for (let i = 0; i < numParticles; i++) {
                particlesRef.current.push({
                    x: Math.random() * dimensions.width,
                    y: Math.random() * dimensions.height,
                    vx: (Math.random() - 0.5) * 0.5,
                    vy: (Math.random() - 0.5) * 0.5,
                    size: Math.random() * 2 + 1,
                    opacity: Math.random() * 0.5 + 0.3,
                    angle: Math.random() * Math.PI * 2,
                    speed: Math.random() * 0.02 + 0.01
                });
            }
        };
        // Initialize base pairs with animation properties
        const initBasePairs = () => {
            basePairsRef.current = [];
            const sequence = generateOrderedSequence(Math.floor(dimensions.height / 25));
            for (let i = 0; i < sequence.length; i++) {
                const base2 = sequence[i];
                const base1 = getComplementaryBase(base2);
                // Start positions (random on screen)
                const startX1 = Math.random() * dimensions.width;
                const startY1 = Math.random() * dimensions.height;
                const startX2 = Math.random() * dimensions.width;
                const startY2 = Math.random() * dimensions.height;
                // Target positions (will be calculated later)
                const _targetY = i * 25;
                basePairsRef.current.push({
                    base1,
                    base2,
                    x1: startX1,
                    y1: startY1,
                    x2: startX2,
                    y2: startY2,
                    z1: 0,
                    z2: 0,
                    glowIntensity: 0,
                    isVisible: true,
                    // Animation properties
                    startX1,
                    startY1,
                    startX2,
                    startY2,
                    animationProgress: 0,
                    velocityX: 0,
                    velocityY: 0,
                    trail: []
                });
            }
        };
        initParticles();
        initBasePairs();
        let time = 0;
        let waveOffset = 0;
        let initialAnimationTimer = 0;
        const initialAnimationDuration = 2000; // 2 seconds
        const animate = (_timestamp) => {
            if (!ctx)
                return;
            ctx.clearRect(0, 0, dimensions.width, dimensions.height);
            // Update time and wave
            time += 0.02;
            waveOffset += 0.05;
            // Handle initial animation
            if (!initialAnimationComplete) {
                initialAnimationTimer += 16; // approx 60fps
                const progress = Math.min(1, initialAnimationTimer / initialAnimationDuration);
                basePairsRef.current.forEach(basePair => {
                    basePair.animationProgress = progress;
                    // Add trail effect
                    basePair.trail.push({
                        x: basePair.x1,
                        y: basePair.y1,
                        opacity: 1
                    });
                    // Keep trail length manageable
                    if (basePair.trail.length > 15) {
                        basePair.trail.shift();
                    }
                    // Fade out trail
                    basePair.trail.forEach(point => point.opacity *= 0.9);
                });
                if (progress >= 1) {
                    setInitialAnimationComplete(true);
                }
            }
            // Handle shatter animation
            if (isShatteringRef.current) {
                shatterAnimationRef.current += 16;
                const shatterProgress = Math.min(1, shatterAnimationRef.current / 1000);
                if (shatterProgress >= 1) {
                    isShatteringRef.current = false;
                }
            }
            // Draw DNA double helix with enhanced features
            drawEnhancedDNAHelix(ctx, time, waveOffset);
            // Update and draw particles
            updateParticles();
            drawParticles(ctx);
            // Update and draw click ripples
            updateClickRipples();
            drawClickRipples(ctx);
            animationRef.current = requestAnimationFrame(animate);
        };
        const drawEnhancedDNAHelix = (ctx, t, waveOffset) => {
            const centerX = dimensions.width / 2;
            const amplitude = 100;
            const frequency = 0.015;
            const verticalSpacing = 25;
            const helixHeight = dimensions.height + 200;
            const mouse = mouseRef.current;
            // Update base pair positions and glow
            basePairsRef.current.forEach((basePair, index) => {
                const targetY = index * verticalSpacing;
                // Calculate target positions with wave animation
                const waveAmplitude = Math.sin(waveOffset + targetY * 0.01) * 10;
                const targetX1 = centerX + Math.sin(targetY * frequency + t) * (amplitude + waveAmplitude);
                const targetX2 = centerX + Math.sin(targetY * frequency + t + Math.PI) * (amplitude + waveAmplitude);
                const z1 = Math.cos(targetY * frequency + t) * amplitude;
                const z2 = Math.cos(targetY * frequency + t + Math.PI) * amplitude;
                // Handle animations
                if (!initialAnimationComplete) {
                    // Initial assembly animation
                    const progress = basePair.animationProgress;
                    // Ease-out interpolation
                    const ease = 1 - Math.pow(1 - progress, 3);
                    basePair.x1 = basePair.startX1 + (targetX1 - basePair.startX1) * ease;
                    basePair.y1 = basePair.startY1 + (targetY - basePair.startY1) * ease;
                    basePair.x2 = basePair.startX2 + (targetX2 - basePair.startX2) * ease;
                    basePair.y2 = basePair.startY2 + (targetY - basePair.startY2) * ease;
                }
                else if (isShatteringRef.current) {
                    // Shatter animation
                    const shatterProgress = shatterAnimationRef.current / 1000;
                    if (shatterProgress < 0.5) {
                        // Explosion phase
                        basePair.x1 += basePair.velocityX;
                        basePair.y1 += basePair.velocityY;
                        basePair.x2 += basePair.velocityX * 0.8;
                        basePair.y2 += basePair.velocityY * 0.8;
                        // Add friction
                        basePair.velocityX *= 0.95;
                        basePair.velocityY *= 0.95;
                        // Add trail
                        basePair.trail.push({
                            x: basePair.x1,
                            y: basePair.y1,
                            opacity: 1
                        });
                        // Keep trail length manageable
                        if (basePair.trail.length > 10) {
                            basePair.trail.shift();
                        }
                        // Fade out trail
                        basePair.trail.forEach(point => point.opacity *= 0.8);
                    }
                    else {
                        // Reassembly phase
                        const reassemblyProgress = (shatterProgress - 0.5) * 2;
                        const ease = reassemblyProgress * reassemblyProgress;
                        basePair.x1 = basePair.x1 + (targetX1 - basePair.x1) * ease;
                        basePair.y1 = basePair.y1 + (targetY - basePair.y1) * ease;
                        basePair.x2 = basePair.x2 + (targetX2 - basePair.x2) * ease;
                        basePair.y2 = basePair.y2 + (targetY - basePair.y2) * ease;
                        // Add trail
                        if (Math.random() < 0.3) {
                            basePair.trail.push({
                                x: basePair.x1,
                                y: basePair.y1,
                                opacity: 1
                            });
                        }
                        // Keep trail length manageable
                        if (basePair.trail.length > 8) {
                            basePair.trail.shift();
                        }
                        // Fade out trail
                        basePair.trail.forEach(point => point.opacity *= 0.85);
                    }
                }
                else {
                    // Normal position
                    basePair.x1 = targetX1;
                    basePair.y1 = targetY;
                    basePair.x2 = targetX2;
                    basePair.y2 = targetY;
                }
                basePair.z1 = z1;
                basePair.z2 = z2;
                // Calculate glow based on mouse proximity
                const dist1 = Math.sqrt(Math.pow((basePair.x1 - mouse.x), 2) + Math.pow((basePair.y1 - mouse.y), 2));
                const dist2 = Math.sqrt(Math.pow((basePair.x2 - mouse.x), 2) + Math.pow((basePair.y2 - mouse.y), 2));
                const minDist = Math.min(dist1, dist2);
                const glowRadius = 120;
                if (minDist < glowRadius) {
                    basePair.glowIntensity = Math.max(0, 1 - minDist / glowRadius);
                }
                else {
                    basePair.glowIntensity *= 0.95; // Fade out glow
                }
                basePair.isVisible = z1 > -50 || z2 > -50; // Only show if not too far back
            });
            // Draw DNA backbone (phosphate-sugar backbone)
            drawBackbone(ctx, t, waveOffset, centerX, amplitude, frequency, helixHeight);
            // Draw base pairs
            drawBasePairs(ctx);
            // Draw connecting base pair bonds
            drawBasePairConnections(ctx);
            // Draw molecular structures
            drawMolecularStructures(ctx);
            // Draw animation trails
            drawAnimationTrails(ctx);
        };
        // Full nucleotide structures: base + ribose + phosphate
        const rng = (ctx, v) => {
            ctx.beginPath(); ctx.moveTo(v[0].x,v[0].y);
            for (let i=1;i<v.length;i++) ctx.lineTo(v[i].x,v[i].y);
            ctx.closePath(); ctx.stroke();
            ctx.globalAlpha*=0.1; ctx.fill(); ctx.globalAlpha/=0.1;
        };
        const bnd = (ctx, a, b) => { ctx.beginPath(); ctx.moveTo(a.x,a.y); ctx.lineTo(b.x,b.y); ctx.stroke(); };
        const dbl = (ctx, a, b, g) => {
            const dx=b.x-a.x, dy=b.y-a.y, l=Math.sqrt(dx*dx+dy*dy), nx=-dy/l*g, ny=dx/l*g;
            ctx.beginPath(); ctx.moveTo(a.x+nx,a.y+ny); ctx.lineTo(b.x+nx,b.y+ny); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(a.x-nx,a.y-ny); ctx.lineTo(b.x-nx,b.y-ny); ctx.stroke();
        };
        const lbl = (ctx, text, x, y) => ctx.fillText(text, x, y);

        const drawMolecularStructures = (ctx) => {
            const totalH = dimensions.height - 40;
            const sp = totalH / 5;
            const R = 50;  // base ring scale
            const sr = 26; // sugar ring radius
            const mouse = mouseRef.current;
            const t = Date.now() * 0.001;

            const structs = [
                { base: 'A', side: 'left' },
                { base: 'T', side: 'right' },
                { base: 'G', side: 'left' },
                { base: 'C', side: 'right' },
            ];

            structs.forEach((struct, idx) => {
                const base = struct.base;
                const ox = struct.side === 'left' ? 170 : dimensions.width - 170;
                const offsetY = struct.side === 'left' ? 30 : -30;
                const oy = 40 + sp * (idx + 0.5) + offsetY;
                const fx = ox + Math.sin(t*0.7+idx*1.2)*8 + (()=>{const d=ox-mouse.x,dd=oy-mouse.y,dist=Math.sqrt(d*d+dd*dd); return dist<250?(d/dist)*(250-dist)*0.04:0;})();
                const fy = oy + Math.cos(t*0.9+idx*1.5)*6 + (()=>{const d=ox-mouse.x,dd=oy-mouse.y,dist=Math.sqrt(d*d+dd*dd); return dist<250?(dd/dist)*(250-dist)*0.04:0;})();

                ctx.save();
                ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
                const sc = baseColors[base];

                // === PURINE (A, G): fused 6-ring (pyrimidine) + 5-ring (imidazole) ===
                if (base === 'A' || base === 'G') {
                    ctx.strokeStyle = sc; ctx.fillStyle = sc; ctx.lineWidth = 2.2; ctx.globalAlpha = 0.75; ctx.font = 'bold 13px monospace';

                    // Purine skeleton vertices (realistic proportions, not regular polygons)
                    // Pyrimidine ring: N1(top-left), C2(top-mid), N3(top-right), C4(right-mid), C5(bottom-right), C6(bottom-left=fusion)
                    // Imidazole ring: C4(right-mid)=shared, C5(bottom-right)=shared, N7(bottom-mid), C8(bottom-left-ish), N9(far-left)
                    const pur = [
                        { x: fx - R*0.30, y: fy - R*0.90, lab: 'N' },   // N1
                        { x: fx + R*0.30, y: fy - R*0.90, lab: 'C' },   // C2
                        { x: fx + R*0.75, y: fy - R*0.35, lab: 'N' },   // N3
                        { x: fx + R*0.60, y: fy + R*0.15, lab: 'C' },   // C4 (shared)
                        { x: fx + R*0.15, y: fy + R*0.30, lab: 'C' },   // C5 (shared)
                        { x: fx - R*0.45, y: fy + R*0.05, lab: 'C' },   // C6
                        { x: fx - R*0.20, y: fy + R*0.65, lab: 'N' },   // N7
                        { x: fx - R*0.55, y: fy + R*0.45, lab: 'C' },   // C8
                        { x: fx - R*0.75, y: fy - R*0.10, lab: 'N' },   // N9
                    ];
                    // Draw 6-ring: vertices 0,1,2,3,4,5
                    rng(ctx, [pur[0], pur[1], pur[2], pur[3], pur[4], pur[5]]);
                    // Draw 5-ring: vertices 3,4,6,7,8
                    rng(ctx, [pur[3], pur[4], pur[6], pur[7], pur[8]]);

                    // Labels
                    lbl(ctx, 'N', pur[0].x-14, pur[0].y);
                    lbl(ctx, 'N', pur[2].x+16, pur[2].y);
                    lbl(ctx, 'N', pur[8].x-14, pur[8].y);
                    lbl(ctx, 'N', pur[6].x, pur[6].y+16);
                    dbl(ctx, pur[4], pur[5], 3);

                    if (base === 'A') {
                        lbl(ctx, 'NH₂', pur[1].x, pur[1].y-16);
                        ctx.font = 'bold 18px monospace'; ctx.globalAlpha=1;
                        ctx.fillText('A', fx, fy+R*1.8);
                    } else {
                        lbl(ctx, 'NH₂', pur[1].x, pur[1].y-16);
                        lbl(ctx, 'O', pur[5].x-14, pur[5].y-8);
                        dbl(ctx, pur[5], {x:pur[5].x-18, y:pur[5].y-10}, 2.5);
                        ctx.font = 'bold 18px monospace'; ctx.globalAlpha=1;
                        ctx.fillText('G', fx, fy+R*1.8);
                    }
                }
                // === PYRIMIDINE (T, C): single 6-ring ===
                else {
                    ctx.strokeStyle = sc; ctx.fillStyle = sc; ctx.lineWidth = 2.2; ctx.globalAlpha = 0.75; ctx.font = 'bold 13px monospace';

                    const pyr = [
                        { x: fx - R*0.40, y: fy - R*0.70, lab: 'N' },   // N1
                        { x: fx + R*0.30, y: fy - R*0.90, lab: 'C' },   // C2
                        { x: fx + R*0.75, y: fy - R*0.25, lab: 'N' },   // N3
                        { x: fx + R*0.55, y: fy + R*0.25, lab: 'C' },   // C4
                        { x: fx + R*0.10, y: fy + R*0.45, lab: 'C' },   // C5
                        { x: fx - R*0.50, y: fy + R*0.10, lab: 'C' },   // C6
                    ];
                    rng(ctx, pyr);
                    lbl(ctx, 'N', pyr[0].x-14, pyr[0].y);
                    lbl(ctx, 'N', pyr[2].x+16, pyr[2].y);

                    if (base === 'T') {
                        lbl(ctx, 'O', pyr[1].x, pyr[1].y-22); dbl(ctx, pyr[1], {x:pyr[1].x,y:pyr[1].y-16}, 2.5);
                        lbl(ctx, 'O', pyr[3].x, pyr[3].y+22); dbl(ctx, pyr[3], {x:pyr[3].x,y:pyr[3].y+16}, 2.5);
                        lbl(ctx, 'CH₃', pyr[0].x-20, pyr[0].y-10);
                        dbl(ctx, pyr[4], pyr[5], 3);
                        ctx.font = 'bold 18px monospace'; ctx.globalAlpha=1;
                        ctx.fillText('T', fx, fy+R*1.6);
                    } else {
                        lbl(ctx, 'O', pyr[1].x, pyr[1].y-22); dbl(ctx, pyr[1], {x:pyr[1].x,y:pyr[1].y-16}, 2.5);
                        lbl(ctx, 'NH₂', pyr[3].x, pyr[3].y+22);
                        dbl(ctx, pyr[4], pyr[5], 3);
                        ctx.font = 'bold 18px monospace'; ctx.globalAlpha=1;
                        ctx.fillText('C', fx, fy+R*1.6);
                    }
                }

                // --- N-GLYCOSIDIC BOND (base N9/N1 to sugar C1') ---
                let baseN;
                if (base === 'A' || base === 'G') baseN = {x: fx - R*0.75, y: fy - R*0.10};     // N9
                else baseN = {x: fx - R*0.40, y: fy - R*0.70};                                   // N1

                // --- RIBOSE ---
                const sugarCY = fy + R * 1.55;
                const sugar = [];
                const sAng = [-Math.PI/2, -Math.PI/8, Math.PI/3, 4*Math.PI/5, -3*Math.PI/4];
                sAng.forEach(a => sugar.push({x:fx+sr*Math.cos(a), y:sugarCY+sr*Math.sin(a)}));

                ctx.strokeStyle = '#777'; ctx.fillStyle = '#777'; ctx.globalAlpha = 0.5; ctx.lineWidth = 1.8;
                rng(ctx, sugar);
                ctx.font = 'bold 12px monospace';
                lbl(ctx, 'O', sugar[0].x, sugar[0].y-12);

                // OH on 2' and 3'
                ctx.fillStyle = '#d44'; ctx.globalAlpha = 0.65; ctx.strokeStyle = '#d44'; ctx.lineWidth = 1.5;
                bnd(ctx, sugar[2], {x:sugar[2].x+10,y:sugar[2].y+14});
                bnd(ctx, sugar[3], {x:sugar[3].x-6,y:sugar[3].y+20});
                lbl(ctx, 'OH', sugar[2].x+14, sugar[2].y+18);
                lbl(ctx, 'OH', sugar[3].x-10, sugar[3].y+24);

                // N-glycosidic bond
                ctx.globalAlpha = 0.55; ctx.strokeStyle = '#999'; ctx.lineWidth = 2;
                bnd(ctx, baseN, sugar[1]);

                // --- PHOSPHATE ---
                const pAt = {x: sugar[4].x - 26, y: sugar[4].y - 16};
                ctx.strokeStyle = '#f80'; ctx.fillStyle = '#f80'; ctx.globalAlpha = 0.7; ctx.lineWidth = 1.8; ctx.font = 'bold 12px monospace';
                bnd(ctx, sugar[4], pAt);
                lbl(ctx, 'P', pAt.x, pAt.y-8);
                lbl(ctx, 'O', pAt.x-16, pAt.y);
                lbl(ctx, 'O', pAt.x+16, pAt.y);
                lbl(ctx, 'O⁻', pAt.x, pAt.y+16);
                dbl(ctx, pAt, {x:pAt.x, y:pAt.y-18}, 2.5);

                ctx.restore();
            });
        };

        const drawAnimationTrails = (ctx) => {
            basePairsRef.current.forEach(basePair => {
                if (basePair.trail.length < 2)
                    return;
                ctx.lineWidth = 2;
                ctx.lineCap = 'round';
                // Draw trail for base1
                for (let i = 1; i < basePair.trail.length; i++) {
                    const start = basePair.trail[i - 1];
                    const end = basePair.trail[i];
                    if (start.opacity < 0.05 || end.opacity < 0.05)
                        continue;
                    const gradient = ctx.createLinearGradient(start.x, start.y, end.x, end.y);
                    gradient.addColorStop(0, `rgba(26, 136, 255, ${start.opacity * 0.5})`);
                    gradient.addColorStop(1, `rgba(26, 136, 255, ${end.opacity * 0.5})`);
                    ctx.strokeStyle = gradient;
                    ctx.beginPath();
                    ctx.moveTo(start.x, start.y);
                    ctx.lineTo(end.x, end.y);
                    ctx.stroke();
                }
            });
        };
        const drawBackbone = (ctx, t, waveOffset, centerX, amplitude, frequency, helixHeight) => {
            const verticalSpacing = 8;
            // Create gradients for backbones
            const gradient1 = ctx.createLinearGradient(0, 0, 0, helixHeight);
            gradient1.addColorStop(0, 'rgba(128, 128, 128, 0.1)');
            gradient1.addColorStop(0.5, 'rgba(128, 128, 128, 0.6)');
            gradient1.addColorStop(1, 'rgba(128, 128, 128, 0.1)');
            const gradient2 = ctx.createLinearGradient(0, 0, 0, helixHeight);
            gradient2.addColorStop(0, 'rgba(169, 169, 169, 0.1)');
            gradient2.addColorStop(0.5, 'rgba(169, 169, 169, 0.6)');
            gradient2.addColorStop(1, 'rgba(169, 169, 169, 0.1)');
            // Draw first backbone strand
            ctx.beginPath();
            ctx.strokeStyle = gradient1;
            ctx.lineWidth = 4;
            ctx.lineCap = 'round';
            let _prevX1 = 0, _prevY1 = 0;
            for (let y = -100; y < helixHeight; y += verticalSpacing) {
                const waveAmplitude = Math.sin(waveOffset + y * 0.01) * 10;
                const x1 = centerX + Math.sin(y * frequency + t) * (amplitude + waveAmplitude);
                const z1 = Math.cos(y * frequency + t) * amplitude;
                const scale1 = (z1 + amplitude) / (2 * amplitude);
                if (y === -100) {
                    ctx.moveTo(x1, y);
                }
                else {
                    ctx.globalAlpha = 0.3 + scale1 * 0.7;
                    ctx.lineTo(x1, y);
                }
                _prevX1 = x1;
                _prevY1 = y;
            }
            ctx.stroke();
            // Draw second backbone strand
            ctx.beginPath();
            ctx.strokeStyle = gradient2;
            ctx.lineWidth = 4;
            for (let y = -100; y < helixHeight; y += verticalSpacing) {
                const waveAmplitude = Math.sin(waveOffset + y * 0.01) * 10;
                const x2 = centerX + Math.sin(y * frequency + t + Math.PI) * (amplitude + waveAmplitude);
                const z2 = Math.cos(y * frequency + t + Math.PI) * amplitude;
                const scale2 = (z2 + amplitude) / (2 * amplitude);
                if (y === -100) {
                    ctx.moveTo(x2, y);
                }
                else {
                    ctx.globalAlpha = 0.3 + scale2 * 0.7;
                    ctx.lineTo(x2, y);
                }
            }
            ctx.stroke();
            ctx.globalAlpha = 1;
        };
        const drawBasePairs = (ctx) => {
            basePairsRef.current.forEach(basePair => {
                if (!basePair.isVisible)
                    return;
                const scale1 = (basePair.z1 + 100) / 200;
                const scale2 = (basePair.z2 + 100) / 200;
                // Draw base 1
                if (basePair.z1 > -50) {
                    ctx.globalAlpha = 0.4 + scale1 * 0.6;
                    // Glow effect
                    if (basePair.glowIntensity > 0) {
                        ctx.shadowBlur = 20 * basePair.glowIntensity;
                        ctx.shadowColor = baseColors[basePair.base1];
                    }
                    ctx.fillStyle = baseColors[basePair.base1];
                    ctx.beginPath();
                    ctx.arc(basePair.x1, basePair.y1, 8 * scale1, 0, Math.PI * 2);
                    ctx.fill();
                    // Draw base letter
                    ctx.shadowBlur = 0;
                    ctx.fillStyle = 'white';
                    ctx.font = `${12 * scale1}px Arial`;
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    ctx.fillText(basePair.base1, basePair.x1, basePair.y1);
                }
                // Draw base 2
                if (basePair.z2 > -50) {
                    ctx.globalAlpha = 0.4 + scale2 * 0.6;
                    // Glow effect
                    if (basePair.glowIntensity > 0) {
                        ctx.shadowBlur = 20 * basePair.glowIntensity;
                        ctx.shadowColor = baseColors[basePair.base2];
                    }
                    ctx.fillStyle = baseColors[basePair.base2];
                    ctx.beginPath();
                    ctx.arc(basePair.x2, basePair.y2, 8 * scale2, 0, Math.PI * 2);
                    ctx.fill();
                    // Draw base letter
                    ctx.shadowBlur = 0;
                    ctx.fillStyle = 'white';
                    ctx.font = `${12 * scale2}px Arial`;
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    ctx.fillText(basePair.base2, basePair.x2, basePair.y2);
                }
            });
            ctx.globalAlpha = 1;
            ctx.shadowBlur = 0;
        };
        const drawBasePairConnections = (ctx) => {
            basePairsRef.current.forEach(basePair => {
                if (!basePair.isVisible || basePair.z1 < -50 || basePair.z2 < -50)
                    return;
                const avgZ = (basePair.z1 + basePair.z2) / 2;
                const scale = (avgZ + 100) / 200;
                // Determine bond type (A-T: 2 bonds, G-C: 3 bonds)
                const bondCount = (basePair.base1 === 'A' || basePair.base1 === 'C') ? 2 : 3;
                const bondSpacing = 3;
                ctx.globalAlpha = 0.3 + scale * 0.4;
                // Glow effect for connections
                if (basePair.glowIntensity > 0) {
                    ctx.shadowBlur = 10 * basePair.glowIntensity;
                    ctx.shadowColor = 'rgba(255, 255, 255, 0.8)';
                    ctx.strokeStyle = `rgba(255, 255, 255, ${0.5 + basePair.glowIntensity * 0.5})`;
                }
                else {
                    ctx.strokeStyle = connectionColor;
                }
                ctx.lineWidth = 2;
                // Draw hydrogen bonds
                for (let i = 0; i < bondCount; i++) {
                    const offset = (i - (bondCount - 1) / 2) * bondSpacing;
                    ctx.beginPath();
                    ctx.moveTo(basePair.x1, basePair.y1 + offset);
                    ctx.lineTo(basePair.x2, basePair.y2 + offset);
                    ctx.stroke();
                }
                ctx.shadowBlur = 0;
            });
            ctx.globalAlpha = 1;
        };
        const updateParticles = () => {
            const mouse = mouseRef.current;
            particlesRef.current.forEach(particle => {
                // Mouse repulsion
                const dx = particle.x - mouse.x;
                const dy = particle.y - mouse.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                const repulsionRadius = 150;
                if (distance < repulsionRadius) {
                    const force = (repulsionRadius - distance) / repulsionRadius;
                    const angle = Math.atan2(dy, dx);
                    particle.vx += Math.cos(angle) * force * 0.02;
                    particle.vy += Math.sin(angle) * force * 0.02;
                }
                // Apply velocity
                particle.x += particle.vx;
                particle.y += particle.vy;
                // Add some random movement
                particle.angle += particle.speed;
                particle.vx += Math.cos(particle.angle) * 0.001;
                particle.vy += Math.sin(particle.angle) * 0.001;
                // Damping
                particle.vx *= 0.99;
                particle.vy *= 0.99;
                // Boundary wrapping
                if (particle.x < 0)
                    particle.x = dimensions.width;
                if (particle.x > dimensions.width)
                    particle.x = 0;
                if (particle.y < 0)
                    particle.y = dimensions.height;
                if (particle.y > dimensions.height)
                    particle.y = 0;
                // Opacity flickering
                particle.opacity += (Math.random() - 0.5) * 0.02;
                particle.opacity = Math.max(0.1, Math.min(0.8, particle.opacity));
            });
        };
        const drawParticles = (ctx) => {
            particlesRef.current.forEach(particle => {
                ctx.globalAlpha = particle.opacity;
                ctx.fillStyle = sparkColor;
                ctx.beginPath();
                ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
                ctx.fill();
                // Add subtle glow
                ctx.shadowBlur = 10;
                ctx.shadowColor = sparkColor;
                ctx.beginPath();
                ctx.arc(particle.x, particle.y, particle.size * 0.5, 0, Math.PI * 2);
                ctx.fill();
                ctx.shadowBlur = 0;
            });
            ctx.globalAlpha = 1;
        };
        const updateClickRipples = () => {
            clickRipples.current = clickRipples.current.filter(ripple => {
                ripple.radius += 5;
                ripple.opacity -= 0.02;
                return ripple.opacity > 0;
            });
        };
        const drawClickRipples = (ctx) => {
            clickRipples.current.forEach(ripple => {
                ctx.globalAlpha = ripple.opacity;
                ctx.strokeStyle = rippleColor;
                ctx.lineWidth = 3;
                ctx.beginPath();
                ctx.arc(ripple.x, ripple.y, ripple.radius, 0, Math.PI * 2);
                ctx.stroke();
                // Inner ripple
                ctx.globalAlpha = ripple.opacity * 0.5;
                ctx.beginPath();
                ctx.arc(ripple.x, ripple.y, ripple.radius * 0.5, 0, Math.PI * 2);
                ctx.stroke();
            });
            ctx.globalAlpha = 1;
        };
        animationRef.current = requestAnimationFrame(animate);
        return () => {
            if (animationRef.current) {
                cancelAnimationFrame(animationRef.current);
            }
        };
    }, [dimensions, sparkColor, strandColor, particleColor, connectionColor, rippleColor, initialAnimationComplete]);
    return (_jsx("canvas", { ref: canvasRef, width: dimensions.width, height: dimensions.height, className: `absolute inset-0 ${className}`, style: {
            zIndex: 0,
            pointerEvents: 'auto',
            background: 'transparent'
        } }));
};
export default DNASparkBackground;
