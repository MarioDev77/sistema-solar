'use client'

import type { Texture } from 'three'
import { useFrame, useThree } from '@react-three/fiber'
import { useTexture } from '@react-three/drei'
import { Suspense, useEffect, useRef, type RefObject } from 'react'
import { coreTextureUrls } from './preload'
import { configureTexture } from './textures'
import { markTexturesWarm } from './warmup'

function WarmTexture({ url, queue }: { url: string; queue: RefObject<Texture[]> }) {
  // mesma chave de cache do preload: não baixa de novo
  const texture = useTexture(url)
  useEffect(() => {
    queue.current.push(texture)
  }, [texture, queue])
  return null
}

/**
 * Envia as texturas essenciais para a GPU UMA POR QUADRO, enquanto a tela de carregamento ainda está
 * visível. Sem isso, o upload + geração de mipmaps de ~10 texturas acontecia todo de uma vez no primeiro
 * frame da cena (um travamento longo logo ao abrir). Aqui o custo é diluído e o loader continua animando.
 */
export function TextureWarmup() {
  const gl = useThree((state) => state.gl)
  const urls = useRef(coreTextureUrls()).current
  const queue = useRef<Texture[]>([])
  const uploaded = useRef(0)

  useFrame(() => {
    const texture = queue.current.shift()
    if (!texture) return
    configureTexture(texture, gl, 16)
    gl.initTexture(texture)
    uploaded.current += 1
    if (uploaded.current >= urls.length) markTexturesWarm()
  })

  return (
    <>
      {urls.map((url) => (
        <Suspense key={url} fallback={null}>
          <WarmTexture url={url} queue={queue} />
        </Suspense>
      ))}
    </>
  )
}
