import React, { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";

const Spaceship = (props) => {
  const group = useRef();

  useFrame((state, delta) => {
    if (group.current) {
      // Enhanced floating animation with slight rotation
      group.current.position.y = Math.sin(state.clock.elapsedTime) * 0.1;
      group.current.rotation.z = Math.sin(state.clock.elapsedTime * 0.5) * 0.02;
    }
  });

  return (
    <group ref={group} {...props}>
      {/* Main body */}
      <mesh position={[0, 0, 0]}>
        <cylinderGeometry args={[0.7, 1.0, 4.5, 12]} />
        <meshStandardMaterial color="#e8e8e8" metalness={0.9} roughness={0.1} />
      </mesh>

      {/* Front nose cone */}
      <mesh position={[0, 0, 2.5]}>
        <coneGeometry args={[0.7, 2.5, 12]} />
        <meshStandardMaterial color="#ffffff" metalness={0.9} roughness={0.1} />
      </mesh>

      {/* Wings */}
      <group>
        {/* Left & Right wings - base color */}
        <mesh position={[-1.8, 0, 0]} rotation={[0, 0.2, Math.PI * 0.12]}>
          <boxGeometry args={[3.5, 0.08, 2.5]} />
          <meshStandardMaterial
            color="#f0f0f0"
            metalness={0.9}
            roughness={0.1}
          />
        </mesh>
        <mesh position={[1.8, 0, 0]} rotation={[0, -0.2, -Math.PI * 0.12]}>
          <boxGeometry args={[3.5, 0.08, 2.5]} />
          <meshStandardMaterial
            color="#f0f0f0"
            metalness={0.9}
            roughness={0.1}
          />
        </mesh>

        {/* Wing accent lights */}
        <mesh position={[-2.2, 0.1, 0]}>
          <boxGeometry args={[2.8, 0.02, 0.05]} />
          <meshStandardMaterial
            color="#00ffff"
            emissive="#00ffff"
            emissiveIntensity={3}
            toneMapped={false}
          />
        </mesh>
        <mesh position={[2.2, 0.1, 0]}>
          <boxGeometry args={[2.8, 0.02, 0.05]} />
          <meshStandardMaterial
            color="#00ffff"
            emissive="#00ffff"
            emissiveIntensity={3}
            toneMapped={false}
          />
        </mesh>
      </group>

      {/* Engine section */}
      <group position={[0, 0, -2.2]}>
        <mesh>
          <cylinderGeometry args={[0.8, 0.9, 0.8, 12]} />
          <meshStandardMaterial
            color="#e8e8e8"
            metalness={0.9}
            roughness={0.1}
          />
        </mesh>

        {/* Engine glow */}
        {[0.2, 0.1, 0].map((z, i) => (
          <mesh key={i} position={[0, 0, -z]}>
            <cylinderGeometry args={[0.5 - i * 0.1, 0.5 - i * 0.1, 0.1, 12]} />
            <meshStandardMaterial
              color="#00ffff"
              emissive="#00ffff"
              emissiveIntensity={4 - i}
              toneMapped={false}
              transparent={true}
              opacity={0.9}
            />
          </mesh>
        ))}
      </group>

      {/* Cockpit */}
      <mesh position={[0, 0.6, 1.2]}>
        <sphereGeometry
          args={[0.5, 24, 24, 0, Math.PI * 2, 0, Math.PI * 0.6]}
        />
        <meshPhysicalMaterial
          color="#80ffff"
          metalness={0.2}
          roughness={0.1}
          transmission={0.9}
          thickness={0.5}
          opacity={0.8}
          transparent={true}
        />
      </mesh>

      {/* Surface details */}
      <group>
        {/* Panel lines */}
        {[-0.6, -0.2, 0.2, 0.6].map((x, i) => (
          <mesh key={i} position={[x, 0.3, 0]}>
            <boxGeometry args={[0.03, 0.01, 3]} />
            <meshStandardMaterial
              color="#00ffff"
              emissive="#00ffff"
              emissiveIntensity={2}
              toneMapped={false}
            />
          </mesh>
        ))}

        {/* Tech panels */}
        {[-1, 1].map((x, i) => (
          <mesh key={i} position={[x * 0.4, 0.4, 0]}>
            <boxGeometry args={[0.3, 0.2, 0.05]} />
            <meshStandardMaterial
              color="#40ffff"
              emissive="#40ffff"
              emissiveIntensity={1.5}
              toneMapped={false}
            />
          </mesh>
        ))}
      </group>
    </group>
  );
};

export default Spaceship;
