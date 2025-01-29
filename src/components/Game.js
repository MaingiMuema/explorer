import React, { Suspense, useRef } from "react";
import { Canvas, useThree, useFrame } from "@react-three/fiber";
import { Stars, PerspectiveCamera } from "@react-three/drei";
import * as THREE from "three";
import Spaceship from "./Spaceship";

// Camera follow component
const CameraFollow = ({ target }) => {
  const { camera } = useThree();
  const cameraPosition = useRef([0, 1.5, 5]); // Adjusted initial position
  const smoothness = 0.05;

  useFrame(() => {
    if (target.current) {
      const targetPosition = target.current.position;
      const targetRotation = target.current.rotation;

      // Calculate desired camera position (behind and above the ship)
      const distance = 4; // Reduced distance for closer view
      const height = 1.5; // Adjusted height
      const angle = targetRotation.y;

      const desiredX = targetPosition.x - Math.sin(angle) * distance;
      const desiredY = targetPosition.y + height;
      const desiredZ = targetPosition.z - Math.cos(angle) * distance;

      // Smooth camera movement
      cameraPosition.current[0] +=
        (desiredX - cameraPosition.current[0]) * smoothness;
      cameraPosition.current[1] +=
        (desiredY - cameraPosition.current[1]) * smoothness;
      cameraPosition.current[2] +=
        (desiredZ - cameraPosition.current[2]) * smoothness;

      // Update camera position and look at target
      camera.position.set(...cameraPosition.current);
      camera.lookAt(targetPosition);
    }
  });

  return null;
};

const Game = () => {
  const shipRef = useRef(null);

  return (
    <div style={{ width: "100vw", height: "100vh", backgroundColor: "#000" }}>
      <Canvas shadows>
        <Suspense fallback={null}>
          <PerspectiveCamera makeDefault position={[0, 1.5, 5]} />{" "}
          {/* Updated initial camera position */}
          <CameraFollow target={shipRef} />
          
          {/* Enhanced lighting setup */}
          <ambientLight intensity={0.2} />
          
          {/* Main light from the front-top */}
          <directionalLight
            position={[5, 5, 5]}
            intensity={0.7}
            castShadow
            shadow-mapSize-width={2048}
            shadow-mapSize-height={2048}
          />
          
          {/* Atmospheric lighting */}
          <fog attach="fog" args={["#000000", 10, 50]} />
          
          {/* Environment lighting */}
          <pointLight position={[-5, 3, -5]} intensity={0.3} color="#4444ff" />
          <pointLight position={[5, -3, -5]} intensity={0.3} color="#ff4444" />
          
          {/* Add volumetric-like beams */}
          <mesh position={[0, 20, -20]} rotation={[-Math.PI / 4, 0, 0]}>
            <planeGeometry args={[100, 100]} />
            <meshBasicMaterial
              color="#0066ff"
              transparent
              opacity={0.03}
              blending={THREE.AdditiveBlending}
              side={THREE.DoubleSide}
            />
          </mesh>

          <Spaceship
            ref={shipRef}
            position={[0, 0, 0]}
            rotation={[0, Math.PI / 4, 0]}
          />
          
          <Stars
            radius={100}
            depth={50}
            count={7000}
            factor={4}
            saturation={0}
            fade
            speed={1}
          />
        </Suspense>
      </Canvas>

      {/* Optional: Add control instructions */}
      <div
        style={{
          position: "absolute",
          bottom: 20,
          left: 20,
          color: "white",
          backgroundColor: "rgba(0,0,0,0.5)",
          padding: "10px",
          borderRadius: "5px",
          fontFamily: "Arial",
        }}
      >
        <h3>Controls:</h3>
        <p>↑ Forward</p>
        <p>↓ Reverse</p>
        <p>← Turn Left</p>
        <p>→ Turn Right</p>
        <p>W Ascend</p>
        <p>S Descend</p>
      </div>
    </div>
  );
};

export default Game;
