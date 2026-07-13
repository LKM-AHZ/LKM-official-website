import React from 'react';
interface NebulaBackgroundProps {
    baseColor?: string;
    glowColor?: string;
    intensity?: number;
    className?: string;
    blobCount?: number;
    blobRadiusMin?: number;
    blobRadiusMax?: number;
    gradientSpread?: number;
}
declare const NebulaBackground: React.FC<NebulaBackgroundProps>;
export default NebulaBackground;
