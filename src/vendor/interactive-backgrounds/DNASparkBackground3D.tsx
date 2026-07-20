import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { useCanvasViewport } from '~/components/background/useCanvasViewport';
import { useColorMode } from './useColorMode';

export interface DNASparkBackground3DProps {
  sparkColor?: string;
  strandColor?: string;
  className?: string;
  particleColor?: string;
  connectionColor?: string;
  rippleColor?: string;
  color?: string;
  constfill?: string;
  text?: string;
  basePairCount?: number;
  helixRadius?: number;
  helixHeight?: number;
  basePairSpacing?: number;
  backboneSegments?: number;
  backboneRadius?: number;
  baseSphereRadius?: number;
  baseSphereSegments?: number;
  particleCount?: number;
  particleSize?: number;
  particleSpeedMin?: number;
  particleSpeedMax?: number;
  glowRadius?: number;
  glowIntensityMultiplier?: number;
  cameraOrbitRadius?: number;
  cameraOrbitSpeed?: number;
  dnaRotationSpeed?: number;
  particleOrbitalAmplitude?: number;
  rippleGrowthRate?: number;
  rippleFadeRate?: number;
}

interface ParticleData {
  mesh: THREE.Mesh;
  velocity: THREE.Vector3;
  originalPosition: THREE.Vector3;
  angle: number;
  speed: number;
}

interface BasePairData {
  base1: string;
  base2: string;
  mesh1: THREE.Mesh;
  mesh2: THREE.Mesh;
  connections: THREE.Mesh[];
  originalGlow: number;
  glowIntensity: number;
}

interface BackboneData {
  mesh1: THREE.Mesh;
  mesh2: THREE.Mesh;
}

interface NucleotideGroupData {
  group: THREE.Group;
  base: string;
  side: string;
}

interface ClickRippleData {
  mesh: THREE.Mesh;
  scale: number;
  opacity: number;
}

