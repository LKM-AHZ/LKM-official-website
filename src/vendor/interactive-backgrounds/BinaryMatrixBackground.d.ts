import React from 'react';
interface BinaryMatrixBackgroundProps {
    fontSize?: number;
    fontFamily?: string;
    color?: string;
    rippleColor?: string;
    density?: number;
    className?: string;
    flickerSpeed?: number;
    trailLength?: number;
    charSet?: string[];
    charChangeRate?: number;
    rippleGrowthRate?: number;
    rippleFadeRate?: number;
    rippleLineWidth?: number;
    mouseAffectRadius?: number;
}
declare const BinaryMatrixBackground: React.FC<BinaryMatrixBackgroundProps>;
export default BinaryMatrixBackground;
