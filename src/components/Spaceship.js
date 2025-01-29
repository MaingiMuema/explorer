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
    ShiftLeft: false, // For boost
    Space: false, // For stabilize
  });

  const [movement, setMovement] = useState({
    position: [0, 0, 0],
    rotation: [0, 0, 0],
    velocity: [0, 0, 0],
    acceleration: [0, 0, 0],
    angularVelocity: [0, 0, 0],
    bankAngle: 0, // Current bank angle
    targetBankAngle: 0, // Target bank angle based on turning
    thrust: 0,
    energy: 100, // Energy for boost
    stabilizing: false, // Stabilization mode
    boosting: false, // Boost mode
  });

  // Physics constants
  const NORMAL_MAX_SPEED = 0.4;
  const BOOST_MAX_SPEED = 0.8;
  const NORMAL_ACCELERATION = 0.006;
  const BOOST_ACCELERATION = 0.012;
  const ROTATION_ACCELERATION = 0.015; // Fast turning
  const MAX_ROTATION_SPEED = 0.08; // High max rotation speed
  const ANGULAR_DAMPING = 0.85; // Significantly increased damping for more momentum
  const BANK_ANGLE = 0.4; // Banking angle (in radians)
  const BANK_SPEED = 0.15; // Quick banking response
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
        child.material.metalness = 0.85; // Increased metalness for more reflectivity
        child.material.roughness = 0.3; // Decreased roughness for more shine
        child.material.emissive = new THREE.Color(0x00ffff);
        child.material.emissiveIntensity = 2.0; // Increased emission intensity

        // Add custom neon shader with more dynamic effects
        if (!child.material.onBeforeCompile) {
          child.material.onBeforeCompile = (shader) => {
            shader.fragmentShader = shader.fragmentShader.replace(
              "#include <emissivemap_fragment>",
              `
              #include <emissivemap_fragment>
              // Dynamic pulsing effect
              float mainPulse = sin(time * 2.0) * 0.5 + 0.5;
              // Secondary faster pulse
              float secondaryPulse = sin(time * 5.0) * 0.3 + 0.7;
              // Edge glow effect
              float edgeGlow = pow(1.0 - dot(normal, viewDir), 3.0) * 2.0;
              // Combine effects
              vec3 neonColor = vec3(0.0, 1.0, 1.0); // Cyan base color
              vec3 accentColor = vec3(1.0, 0.2, 0.8); // Pink accent
              totalEmissiveRadiance *= 1.0 + mainPulse * 0.5;
              totalEmissiveRadiance += mix(neonColor, accentColor, secondaryPulse) * edgeGlow;
              totalEmissiveRadiance *= 1.5; // Overall brightness boost
              `
            );

            // Add required uniforms
            shader.uniforms.time = { value: 0 };
            shader.uniforms.viewDir = { value: new THREE.Vector3() };
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
          child.material.userData.shader.uniforms.time.value =
            state.clock.elapsedTime;
        }
      });

      // Calculate new position and rotation
      const newMovement = { ...movement };

      // Energy management
      if (newMovement.boosting) {
        newMovement.energy = Math.max(
          0,
          newMovement.energy - ENERGY_CONSUMPTION_RATE
        );
        if (newMovement.energy <= 0) {
          newMovement.boosting = false;
        }
      } else {
        newMovement.energy = Math.min(
          100,
          newMovement.energy + ENERGY_RECOVERY_RATE
        );
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
      const currentMaxSpeed = newMovement.boosting
        ? BOOST_MAX_SPEED
        : NORMAL_MAX_SPEED;
      const currentAcceleration = newMovement.boosting
        ? BOOST_ACCELERATION
        : NORMAL_ACCELERATION;

      // Calculate thrust based on input
      let targetThrust = 0;
      if (keys.ArrowUp) targetThrust = 1;
      if (keys.ArrowDown) targetThrust = -0.5; // Slower reverse speed

      // Smoothly interpolate thrust
      newMovement.thrust += (targetThrust - newMovement.thrust) * 0.1;

      // Apply thrust to acceleration with proper directional vectors
      const shipForward = new THREE.Vector3(0, 0, 1).applyEuler(
        new THREE.Euler(...newMovement.rotation)
      );
      const thrustVector = shipForward.multiplyScalar(
        newMovement.thrust * currentAcceleration
      );

      newMovement.acceleration[0] = thrustVector.x;
      newMovement.acceleration[1] = 0;
      newMovement.acceleration[2] = thrustVector.z;

      // Calculate angular acceleration with momentum
      const angularAccel = [0, 0, 0];
      let targetRotationSpeed = 0;

      if (keys.ArrowLeft) targetRotationSpeed = MAX_ROTATION_SPEED;
      if (keys.ArrowRight) targetRotationSpeed = -MAX_ROTATION_SPEED;

      // Smoothly approach target rotation speed
      const currentRotationSpeed = newMovement.angularVelocity[1];
      const rotationDiff = targetRotationSpeed - currentRotationSpeed;
      angularAccel[1] = rotationDiff * ROTATION_ACCELERATION;

      // Calculate target bank angle based on turning
      const turnIntensity = currentRotationSpeed / MAX_ROTATION_SPEED;
      newMovement.targetBankAngle = -turnIntensity * BANK_ANGLE;

      // Smoothly interpolate current bank angle towards target
      newMovement.bankAngle +=
        (newMovement.targetBankAngle - newMovement.bankAngle) * BANK_SPEED;

      // Update angular velocity with improved physics
      newMovement.angularVelocity = newMovement.angularVelocity.map((av, i) => {
        let newAV = av + angularAccel[i];

        // Apply stronger angular damping (even stronger when stabilizing)
        const dampingFactor = newMovement.stabilizing
          ? ANGULAR_DAMPING * 0.8
          : ANGULAR_DAMPING;
        newAV *= dampingFactor;

        // Limit maximum rotation speed
        if (Math.abs(newAV) > MAX_ROTATION_SPEED) {
          newAV = Math.sign(newAV) * MAX_ROTATION_SPEED;
        }

        return newAV;
      });

      // Update rotation based on angular velocity
      newMovement.rotation = newMovement.rotation.map(
        (r, i) => r + newMovement.angularVelocity[i]
      );

      // Apply stabilization if active
      if (newMovement.stabilizing) {
        newMovement.velocity = newMovement.velocity.map((v) => v * 0.9);
        newMovement.angularVelocity = newMovement.angularVelocity.map(
          (av) => av * 0.8
        );
        newMovement.bankAngle *= 0.9;
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

      // Update movement state
      setMovement(newMovement);

      // Apply movement and rotation to the group
      group.current.position.set(...newMovement.position);

      // Apply rotation with banking effect
      group.current.rotation.set(
        newMovement.bankAngle, // Bank (roll)
        newMovement.rotation[1], // Yaw (turning)
        newMovement.rotation[2] +
          (newMovement.stabilizing ? 0.005 : 0.015) *
            Math.sin(state.clock.elapsedTime * 0.5) // Z-axis oscillation
      );

      // Add slight floating animation (reduced when stabilizing)
      const floatAmount = newMovement.stabilizing ? 0.0005 : 0.001;
      group.current.position.y +=
        Math.sin(state.clock.elapsedTime) * floatAmount;

      // Add slight roll oscillation based on speed
      const speedOscillation =
        (Math.sin(state.clock.elapsedTime * 2) *
          0.005 *
          (Math.abs(newMovement.velocity[0]) +
            Math.abs(newMovement.velocity[2]))) /
        NORMAL_MAX_SPEED;
      group.current.rotation.z = speedOscillation;
    }
  });

  return (
    <group ref={group} {...otherProps}>
      <primitive object={scene} scale={[0.1, 0.1, 0.1]} />
      {/* Center engine trail */}
      <EngineTrail 
        position={[
          group.current?.position.x || 0,
          group.current?.position.y || 0,
          (group.current?.position.z || 0) + 0.2
        ]} 
        thrust={Math.max(0.2, Math.abs(movement.thrust))}
        color="#00ffff" 
      />
      {/* Left engine trail */}
      <EngineTrail 
        position={[
          (group.current?.position.x || 0) - 0.1,
          group.current?.position.y || 0,
          (group.current?.position.z || 0) + 0.2
        ]} 
        thrust={Math.max(0.2, Math.abs(movement.thrust))}
        color="#ff1493"
      />
      {/* Right engine trail */}
      <EngineTrail 
        position={[
          (group.current?.position.x || 0) + 0.1,
          group.current?.position.y || 0,
          (group.current?.position.z || 0) + 0.2
        ]} 
        thrust={Math.max(0.2, Math.abs(movement.thrust))}
        color="#ff1493"
      />
    </group>
  );
});

Spaceship.displayName = "Spaceship";

// Preload the model
useGLTF.preload("/models/spaceship.glb");

export default Spaceship;
