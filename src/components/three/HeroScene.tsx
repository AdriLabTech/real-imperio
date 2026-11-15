"use client";

import { Environment, Lightformer } from "@react-three/drei";
import { Canvas, useFrame, useLoader } from "@react-three/fiber";
import { Suspense, useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { asset, club } from "@/config/club";

function Ball({ small }: { small: boolean }) {
  const group = useRef<THREE.Group>(null);
  const mesh = useRef<THREE.Mesh>(null);
  // Texturas precalculadas (scripts/bake-ball.mjs): se decodifican fuera del hilo principal.
  const [map, bumpMap] = useLoader(THREE.TextureLoader, [asset("/textures/ball-color.webp"), asset("/textures/ball-bump.webp")]);
  // eslint-disable-next-line react-hooks/immutability -- las texturas de three son objetos externos mutables por diseño
  useEffect(() => { map.colorSpace = THREE.SRGBColorSpace; map.anisotropy = 4; map.needsUpdate = true; }, [map]);

  useFrame((state, dt) => {
    const t = state.clock.elapsedTime;
    if (mesh.current) {
      mesh.current.rotation.y += dt * 0.35;
      mesh.current.rotation.x = Math.sin(t * 0.4) * 0.15;
    }
    if (group.current) {
      // Respuesta al cursor: inclinación suave y desplazamiento
      group.current.rotation.y = THREE.MathUtils.damp(group.current.rotation.y, state.pointer.x * 0.7, 3, dt);
      group.current.rotation.x = THREE.MathUtils.damp(group.current.rotation.x, -state.pointer.y * 0.45, 3, dt);
      group.current.position.x = THREE.MathUtils.damp(group.current.position.x, state.pointer.x * 0.35, 3, dt);
      group.current.position.y = Math.sin(t * 0.9) * 0.12;
    }
  });

  return (
    <group position={[small ? 0 : 0.9, small ? -0.3 : -0.1, 0]}>
    <group ref={group}>
      <mesh ref={mesh} castShadow>
        <sphereGeometry args={[1.05, small ? 32 : 96, small ? 32 : 96]} />
        <meshStandardMaterial map={map} bumpMap={bumpMap} bumpScale={1.4} roughness={0.42} metalness={0.05} />
      </mesh>
    </group>
    </group>
  );
}

function Particles({ count }: { count: number }) {
  const ref = useRef<THREE.Points>(null);
  const positions = useMemo(() => {
    // PRNG determinista (mulberry32): el campo de partículas es idéntico entre renders.
    let s = 0x9e3779b9;
    const rand = () => { s = (s + 0x6d2b79f5) | 0; let t = Math.imul(s ^ (s >>> 15), 1 | s); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
    const a = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) { a[i * 3] = (rand() - 0.5) * 14; a[i * 3 + 1] = (rand() - 0.5) * 9; a[i * 3 + 2] = (rand() - 0.5) * 8 - 1; }
    return a;
  }, [count]);
  useFrame((s, dt) => { if (ref.current) { ref.current.rotation.y += dt * 0.02; ref.current.position.y = Math.sin(s.clock.elapsedTime * 0.2) * 0.15; } });
  return (
    <points ref={ref}>
      <bufferGeometry><bufferAttribute attach="attributes-position" args={[positions, 3]} /></bufferGeometry>
      <pointsMaterial size={0.03} color={club.colors.primary} transparent opacity={0.75} sizeAttenuation depthWrite={false} blending={THREE.AdditiveBlending} />
    </points>
  );
}

function Geometry() {
  const ico = useRef<THREE.Mesh>(null);
  const ring = useRef<THREE.Mesh>(null);
  useFrame((_, dt) => {
    if (ico.current) { ico.current.rotation.x += dt * 0.15; ico.current.rotation.y += dt * 0.2; }
    if (ring.current) ring.current.rotation.z += dt * 0.08;
  });
  return (
    <>
      <mesh ref={ico} position={[-3.1, 1.3, -1.5]}>
        <icosahedronGeometry args={[0.7, 0]} />
        <meshBasicMaterial color={club.colors.primary} wireframe transparent opacity={0.55} />
      </mesh>
      <mesh ref={ring} position={[0, 0, -1]} rotation={[1.1, 0.2, 0]}>
        <torusGeometry args={[2.4, 0.008, 8, 128]} />
        <meshBasicMaterial color={club.colors.paper} transparent opacity={0.4} />
      </mesh>
      <mesh position={[3.2, -1.5, -2]} rotation={[0.6, 0.4, 0]}>
        <octahedronGeometry args={[0.45, 0]} />
        <meshBasicMaterial color={club.colors.paper} wireframe transparent opacity={0.5} />
      </mesh>
    </>
  );
}

export default function HeroScene({ small, active }: { small: boolean; active: boolean }) {
  return (
    <Canvas
      frameloop={active ? "always" : "never"}
      dpr={small ? 1 : [1, 2]}
      camera={{ position: [0, 0, small ? 7.4 : 5.2], fov: 42 }}
      gl={{ antialias: !small, alpha: true, powerPreference: "high-performance" }}
      aria-hidden
    >
      <ambientLight intensity={0.35} />
      <directionalLight position={[-4, 4, 3]} intensity={2.4} color={club.colors.primary} />
      <directionalLight position={[4, -1, 2]} intensity={1.6} color={club.colors.paper} />
      <pointLight position={[0, 2, 4]} intensity={18} color="#ffffff" />
      <Environment resolution={64} frames={1}>
        <Lightformer form="rect" intensity={3} position={[0, 4, 3]} scale={[6, 1.2, 1]} />
        <Lightformer form="rect" intensity={2} color={club.colors.primary} position={[-5, 0, 2]} scale={[1, 5, 1]} />
        <Lightformer form="rect" intensity={2} color={club.colors.primary} position={[5, 0, 2]} scale={[1, 5, 1]} />
      </Environment>
      <Suspense fallback={null}><Ball small={small} /></Suspense>
      <Geometry />
      <Particles count={small ? 90 : 650} />
    </Canvas>
  );
}
