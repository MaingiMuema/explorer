import React, { useRef, useState, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";

const Spaceship = React.forwardRef((props, ref) => {
  const group = useRef();
  const [keys, setKeys] = useState({
    ArrowUp: false,
    ArrowDown: false,
    ArrowLeft: false,
    ArrowRight: false,
    KeyW: false,
    KeyS: false,
  });

  const [movement, setMovement] = useState({
    position: [0, 0, 0],
    rotation: [0, 0, 0],
    velocity: [0, 0, 0],
  });

  const SPEED = 0.15;
  const ROTATION_SPEED = 0.05;
  const VERTICAL_SPEED = 0.1;
  const DRAG = 0.98;

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (keys.hasOwnProperty(e.code)) {
        e.preventDefault();
        setKeys(prev => ({ ...prev, [e.code]: true }));
      }
    };

    const handleKeyUp = (e) => {
      if (keys.hasOwnProperty(e.code)) {
        e.preventDefault();
        setKeys(prev => ({ ...prev, [e.code]: false }));
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, []);

  useEffect(() => {
    if (ref) {
      ref.current = group.current;
    }
  }, [ref]);

  useFrame((state, delta) => {
    if (group.current) {
      // Calculate new position and rotation
      const newMovement = { ...movement };
      
      // Forward/Backward movement
      if (keys.ArrowUp) {
        newMovement.velocity[2] -= Math.cos(movement.rotation[1]) * SPEED;
        newMovement.velocity[0] -= Math.sin(movement.rotation[1]) * SPEED;
      }
      if (keys.ArrowDown) {
        newMovement.velocity[2] += Math.cos(movement.rotation[1]) * SPEED;
        newMovement.velocity[0] += Math.sin(movement.rotation[1]) * SPEED;
      }

      // Left/Right rotation
      if (keys.ArrowLeft) {
        newMovement.rotation[1] += ROTATION_SPEED;
      }
      if (keys.ArrowRight) {
        newMovement.rotation[1] -= ROTATION_SPEED;
      }

      // Up/Down movement
      if (keys.KeyW) {
        newMovement.velocity[1] += VERTICAL_SPEED;
      }
      if (keys.KeyS) {
        newMovement.velocity[1] -= VERTICAL_SPEED;
      }

      // Apply velocity with drag
      newMovement.velocity = newMovement.velocity.map(v => v * DRAG);
      newMovement.position = newMovement.position.map((p, i) => p + newMovement.velocity[i]);

      // Update movement state
      setMovement(newMovement);

      // Apply movement to the group
      group.current.position.set(...newMovement.position);
      group.current.rotation.set(
        newMovement.rotation[0],
        newMovement.rotation[1],
        newMovement.rotation[2]
      );

      // Add slight floating animation
      group.current.position.y += Math.sin(state.clock.elapsedTime) * 0.002;
      group.current.rotation.z = Math.sin(state.clock.elapsedTime * 0.5) * 0.02;
    }
  });

  return (
    <group ref={group} {...props}>
      {/* Main body - brightened with more vibrant base color */}
      <mesh position={[0, 0, 0]}>
        <cylinderGeometry args={[0.7, 1.0, 4.5, 16]} />
        <meshPhysicalMaterial
          color="#4169E1" // Royal Blue
          metalness={0.7}
          roughness={0.2}
          clearcoat={1}
          clearcoatRoughness={0.1}
        />
      </mesh>

      {/* Secondary body layer */}
      <mesh position={[0, 0, 0.2]} rotation={[0, Math.PI / 8, 0]}>
        <cylinderGeometry args={[0.72, 1.02, 4.3, 16]} />
        <meshPhysicalMaterial
          color="#6495ED" // Cornflower Blue
          metalness={0.8}
          roughness={0.2}
          clearcoat={0.5}
          opacity={0.6}
          transparent={true}
        />
      </mesh>

      {/* Front nose cone */}
      <group position={[0, 0, 2.5]}>
        <mesh>
          <coneGeometry args={[0.7, 2.5, 16]} />
          <meshPhysicalMaterial
            color="#4876FF" // Bright Blue
            metalness={0.7}
            roughness={0.2}
            clearcoat={1}
          />
        </mesh>
        {/* Energy field effect - brighter glow */}
        <mesh position={[0, 0, -0.5]}>
          <coneGeometry args={[0.8, 0.5, 16]} />
          <meshPhysicalMaterial
            color="#FF1493" // Deep Pink
            emissive="#FF1493"
            emissiveIntensity={1}
            transparent={true}
            opacity={0.4}
            metalness={1}
          />
        </mesh>
      </group>

      {/* Wings with enhanced contrast */}
      <group>
        {[-1, 1].map((side) => (
          <group
            key={side}
            position={[side * 1.8, 0, 0]}
            rotation={[0, side * 0.2, side * Math.PI * 0.12]}
          >
            <mesh>
              <boxGeometry args={[3.5, 0.08, 2.5]} />
              <meshPhysicalMaterial
                color="#1E90FF" // Dodger Blue
                metalness={0.7}
                roughness={0.2}
                clearcoat={1}
              />
            </mesh>

            {/* Wing energy trails - brighter cyan */}
            <mesh position={[side * 0.4, 0.1, 0]}>
              <boxGeometry args={[2.8, 0.02, 0.05]} />
              <meshStandardMaterial
                color="#00FFFF"
                emissive="#00FFFF"
                emissiveIntensity={6}
                toneMapped={false}
              />
            </mesh>

            {/* Wing tip accents - vibrant magenta */}
            <mesh position={[side * 1.5, 0.05, -0.8]}>
              <boxGeometry args={[0.5, 0.1, 0.1]} />
              <meshStandardMaterial
                color="#FF00FF"
                emissive="#FF00FF"
                emissiveIntensity={4}
                toneMapped={false}
              />
            </mesh>
          </group>
        ))}
      </group>

      {/* Engine section with brighter plasma */}
      <group position={[0, 0, -2.2]}>
        <mesh>
          <cylinderGeometry args={[0.8, 0.9, 0.8, 16]} />
          <meshPhysicalMaterial
            color="#4169E1" // Royal Blue
            metalness={0.7}
            roughness={0.2}
            clearcoat={1}
          />
        </mesh>

        {/* Brighter engine glow */}
        {[0.3, 0.2, 0.1, 0].map((z, i) => (
          <mesh key={i} position={[0, 0, -z]}>
            <cylinderGeometry args={[0.6 - i * 0.1, 0.6 - i * 0.1, 0.1, 16]} />
            <meshStandardMaterial
              color={i % 2 ? "#00FFFF" : "#FF1493"}
              emissive={i % 2 ? "#00FFFF" : "#FF1493"}
              emissiveIntensity={6 - i}
              toneMapped={false}
              transparent={true}
              opacity={0.9}
            />
          </mesh>
        ))}
      </group>

      {/* Enhanced cockpit with holographic effect */}
      <group position={[0, 0.6, 1.2]}>
        {/* Main cockpit glass */}
        <mesh>
          <sphereGeometry
            args={[0.5, 32, 32, 0, Math.PI * 2, 0, Math.PI * 0.6]}
          />
          <meshPhysicalMaterial
            color="#80ffff"
            metalness={0.1}
            roughness={0.1}
            transmission={0.9}
            thickness={0.5}
            opacity={0.8}
            transparent={true}
            clearcoat={1}
          />
        </mesh>
        {/* Holographic HUD effect */}
        <mesh position={[0, 0.2, 0]} rotation={[Math.PI * 0.1, 0, 0]}>
          <planeGeometry args={[0.6, 0.3]} />
          <meshStandardMaterial
            color="#00ffff"
            emissive="#00ffff"
            emissiveIntensity={2}
            transparent={true}
            opacity={0.4}
            side={2}
          />
        </mesh>
      </group>

      {/* Enhanced surface details */}
      <group>
        {/* Glowing panel lines */}
        {[-0.6, -0.2, 0.2, 0.6].map((x, i) => (
          <mesh key={i} position={[x, 0.3, 0]}>
            <boxGeometry args={[0.03, 0.01, 3]} />
            <meshStandardMaterial
              color={i % 2 ? "#00ffff" : "#ff00ff"}
              emissive={i % 2 ? "#00ffff" : "#ff00ff"}
              emissiveIntensity={3}
              toneMapped={false}
            />
          </mesh>
        ))}

        {/* Tech panels with pulsing effect */}
        {[-1, 1].map((x, i) => (
          <mesh key={i} position={[x * 0.4, 0.4, 0]}>
            <boxGeometry args={[0.3, 0.2, 0.05]} />
            <meshStandardMaterial
              color="#40ffff"
              emissive="#40ffff"
              emissiveIntensity={2 + Math.sin(Date.now() * 0.005) * 0.5}
              toneMapped={false}
            />
          </mesh>
        ))}

        {/* Additional decorative elements */}
        {[0, Math.PI].map((rotation, i) => (
          <group key={i} rotation={[0, rotation, 0]}>
            <mesh position={[0.5, 0, 0]}>
              <torusGeometry args={[0.1, 0.02, 16, 16]} />
              <meshStandardMaterial
                color="#ff00ff"
                emissive="#ff00ff"
                emissiveIntensity={3}
                toneMapped={false}
              />
            </mesh>
          </group>
        ))}
      </group>
    </group>
  );
});

Spaceship.displayName = 'Spaceship';

export default Spaceship;
