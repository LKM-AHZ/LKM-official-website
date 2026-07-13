import React from 'react';
interface FluidSmokeFlowProps {
    particleColor?: string;
    lineWidth?: number;
    className?: string;
    particleCount?: number;
    interactionRadius?: number;
    interactionStrength?: number;
    backgroundFadeAlpha?: number;
}
declare const FluidSmokeFlowBackground: React.FC<FluidSmokeFlowProps>;
export default FluidSmokeFlowBackground;
