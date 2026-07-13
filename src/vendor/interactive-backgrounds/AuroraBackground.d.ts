import React from 'react';
interface AuroraBackgroundProps {
    mouseRadius?: number;
    rippleColor?: string;
    className?: string;
    layers?: number;
    baseWaveHeight?: number;
    waveSpacing?: number;
    waveSpeed?: number;
    lineWidthBase?: number;
    rippleMaxRadius?: number;
    rippleGrowthRate?: number;
    rippleLineWidth?: number;
}
declare const AuroraBackground: React.FC<AuroraBackgroundProps>;
export default AuroraBackground;
