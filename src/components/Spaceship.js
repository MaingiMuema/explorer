import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';

const Spaceship = (props) => {
  const mesh = useRef();

  useFrame((state, delta) => {
    if (mesh.current) {
      // Add simple rotation animation
      mesh.current.rotation.y += delta * 0.5;
    }
  });

  return (
    <mesh {...props} ref={mesh}>
      <boxGeometry args={[1, 1, 2]} />
      <meshStandardMaterial color="hotpink" />
    </mesh>
  );
};

export default Spaceship;
