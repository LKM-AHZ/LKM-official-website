import { jsx as _jsx } from "react/jsx-runtime";
import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { useColorMode } from './useColorMode';
const DNASparkBackground3D = ({ sparkColor: propSparkColor, strandColor: propStrandColor, className = '', particleColor: propParticleColor, connectionColor: propConnectionColor, rippleColor: propRippleColor, color: propColor, _constfill = 'white', _text = '', basePairCount = 40, helixRadius = 25, helixHeight = 400, _basePairSpacing = 10, backboneSegments = 100, backboneRadius = 2, baseSphereRadius = 4, baseSphereSegments = 16, particleCount = 100, particleSize = 1, particleSpeedMin = 0.01, particleSpeedMax = 0.03, glowRadius = 30, glowIntensityMultiplier = 0.3, cameraOrbitRadius = 200, cameraOrbitSpeed = 0.1, dnaRotationSpeed = 0.2, particleOrbitalAmplitude = 0.1, rippleGrowthRate = 0.1, rippleFadeRate = 0.02 }) => {
    const mode = useColorMode();
    const sparkColor = propSparkColor || (mode === 'dark' ? 'rgba(255,255,255,0.8)' : 'rgba(0,0,0,0.7)');
    const strandColor = propStrandColor || (mode === 'dark' ? 'rgba(64,224,208,0.6)' : 'rgba(0,0,0,0.2)');
    const particleColor = propParticleColor || (mode === 'dark' ? 'rgba(255,255,255,0.8)' : 'rgba(0,0,0,0.7)');
    const connectionColor = propConnectionColor || (mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)');
    const rippleColor = propRippleColor || (mode === 'dark' ? 'rgba(255,255,255,0.8)' : 'rgba(0,0,0,0.08)');
    const _color = propColor || (mode === 'dark' ? 'rgba(255,255,255,0.8)' : 'rgba(0,0,0,0.7)');
    const mountRef = useRef(null);
    const sceneRef = useRef();
    const rendererRef = useRef();
    const cameraRef = useRef();
    const animationRef = useRef();
    const particlesRef = useRef([]);
    const basePairsRef = useRef([]);
    const backboneRef = useRef();
    const mouseRef = useRef(new THREE.Vector2());
    const raycasterRef = useRef(new THREE.Raycaster());
    const clickRipples = useRef([]);
    const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
    // Base color mapping
    const baseColors = {
        A: 0x4169E1, // Royal Blue
        T: 0xFFD700, // Gold
        G: 0x1E90FF, // Dodger Blue
        C: 0xFFA500 // Orange
    };
    // Complementary base pairs
    const getComplementaryBase = (base) => {
        const pairs = { A: 'T', T: 'A', G: 'C', C: 'G' };
        return pairs[base] || 'A';
    };
    // Generate random DNA sequence
    const generateDNASequence = (length) => {
        const bases = ['A', 'T', 'G', 'C'];
        return Array.from({ length }, () => bases[Math.floor(Math.random() * bases.length)]).join('');
    };
    // Convert rgba string to THREE.Color
    const rgbaToThreeColor = (rgba) => {
        const match = rgba.match(/rgba?\(([^)]+)\)/);
        if (match) {
            const values = match[1].split(',').map(v => parseFloat(v.trim()));
            return new THREE.Color(values[0] / 255, values[1] / 255, values[2] / 255);
        }
        return new THREE.Color(0xffffff);
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
        const handleMouseMove = (event) => {
            mouseRef.current.x = (event.clientX / (window.innerWidth)) * 2 - 1;
            mouseRef.current.y = -(event.clientY / (window.innerHeight)) * 2 + 1;
            // Drag rotation for nucleotide groups
            if (nucDragState.active >= 0 && rendererRef.current && cameraRef.current) {
                const cam = cameraRef.current;
                const dx = event.clientX - nucDragState.lastX;
                const dy = event.clientY - nucDragState.lastY;
                const group = nucleotideGroups[nucDragState.active];
                if (group) {
                    // Rotate around camera's up and right axes for intuitive drag
                    const camRight = new THREE.Vector3();
                    camRight.crossVectors(cam.up, new THREE.Vector3().subVectors(new THREE.Vector3(0,0,0), cam.position).normalize()).normalize();
                    const camUp = cam.up.clone();
                    group.group.rotateOnWorldAxis(camUp, dx * 0.005);
                    group.group.rotateOnWorldAxis(camRight, -dy * 0.005);
                }
                nucDragState.lastX = event.clientX;
                nucDragState.lastY = event.clientY;
            }
        };
        const handleMouseDown = (event) => {
            if (!sceneRef.current || !cameraRef.current || !rendererRef.current) return;
            const rect = rendererRef.current.domElement.getBoundingClientRect();
            // Check if click is within the 3D canvas area
            if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) return;
            const mx = ((event.clientX - rect.left) / rect.width) * 2 - 1;
            const my = -((event.clientY - rect.top) / rect.height) * 2 + 1;
            const mouse = new THREE.Vector2(mx, my);
            const raycaster = new THREE.Raycaster();
            raycaster.setFromCamera(mouse, cameraRef.current);
            for (let i = nucleotideGroups.length - 1; i >= 0; i--) {
                const intersects = raycaster.intersectObjects(nucleotideGroups[i].group.children, true);
                if (intersects.length > 0) {
                    nucDragState.active = i;
                    nucDragState.lastX = event.clientX;
                    nucDragState.lastY = event.clientY;
                    event.preventDefault();
                    event.stopPropagation();
                    return;
                }
            }
        };
        const handleMouseUp = () => { nucDragState.active = -1; };
        const handleClick = (event) => {
            if (!sceneRef.current || !cameraRef.current)
                return;
            mouseRef.current.x = (event.clientX / (window.innerWidth)) * 2 - 1;
            mouseRef.current.y = -(event.clientY / (window.innerHeight)) * 2 + 1;
            raycasterRef.current.setFromCamera(mouseRef.current, cameraRef.current);
            // Create ripple effect at click position
            const rippleGeometry = new THREE.RingGeometry(0.5, 1, 32);
            const rippleMaterial = new THREE.MeshBasicMaterial({
                color: rgbaToThreeColor(rippleColor),
                transparent: true,
                opacity: 0.8,
                side: THREE.DoubleSide
            });
            const rippleMesh = new THREE.Mesh(rippleGeometry, rippleMaterial);
            const intersects = raycasterRef.current.intersectObjects(sceneRef.current.children, true);
            if (intersects.length > 0) {
                rippleMesh.position.copy(intersects[0].point);
                rippleMesh.lookAt(cameraRef.current.position);
            }
            else {
                rippleMesh.position.set(0, 0, 0);
            }
            sceneRef.current.add(rippleMesh);
            clickRipples.current.push({ mesh: rippleMesh, scale: 1, opacity: 0.8 });
        };
        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('click', handleClick);
        window.addEventListener('mousedown', handleMouseDown);
        window.addEventListener('mouseup', handleMouseUp);
        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('click', handleClick);
            window.removeEventListener('mousedown', handleMouseDown);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [rippleColor]);
    useEffect(() => {
        if (!mountRef.current || dimensions.width === 0 || dimensions.height === 0)
            return;
        // Initialize Three.js scene
        const scene = new THREE.Scene();
        scene.background = null; // Transparent background
        sceneRef.current = scene;
        // Camera
        const camera = new THREE.PerspectiveCamera(75, dimensions.width / dimensions.height, 0.1, 1000);
        camera.position.set(0, 0, cameraOrbitRadius);
        cameraRef.current = camera;
        // Renderer
        const renderer = new THREE.WebGLRenderer({
            antialias: true,
            alpha: true,
            premultipliedAlpha: false
        });
        renderer.setSize(dimensions.width, dimensions.height);
        renderer.setPixelRatio(window.devicePixelRatio);
        renderer.shadowMap.enabled = true;
        renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        rendererRef.current = renderer;
        mountRef.current.appendChild(renderer.domElement);
        // Lighting
        const ambientLight = new THREE.AmbientLight(0x808080, 1.2);
        scene.add(ambientLight);
        const hemiLight = new THREE.HemisphereLight(0xffffff, 0x444444, 0.8);
        scene.add(hemiLight);
        const directionalLight = new THREE.DirectionalLight(0xffffff, 1.0);
        directionalLight.position.set(100, 100, 50);
        directionalLight.castShadow = true;
        scene.add(directionalLight);
        const pointLight = new THREE.PointLight(0x00ffff, 0.5, 300);
        pointLight.position.set(0, 0, 100);
        scene.add(pointLight);
        // Initialize 3D DNA structure
        initDNA3D(scene);
        // Initialize 3D particles
        initParticles3D(scene);
        // Animation loop
        let time = 0;
        let waveOffset = 0;
        const animate = () => {
            time += 0.02;
            waveOffset += 0.05;
            // Update camera orbit
            if (cameraRef.current) {
                cameraRef.current.position.x = Math.cos(time * cameraOrbitSpeed) * cameraOrbitRadius;
                cameraRef.current.position.z = Math.sin(time * cameraOrbitSpeed) * cameraOrbitRadius;
                cameraRef.current.lookAt(0, 0, 0);
            }
            // Update DNA animation
            updateDNA3D(time, waveOffset);
            // Update particles
            updateParticles3D();
            // Keep nucleotide groups fixed in screen space by parenting to camera position
            if (cameraRef.current) {
                const cam = cameraRef.current;
                const camDir = new THREE.Vector3();
                cam.getWorldDirection(camDir);
                const camRight = new THREE.Vector3();
                camRight.crossVectors(cam.up, camDir).normalize();
                const camUp = new THREE.Vector3().crossVectors(camDir, camRight).normalize();

                const aspect = dimensions.width / dimensions.height;
                const fovRad = 75 * Math.PI / 180;
                const dist = 120;
                const halfH = Math.tan(fovRad / 2) * dist;
                const halfW = halfH * aspect;

                nucleotideGroups.forEach((g, i) => {
                    // 4 corners: A=top-left, T=top-right, G=bottom-left, C=bottom-right
                    const sideMul = g.side === 'left' ? 1 : -1;
                    const topMul = i < 2 ? 1 : -1; // A,T top; G,C bottom
                    g.group.position.copy(cam.position)
                        .addScaledVector(camDir, dist)
                        .addScaledVector(camRight, sideMul * halfW * 0.5)
                        .addScaledVector(camUp, topMul * halfH * 0.5);
                    // Only set initial orientation once, not every frame
                    if (!g.group.userData.initialized) {
                        g.group.lookAt(cam.position);
                        g.group.userData.initialized = true;
                    }
                    if (nucDragState.active !== i) {
                        g.group.rotateOnWorldAxis(new THREE.Vector3(0, 1, 0), 0.005);
                    }
                });
            }
            // Update click ripples
            updateClickRipples3D();
            // Update glow effects based on mouse
            updateGlowEffects();
            renderer.render(scene, camera);
            animationRef.current = requestAnimationFrame(animate);
        };
        animate();
        return () => {
            if (animationRef.current) {
                cancelAnimationFrame(animationRef.current);
            }
            if (mountRef.current && renderer.domElement) {
                mountRef.current.removeChild(renderer.domElement);
            }
            renderer.dispose();
        };
    }, [dimensions, sparkColor, strandColor, particleColor, connectionColor, rippleColor, cameraOrbitRadius, cameraOrbitSpeed]);
    const initDNA3D = (scene) => {
        const sequence = generateDNASequence(basePairCount);
        // Create DNA backbone — two strands offset by π phase
        const h = helixHeight * 2;
        const turns = 8;
        const curve1 = new THREE.CatmullRomCurve3(Array.from({ length: backboneSegments }, (_, i) => {
            const t = (i / (backboneSegments - 1)) * Math.PI * 2 * turns;
            const y = (i / (backboneSegments - 1)) * h - h / 2;
            return new THREE.Vector3(Math.cos(t) * helixRadius, y, Math.sin(t) * helixRadius);
        }));
        const curve2 = new THREE.CatmullRomCurve3(Array.from({ length: backboneSegments }, (_, i) => {
            const t = (i / (backboneSegments - 1)) * Math.PI * 2 * turns + Math.PI;
            const y = (i / (backboneSegments - 1)) * h - h / 2;
            return new THREE.Vector3(Math.cos(t) * helixRadius, y, Math.sin(t) * helixRadius);
        }));
        const backboneGeo1 = new THREE.TubeGeometry(curve1, backboneSegments, backboneRadius, 8, false);
        const backboneGeo2 = new THREE.TubeGeometry(curve2, backboneSegments, backboneRadius, 8, false);
        const mat1 = new THREE.MeshPhongMaterial({ color: 0x808080, transparent: true, opacity: 0.7, shininess: 100 });
        const mat2 = new THREE.MeshPhongMaterial({ color: 0xa9a9a9, transparent: true, opacity: 0.7, shininess: 100 });
        const backboneMesh1 = new THREE.Mesh(backboneGeo1, mat1);
        const backboneMesh2 = new THREE.Mesh(backboneGeo2, mat2);
        scene.add(backboneMesh1);
        scene.add(backboneMesh2);
        backboneRef.current = { mesh1: backboneMesh1, mesh2: backboneMesh2 };
        // Add 3D molecular structures
        initMolecularStructures3D(scene);
        // Create base pairs
        basePairsRef.current = [];
        const seqLen = sequence.length * 2;
        for (let i = 0; i < seqLen; i++) {
            const base1 = sequence[i % sequence.length];
            const base2 = getComplementaryBase(base1);
            const y = (i / (seqLen - 1)) * h - h / 2;
            const angle = (i / seqLen) * Math.PI * 2 * turns;
            const pos1 = new THREE.Vector3(Math.cos(angle) * helixRadius, y, Math.sin(angle) * helixRadius);
            const pos2 = new THREE.Vector3(Math.cos(angle + Math.PI) * helixRadius, y, Math.sin(angle + Math.PI) * helixRadius);
            // Create base geometries
            const baseGeometry = new THREE.SphereGeometry(baseSphereRadius, baseSphereSegments, baseSphereSegments);
            // Base 1
            const baseMaterial1 = new THREE.MeshPhongMaterial({
                color: baseColors[base1],
                transparent: true,
                opacity: 0.8,
                shininess: 100
            });
            const baseMesh1 = new THREE.Mesh(baseGeometry, baseMaterial1);
            baseMesh1.position.copy(pos1);
            scene.add(baseMesh1);
            // Base 2
            const baseMaterial2 = new THREE.MeshPhongMaterial({
                color: baseColors[base2],
                transparent: true,
                opacity: 0.8,
                shininess: 100
            });
            const baseMesh2 = new THREE.Mesh(baseGeometry, baseMaterial2);
            baseMesh2.position.copy(pos2);
            scene.add(baseMesh2);
            // Create hydrogen bonds
            const bondCount = (base1 === 'A' || base1 === 'T') ? 2 : 3;
            const connections = [];
            for (let j = 0; j < bondCount; j++) {
                const bondGeometry = new THREE.CylinderGeometry(0.5, 0.5, pos1.distanceTo(pos2), 8);
                const bondMaterial = new THREE.MeshPhongMaterial({
                    color: 0xffffff,
                    transparent: true,
                    opacity: 0.4
                });
                const bondMesh = new THREE.Mesh(bondGeometry, bondMaterial);
                // Position bond between bases
                bondMesh.position.copy(pos1).add(pos2).multiplyScalar(0.5);
                bondMesh.lookAt(pos2);
                bondMesh.rotateX(Math.PI / 2);
                // Offset multiple bonds
                const offset = (j - (bondCount - 1) / 2) * 1.5;
                bondMesh.position.add(new THREE.Vector3(0, offset, 0));
                scene.add(bondMesh);
                connections.push(bondMesh);
            }
            basePairsRef.current.push({
                base1,
                base2,
                mesh1: baseMesh1,
                mesh2: baseMesh2,
                connections,
                originalGlow: 0,
                glowIntensity: 0
            });
        }
    };
    const initParticles3D = (scene) => {
        const particleGeometry = new THREE.SphereGeometry(particleSize, 8, 8);
        const particleMaterial = new THREE.MeshBasicMaterial({
            color: rgbaToThreeColor(sparkColor),
            transparent: true,
            opacity: 0.6
        });
        particlesRef.current = [];
        for (let i = 0; i < particleCount; i++) {
            const particle = new THREE.Mesh(particleGeometry, particleMaterial.clone());
            const position = new THREE.Vector3((Math.random() - 0.5) * 400, (Math.random() - 0.5) * 400, (Math.random() - 0.5) * 400);
            particle.position.copy(position);
            scene.add(particle);
            const speed = Math.random() * (particleSpeedMax - particleSpeedMin) + particleSpeedMin;
            particlesRef.current.push({
                mesh: particle,
                velocity: new THREE.Vector3((Math.random() - 0.5) * 0.5, (Math.random() - 0.5) * 0.5, (Math.random() - 0.5) * 0.5),
                originalPosition: position.clone(),
                angle: Math.random() * Math.PI * 2,
                speed
            });
        }
    };
    const updateDNA3D = (time, waveOffset) => {
        // Animate DNA structure
        if (backboneRef.current) {
            backboneRef.current.mesh1.rotation.y = time * dnaRotationSpeed;
            backboneRef.current.mesh2.rotation.y = time * dnaRotationSpeed;
        }
        // Animate base pairs
        basePairsRef.current.forEach((basePair, index) => {
            const waveAmplitude = Math.sin(waveOffset + index * 0.2) * 2;
            const rotationOffset = time * dnaRotationSpeed + index * 0.2;
            // Apply wave motion to bases
            basePair.mesh1.position.x += Math.cos(rotationOffset) * waveAmplitude * 0.1;
            basePair.mesh1.position.z += Math.sin(rotationOffset) * waveAmplitude * 0.1;
            basePair.mesh2.position.x += Math.cos(rotationOffset + Math.PI) * waveAmplitude * 0.1;
            basePair.mesh2.position.z += Math.sin(rotationOffset + Math.PI) * waveAmplitude * 0.1;
            // Rotate bases
            basePair.mesh1.rotation.y = time + index * 0.1;
            basePair.mesh2.rotation.y = time + index * 0.1;
        });
    };
    const updateParticles3D = () => {
        if (!cameraRef.current)
            return;
        particlesRef.current.forEach(particle => {
            // Mouse repulsion in 3D
            const mouse3D = new THREE.Vector3();
            mouse3D.x = mouseRef.current.x * 100;
            mouse3D.y = mouseRef.current.y * 100;
            mouse3D.z = cameraRef.current ? cameraRef.current.position.z * 0.1 : 0;
            const distance = particle.mesh.position.distanceTo(mouse3D);
            if (distance < 50) {
                const repulsion = particle.mesh.position.clone().sub(mouse3D).normalize().multiplyScalar(0.5);
                particle.velocity.add(repulsion);
            }
            // Apply velocity
            particle.mesh.position.add(particle.velocity);
            // Add orbital motion
            particle.angle += particle.speed;
            const orbital = new THREE.Vector3(Math.cos(particle.angle) * particleOrbitalAmplitude, Math.sin(particle.angle * 0.7) * particleOrbitalAmplitude, Math.sin(particle.angle) * particleOrbitalAmplitude);
            particle.mesh.position.add(orbital);
            // Damping
            particle.velocity.multiplyScalar(0.98);
            // Boundary wrapping
            if (particle.mesh.position.x < -200)
                particle.mesh.position.x = 200;
            if (particle.mesh.position.x > 200)
                particle.mesh.position.x = -200;
            if (particle.mesh.position.y < -200)
                particle.mesh.position.y = 200;
            if (particle.mesh.position.y > 200)
                particle.mesh.position.y = -200;
            if (particle.mesh.position.z < -200)
                particle.mesh.position.z = 200;
            if (particle.mesh.position.z > 200)
                particle.mesh.position.z = -200;
        });
    };
    // Full nucleotide 3D ball-and-stick: base ring + ribose + phosphate
    const nucleotideGroups = [];
    const nucDragState = { active: -1, lastX: 0, lastY: 0 };

    const createAtom = (parent, x, y, z, color, radius = 0.65) => {
        const geo = new THREE.SphereGeometry(radius, 16, 16);
        const mat = new THREE.MeshPhongMaterial({ color, emissive: color, emissiveIntensity: 0.25, specular: 0x222222, shininess: 30 });
        const mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(x, y, z);
        parent.add(mesh);
        return mesh;
    };
    const createBond = (parent, a, b, color = 0xcccccc, radius = 0.16) => {
        const mid = new THREE.Vector3((a.x+b.x)/2, (a.y+b.y)/2, (a.z+b.z)/2);
        const dir = new THREE.Vector3(b.x-a.x, b.y-a.y, b.z-a.z);
        const len = dir.length();
        const geo = new THREE.CylinderGeometry(radius, radius, len, 8);
        const mat = new THREE.MeshPhongMaterial({ color, emissive: color, emissiveIntensity: 0.15 });
        const mesh = new THREE.Mesh(geo, mat);
        mesh.position.copy(mid);
        mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.normalize());
        parent.add(mesh);
        return mesh;
    };

    const buildNucleotide = (base, ox, oy) => {
        const group = new THREE.Group();
        group.position.set(ox, oy, 0);

        // From crystal structures: base coordinates in XY, ribose extends in Z
        // Purine: fused 6+5 ring, pyrimidine: 6-ring
        // Glycosidic bond ~N9-C1' (purine) or N1-C1' (pyrimidine), anti conformation
        // Ribose C2'-endo pucker

        const purineAtoms = (g, isG) => {
            const atoms = [
                {x:-1.46,y:2.80,z:0, c:0x3055ff,r:0.65},  // N1
                {x:0.00, y:3.40,z:0, c:0x666666,r:0.5},   // C2
                {x:1.46, y:2.80,z:0, c:0x3055ff,r:0.65},   // N3
                {x:1.15, y:1.40,z:0, c:0x666666,r:0.5},    // C4
                {x:-0.42,y:0.85,z:0, c:0x666666,r:0.5},    // C5
                {x:-1.70,y:1.50,z:0, c:0x666666,r:0.5},    // C6
                {x:-0.30,y:-0.55,z:0,c:0x3055ff,r:0.65},   // N7
                {x:-1.60,y:0.20,z:0, c:0x666666,r:0.5},    // C8
                {x:-2.15,y:1.55,z:0, c:0x3055ff,r:0.65},   // N9
            ];
            atoms.forEach(a => createAtom(g, a.x * 0.55, a.y * 0.55, a.z, a.c, a.r));
            // 6-ring: 0-1-2-3-4-5-0
            for (let i=0;i<5;i++) createBond(g, v(atoms[i]), v(atoms[i+1]));
            createBond(g, v(atoms[5]), v(atoms[0]));
            // 5-ring: 4-6-7-8-3
            createBond(g, v(atoms[4]), v(atoms[6]));
            createBond(g, v(atoms[6]), v(atoms[7]));
            createBond(g, v(atoms[7]), v(atoms[8]));
            createBond(g, v(atoms[8]), v(atoms[3]));
            // C5=C6 double bond
            addDoubleBond(g, v(atoms[4]), v(atoms[5]), 0.5, 0.18);

            // Substituents
            if (isG) {
                createAtom(g, v(atoms[1]).x, v(atoms[1]).y+1.2, -0.9, 0x3055ff, 0.5);
                createBond(g, v(atoms[1]), {x:v(atoms[1]).x, y:v(atoms[1]).y+0.7, z:-0.5});
                createAtom(g, v(atoms[5]).x-1.0, v(atoms[5]).y-0.1, 0.8, 0xff4040, 0.48);
                createBond(g, v(atoms[5]), {x:v(atoms[5]).x-0.5, y:v(atoms[5]).y, z:0.5});
            } else {
                createAtom(g, v(atoms[1]).x, v(atoms[1]).y+1.3, -0.9, 0x3055ff, 0.5);
                createBond(g, v(atoms[1]), {x:v(atoms[1]).x, y:v(atoms[1]).y+0.7, z:-0.5});
            }

            const c1prime = {x: v(atoms[8]).x - 1.8, y: v(atoms[8]).y + 0.4, z: 1.5};
            createBond(g, v(atoms[8]), c1prime);
            return c1prime;
        };

        const pyrimidineAtoms = (g, isT) => {
            const atoms = [
                {x:-1.50,y:2.30,z:0, c:0x3055ff,r:0.65}, // N1
                {x:0.00, y:3.00,z:0, c:0x666666,r:0.5},   // C2
                {x:1.50, y:2.30,z:0, c:0x3055ff,r:0.65},   // N3
                {x:1.10, y:1.00,z:0, c:0x666666,r:0.5},    // C4
                {x:-0.40,y:0.40,z:0, c:0x666666,r:0.5},    // C5
                {x:-1.70,y:1.00,z:0, c:0x666666,r:0.5},    // C6
            ];
            atoms.forEach(a => createAtom(g, a.x * 0.55, a.y * 0.55, a.z, a.c, a.r));
            for (let i=0;i<5;i++) createBond(g, v(atoms[i]), v(atoms[i+1]));
            createBond(g, v(atoms[5]), v(atoms[0]));
            // C5=C6 double bond
            addDoubleBond(g, v(atoms[4]), v(atoms[5]), 0.5, 0.18);

            if (isT) {
                createAtom(g, v(atoms[1]).x, v(atoms[1]).y+1.2, -0.8, 0xff4040, 0.48);
                createBond(g, v(atoms[1]), {x:v(atoms[1]).x, y:v(atoms[1]).y+0.7, z:-0.5});
                createAtom(g, v(atoms[3]).x, v(atoms[3]).y-1.2, 0.8, 0xff4040, 0.48);
                createBond(g, v(atoms[3]), {x:v(atoms[3]).x, y:v(atoms[3]).y-0.7, z:0.5});
                createAtom(g, v(atoms[0]).x-1.4, v(atoms[0]).y-0.1, -0.7, 0x666666, 0.5);
                createBond(g, v(atoms[0]), {x:v(atoms[0]).x-0.8, y:v(atoms[0]).y, z:-0.4});
            } else {
                createAtom(g, v(atoms[1]).x, v(atoms[1]).y+1.2, -0.8, 0xff4040, 0.48);
                createBond(g, v(atoms[1]), {x:v(atoms[1]).x, y:v(atoms[1]).y+0.7, z:-0.5});
                createAtom(g, v(atoms[3]).x, v(atoms[3]).y-1.2, 0.8, 0x3055ff, 0.5);
                createBond(g, v(atoms[3]), {x:v(atoms[3]).x, y:v(atoms[3]).y-0.7, z:0.5});
            }

            const c1prime = {x: v(atoms[0]).x - 1.8, y: v(atoms[0]).y + 0.4, z: 1.5};
            createBond(g, v(atoms[0]), c1prime);
            return c1prime;
        };

        let c1prime;
        if (base === 'A' || base === 'G') {
            c1prime = purineAtoms(group, base === 'G');
        } else {
            c1prime = pyrimidineAtoms(group, base === 'T');
        }
        drawRibosePhosphate3D(group, c1prime);

        group.scale.set(5.0, 5.0, 5.0);
        return group;
    };

    const v = (a) => ({x: a.x * 0.55, y: a.y * 0.55, z: a.z || 0});

    const addDoubleBond = (g, a, b, offset, radius) => {
        const dx = b.x - a.x, dy = b.y - a.y, len = Math.sqrt(dx*dx+dy*dy);
        const nx = -dy / len * offset, ny = dx / len * offset;
        createBond(g, {x:a.x+nx, y:a.y+ny, z:0}, {x:b.x+nx, y:b.y+ny, z:0}, 0xccaaaa, radius);
        createBond(g, {x:a.x-nx, y:a.y-ny, z:0}, {x:b.x-nx, y:b.y-ny, z:0}, 0xccaaaa, radius);
    };

    const drawRibosePhosphate3D = (g, c1) => {
        // Ribose: C2'-endo pucker from real sugar geometry
        // C1'(c1), C2'(endo), C3'(exo), C4', O4'  — forming furanose ring
        const sc = 1.8;
        const rib = [
            {x: c1.x,              y: c1.y,              z: c1.z            },  // C1'
            {x: c1.x+0.2,          y: c1.y-sc*0.8,       z: c1.z+1.2        },  // C2' (endo pucker)
            {x: c1.x-sc*0.7,       y: c1.y-sc*0.4,       z: c1.z+0.8        },  // C3' (exo pucker)
            {x: c1.x-sc*0.9,       y: c1.y+sc*0.3,       z: c1.z-0.3        },  // C4'
            {x: c1.x-sc*0.5,       y: c1.y+sc*0.8,       z: c1.z-0.8        },  // O4'
        ];
        createAtom(g, rib[0].x, rib[0].y, rib[0].z, 0x777777, 0.42); // C1'
        createAtom(g, rib[1].x, rib[1].y, rib[1].z, 0x777777, 0.42); // C2'
        createAtom(g, rib[2].x, rib[2].y, rib[2].z, 0x777777, 0.42); // C3'
        createAtom(g, rib[3].x, rib[3].y, rib[3].z, 0x777777, 0.42); // C4'
        createAtom(g, rib[4].x, rib[4].y, rib[4].z, 0xd44,    0.5);  // O4'

        // Ring bonds: O4' connected to both C1' and C4'
        createBond(g, rib[4], rib[0], 0xaaaaaa, 0.1); // O4'-C1'
        createBond(g, rib[0], rib[1], 0xaaaaaa, 0.1); // C1'-C2'
        createBond(g, rib[1], rib[2], 0xaaaaaa, 0.1); // C2'-C3'
        createBond(g, rib[2], rib[3], 0xaaaaaa, 0.1); // C3'-C4'
        createBond(g, rib[3], rib[4], 0xaaaaaa, 0.1); // C4'-O4'

        // 2'-OH  — pointing outward from ring
        const oh2 = {x: rib[1].x+0.6, y: rib[1].y-1.0, z: rib[1].z+0.9};
        createAtom(g, oh2.x, oh2.y, oh2.z, 0xd44, 0.45);
        createBond(g, rib[1], oh2, 0xaaaaaa, 0.1);

        // 3'-OH  — opposite side
        const oh3 = {x: rib[2].x-1.0, y: rib[2].y-0.5, z: rib[2].z-0.1};
        createAtom(g, oh3.x, oh3.y, oh3.z, 0xd44, 0.45);
        createBond(g, rib[2], oh3, 0xaaaaaa, 0.1);

        // 5'-phosphate: attached to C4', tetrahedral geometry
        const p = {x: rib[3].x - 1.5, y: rib[3].y + 1.0, z: rib[3].z - 1.8};
        createBond(g, rib[3], p, 0xf8a030, 0.15);
        createAtom(g, p.x, p.y, p.z, 0xf8a030, 0.7);

        // Tetrahedral: 4 O atoms around P with ~109.5° bond angles
        const dir = {x: p.x - rib[3].x, y: p.y - rib[3].y, z: p.z - rib[3].z};
        const dLen = Math.sqrt(dir.x*dir.x + dir.y*dir.y + dir.z*dir.z);
        const dNorm = {x: dir.x/dLen, y: dir.y/dLen, z: dir.z/dLen};
        // Perpendicular vectors
        const u1 = Math.abs(dNorm.x) < 0.9 ? {x:1,y:0,z:0} : {x:0,y:1,z:0};
        const p1 = {x: u1.x-dNorm.x*(dNorm.x*u1.x+dNorm.y*u1.y+dNorm.z*u1.z), y: u1.y-dNorm.y*(dNorm.x*u1.x+dNorm.y*u1.y+dNorm.z*u1.z), z: u1.z-dNorm.z*(dNorm.x*u1.x+dNorm.y*u1.y+dNorm.z*u1.z)};
        const p1Len = Math.sqrt(p1.x*p1.x+p1.y*p1.y+p1.z*p1.z);
        p1.x/=p1Len; p1.y/=p1Len; p1.z/=p1Len;
        const p2 = {x: dNorm.y*p1.z-dNorm.z*p1.y, y: dNorm.z*p1.x-dNorm.x*p1.z, z: dNorm.x*p1.y-dNorm.y*p1.x};

        const angles = [
            {theta:Math.PI,             phi:0},      // opposite direction
            {theta:Math.acos(-1/3),     phi:0},      // tetrahedral
            {theta:Math.acos(-1/3),     phi:2*Math.PI/3},
            {theta:Math.acos(-1/3),     phi:4*Math.PI/3},
        ];
        const bondLen = 1.2;
        angles.forEach(({theta, phi}) => {
            const ox = p.x + bondLen * (Math.sin(theta)*Math.cos(phi)*p1.x + Math.sin(theta)*Math.sin(phi)*p2.x + Math.cos(theta)*dNorm.x);
            const oy = p.y + bondLen * (Math.sin(theta)*Math.cos(phi)*p1.y + Math.sin(theta)*Math.sin(phi)*p2.y + Math.cos(theta)*dNorm.y);
            const oz = p.z + bondLen * (Math.sin(theta)*Math.cos(phi)*p1.z + Math.sin(theta)*Math.sin(phi)*p2.z + Math.cos(theta)*dNorm.z);
            createAtom(g, ox, oy, oz, 0xff4040, 0.43);
            createBond(g, p, {x:ox, y:oy, z:oz}, 0xf8a030, 0.12);
        });
    };

    const initMolecularStructures3D = (scene) => {
        const structs = [
            { base: 'A', side: 'left', color: 0x4169E1 },
            { base: 'T', side: 'right', color: 0xFFD700 },
            { base: 'G', side: 'left', color: 0x1E90FF },
            { base: 'C', side: 'right', color: 0xFFA500 },
        ];

        // Compute visible half-width/height at the origin plane
        const aspect = dimensions.width / dimensions.height;
        const fovRad = 75 * Math.PI / 180;
        const halfH = Math.tan(fovRad / 2) * cameraOrbitRadius * 0.7;
        const halfW = halfH * aspect;

        structs.forEach((s, idx) => {
            const sideMul = s.side === 'left' ? 1 : -1;
            const normY = (idx - 1.5) / 4; // -0.375, -0.125, 0.125, 0.375
            const wx = sideMul * halfW * 0.45;
            const wy = -normY * halfH * 1.3;
            const _wz = 60; // forward of DNA origin toward camera

            const group = buildNucleotide(s.base, wx, wy);
            scene.add(group);
            nucleotideGroups.push({ group, base: s.base, side: s.side });
        });
    };

    const updateClickRipples3D = () => {
        if (!sceneRef.current)
            return;
        clickRipples.current = clickRipples.current.filter(ripple => {
            ripple.scale += rippleGrowthRate;
            ripple.opacity -= rippleFadeRate;
            ripple.mesh.scale.set(ripple.scale, ripple.scale, ripple.scale);
            ripple.mesh.material.opacity = ripple.opacity;
            if (ripple.opacity <= 0) {
                sceneRef.current.remove(ripple.mesh);
                return false;
            }
            return true;
        });
    };
    const updateGlowEffects = () => {
        if (!cameraRef.current)
            return;
        // Convert mouse position to 3D ray
        raycasterRef.current.setFromCamera(mouseRef.current, cameraRef.current);
        basePairsRef.current.forEach(basePair => {
            // Calculate distance from mouse ray to base
            const distance1 = raycasterRef.current.ray.distanceToPoint(basePair.mesh1.position);
            const distance2 = raycasterRef.current.ray.distanceToPoint(basePair.mesh2.position);
            const minDistance = Math.min(distance1, distance2);
            // Apply glow effect
            if (minDistance < glowRadius) {
                basePair.glowIntensity = Math.max(0, 1 - minDistance / glowRadius);
            }
            else {
                basePair.glowIntensity *= 0.95;
            }
            // Update material emissive properties for glow
            const emissiveIntensity = basePair.glowIntensity * glowIntensityMultiplier;
            basePair.mesh1.material.emissive.setScalar(emissiveIntensity);
            basePair.mesh2.material.emissive.setScalar(emissiveIntensity);
            // Update connection glow
            basePair.connections.forEach(connection => {
                connection.material.emissive.setScalar(emissiveIntensity);
                connection.material.opacity = 0.4 + basePair.glowIntensity * 0.4;
            });
        });
    };
    return (_jsx("div", { ref: mountRef, className: `absolute inset-0 ${className}`, style: {
            zIndex: 0,
            pointerEvents: 'auto',
            background: 'transparent'
        } }));
};
export default DNASparkBackground3D;