export default function DNASparkBackground3D({
  sparkColor: propSparkColor,
  strandColor: propStrandColor,
  className = '',
  particleColor: propParticleColor,
  connectionColor: propConnectionColor,
  rippleColor: propRippleColor,
  basePairCount = 40,
  helixRadius = 25,
  helixHeight = 400,
  backboneSegments = 100,
  backboneRadius = 2,
  baseSphereRadius = 4,
  baseSphereSegments = 16,
  particleCount = 100,
  particleSize = 1,
  particleSpeedMin = 0.01,
  particleSpeedMax = 0.03,
  glowRadius = 30,
  glowIntensityMultiplier = 0.3,
  cameraOrbitRadius = 200,
  cameraOrbitSpeed = 0.1,
  dnaRotationSpeed = 0.2,
  particleOrbitalAmplitude = 0.1,
  rippleGrowthRate = 0.1,
  rippleFadeRate = 0.02,
}: DNASparkBackground3DProps) {
  const mode = useColorMode();
  const sparkColor = propSparkColor || (mode === 'dark' ? 'rgba(255,255,255,0.8)' : 'rgba(0,0,0,0.7)');
  const strandColor = propStrandColor || (mode === 'dark' ? 'rgba(64,224,208,0.6)' : 'rgba(0,0,0,0.2)');
  const particleColor = propParticleColor || (mode === 'dark' ? 'rgba(255,255,255,0.8)' : 'rgba(0,0,0,0.7)');
  const connectionColor = propConnectionColor || (mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)');
  const rippleColor = propRippleColor || (mode === 'dark' ? 'rgba(255,255,255,0.8)' : 'rgba(0,0,0,0.08)');

  const { containerRef, width, height, mouse, ripples, isVisible, quality, performance } = useCanvasViewport({
    mouse: true,
    click: true,
  });
  const qualityConfig = {
    high: { pixelRatio: 1.5, basePairs: 40, particleCount: 100, shadow: true, glow: 1, motion: 1 },
    medium: { pixelRatio: 1.25, basePairs: 28, particleCount: 60, shadow: false, glow: 0.7, motion: 0.7 },
    low: { pixelRatio: 1, basePairs: 16, particleCount: 20, shadow: false, glow: 0.45, motion: 0.45 },
  }[quality];
  const actualBasePairCount = Math.min(basePairCount, qualityConfig.basePairs);
  const actualParticleCount = Math.min(particleCount, qualityConfig.particleCount);
  const actualBackboneSegments =
    quality === 'low' ? Math.min(backboneSegments, 40) : quality === 'medium' ? Math.min(backboneSegments, 64) : backboneSegments;
  const actualBaseSphereSegments =
    quality === 'low' ? Math.min(baseSphereSegments, 8) : quality === 'medium' ? Math.min(baseSphereSegments, 12) : baseSphereSegments;
  const reducedMotion = performance.reducedMotion;

  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rafIdRef = useRef<number | null>(null);

  const timeRef = useRef(0);
  const waveOffsetRef = useRef(0);
  const particlesRef = useRef<ParticleData[]>([]);
  const basePairsRef = useRef<BasePairData[]>([]);
  const backboneRef = useRef<BackboneData | null>(null);
  const raycasterRef = useRef(new THREE.Raycaster());
  const clickRipplesRef = useRef<ClickRippleData[]>([]);
  const nucleotideGroupsRef = useRef<NucleotideGroupData[]>([]);

  // Base color mapping
  const baseColors: Record<string, number> = {
    A: 0x4169E1, // Royal Blue
    T: 0xFFD700, // Gold
    G: 0x1E90FF, // Dodger Blue
    C: 0xFFA500, // Orange
  };

  // Complementary base pairs
  const getComplementaryBase = (base: string) => {
    const pairs: Record<string, string> = { A: 'T', T: 'A', G: 'C', C: 'G' };
    return pairs[base] || 'A';
  };

  // Generate random DNA sequence
  const generateDNASequence = (length: number) => {
    const bases = ['A', 'T', 'G', 'C'];
    return Array.from({ length }, () => bases[Math.floor(Math.random() * bases.length)]).join('');
  };

  // Convert rgba string to THREE.Color
  const rgbaToThreeColor = (rgba: string) => {
    const match = rgba.match(/rgba?\(([^)]+)\)/);
    if (match) {
      const values = match[1].split(',').map((v) => parseFloat(v.trim()));
      return new THREE.Color(values[0] / 255, values[1] / 255, values[2] / 255);
    }
    return new THREE.Color(0xffffff);
  };

  const createAtom = (parent: THREE.Group, x: number, y: number, z: number, color: number, radius = 0.65) => {
    const geo = new THREE.SphereGeometry(radius, 16, 16);
    const mat = new THREE.MeshPhongMaterial({ color, emissive: color, emissiveIntensity: 0.25, specular: 0x222222, shininess: 30 });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(x, y, z);
    parent.add(mesh);
    return mesh;
  };

  const createBond = (parent: THREE.Group, a: { x: number; y: number; z: number }, b: { x: number; y: number; z: number }, color = 0xcccccc, radius = 0.16) => {
    const mid = new THREE.Vector3((a.x + b.x) / 2, (a.y + b.y) / 2, (a.z + b.z) / 2);
    const dir = new THREE.Vector3(b.x - a.x, b.y - a.y, b.z - a.z);
    const len = dir.length();
    const geo = new THREE.CylinderGeometry(radius, radius, len, 8);
    const mat = new THREE.MeshPhongMaterial({ color, emissive: color, emissiveIntensity: 0.15 });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.copy(mid);
    mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.normalize());
    parent.add(mesh);
    return mesh;
  };

  const v = (a: { x: number; y: number; z?: number }) => ({ x: a.x * 0.55, y: a.y * 0.55, z: a.z || 0 });

  const addDoubleBond = (g: THREE.Group, a: { x: number; y: number; z: number }, b: { x: number; y: number; z: number }, offset: number, radius: number) => {
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const len = Math.sqrt(dx * dx + dy * dy);
    const nx = (-dy / len) * offset;
    const ny = (dx / len) * offset;
    createBond(g, { x: a.x + nx, y: a.y + ny, z: 0 }, { x: b.x + nx, y: b.y + ny, z: 0 }, 0xccaaaa, radius);
    createBond(g, { x: a.x - nx, y: a.y - ny, z: 0 }, { x: b.x - nx, y: b.y - ny, z: 0 }, 0xccaaaa, radius);
  };

  const drawRibosePhosphate3D = (g: THREE.Group, c1: { x: number; y: number; z: number }) => {
    const sc = 1.8;
    const rib = [
      { x: c1.x, y: c1.y, z: c1.z },
      { x: c1.x + 0.2, y: c1.y - sc * 0.8, z: c1.z + 1.2 },
      { x: c1.x - sc * 0.7, y: c1.y - sc * 0.4, z: c1.z + 0.8 },
      { x: c1.x - sc * 0.9, y: c1.y + sc * 0.3, z: c1.z - 0.3 },
      { x: c1.x - sc * 0.5, y: c1.y + sc * 0.8, z: c1.z - 0.8 },
    ];
    createAtom(g, rib[0].x, rib[0].y, rib[0].z, 0x777777, 0.42);
    createAtom(g, rib[1].x, rib[1].y, rib[1].z, 0x777777, 0.42);
    createAtom(g, rib[2].x, rib[2].y, rib[2].z, 0x777777, 0.42);
    createAtom(g, rib[3].x, rib[3].y, rib[3].z, 0x777777, 0.42);
    createAtom(g, rib[4].x, rib[4].y, rib[4].z, 0xd44, 0.5);

    createBond(g, rib[4], rib[0], 0xaaaaaa, 0.1);
    createBond(g, rib[0], rib[1], 0xaaaaaa, 0.1);
    createBond(g, rib[1], rib[2], 0xaaaaaa, 0.1);
    createBond(g, rib[2], rib[3], 0xaaaaaa, 0.1);
    createBond(g, rib[3], rib[4], 0xaaaaaa, 0.1);

    const oh2 = { x: rib[1].x + 0.6, y: rib[1].y - 1.0, z: rib[1].z + 0.9 };
    createAtom(g, oh2.x, oh2.y, oh2.z, 0xd44, 0.45);
    createBond(g, rib[1], oh2, 0xaaaaaa, 0.1);

    const oh3 = { x: rib[2].x - 1.0, y: rib[2].y - 0.5, z: rib[2].z - 0.1 };
    createAtom(g, oh3.x, oh3.y, oh3.z, 0xd44, 0.45);
    createBond(g, rib[2], oh3, 0xaaaaaa, 0.1);

    const p = { x: rib[3].x - 1.5, y: rib[3].y + 1.0, z: rib[3].z - 1.8 };
    createBond(g, rib[3], p, 0xf8a030, 0.15);
    createAtom(g, p.x, p.y, p.z, 0xf8a030, 0.7);

    const dir = { x: p.x - rib[3].x, y: p.y - rib[3].y, z: p.z - rib[3].z };
    const dLen = Math.sqrt(dir.x * dir.x + dir.y * dir.y + dir.z * dir.z);
    const dNorm = { x: dir.x / dLen, y: dir.y / dLen, z: dir.z / dLen };
    const u1 = Math.abs(dNorm.x) < 0.9 ? { x: 1, y: 0, z: 0 } : { x: 0, y: 1, z: 0 };
    const p1 = {
      x: u1.x - dNorm.x * (dNorm.x * u1.x + dNorm.y * u1.y + dNorm.z * u1.z),
      y: u1.y - dNorm.y * (dNorm.x * u1.x + dNorm.y * u1.y + dNorm.z * u1.z),
      z: u1.z - dNorm.z * (dNorm.x * u1.x + dNorm.y * u1.y + dNorm.z * u1.z),
    };
    const p1Len = Math.sqrt(p1.x * p1.x + p1.y * p1.y + p1.z * p1.z);
    p1.x /= p1Len; p1.y /= p1Len; p1.z /= p1Len;
    const p2 = {
      x: dNorm.y * p1.z - dNorm.z * p1.y,
      y: dNorm.z * p1.x - dNorm.x * p1.z,
      z: dNorm.x * p1.y - dNorm.y * p1.x,
    };

    const angles = [
      { theta: Math.PI, phi: 0 },
      { theta: Math.acos(-1 / 3), phi: 0 },
      { theta: Math.acos(-1 / 3), phi: (2 * Math.PI) / 3 },
      { theta: Math.acos(-1 / 3), phi: (4 * Math.PI) / 3 },
    ];
    const bondLen = 1.2;
    angles.forEach(({ theta, phi }) => {
      const ox = p.x + bondLen * (Math.sin(theta) * Math.cos(phi) * p1.x + Math.sin(theta) * Math.sin(phi) * p2.x + Math.cos(theta) * dNorm.x);
      const oy = p.y + bondLen * (Math.sin(theta) * Math.cos(phi) * p1.y + Math.sin(theta) * Math.sin(phi) * p2.y + Math.cos(theta) * dNorm.y);
      const oz = p.z + bondLen * (Math.sin(theta) * Math.cos(phi) * p1.z + Math.sin(theta) * Math.sin(phi) * p2.z + Math.cos(theta) * dNorm.z);
      createAtom(g, ox, oy, oz, 0xff4040, 0.43);
      createBond(g, p, { x: ox, y: oy, z: oz }, 0xf8a030, 0.12);
    });
  };

  const buildNucleotide = (base: string, ox: number, oy: number) => {
    const group = new THREE.Group();
    group.position.set(ox, oy, 0);

    const purineAtoms = (g: THREE.Group, isG: boolean) => {
      const atoms = [
        { x: -1.46, y: 2.80, z: 0, c: 0x3055ff, r: 0.65 },
        { x: 0.00, y: 3.40, z: 0, c: 0x666666, r: 0.5 },
        { x: 1.46, y: 2.80, z: 0, c: 0x3055ff, r: 0.65 },
        { x: 1.15, y: 1.40, z: 0, c: 0x666666, r: 0.5 },
        { x: -0.42, y: 0.85, z: 0, c: 0x666666, r: 0.5 },
        { x: -1.70, y: 1.50, z: 0, c: 0x666666, r: 0.5 },
        { x: -0.30, y: -0.55, z: 0, c: 0x3055ff, r: 0.65 },
        { x: -1.60, y: 0.20, z: 0, c: 0x666666, r: 0.5 },
        { x: -2.15, y: 1.55, z: 0, c: 0x3055ff, r: 0.65 },
      ];
      atoms.forEach((a) => createAtom(g, a.x * 0.55, a.y * 0.55, a.z, a.c, a.r));
      for (let i = 0; i < 5; i++) createBond(g, v(atoms[i]), v(atoms[i + 1]));
      createBond(g, v(atoms[5]), v(atoms[0]));
      createBond(g, v(atoms[4]), v(atoms[6]));
      createBond(g, v(atoms[6]), v(atoms[7]));
      createBond(g, v(atoms[7]), v(atoms[8]));
      createBond(g, v(atoms[8]), v(atoms[3]));
      addDoubleBond(g, v(atoms[4]), v(atoms[5]), 0.5, 0.18);

      if (isG) {
        createAtom(g, v(atoms[1]).x, v(atoms[1]).y + 1.2, -0.9, 0x3055ff, 0.5);
        createBond(g, v(atoms[1]), { x: v(atoms[1]).x, y: v(atoms[1]).y + 0.7, z: -0.5 });
        createAtom(g, v(atoms[5]).x - 1.0, v(atoms[5]).y - 0.1, 0.8, 0xff4040, 0.48);
        createBond(g, v(atoms[5]), { x: v(atoms[5]).x - 0.5, y: v(atoms[5]).y, z: 0.5 });
      } else {
        createAtom(g, v(atoms[1]).x, v(atoms[1]).y + 1.3, -0.9, 0x3055ff, 0.5);
        createBond(g, v(atoms[1]), { x: v(atoms[1]).x, y: v(atoms[1]).y + 0.7, z: -0.5 });
      }

      const c1prime = { x: v(atoms[8]).x - 1.8, y: v(atoms[8]).y + 0.4, z: 1.5 };
      createBond(g, v(atoms[8]), c1prime);
      return c1prime;
    };

    const pyrimidineAtoms = (g: THREE.Group, isT: boolean) => {
      const atoms = [
        { x: -1.50, y: 2.30, z: 0, c: 0x3055ff, r: 0.65 },
        { x: 0.00, y: 3.00, z: 0, c: 0x666666, r: 0.5 },
        { x: 1.50, y: 2.30, z: 0, c: 0x3055ff, r: 0.65 },
        { x: 1.10, y: 1.00, z: 0, c: 0x666666, r: 0.5 },
        { x: -0.40, y: 0.40, z: 0, c: 0x666666, r: 0.5 },
        { x: -1.70, y: 1.00, z: 0, c: 0x666666, r: 0.5 },
      ];
      atoms.forEach((a) => createAtom(g, a.x * 0.55, a.y * 0.55, a.z, a.c, a.r));
      for (let i = 0; i < 5; i++) createBond(g, v(atoms[i]), v(atoms[i + 1]));
      createBond(g, v(atoms[5]), v(atoms[0]));
      addDoubleBond(g, v(atoms[4]), v(atoms[5]), 0.5, 0.18);

      if (isT) {
        createAtom(g, v(atoms[1]).x, v(atoms[1]).y + 1.2, -0.8, 0xff4040, 0.48);
        createBond(g, v(atoms[1]), { x: v(atoms[1]).x, y: v(atoms[1]).y + 0.7, z: -0.5 });
        createAtom(g, v(atoms[3]).x, v(atoms[3]).y - 1.2, 0.8, 0xff4040, 0.48);
        createBond(g, v(atoms[3]), { x: v(atoms[3]).x, y: v(atoms[3]).y - 0.7, z: 0.5 });
        createAtom(g, v(atoms[0]).x - 1.4, v(atoms[0]).y - 0.1, -0.7, 0x666666, 0.5);
        createBond(g, v(atoms[0]), { x: v(atoms[0]).x - 0.8, y: v(atoms[0]).y, z: -0.4 });
      } else {
        createAtom(g, v(atoms[1]).x, v(atoms[1]).y + 1.2, -0.8, 0xff4040, 0.48);
        createBond(g, v(atoms[1]), { x: v(atoms[1]).x, y: v(atoms[1]).y + 0.7, z: -0.5 });
        createAtom(g, v(atoms[3]).x, v(atoms[3]).y - 1.2, 0.8, 0x3055ff, 0.5);
        createBond(g, v(atoms[3]), { x: v(atoms[3]).x, y: v(atoms[3]).y - 0.7, z: 0.5 });
      }

      const c1prime = { x: v(atoms[0]).x - 1.8, y: v(atoms[0]).y + 0.4, z: 1.5 };
      createBond(g, v(atoms[0]), c1prime);
      return c1prime;
    };

    let c1prime: { x: number; y: number; z: number };
    if (base === 'A' || base === 'G') {
      c1prime = purineAtoms(group, base === 'G');
    } else {
      c1prime = pyrimidineAtoms(group, base === 'T');
    }
    drawRibosePhosphate3D(group, c1prime);

    group.scale.set(5.0, 5.0, 5.0);
    return group;
  };

  const initMolecularStructures3D = (scene: THREE.Scene) => {
    const structs = [
      { base: 'A', side: 'left', color: 0x4169E1 },
      { base: 'T', side: 'right', color: 0xffd700 },
      { base: 'G', side: 'left', color: 0x1e90ff },
      { base: 'C', side: 'right', color: 0xffa500 },
    ];

    const aspect = width > 0 && height > 0 ? width / height : 1;
    const fovRad = 75 * Math.PI / 180;
    const halfH = Math.tan(fovRad / 2) * cameraOrbitRadius * 0.7;
    const halfW = halfH * aspect;

    nucleotideGroupsRef.current = [];
    structs.forEach((s, idx) => {
      const sideMul = s.side === 'left' ? 1 : -1;
      const normY = (idx - 1.5) / 4;
      const wx = sideMul * halfW * 0.45;
      const wy = -normY * halfH * 1.3;

      const group = buildNucleotide(s.base, wx, wy);
      scene.add(group);
      nucleotideGroupsRef.current.push({ group, base: s.base, side: s.side });
    });
  };

  const initDNA3D = (scene: THREE.Scene) => {
    const sequence = generateDNASequence(actualBasePairCount);
    const h = helixHeight * 2;
    const turns = 8;
    const curve1 = new THREE.CatmullRomCurve3(
      Array.from({ length: actualBackboneSegments }, (_, i) => {
        const t = (i / (actualBackboneSegments - 1)) * Math.PI * 2 * turns;
        const y = (i / (actualBackboneSegments - 1)) * h - h / 2;
        return new THREE.Vector3(Math.cos(t) * helixRadius, y, Math.sin(t) * helixRadius);
      })
    );
    const curve2 = new THREE.CatmullRomCurve3(
      Array.from({ length: actualBackboneSegments }, (_, i) => {
        const t = (i / (actualBackboneSegments - 1)) * Math.PI * 2 * turns + Math.PI;
        const y = (i / (actualBackboneSegments - 1)) * h - h / 2;
        return new THREE.Vector3(Math.cos(t) * helixRadius, y, Math.sin(t) * helixRadius);
      })
    );
    const backboneGeo1 = new THREE.TubeGeometry(curve1, actualBackboneSegments, backboneRadius, 8, false);
    const backboneGeo2 = new THREE.TubeGeometry(curve2, actualBackboneSegments, backboneRadius, 8, false);
    const mat1 = new THREE.MeshPhongMaterial({ color: 0x808080, transparent: true, opacity: 0.7, shininess: 100 });
    const mat2 = new THREE.MeshPhongMaterial({ color: 0xa9a9a9, transparent: true, opacity: 0.7, shininess: 100 });
    const backboneMesh1 = new THREE.Mesh(backboneGeo1, mat1);
    const backboneMesh2 = new THREE.Mesh(backboneGeo2, mat2);
    scene.add(backboneMesh1);
    scene.add(backboneMesh2);
    backboneRef.current = { mesh1: backboneMesh1, mesh2: backboneMesh2 };

    if (quality !== 'low') initMolecularStructures3D(scene);

    basePairsRef.current = [];
    const seqLen = sequence.length * 2;
    for (let i = 0; i < seqLen; i++) {
      const base1 = sequence[i % sequence.length];
      const base2 = getComplementaryBase(base1);
      const y = (i / (seqLen - 1)) * h - h / 2;
      const angle = (i / seqLen) * Math.PI * 2 * turns;
      const pos1 = new THREE.Vector3(Math.cos(angle) * helixRadius, y, Math.sin(angle) * helixRadius);
      const pos2 = new THREE.Vector3(Math.cos(angle + Math.PI) * helixRadius, y, Math.sin(angle + Math.PI) * helixRadius);

      const baseGeometry = new THREE.SphereGeometry(baseSphereRadius, actualBaseSphereSegments, actualBaseSphereSegments);
      const baseMaterial1 = new THREE.MeshPhongMaterial({
        color: baseColors[base1],
        transparent: true,
        opacity: 0.8,
        shininess: 100,
      });
      const baseMesh1 = new THREE.Mesh(baseGeometry, baseMaterial1);
      baseMesh1.position.copy(pos1);
      scene.add(baseMesh1);

      const baseMaterial2 = new THREE.MeshPhongMaterial({
        color: baseColors[base2],
        transparent: true,
        opacity: 0.8,
        shininess: 100,
      });
      const baseMesh2 = new THREE.Mesh(baseGeometry, baseMaterial2);
      baseMesh2.position.copy(pos2);
      scene.add(baseMesh2);

      const bondCount = base1 === 'A' || base1 === 'T' ? 2 : 3;
      const connections: THREE.Mesh[] = [];
      for (let j = 0; j < bondCount; j++) {
        const bondGeometry = new THREE.CylinderGeometry(0.5, 0.5, pos1.distanceTo(pos2), 8);
        const bondMaterial = new THREE.MeshPhongMaterial({ color: 0xffffff, transparent: true, opacity: 0.4 });
        const bondMesh = new THREE.Mesh(bondGeometry, bondMaterial);
        bondMesh.position.copy(pos1).add(pos2).multiplyScalar(0.5);
        bondMesh.lookAt(pos2);
        bondMesh.rotateX(Math.PI / 2);
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
        glowIntensity: 0,
      });
    }
  };

  const initParticles3D = (scene: THREE.Scene) => {
    const particleGeometry = new THREE.SphereGeometry(particleSize, 8, 8);
    const particleMaterial = new THREE.MeshBasicMaterial({
      color: rgbaToThreeColor(sparkColor),
      transparent: true,
      opacity: 0.6,
    });
    particlesRef.current = [];
    for (let i = 0; i < actualParticleCount; i++) {
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
        speed,
      });
    }
  };

  const updateDNA3D = (time: number, waveOffset: number) => {
    if (backboneRef.current) {
      backboneRef.current.mesh1.rotation.y = time * dnaRotationSpeed;
      backboneRef.current.mesh2.rotation.y = time * dnaRotationSpeed;
    }
    basePairsRef.current.forEach((basePair, index) => {
      const waveAmplitude = Math.sin(waveOffset + index * 0.2) * 2;
      const rotationOffset = time * dnaRotationSpeed + index * 0.2;
      basePair.mesh1.position.x += Math.cos(rotationOffset) * waveAmplitude * 0.1;
      basePair.mesh1.position.z += Math.sin(rotationOffset) * waveAmplitude * 0.1;
      basePair.mesh2.position.x += Math.cos(rotationOffset + Math.PI) * waveAmplitude * 0.1;
      basePair.mesh2.position.z += Math.sin(rotationOffset + Math.PI) * waveAmplitude * 0.1;
      basePair.mesh1.rotation.y = time + index * 0.1;
      basePair.mesh2.rotation.y = time + index * 0.1;
    });
  };

  const updateParticles3D = (frameScale: number) => {
    if (!cameraRef.current || width <= 0 || height <= 0) return;
    const mouse3D = new THREE.Vector3();
    const mx = mouse.x !== null ? (mouse.x / width) * 2 - 1 : 0;
    const my = mouse.y !== null ? -(mouse.y / height) * 2 + 1 : 0;
    mouse3D.x = mx * 100;
    mouse3D.y = my * 100;
    mouse3D.z = cameraRef.current.position.z * 0.1;

    particlesRef.current.forEach((particle) => {
      const distance = particle.mesh.position.distanceTo(mouse3D);
      if (distance < 50) {
        const repulsion = particle.mesh.position
          .clone()
          .sub(mouse3D)
          .normalize()
          .multiplyScalar(0.5 * qualityConfig.motion * frameScale);
        particle.velocity.add(repulsion);
      }
      particle.mesh.position.addScaledVector(particle.velocity, qualityConfig.motion * frameScale);
      particle.angle += particle.speed * qualityConfig.motion * frameScale;
      const orbital = new THREE.Vector3(
        Math.cos(particle.angle) * particleOrbitalAmplitude,
        Math.sin(particle.angle * 0.7) * particleOrbitalAmplitude,
        Math.sin(particle.angle) * particleOrbitalAmplitude
      );
      particle.mesh.position.addScaledVector(orbital, qualityConfig.motion * frameScale);
      particle.velocity.multiplyScalar(Math.pow(0.98, qualityConfig.motion * frameScale));
      if (particle.mesh.position.x < -200) particle.mesh.position.x = 200;
      if (particle.mesh.position.x > 200) particle.mesh.position.x = -200;
      if (particle.mesh.position.y < -200) particle.mesh.position.y = 200;
      if (particle.mesh.position.y > 200) particle.mesh.position.y = -200;
      if (particle.mesh.position.z < -200) particle.mesh.position.z = 200;
      if (particle.mesh.position.z > 200) particle.mesh.position.z = -200;
    });
  };

  const updateClickRipples3D = (frameScale: number) => {
    if (!sceneRef.current) return;
    clickRipplesRef.current = clickRipplesRef.current.filter((ripple) => {
      ripple.scale += rippleGrowthRate * frameScale;
      ripple.opacity -= rippleFadeRate * frameScale;
      ripple.mesh.scale.set(ripple.scale, ripple.scale, ripple.scale);
      (ripple.mesh.material as THREE.MeshBasicMaterial).opacity = ripple.opacity;
      if (ripple.opacity <= 0) {
        sceneRef.current!.remove(ripple.mesh);
        ripple.mesh.geometry.dispose();
        (ripple.mesh.material as THREE.MeshBasicMaterial).dispose();
        return false;
      }
      return true;
    });
  };

  const updateGlowEffects = () => {
    if (!cameraRef.current) return;
    const mx = mouse.x !== null ? (mouse.x / width) * 2 - 1 : 0;
    const my = mouse.y !== null ? -(mouse.y / height) * 2 + 1 : 0;
    raycasterRef.current.setFromCamera(new THREE.Vector2(mx, my), cameraRef.current);
    basePairsRef.current.forEach((basePair) => {
      const distance1 = raycasterRef.current.ray.distanceToPoint(basePair.mesh1.position);
      const distance2 = raycasterRef.current.ray.distanceToPoint(basePair.mesh2.position);
      const minDistance = Math.min(distance1, distance2);
      if (minDistance < glowRadius) {
        basePair.glowIntensity = Math.max(0, 1 - minDistance / glowRadius);
      } else {
        basePair.glowIntensity *= 0.95;
      }
      const emissiveIntensity = basePair.glowIntensity * glowIntensityMultiplier * qualityConfig.glow;
      (basePair.mesh1.material as THREE.MeshPhongMaterial).emissive.setScalar(emissiveIntensity);
      (basePair.mesh2.material as THREE.MeshPhongMaterial).emissive.setScalar(emissiveIntensity);
      basePair.connections.forEach((connection) => {
        (connection.material as THREE.MeshPhongMaterial).emissive.setScalar(emissiveIntensity);
        (connection.material as THREE.MeshPhongMaterial).opacity = 0.4 + basePair.glowIntensity * 0.4;
      });
    });
  };

  // Scene initialization
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const scene = new THREE.Scene();
    scene.background = null;
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(75, (width || 1) / (height || 1), 0.1, 1000);
    camera.position.set(0, 0, cameraOrbitRadius);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      premultipliedAlpha: false,
    });
    renderer.setSize(width || 1, height || 1);
    renderer.setPixelRatio(performance.dpr);
    renderer.shadowMap.enabled = qualityConfig.shadow;
    if (qualityConfig.shadow) {
      renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    }
    rendererRef.current = renderer;
    el.appendChild(renderer.domElement);

    const ambientLight = new THREE.AmbientLight(0x808080, 1.2);
    scene.add(ambientLight);
    const hemiLight = new THREE.HemisphereLight(0xffffff, 0x444444, 0.8);
    scene.add(hemiLight);
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1.0);
    directionalLight.position.set(100, 100, 50);
    directionalLight.castShadow = qualityConfig.shadow;
    scene.add(directionalLight);
    const pointLight = new THREE.PointLight(0x00ffff, 0.5, 300);
    pointLight.position.set(0, 0, 100);
    scene.add(pointLight);

    initDNA3D(scene);
    initParticles3D(scene);

    return () => {
      scene.traverse((obj) => {
        if (obj instanceof THREE.Mesh) {
          obj.geometry?.dispose();
          if (Array.isArray(obj.material)) {
            obj.material.forEach((m) => m.dispose());
          } else {
            obj.material?.dispose();
          }
        }
      });
      if (el && renderer.domElement && el.contains(renderer.domElement)) {
        el.removeChild(renderer.domElement);
      }
      renderer.dispose();
      sceneRef.current = null;
      rendererRef.current = null;
      cameraRef.current = null;
      backboneRef.current = null;
      basePairsRef.current = [];
      particlesRef.current = [];
      nucleotideGroupsRef.current = [];
      clickRipplesRef.current = [];
      timeRef.current = 0;
      waveOffsetRef.current = 0;
    };
  }, [
    actualBasePairCount,
    helixRadius,
    helixHeight,
    actualBackboneSegments,
    backboneRadius,
    baseSphereRadius,
    actualBaseSphereSegments,
    actualParticleCount,
    quality,
    performance.dpr,
    qualityConfig.shadow,
    particleSize,
    particleSpeedMin,
    particleSpeedMax,
    sparkColor,
    strandColor,
    particleColor,
    connectionColor,
    rippleColor,
    cameraOrbitRadius,
    cameraOrbitSpeed,
  ]);

  // Size synchronization
  useEffect(() => {
    if (!rendererRef.current || !cameraRef.current || width === 0 || height === 0) return;
    rendererRef.current.setSize(width, height);
    cameraRef.current.aspect = width / height;
    cameraRef.current.updateProjectionMatrix();
  }, [width, height]);

  // rAF loop + pause
  useEffect(() => {
    const disposeRipples = () => {
      for (const ripple of clickRipplesRef.current) {
        sceneRef.current?.remove(ripple.mesh);
        ripple.mesh.geometry.dispose();
        (ripple.mesh.material as THREE.Material).dispose();
      }
      clickRipplesRef.current = [];
      ripples.length = 0;
    };

    if (reducedMotion) {
      disposeRipples();
      if (rendererRef.current && sceneRef.current && cameraRef.current) {
        rendererRef.current.render(sceneRef.current, cameraRef.current);
      }
      return;
    }
    if (!isVisible) return;

    let lastRenderTime: number | null = null;
    let nextRenderTime: number | null = null;
    const loop = (now: number) => {
      rafIdRef.current = requestAnimationFrame(loop);
      const interval = performance.frameInterval;
      if (nextRenderTime === null) nextRenderTime = now;
      if (now + 0.1 < nextRenderTime) return;

      const deltaSeconds = lastRenderTime === null ? interval / 1000 : Math.min((now - lastRenderTime) / 1000, 0.1);
      const frameScale = deltaSeconds * 60;
      lastRenderTime = now;
      nextRenderTime += interval;
      if (now - nextRenderTime > interval) nextRenderTime = now + interval;

      // Scale accumulated simulation time once; consumers must not apply motion a second time.
      timeRef.current += deltaSeconds * qualityConfig.motion;
      waveOffsetRef.current += deltaSeconds * 2.5 * qualityConfig.motion;
      const time = timeRef.current;
      const waveOffset = waveOffsetRef.current;

      if (cameraRef.current) {
        cameraRef.current.position.x = Math.cos(time * cameraOrbitSpeed) * cameraOrbitRadius;
        cameraRef.current.position.z = Math.sin(time * cameraOrbitSpeed) * cameraOrbitRadius;
        cameraRef.current.lookAt(0, 0, 0);
      }

      updateDNA3D(time, waveOffset);
      updateParticles3D(frameScale);

      if (cameraRef.current) {
        const cam = cameraRef.current;
        const camDir = new THREE.Vector3();
        cam.getWorldDirection(camDir);
        const camRight = new THREE.Vector3();
        camRight.crossVectors(cam.up, camDir).normalize();
        const camUp = new THREE.Vector3().crossVectors(camDir, camRight).normalize();

        const aspect = width > 0 && height > 0 ? width / height : 1;
        const fovRad = (75 * Math.PI) / 180;
        const dist = 120;
        const halfH = Math.tan(fovRad / 2) * dist;
        const halfW = halfH * aspect;

        nucleotideGroupsRef.current.forEach((g, i) => {
          const sideMul = g.side === 'left' ? 1 : -1;
          const topMul = i < 2 ? 1 : -1;
          g.group.position
            .copy(cam.position)
            .addScaledVector(camDir, dist)
            .addScaledVector(camRight, sideMul * halfW * 0.5)
            .addScaledVector(camUp, topMul * halfH * 0.5);
          if (!g.group.userData.initialized) {
            g.group.lookAt(cam.position);
            g.group.userData.initialized = true;
          }
          g.group.rotateOnWorldAxis(new THREE.Vector3(0, 1, 0), 0.005 * qualityConfig.motion * frameScale);
        });
      }

      const batch = ripples.splice(0);
      if (batch.length > 0 && sceneRef.current && cameraRef.current && width > 0 && height > 0) {
        for (const ripple of batch) {
          const rmx = (ripple.x / width) * 2 - 1;
          const rmy = -(ripple.y / height) * 2 + 1;
          raycasterRef.current.setFromCamera(new THREE.Vector2(rmx, rmy), cameraRef.current);
          const rippleGeometry = new THREE.RingGeometry(0.5, 1, quality === 'high' ? 32 : 16);
          const rippleMaterial = new THREE.MeshBasicMaterial({
            color: rgbaToThreeColor(rippleColor),
            transparent: true,
            opacity: 0.8,
            side: THREE.DoubleSide,
          });
          const rippleMesh = new THREE.Mesh(rippleGeometry, rippleMaterial);
          const intersects = raycasterRef.current.intersectObjects(sceneRef.current.children, true);
          if (intersects.length > 0) {
            rippleMesh.position.copy(intersects[0].point);
            rippleMesh.lookAt(cameraRef.current.position);
          }
          sceneRef.current.add(rippleMesh);
          clickRipplesRef.current.push({ mesh: rippleMesh, scale: 1, opacity: 0.8 });
        }
      }

      updateClickRipples3D(frameScale);
      updateGlowEffects();
      if (rendererRef.current && sceneRef.current && cameraRef.current) {
        rendererRef.current.render(sceneRef.current, cameraRef.current);
      }
    };

    rafIdRef.current = requestAnimationFrame(loop);
    return () => {
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current);
        rafIdRef.current = null;
      }
    };
  }, [
    isVisible,
    reducedMotion,
    performance.frameInterval,
    quality,
    qualityConfig.motion,
    qualityConfig.glow,
    width,
    height,
    cameraOrbitSpeed,
    cameraOrbitRadius,
    dnaRotationSpeed,
    particleOrbitalAmplitude,
    glowRadius,
    glowIntensityMultiplier,
    rippleGrowthRate,
    rippleFadeRate,
    rippleColor,
  ]);

  return (
    <div
      ref={containerRef}
      className={className}
      style={{ position: 'absolute', inset: 0, zIndex: 0, pointerEvents: 'auto', background: 'transparent' }}
    />
  );
}
