"use client";
import { Canvas, useFrame } from "@react-three/fiber";
import { useGLTF, Environment, ContactShadows, Float } from "@react-three/drei";
import React, { Suspense, useRef } from "react";
import * as THREE from "three";

function MascotModel() {
  const { scene } = useGLTF("/hero_3d_model/mascot.glb");
  const groupRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (groupRef.current) {
      // Calculate target rotation based on mouse coordinates (-1 to +1)
      const targetX = (state.pointer.x * Math.PI) / 3.5;
      const targetY = (state.pointer.y * Math.PI) / 4;
      
      // Smoothly interpolate current rotation to target rotation
      groupRef.current.rotation.y = THREE.MathUtils.lerp(groupRef.current.rotation.y, targetX, 0.05);
      groupRef.current.rotation.x = THREE.MathUtils.lerp(groupRef.current.rotation.x, -targetY, 0.05);
    }
  });

  return (
    <group ref={groupRef}>
      <primitive object={scene} scale={5.5} position={[0, -0.4, 0]} />
    </group>
  );
}

export default function Hero3DModel() {
  return (
    <div style={{ width: "100%", height: "100%", cursor: "default" }}>
      <Canvas shadows camera={{ position: [0, 0, 6], fov: 45 }} style={{ background: "transparent" }}>
        <ambientLight intensity={0.6} />
        <directionalLight position={[5, 10, 5]} intensity={1.5} castShadow />
        <spotLight position={[-5, 5, 5]} intensity={0.8} angle={0.4} penumbra={1} />
        
        <Suspense fallback={null}>
          <Environment preset="city" />
          <Float speed={2} rotationIntensity={0.1} floatIntensity={0.8}>
            <MascotModel />
          </Float>
          <ContactShadows position={[0, -0.8, 0]} opacity={0.6} scale={20} blur={3} far={4} color="#000000" />
        </Suspense>
      </Canvas>
    </div>
  );
}
