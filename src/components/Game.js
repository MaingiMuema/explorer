import React, { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { Stars, OrbitControls, PerspectiveCamera } from '@react-three/drei';
import Spaceship from './Spaceship';

const Game = () => {
  return (
    <div style={{ width: '100vw', height: '100vh', backgroundColor: '#000' }}>
      <Canvas shadows>
        <Suspense fallback={null}>
          <PerspectiveCamera makeDefault position={[0, 2, 10]} />
          <ambientLight intensity={0.2} />
          <pointLight position={[10, 10, 10]} intensity={1} />
          <pointLight position={[-10, -10, -10]} intensity={0.5} />
          
          <Spaceship position={[0, 0, 0]} rotation={[0, Math.PI / 4, 0]} />
          
          <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
          <OrbitControls 
            enablePan={true}
            enableZoom={true}
            enableRotate={true}
            minDistance={5}
            maxDistance={20}
          />
        </Suspense>
      </Canvas>
    </div>
  );
};

export default Game;
