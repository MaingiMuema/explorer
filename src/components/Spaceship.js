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
      {/* Main body - now more streamlined */}
      <mesh position={[0, 0, 0]}>
        <cylinderGeometry args={[0.7, 1.0, 4.5, 12]} />
        <meshStandardMaterial color="#2c3e50" metalness={0.9} roughness={0.1} />
      </mesh>

      {/* Front nose cone - sharper and more angular */}
      <mesh position={[0, 0, 2.5]}>
        <coneGeometry args={[0.7, 2.5, 12]} />
        <meshStandardMaterial color="#34495e" metalness={0.9} roughness={0.1} />
      </mesh>

      {/* Enhanced wings with accent lighting */}
      <group>
        {/* Left wing */}
        <mesh position={[-1.8, 0, 0]} rotation={[0, 0.2, Math.PI * 0.12]}>
          <boxGeometry args={[3.5, 0.08, 2.5]} />
          <meshStandardMaterial
            color="#34495e"
            metalness={0.9}
            roughness={0.1}
          />
        </mesh>

        {/* Wing accent lights - left */}
        <mesh position={[-2.2, 0.1, 0]}>
          <boxGeometry args={[2.8, 0.02, 0.05]} />
          <meshStandardMaterial
            color="#3498db"
            emissive="#3498db"
            emissiveIntensity={2}
            toneMapped={false}
          />
        </mesh>

        {/* Right wing */}
        <mesh position={[1.8, 0, 0]} rotation={[0, -0.2, -Math.PI * 0.12]}>
          <boxGeometry args={[3.5, 0.08, 2.5]} />
          <meshStandardMaterial
            color="#34495e"
            metalness={0.9}
            roughness={0.1}
          />
        </mesh>

        {/* Wing accent lights - right */}
        <mesh position={[2.2, 0.1, 0]}>
          <boxGeometry args={[2.8, 0.02, 0.05]} />
          <meshStandardMaterial
            color="#3498db"
            emissive="#3498db"
            emissiveIntensity={2}
            toneMapped={false}
          />
        </mesh>
      </group>

      {/* Enhanced engine section */}
      <group position={[0, 0, -2.2]}>
        {/* Main engine housing */}
        <mesh>
          <cylinderGeometry args={[0.8, 0.9, 0.8, 12]} />
          <meshStandardMaterial
            color="#2c3e50"
            metalness={0.9}
            roughness={0.1}
          />
        </mesh>

        {/* Engine glow effects */}
        {[0.2, 0.1, 0].map((z, i) => (
          <mesh key={i} position={[0, 0, -z]}>
            <cylinderGeometry args={[0.5 - i * 0.1, 0.5 - i * 0.1, 0.1, 12]} />
            <meshStandardMaterial
              color="#3498db"
              emissive="#3498db"
              emissiveIntensity={3 - i}
              toneMapped={false}
              transparent={true}
              opacity={0.8}
            />
          </mesh>
        ))}
      </group>

      {/* Enhanced cockpit with better transparency */}
      <mesh position={[0, 0.6, 1.2]}>
        <sphereGeometry
          args={[0.5, 24, 24, 0, Math.PI * 2, 0, Math.PI * 0.6]}
        />
        <meshPhysicalMaterial
          color="#81ecec"
          metalness={0.2}
          roughness={0.1}
          transmission={0.9}
          thickness={0.5}
          opacity={0.7}
          transparent={true}
        />
      </mesh>

      {/* Additional surface details */}
      <group>
        {/* Enhanced panel lines */}
        {[-0.6, -0.2, 0.2, 0.6].map((x, i) => (
          <mesh key={i} position={[x, 0.3, 0]}>
            <boxGeometry args={[0.03, 0.01, 3]} />
            <meshStandardMaterial
              color="#74b9ff"
              emissive="#74b9ff"
              emissiveIntensity={0.5}
              toneMapped={false}
            />
          </mesh>
        ))}

        {/* Decorative tech panels */}
        {[-1, 1].map((x, i) => (
          <mesh key={i} position={[x * 0.4, 0.4, 0]}>
            <boxGeometry args={[0.3, 0.2, 0.05]} />
            <meshStandardMaterial
              color="#0984e3"
              emissive="#0984e3"
              emissiveIntensity={0.5}
              toneMapped={false}
            />
          </mesh>
        ))}
      </group>
    </group>
  );
};

export default Spaceship;
