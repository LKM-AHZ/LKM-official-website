import React from 'react';
interface DreamyHaloBackgroundProps {
    baseHue?: number;
    className?: string;
    blurOverlay?: boolean;
    overlayOpacity?: number;
    haloCount?: number;
    haloRadiusMin?: number;
    haloRadiusMax?: number;
    pulseAmplitude?: number;
    saturation?: number;
    lightness?: number;
}
declare const DreamyHaloBackground: React.FC<DreamyHaloBackgroundProps>;
export default DreamyHaloBackground;
