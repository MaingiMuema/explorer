import React, { useRef, useState, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";

const Spaceship = React.forwardRef((props, ref) => {
  const group = useRef();
  const { scene } = useGLTF("/models/spaceship.glb");
  
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
      <primitive object={scene} scale={[0.05, 0.05, 0.05]} />
    </group>
  );
});

Spaceship.displayName = 'Spaceship';

// Preload the model
useGLTF.preload("/models/spaceship.glb");

export default Spaceship;
