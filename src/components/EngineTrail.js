import React, { useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const EngineTrail = ({ position, thrust, color = '#00ffff', width = 2 }) => {
  const MAX_POINTS = 50;
  const points = useRef([]);
  const geometry = useRef();
  const material = useRef();
  const time = useRef(0);
  const lastPosition = useRef(new THREE.Vector3(...position));

  useEffect(() => {
    // Initialize points array with starting position
    points.current = Array(MAX_POINTS).fill().map(() => new THREE.Vector3(...position));
    lastPosition.current.set(...position);
    
    // Create geometry with initial positions
    geometry.current = new THREE.BufferGeometry();
    geometry.current.setAttribute('position', new THREE.Float32BufferAttribute(new Array(MAX_POINTS * 3).fill(0), 3));
    
    // Create material with enhanced glow effect
    material.current = new THREE.ShaderMaterial({
      uniforms: {
        color: { value: new THREE.Color(color) },
        time: { value: 0 },
        thrust: { value: thrust },
      },
      vertexShader: `
        attribute vec3 position;
        uniform float time;
        varying float vDistance;
        
        void main() {
          vDistance = float(position.z);
          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          gl_Position = projectionMatrix * mvPosition;
          gl_PointSize = 3.0;
        }
      `,
      fragmentShader: `
        uniform vec3 color;
        uniform float time;
        uniform float thrust;
        varying float vDistance;
        
        void main() {
          float pulse = sin(time * 8.0 - vDistance * 2.0) * 0.5 + 0.5;
          float fadeOut = smoothstep(1.0, 0.0, abs(vDistance));
          vec3 glowColor = color * (1.0 + pulse * 0.5);
          float alpha = fadeOut * thrust * 0.8;
          gl_FragColor = vec4(glowColor, alpha);
        }
      `,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    
  }, [position, color]);

  useFrame((state, delta) => {
    if (points.current && geometry.current) {
      time.current += delta;

      // Update points
      for (let i = points.current.length - 1; i > 0; i--) {
        points.current[i].copy(points.current[i - 1]);
      }
      
      // Update first point with current position
      points.current[0].set(...position);
      lastPosition.current.set(...position);
      
      // Add some waviness to the trail
      for (let i = 1; i < points.current.length; i++) {
        const wave = Math.sin(i * 0.2 + time.current * 5) * 0.01 * thrust;
        points.current[i].x += wave;
        points.current[i].y += wave;
      }
      
      // Update geometry
      const positions = new Float32Array(MAX_POINTS * 3);
      points.current.forEach((point, i) => {
        positions[i * 3] = point.x;
        positions[i * 3 + 1] = point.y;
        positions[i * 3 + 2] = point.z;
      });
      geometry.current.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
      
      // Update material uniforms
      if (material.current) {
        material.current.uniforms.time.value = time.current;
        material.current.uniforms.thrust.value = thrust;
      }
    }
  });

  return (
    <points geometry={geometry.current} material={material.current}>
      <pointsMaterial
        size={3}
        sizeAttenuation={true}
        transparent={true}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  );
};

export default EngineTrail;
