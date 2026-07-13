import React from 'react';
interface OrbitClusterBackgroundProps {
    clusterCount?: number;
    particlesPerCluster?: number;
    color?: string;
    className?: string;
    orbitDistanceMin?: number;
    orbitDistanceMax?: number;
    orbitSpeedMin?: number;
    orbitSpeedMax?: number;
    particleSizeMin?: number;
    particleSizeMax?: number;
    gravityWarpStrength?: number;
    gravityWarpDecay?: number;
    parallaxMultiplier?: number;
}
declare const OrbitClusterBackground: React.FC<OrbitClusterBackgroundProps>;
export default OrbitClusterBackground;
