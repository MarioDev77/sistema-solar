'use client'

import * as THREE from 'three'
import { useThree } from '@react-three/fiber'
import { Html, useTexture } from '@react-three/drei'
import { useMemo, useEffect } from 'react'
import { CosmosObject } from './data'
import { nebulaTextures, RenderQuality } from './textures'

const nebulaPlacements: Record<string, { position: [number, number, number]; scale: [number, number, number] }> = {
  'Nebulosa de Órion': { position: [-8, 2.4, -4], scale: [8.5, 4.1, 1] },
  'Nebulosa do Anel': { position: [7.5, 3.5, -7], scale: [5, 5, 1] },
  'Nebulosa do Caranguejo': { position: [-6.5, -3.2, 5], scale: [5.5, 4.9, 1] },
  'Nebulosa da Águia': { position: [7, -2.8, 4], scale: [8.5, 4.1, 1] },
}

export function DeepSpaceNebula({ object, selected, register, onSelect, quality }: { object: CosmosObject; selected: boolean; register: (name: string, node: THREE.Object3D | null) => void; onSelect: (object: CosmosObject) => void; quality: RenderQuality }) {
  const texture = useTexture(nebulaTextures[object.name as keyof typeof nebulaTextures])
  const gl = useThree((state) => state.gl)
  const placement = nebulaPlacements[object.name]
  const volumeTexture = useMemo(() => {
    if (typeof document === 'undefined' || !texture.image) return texture
    const image = texture.image as HTMLImageElement
    const canvas = document.createElement('canvas')
    canvas.width = image.naturalWidth || image.width
    canvas.height = image.naturalHeight || image.height
    const context = canvas.getContext('2d', { willReadFrequently: true })
    if (!context) return texture
    context.drawImage(image, 0, 0, canvas.width, canvas.height)
    const frame = context.getImageData(0, 0, canvas.width, canvas.height)
    const pixels = frame.data
    const smoothstep = (edge0: number, edge1: number, value: number) => {
      const t = THREE.MathUtils.clamp((value - edge0) / (edge1 - edge0), 0, 1)
      return t * t * (3 - 2 * t)
    }
    for (let index = 0; index < pixels.length; index += 4) {
      const red = pixels[index] / 255
      const green = pixels[index + 1] / 255
      const blue = pixels[index + 2] / 255
      const luminance = red * 0.2126 + green * 0.7152 + blue * 0.0722
      const chroma = Math.max(red, green, blue) - Math.min(red, green, blue)
      const cloud = smoothstep(0.018, 0.16, luminance) * 0.82
      const coloredGas = smoothstep(0.035, 0.24, chroma) * 0.68
      const brightDetail = smoothstep(0.28, 0.72, luminance)
      pixels[index + 3] = Math.round(Math.max(cloud, coloredGas, brightDetail) * 255)
    }
    context.putImageData(frame, 0, 0)
    const result = new THREE.CanvasTexture(canvas)
    result.colorSpace = THREE.SRGBColorSpace
    result.anisotropy = Math.min(8, gl.capabilities.getMaxAnisotropy())
    result.generateMipmaps = true
    result.minFilter = THREE.LinearMipmapLinearFilter
    result.magFilter = THREE.LinearFilter
    return result
  }, [texture, gl])
  const geometry = useMemo(() => {
    const segments = quality === 'high' ? 144 : 96
    const cloud = new THREE.PlaneGeometry(placement.scale[0], placement.scale[1], segments, Math.round(segments * 0.52))
    if (typeof document === 'undefined' || !texture.image) return cloud
    const positions = cloud.attributes.position
    const uv = cloud.attributes.uv
    const image = texture.image as HTMLImageElement
    const canvas = document.createElement('canvas')
    canvas.width = 256
    canvas.height = 144
    const context = canvas.getContext('2d', { willReadFrequently: true })
    if (context && image) {
      context.drawImage(image, 0, 0, canvas.width, canvas.height)
      const pixels = context.getImageData(0, 0, canvas.width, canvas.height).data
      for (let index = 0; index < positions.count; index++) {
        const x = Math.min(canvas.width - 1, Math.floor(uv.getX(index) * canvas.width))
        const y = Math.min(canvas.height - 1, Math.floor((1 - uv.getY(index)) * canvas.height))
        const pixel = (y * canvas.width + x) * 4
        const red = pixels[pixel] / 255
        const green = pixels[pixel + 1] / 255
        const blue = pixels[pixel + 2] / 255
        const luminance = red * 0.2126 + green * 0.7152 + blue * 0.0722
        const chroma = Math.max(red, green, blue) - Math.min(red, green, blue)
        const cloudRelief = THREE.MathUtils.clamp((luminance - 0.035) * 0.9 + chroma * 0.28, 0, 0.72)
        const turbulence = (Math.sin(x * 0.052 + y * 0.018) * Math.cos(y * 0.061 - x * 0.014)) * 0.09
        positions.setZ(index, cloudRelief + turbulence)
      }
      positions.needsUpdate = true
      cloud.computeVertexNormals()
      cloud.computeBoundingSphere()
    }
    return cloud
  }, [texture, placement, quality])
  useEffect(() => { texture.colorSpace = THREE.SRGBColorSpace; texture.anisotropy = Math.min(8, gl.capabilities.getMaxAnisotropy()); texture.needsUpdate = true }, [texture, gl])
  useEffect(() => () => { geometry.dispose(); if (volumeTexture !== texture) volumeTexture.dispose() }, [geometry, texture, volumeTexture])
  return <group position={placement.position} onClick={(event) => { event.stopPropagation(); onSelect(object) }}>
    <group ref={(node) => register(object.name, node)}>
      <mesh geometry={geometry} position-z={-0.62} renderOrder={selected ? 3 : 1}>
        <meshBasicMaterial map={volumeTexture} transparent opacity={selected ? 0.13 : 0.1} depthWrite={false} side={THREE.DoubleSide} toneMapped={false} />
      </mesh>
      <mesh geometry={geometry} position-z={-0.34} renderOrder={selected ? 4 : 2}>
        <meshBasicMaterial map={volumeTexture} transparent opacity={selected ? 0.19 : 0.15} depthWrite={false} side={THREE.DoubleSide} toneMapped={false} />
      </mesh>
      <mesh geometry={geometry} position-z={-0.12} renderOrder={selected ? 5 : 3}>
        <meshBasicMaterial map={volumeTexture} transparent opacity={selected ? 0.22 : 0.18} depthWrite={false} side={THREE.DoubleSide} toneMapped={false} />
      </mesh>
      <mesh geometry={geometry} renderOrder={selected ? 6 : 4}>
        <meshBasicMaterial map={volumeTexture} transparent opacity={selected ? 0.98 : 0.88} depthWrite={false} side={THREE.DoubleSide} toneMapped={false} />
      </mesh>
    </group>
    <Html center distanceFactor={15} position={[0, -placement.scale[1] * 0.62, 0]}>
      <button className={`nebula-space-label ${selected ? 'active' : ''}`} onClick={(event) => { event.stopPropagation(); onSelect(object) }}>{object.name.toUpperCase()}<small>{object.distance}</small></button>
    </Html>
  </group>
}
