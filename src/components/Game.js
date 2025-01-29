import React, { Suspense, useRef } from "react";
import { Canvas, useThree, useFrame } from "@react-three/fiber";
import { Stars, PerspectiveCamera } from "@react-three/drei";
import Spaceship from "./Spaceship";

// Camera follow component
const CameraFollow = ({ target }) => {
  const { camera } = useThree();
  const cameraPosition = useRef([0, 2, 10]);
  const smoothness = 0.1;

  useFrame(() => {
    if (target.current) {
      const targetPosition = target.current.position;
      const targetRotation = target.current.rotation;

      // Calculate desired camera position (behind and above the ship)
      const distance = 10;
      const height = 3;
      const angle = targetRotation.y;

      const desiredX = targetPosition.x - Math.sin(angle) * distance;
      const desiredY = targetPosition.y + height;
      const desiredZ = targetPosition.z - Math.cos(angle) * distance;

      // Smooth camera movement
      cameraPosition.current[0] += (desiredX - cameraPosition.current[0]) * smoothness;
      cameraPosition.current[1] += (desiredY - cameraPosition.current[1]) * smoothness;
      cameraPosition.current[2] += (desiredZ - cameraPosition.current[2]) * smoothness;

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
          <PerspectiveCamera makeDefault position={[0, 2, 10]} />
          <CameraFollow target={shipRef} />
          
          <ambientLight intensity={0.2} />
          <pointLight position={[10, 10, 10]} intensity={1} />
          <pointLight position={[-10, -10, -10]} intensity={0.5} />

          <Spaceship ref={shipRef} position={[0, 0, 0]} rotation={[0, Math.PI / 4, 0]} />

          <Stars
            radius={100}
            depth={50}
            count={5000}
            factor={4}
            saturation={0}
            fade
            speed={1}
          />
        </Suspense>
      </Canvas>

      {/* Optional: Add control instructions */}
      <div style={{
        position: 'absolute',
        bottom: 20,
        left: 20,
        color: 'white',
        backgroundColor: 'rgba(0,0,0,0.5)',
        padding: '10px',
        borderRadius: '5px',
        fontFamily: 'Arial'
      }}>
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
