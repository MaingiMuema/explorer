import React, { useRef, useState, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import { useGLTF, useTexture } from "@react-three/drei";
import * as THREE from "three";
import EngineTrail from "./EngineTrail";

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
    acceleration: [0, 0, 0],
    thrust: 0,
  });

  // Physics constants
  const MAX_SPEED = 0.4;
  const ACCELERATION = 0.006;
  const ROTATION_SPEED = 0.025;
  const VERTICAL_SPEED = 0.05;
  const DRAG = 0.99;
  const MIN_SPEED = 0.001;

  // Load all textures
  const [colorMap, normalMap, metalnessMap, roughnessMap, aoMap, emissionMap] =
    useTexture([
      "/models/24-textures/Intergalactic Spaceship_color_4.jpg",
      "/models/24-textures/Intergalactic Spaceship_nmap_2_Tris.jpg",
      "/models/24-textures/Intergalactic Spaceship_metalness.jpg",
      "/models/24-textures/Intergalactic Spaceship_rough.jpg",
      "/models/24-textures/Intergalactic Spaceship Ao_Blender.jpg",
      "/models/24-textures/Intergalactic Spaceship_emi.jpg",
    ]);

  // Configure texture settings
  const textures = [
    colorMap,
    normalMap,
    metalnessMap,
    roughnessMap,
    aoMap,
    emissionMap,
  ];
  textures.forEach((texture) => {
    texture.flipY = false;
    texture.encoding = THREE.sRGBEncoding;
  });

  // Apply textures to the model
  useEffect(() => {
    scene.traverse((child) => {
      if (child.isMesh) {
        // Apply all textures to the material
        child.material.map = colorMap;
        child.material.normalMap = normalMap;
        child.material.metalnessMap = metalnessMap;
        child.material.roughnessMap = roughnessMap;
        child.material.aoMap = aoMap;
        child.material.emissiveMap = emissionMap;

        // Configure material properties
        child.material.metalness = 0.8;
        child.material.roughness = 1.0;
        child.material.emissive = new THREE.Color(0x00ffff);
        child.material.emissiveIntensity = 1.2;

        // Add custom neon shader
        if (!child.material.onBeforeCompile) {
          child.material.onBeforeCompile = (shader) => {
            shader.fragmentShader = shader.fragmentShader.replace(
              '#include <emissivemap_fragment>',
              `
              #include <emissivemap_fragment>
              float pulseIntensity = sin(time * 2.0) * 0.5 + 0.5;
              totalEmissiveRadiance *= 1.0 + pulseIntensity * 0.3;
              `
            );
            shader.uniforms.time = { value: 0 };
            child.material.userData.shader = shader;
          };
        }

        // Enable necessary material features
        child.material.needsUpdate = true;
      }
    });
  }, [
    scene,
    colorMap,
    normalMap,
    metalnessMap,
    roughnessMap,
    aoMap,
    emissionMap,
  ]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (keys.hasOwnProperty(e.code)) {
        e.preventDefault();
        setKeys((prev) => ({ ...prev, [e.code]: true }));
      }
    };

    const handleKeyUp = (e) => {
      if (keys.hasOwnProperty(e.code)) {
        e.preventDefault();
        setKeys((prev) => ({ ...prev, [e.code]: false }));
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
      // Update shader time uniform for pulsing effect
      group.current.traverse((child) => {
        if (child.isMesh && child.material.userData.shader) {
          child.material.userData.shader.uniforms.time.value = state.clock.elapsedTime;
        }
      });

      // Calculate new position and rotation
      const newMovement = { ...movement };

      // Calculate thrust based on input
      let targetThrust = 0;
      if (keys.ArrowUp) targetThrust = 1;
      if (keys.ArrowDown) targetThrust = -0.7; // Slower reverse speed

      // Smoothly interpolate thrust
      newMovement.thrust += (targetThrust - newMovement.thrust) * 0.1;

      // Apply thrust to acceleration
      const thrustVector = {
        x: Math.sin(movement.rotation[1]) * newMovement.thrust * ACCELERATION,
        z: Math.cos(movement.rotation[1]) * newMovement.thrust * ACCELERATION,
      };

      newMovement.acceleration[0] = thrustVector.x;
      newMovement.acceleration[2] = thrustVector.z;

      // Apply acceleration to velocity
      newMovement.velocity = newMovement.velocity.map((v, i) => {
        let newV = v + newMovement.acceleration[i];

        // Apply drag (stronger when not thrusting)
        const dragFactor =
          Math.abs(newMovement.thrust) > 0.1 ? DRAG : DRAG * 0.98;
        newV *= dragFactor;

        // Limit maximum speed
        if (Math.abs(newV) > MAX_SPEED) {
          newV = Math.sign(newV) * MAX_SPEED;
        }

        // Stop completely if very slow
        if (Math.abs(newV) < MIN_SPEED) {
          newV = 0;
        }

        return newV;
      });

      // Left/Right rotation with smooth deceleration
      if (keys.ArrowLeft) {
        newMovement.rotation[1] += ROTATION_SPEED;
      }
      if (keys.ArrowRight) {
        newMovement.rotation[1] -= ROTATION_SPEED;
      }

      // Vertical movement with smooth acceleration
      if (keys.KeyW) {
        newMovement.velocity[1] = Math.min(
          newMovement.velocity[1] + VERTICAL_SPEED * 0.5,
          MAX_SPEED
        );
      }
      if (keys.KeyS) {
        newMovement.velocity[1] = Math.max(
          newMovement.velocity[1] - VERTICAL_SPEED * 0.5,
          -MAX_SPEED
        );
      }
      if (!keys.KeyW && !keys.KeyS) {
        newMovement.velocity[1] *= DRAG;
      }

      // Apply velocity to position
      newMovement.position = newMovement.position.map(
        (p, i) => p + newMovement.velocity[i]
      );

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
      const floatAmount = 0.001; // Reduced from 0.002
      group.current.position.y +=
        Math.sin(state.clock.elapsedTime) * floatAmount;
      group.current.rotation.z =
        Math.sin(state.clock.elapsedTime * 0.5) * 0.015; // Reduced from 0.02
    }
  });

  return (
    <group ref={group} {...props}>
      <primitive object={scene} scale={[0.1, 0.1, 0.1]} />
      
      {/* Add engine glow */}
      <pointLight
        position={[0, 0, 2]}
        distance={3}
        intensity={Math.abs(movement.thrust) * 2}
        color="#00ffff"
      />
      
      {/* Add engine trails */}
      <EngineTrail
        position={[
          group.current?.position.x || 0,
          group.current?.position.y || 0,
          (group.current?.position.z || 0) + 0.5
        ]}
        thrust={Math.abs(movement.thrust)}
        color="#00ffff"
      />
      <EngineTrail
        position={[
          group.current?.position.x || 0,
          group.current?.position.y || 0,
          (group.current?.position.z || 0) + 0.5
        ]}
        thrust={Math.abs(movement.thrust)}
        color="#ff00ff"
      />
    </group>
  );
});

Spaceship.displayName = "Spaceship";

// Preload the model
useGLTF.preload("/models/spaceship.glb");

export default Spaceship;
