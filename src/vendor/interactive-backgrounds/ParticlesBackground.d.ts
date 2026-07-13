import React from 'react';
interface ParticlesBackgroundProps {
    particleCount?: number;
    mouseRadius?: number;
    particleColor?: string;
    connectionColor?: string;
    rippleColor?: string;
    className?: string;
    particleSizeMin?: number;
    particleSizeMax?: number;
    particleSpeedMultiplier?: number;
    connectionDistance?: number;
    connectionOpacityMultiplier?: number;
    rippleMaxRadius?: number;
    rippleGrowthRate?: number;
    rippleLineWidth?: number;
}
declare const ParticlesBackground: React.FC<ParticlesBackgroundProps>;
export default ParticlesBackground;
