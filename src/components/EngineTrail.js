import React, { useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const EngineTrail = ({ position, thrust, color = '#00ffff' }) => {
  const MAX_POINTS = 50;
  const points = useRef([]);
  const geometry = useRef();
  const material = useRef();

  useEffect(() => {
    // Initialize points array with starting position
    points.current = Array(MAX_POINTS).fill().map(() => new THREE.Vector3(...position));
    
    // Create geometry and material
    geometry.current = new THREE.BufferGeometry();
    material.current = new THREE.LineBasicMaterial({
      color: new THREE.Color(color),
      transparent: true,
      opacity: 0.6,
      blending: THREE.AdditiveBlending,
    });
    
    // Set initial positions
    geometry.current.setFromPoints(points.current);
  }, [position, color]);

  useFrame(() => {
    if (points.current && geometry.current) {
      // Shift all points back
      for (let i = points.current.length - 1; i > 0; i--) {
        points.current[i].copy(points.current[i - 1]);
      }
      
      // Update first point to current position
      points.current[0].set(...position);
      
      // Update geometry
      geometry.current.setFromPoints(points.current);
      
      // Update opacity based on thrust
      if (material.current) {
        material.current.opacity = Math.min(thrust * 0.8, 0.6);
      }
    }
  });

  return (
    <line geometry={geometry.current} material={material.current} />
  );
};

export default EngineTrail;
