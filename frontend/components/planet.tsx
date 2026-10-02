"use client";

import { useEffect, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { useTexture } from "@react-three/drei";
import * as THREE from "three";
import { configureTexture } from "@/components/solar/textures";

interface PlanetProps {
  textureUrl: string;
  size?: number;
  /** Velocidade de rotação em radianos por segundo. */
  rotationSpeed?: number;
  /** Segmentos horizontais da esfera. */
  segments?: number;
  /**
   * Superfícies rochosas e geladas ficam naturalmente mais foscas.
   * Gigantes gasosos podem passar um roughness ligeiramente menor.
   */
  roughness?: number;
  metalness?: number;
  materialColor?: string;
}

/**
 * Corpo esférico com textura equiretangular 2:1.
 *
 * O tratamento de cor e filtragem evita:
 * - texturas lavadas pelo iluminador;
 * - serrilhado excessivo em órbitas inclinadas;
 * - aparência plástica causada por metalness alto;
 * - geometria desnecessariamente densa em dispositivos simples.
 */
export function Planet({
  textureUrl,
  size = 1,
  rotationSpeed = 0.3,
  segments = 64,
  roughness = 0.84,
  metalness = 0,
  materialColor = "#f8f4ec",
}: PlanetProps) {
  const meshRef = useRef<THREE.Mesh>(null!);
  const texture = useTexture(textureUrl);
  const gl = useThree((state) => state.gl);

  const heightSegments = Math.max(24, Math.round(segments * 0.75));

  useEffect(() => {
    configureTexture(texture, gl, 16);
  }, [texture, gl]);

  useFrame((_, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += rotationSpeed * delta;
    }
  });

  return (
    <mesh ref={meshRef} castShadow receiveShadow>
      <sphereGeometry args={[size, segments, heightSegments]} />
      <meshStandardMaterial
        map={texture}
        color={materialColor}
        roughness={roughness}
        metalness={metalness}
        envMapIntensity={0.12}
        dithering
      />
    </mesh>
  );
}

/**
 * Fallback de cor sólida para o carregamento ou para corpos sem textura.
 */
export function FlatPlanet({
  size = 1,
  color,
  segments = 40,
}: {
  size?: number;
  color: string;
  segments?: number;
}) {
  return (
    <mesh castShadow receiveShadow>
      <sphereGeometry
        args={[
          size,
          segments,
          Math.max(18, Math.round(segments * 0.75)),
        ]}
      />
      <meshStandardMaterial
        color={color}
        roughness={0.9}
        metalness={0}
        dithering
      />
    </mesh>
  );
}
