import React from 'react';
interface ConstellationFieldProps {
    particleColor?: string;
    connectionColor?: string;
    particleCount?: number;
    maxDistance?: number;
    className?: string;
    constfill?: string;
    particleSpeed?: number;
    particleRadiusMin?: number;
    particleRadiusMax?: number;
    pulseMin?: number;
    pulseMax?: number;
    shootingStarChance?: number;
    shootingStarSpeedMin?: number;
    shootingStarSpeedMax?: number;
    shootingStarLengthMin?: number;
    shootingStarLengthMax?: number;
    shootingStarLineWidth?: number;
    shootingStarLifeDecay?: number;
    nameSpawnRate?: number;
    nameFadeRate?: number;
    trailMaxLength?: number;
    connectionLineWidth?: number;
}
declare const ConstellationFieldBackground: React.FC<ConstellationFieldProps>;
export default ConstellationFieldBackground;
