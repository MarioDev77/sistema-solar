# sistema-solar

Observatório virtual 3D do Sistema Solar (Next.js + React Three Fiber).

## Rodar

```bash
pnpm install
pnpm dev      # desenvolvimento
pnpm build    # build de produção (checa tipos)
```

## Estrutura

- `app/` — layout, página e estilos globais
- `components/solar-system-explorer.tsx` — componente principal (estado e barra de ferramentas)
- `components/planet.tsx` — esfera texturizada
- `components/solar/`
  - `data.ts`, `textures.ts`, `preload.ts` — dados, caminhos das texturas e pré-carregamento
  - `scene.tsx`, `camera.tsx`, `clock.tsx` — cena 3D, câmeras e relógio da simulação
  - `planet-system.tsx`, `bodies.tsx`, `orbits.tsx`, `belts.tsx`, `nebula.tsx` — corpos celestes
  - `kepler-experiment.tsx` — experimento da 3ª lei de Kepler
  - `panels/` — painéis da interface (info, comparação, cosmos, aula, simulação, camadas…)
- `public/textures/` — texturas (créditos em `CREDITOS.txt`)

## Atalhos

`Espaço` pausa/retoma · `←` `→` trocam de planeta · `Esc` volta · `Ctrl/⌘ + K` busca

Link direto para um planeta: `/?planeta=marte`
