import React, { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { Stars, OrbitControls } from '@react-three/drei';
import Spaceship from './Spaceship';

const Game = () => {
  return (
    <div style={{ width: '100vw', height: '100vh' }}>
      <Canvas>
        <Suspense fallback={null}>
          <ambientLight intensity={0.5} />
          <pointLight position={[10, 10, 10]} />
          <Spaceship position={[0, 0, 0]} />
          <Stars />
          <OrbitControls />
        </Suspense>
      </Canvas>
    </div>
  );
};

export default Game;
