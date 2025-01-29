import React, { useRef, useState, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import { useGLTF, useTexture } from "@react-three/drei";
import * as THREE from "three";
import EngineTrail from "./EngineTrail";

const Spaceship = React.forwardRef((props, ref) => {
  const { onEnergyUpdate, ...otherProps } = props;
  const group = useRef();
  const { scene } = useGLTF("/models/spaceship.glb");

  const [keys, setKeys] = useState({
    ArrowUp: false,
    ArrowDown: false,
    ArrowLeft: false,
    ArrowRight: false,
    KeyW: false,
    KeyS: false,
    ShiftLeft: false,  // For boost
    Space: false,      // For stabilize
  });

  const [movement, setMovement] = useState({
    position: [0, 0, 0],
    rotation: [0, 0, 0],
    velocity: [0, 0, 0],
    acceleration: [0, 0, 0],
    angularVelocity: [0, 0, 0],
    thrust: 0,
    energy: 100,        // Energy for boost
    stabilizing: false, // Stabilization mode
    boosting: false,    // Boost mode
  });

  // Physics constants
  const NORMAL_MAX_SPEED = 0.4;
  const BOOST_MAX_SPEED = 0.8;
  const NORMAL_ACCELERATION = 0.006;
  const BOOST_ACCELERATION = 0.012;
  const ROTATION_SPEED = 0.025;
  const ANGULAR_DAMPING = 0.95;
  const VERTICAL_SPEED = 0.05;
  const NORMAL_DRAG = 0.995;
  const SPACE_DRAG = 0.999;
  const MIN_SPEED = 0.001;
  const ENERGY_RECOVERY_RATE = 0.2;
  const ENERGY_CONSUMPTION_RATE = 0.5;
  const STABILIZE_STRENGTH = 0.15;

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

      // Energy management
      if (newMovement.boosting) {
        newMovement.energy = Math.max(0, newMovement.energy - ENERGY_CONSUMPTION_RATE);
        if (newMovement.energy <= 0) {
          newMovement.boosting = false;
        }
      } else {
        newMovement.energy = Math.min(100, newMovement.energy + ENERGY_RECOVERY_RATE);
      }

      // Update parent component with new energy value
      onEnergyUpdate?.(newMovement.energy);

      // Handle boost activation/deactivation
      if (keys.ShiftLeft && newMovement.energy > 20) {
        newMovement.boosting = true;
      } else {
        newMovement.boosting = false;
      }

      // Handle stabilization
      newMovement.stabilizing = keys.Space;

      // Calculate current max speed and acceleration
      const currentMaxSpeed = newMovement.boosting ? BOOST_MAX_SPEED : NORMAL_MAX_SPEED;
      const currentAcceleration = newMovement.boosting ? BOOST_ACCELERATION : NORMAL_ACCELERATION;

      // Calculate thrust based on input
      let targetThrust = 0;
      if (keys.ArrowUp) targetThrust = 1;
      if (keys.ArrowDown) targetThrust = -0.5; // Slower reverse speed

      // Smoothly interpolate thrust
      newMovement.thrust += (targetThrust - newMovement.thrust) * 0.1;

      // Apply thrust to acceleration with proper directional vectors
      const shipForward = new THREE.Vector3(0, 0, 1).applyEuler(new THREE.Euler(...newMovement.rotation));
      const thrustVector = shipForward.multiplyScalar(newMovement.thrust * currentAcceleration);

      newMovement.acceleration[0] = thrustVector.x;
      newMovement.acceleration[1] = 0;
      newMovement.acceleration[2] = thrustVector.z;

      // Calculate angular acceleration
      const angularAccel = [0, 0, 0];
      if (keys.ArrowLeft) angularAccel[1] = ROTATION_SPEED;
      if (keys.ArrowRight) angularAccel[1] = -ROTATION_SPEED;

      // Update angular velocity with damping
      newMovement.angularVelocity = newMovement.angularVelocity.map((av, i) => {
        let newAV = av + angularAccel[i];
        newAV *= ANGULAR_DAMPING;
        return newAV;
      });

      // Apply stabilization if active
      if (newMovement.stabilizing) {
        newMovement.velocity = newMovement.velocity.map(v => v * 0.9);
        newMovement.angularVelocity = newMovement.angularVelocity.map(av => av * 0.8);
      }

      // Apply acceleration to velocity with improved physics
      newMovement.velocity = newMovement.velocity.map((v, i) => {
        let newV = v + newMovement.acceleration[i];
        
        // Apply space drag (stronger when stabilizing)
        const dragFactor = newMovement.stabilizing ? NORMAL_DRAG : SPACE_DRAG;
        newV *= dragFactor;

        // Apply velocity limits
        if (Math.abs(newV) > currentMaxSpeed) {
          newV = Math.sign(newV) * currentMaxSpeed;
        }

        // Stop completely if very slow
        if (Math.abs(newV) < MIN_SPEED) {
          newV = 0;
        }

        return newV;
      });

      // Vertical movement with smooth acceleration
      if (keys.KeyW) {
        newMovement.velocity[1] = Math.min(
          newMovement.velocity[1] + VERTICAL_SPEED * 0.5,
          currentMaxSpeed
        );
      }
      if (keys.KeyS) {
        newMovement.velocity[1] = Math.max(
          newMovement.velocity[1] - VERTICAL_SPEED * 0.5,
          -currentMaxSpeed
        );
      }
      if (!keys.KeyW && !keys.KeyS) {
        newMovement.velocity[1] *= NORMAL_DRAG;
      }

      // Update position and rotation
      newMovement.position = newMovement.position.map(
        (p, i) => p + newMovement.velocity[i]
      );
      newMovement.rotation = newMovement.rotation.map(
        (r, i) => r + newMovement.angularVelocity[i]
      );

      // Update movement state
      setMovement(newMovement);

      // Apply movement to the group
      group.current.position.set(...newMovement.position);
      group.current.rotation.set(...newMovement.rotation);

      // Add slight floating animation (reduced when stabilizing)
      const floatAmount = newMovement.stabilizing ? 0.0005 : 0.001;
      group.current.position.y += Math.sin(state.clock.elapsedTime) * floatAmount;
      group.current.rotation.z = Math.sin(state.clock.elapsedTime * 0.5) * 
        (newMovement.stabilizing ? 0.005 : 0.015);
    }
  });

  return (
    <group ref={group} {...otherProps}>
      <primitive object={scene} scale={[0.1, 0.1, 0.1]} />
      
      {/* Add engine glow */}
      <pointLight
        position={[0, 0, 2]}
        distance={3}
        intensity={Math.abs(movement.thrust) * (movement.boosting ? 3 : 2)}
        color={movement.boosting ? "#ff00ff" : "#00ffff"}
      />
      
      {/* Add engine trails */}
      <EngineTrail
        position={[
          group.current?.position.x || 0,
          group.current?.position.y || 0,
          (group.current?.position.z || 0) + 0.5
        ]}
        thrust={Math.abs(movement.thrust) * (movement.boosting ? 1.5 : 1)}
        color={movement.boosting ? "#ff00ff" : "#00ffff"}
      />
      <EngineTrail
        position={[
          group.current?.position.x || 0,
          group.current?.position.y || 0,
          (group.current?.position.z || 0) + 0.5
        ]}
        thrust={Math.abs(movement.thrust) * (movement.boosting ? 1.5 : 1)}
        color={movement.boosting ? "#ff66ff" : "#66ffff"}
      />
    </group>
  );
});

Spaceship.displayName = "Spaceship";

// Preload the model
useGLTF.preload("/models/spaceship.glb");

export default Spaceship;
