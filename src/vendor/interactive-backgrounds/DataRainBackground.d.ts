import React from 'react';
interface DataRainBackgroundProps {
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
    deflectionForce?: number;
    mouseGlowRadius?: number;
    rippleGrowthRate?: number;
    rippleFadeRate?: number;
    rippleLineWidth?: number;
    charSpeedMin?: number;
    charSpeedMax?: number;
}
declare const DataRainBackground: React.FC<DataRainBackgroundProps>;
export default DataRainBackground;
