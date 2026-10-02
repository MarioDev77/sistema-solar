import { useTexture } from '@react-three/drei'
import { nebulaTextures, TexKey, textures } from './textures'

export type MoonData = {
  name: string; key: TexKey; relSize: number; dist: number; speed: number;
  color: string; retro?: boolean;
  atmosphere?: { color: string; opacity: number; scale?: number };
}

export type PlanetData = {
  name: string; key: TexKey; orbit: number; size: number; color: string; type: string;
  moons: string; distance: string; period: string; description: string;
  atmosphere?: { color: string; opacity: number; scale?: number };
  moonList: MoonData[];
}

export type MoonSelection = { moon: MoonData; planet: PlanetData }
export type CatalogObject = { name: string; kind: string; planet: PlanetData; moon?: MoonData }
type MoonKnowledge = { diameter: string; orbit: string; period: string; fact: string }

export const planets: PlanetData[] = [
  { name: 'Mercúrio', key: 'mercury', orbit: 3.5, size: .16, color: '#9e9e9e', type: 'Planeta rochoso', moons: '0', distance: '0,39 AU', period: '88 dias', description: 'O menor planeta e o mais próximo do Sol.', moonList: [] },
  { name: 'Vênus', key: 'venus', orbit: 4.8, size: .27, color: '#c8904d', type: 'Planeta rochoso', moons: '0', distance: '0,72 AU', period: '225 dias', description: 'Um mundo de nuvens densas e atmosfera extrema.', atmosphere: { color: '#e8c46a', opacity: .22 }, moonList: [] },
  { name: 'Terra', key: 'earth', orbit: 6.2, size: .3, color: '#3c75b9', type: 'Planeta rochoso', moons: '1', distance: '1,00 AU', period: '365,25 dias', description: 'Nosso planeta azul, com oceanos e vida conhecida.', atmosphere: { color: '#4da3ff', opacity: .18 }, moonList: [{ name: 'Lua', key: 'moon', relSize: .27, dist: 2.4, speed: .3, color: '#b8b8b8' }] },
  { name: 'Marte', key: 'mars', orbit: 7.6, size: .23, color: '#a85635', type: 'Planeta rochoso', moons: '2', distance: '1,52 AU', period: '687 dias', description: 'O planeta vermelho, marcado por vulcões e vales.', atmosphere: { color: '#d88a5a', opacity: .1 }, moonList: [{ name: 'Fobos', key: 'phobos', relSize: .17, dist: 1.6, speed: .9, color: '#7a6f66' }, { name: 'Deimos', key: 'deimos', relSize: .12, dist: 2.2, speed: .6, color: '#8a7a6a' }] },
  { name: 'Júpiter', key: 'jupiter', orbit: 10.4, size: .78, color: '#d4a36e', type: 'Gigante gasoso', moons: '115', distance: '5,20 AU', period: '11,86 anos', description: 'O maior planeta do Sistema Solar.', atmosphere: { color: '#d4a36e', opacity: .08 }, moonList: [{ name: 'Io', key: 'io', relSize: .18, dist: 1.9, speed: .7, color: '#d9c04a' }, { name: 'Europa', key: 'europa', relSize: .16, dist: 2.3, speed: .55, color: '#d8cbb0' }, { name: 'Ganímedes', key: 'ganymede', relSize: .24, dist: 2.8, speed: .4, color: '#9a8a78' }, { name: 'Calisto', key: 'callisto', relSize: .21, dist: 3.4, speed: .3, color: '#6a5f52' }] },
  { name: 'Saturno', key: 'saturn', orbit: 13.8, size: .68, color: '#c6a276', type: 'Gigante gasoso', moons: '293', distance: '9,54 AU', period: '29,45 anos', description: 'Gigante gasoso conhecido pelo seu magnífico sistema de anéis.', atmosphere: { color: '#e0c890', opacity: .08 }, moonList: [{ name: 'Mimas', key: 'mimas', relSize: .075, dist: 1.55, speed: .95, color: '#c7c4bd' }, { name: 'Encélado', key: 'enceladus', relSize: .1, dist: 1.9, speed: .8, color: '#e8f0f2' }, { name: 'Tétis', key: 'tethys', relSize: .115, dist: 2.2, speed: .68, color: '#c8c6c0' }, { name: 'Dione', key: 'dione', relSize: .12, dist: 2.55, speed: .58, color: '#b8b4ac' }, { name: 'Reia', key: 'rhea', relSize: .14, dist: 2.95, speed: .48, color: '#c4c0b8' }, { name: 'Titã', key: 'titan', relSize: .24, dist: 3.55, speed: .35, color: '#d08a3a', atmosphere: { color: '#e08b3a', opacity: .4, scale: 1.6 } }, { name: 'Jápeto', key: 'iapetus', relSize: .13, dist: 4.25, speed: .25, color: '#8a8278' }] },
  { name: 'Urano', key: 'uranus', orbit: 17.1, size: .46, color: '#78b8c4', type: 'Gigante de gelo', moons: '29', distance: '19,19 AU', period: '84 anos', description: 'Um gigante de gelo que gira inclinado de lado.', atmosphere: { color: '#9fd8e0', opacity: .1 }, moonList: [{ name: 'Miranda', key: 'miranda', relSize: .09, dist: 1.7, speed: .8, color: '#a8a49e' }, { name: 'Ariel', key: 'ariel', relSize: .13, dist: 2.0, speed: .6, color: '#c8c4bc' }, { name: 'Umbriel', key: 'umbriel', relSize: .12, dist: 2.4, speed: .5, color: '#6a6866' }, { name: 'Titânia', key: 'titania', relSize: .17, dist: 2.9, speed: .4, color: '#a8988a' }, { name: 'Oberon', key: 'oberon', relSize: .16, dist: 3.3, speed: .32, color: '#988578' }] },
  { name: 'Netuno', key: 'neptune', orbit: 20.4, size: .45, color: '#3558ca', type: 'Gigante de gelo', moons: '16', distance: '30,06 AU', period: '164,8 anos', description: 'O mundo mais distante, com ventos supersônicos.', atmosphere: { color: '#5a7fe0', opacity: .12 }, moonList: [{ name: 'Tritão', key: 'triton', relSize: .25, dist: 2.3, speed: .45, color: '#d8c4bc', retro: true }] },
  { name: 'Plutão', key: 'pluto', orbit: 23.5, size: .14, color: '#c8b8a8', type: 'Planeta anão', moons: '5', distance: '39,48 AU', period: '248 anos', description: 'O mais famoso planeta anão, com o coração de gelo Sputnik Planitia.', moonList: [{ name: 'Caronte', key: 'charon', relSize: .55, dist: 1.9, speed: .5, color: '#8a8a8c' }] },
]

export const planetSizes: Record<string, number> = Object.fromEntries(planets.map(p => [p.name, p.size]))
export const planetFacts: Record<string, { diameter: string; gravity: string }> = {
  'Mercúrio': { diameter: '4.879 km', gravity: '3,7 m/s²' },
  'Vênus': { diameter: '12.104 km', gravity: '8,9 m/s²' },
  'Terra': { diameter: '12.756 km', gravity: '9,8 m/s²' },
  'Marte': { diameter: '6.792 km', gravity: '3,7 m/s²' },
  'Júpiter': { diameter: '142.984 km', gravity: '23,1 m/s²' },
  'Saturno': { diameter: '120.536 km', gravity: '9,0 m/s²' },
  'Urano': { diameter: '51.118 km', gravity: '8,7 m/s²' },
  'Netuno': { diameter: '49.528 km', gravity: '11,0 m/s²' },
  'Plutão': { diameter: '2.376 km', gravity: '0,7 m/s²' },
}

export const moonKnowledge: Record<string, MoonKnowledge> = {
  'Lua': { diameter: '3.475 km', orbit: '384.400 km da Terra', period: '27,3 dias', fact: 'A Lua ajuda a estabilizar a inclinação do eixo terrestre e influencia as marés.' },
  'Fobos': { diameter: '22 km', orbit: '9.376 km de Marte', period: '7,7 horas', fact: 'Fobos orbita tão perto de Marte que completa três voltas enquanto Marte gira uma vez.' },
  'Deimos': { diameter: '12 km', orbit: '23.463 km de Marte', period: '30,3 horas', fact: 'Deimos é a menor e mais externa das duas luas de Marte.' },
  'Io': { diameter: '3.643 km', orbit: '421.700 km de Júpiter', period: '1,77 dias', fact: 'Io é o corpo com maior atividade vulcânica conhecida do Sistema Solar.' },
  'Europa': { diameter: '3.122 km', orbit: '671.100 km de Júpiter', period: '3,55 dias', fact: 'Europa tem uma crosta de gelo e fortes evidências de um oceano sob a superfície.' },
  'Ganímedes': { diameter: '5.268 km', orbit: '1.070.400 km de Júpiter', period: '7,15 dias', fact: 'Ganímedes é a maior lua do Sistema Solar e possui campo magnético próprio.' },
  'Calisto': { diameter: '4.821 km', orbit: '1.882.700 km de Júpiter', period: '16,69 dias', fact: 'Calisto tem uma superfície muito antiga, marcada por crateras de impacto.' },
  'Mimas': { diameter: '396 km', orbit: '185.500 km de Saturno', period: '22,6 horas', fact: 'A enorme cratera Herschel dá a Mimas uma aparência parecida com a Estrela da Morte.' },
  'Encélado': { diameter: '504 km', orbit: '237.900 km de Saturno', period: '1,37 dias', fact: 'Jatos de vapor d’água e partículas de gelo saem de fissuras próximas ao polo sul.' },
  'Tétis': { diameter: '1.062 km', orbit: '294.600 km de Saturno', period: '1,89 dias', fact: 'Tétis abriga a grande cratera Odysseus e o longo cânion Ithaca Chasma.' },
  'Dione': { diameter: '1.123 km', orbit: '377.400 km de Saturno', period: '2,74 dias', fact: 'Dione tem fraturas e escarpas brilhantes formadas por terreno gelado.' },
  'Reia': { diameter: '1.527 km', orbit: '527.100 km de Saturno', period: '4,52 dias', fact: 'Reia é a segunda maior lua de Saturno e tem uma superfície muito craterada.' },
  'Titã': { diameter: '5.150 km', orbit: '1.221.900 km de Saturno', period: '15,95 dias', fact: 'Titã tem atmosfera densa e lagos e mares de metano e etano líquidos.' },
  'Jápeto': { diameter: '1.469 km', orbit: '3.560.800 km de Saturno', period: '79,3 dias', fact: 'Jápeto tem hemisférios com brilho muito diferente e uma crista que percorre o equador.' },
  'Miranda': { diameter: '472 km', orbit: '129.900 km de Urano', period: '1,41 dias', fact: 'Miranda apresenta falésias e terrenos muito diferentes, como se fossem grandes mosaicos.' },
  'Ariel': { diameter: '1.158 km', orbit: '190.900 km de Urano', period: '2,52 dias', fact: 'Ariel possui vales e cânions que indicam uma história geológica ativa.' },
  'Umbriel': { diameter: '1.169 km', orbit: '266.000 km de Urano', period: '4,14 dias', fact: 'Umbriel é uma das luas mais escuras de Urano e tem uma superfície antiga e craterada.' },
  'Titânia': { diameter: '1.578 km', orbit: '436.300 km de Urano', period: '8,71 dias', fact: 'Titânia é a maior lua de Urano e possui grandes cânions em sua superfície.' },
  'Oberon': { diameter: '1.523 km', orbit: '583.500 km de Urano', period: '13,46 dias', fact: 'Oberon é a lua principal mais distante de Urano, com terreno antigo e craterado.' },
  'Tritão': { diameter: '2.707 km', orbit: '354.800 km de Netuno', period: '5,88 dias · retrógrado', fact: 'Tritão orbita Netuno no sentido contrário à rotação do planeta e apresenta atividade de gêiseres.' },
  'Caronte': { diameter: '1.212 km', orbit: '19.600 km de Plutão', period: '6,39 dias', fact: 'Caronte é tão grande em relação a Plutão que os dois orbitam um ponto comum no espaço.' },
}

export const catalogObjects: CatalogObject[] = planets.flatMap((planet) => [
  { name: planet.name, kind: planet.type, planet },
  ...planet.moonList.map((moon) => ({ name: moon.name, kind: `Lua de ${planet.name}`, planet, moon })),
])

export type CosmosObject = { name: string; group: 'Nebulosa' | 'Corpo menor' | 'Região' | 'Estrela'; style: string; summary: string; detail: string; fact: string; source: string; sourceLabel: string; imageCredit?: string; distance?: string }
export const cosmosObjects: CosmosObject[] = [
  { name: 'Nebulosa de Órion', group: 'Nebulosa', style: 'orion', summary: 'Berçário de estrelas', detail: 'Uma nuvem de gás e poeira onde milhares de estrelas estão se formando. A radiação de estrelas jovens esculpe cavidades no material ao redor.', fact: 'A cerca de 1.300 anos-luz da Terra.', source: 'https://science.nasa.gov/asset/hubble/orion-nebula-3/', sourceLabel: 'NASA · Hubble', imageCredit: 'NASA, ESA, Hubble Space Telescope Orion Treasury Project Team, Massimo Robberto (STScI/ESA)', distance: '1.300 anos-luz' },
  { name: 'Nebulosa do Anel', group: 'Nebulosa', style: 'ring', summary: 'Restos de uma estrela como o Sol', detail: 'Uma nebulosa planetária: camadas externas ejetadas por uma estrela em fim de vida. O nome “planetária” é histórico; ela não é um planeta.', fact: 'Também chamada M57; a cerca de 2.500 anos-luz.', source: 'https://science.nasa.gov/asset/webb/ring-nebula-nircam-image/', sourceLabel: 'NASA · Webb', imageCredit: 'NASA, ESA, CSA, STScI', distance: '2.500 anos-luz' },
  { name: 'Nebulosa do Caranguejo', group: 'Nebulosa', style: 'crab', summary: 'Remanescente de supernova', detail: 'Uma nuvem em expansão formada por uma explosão estelar. No centro, uma estrela de nêutrons remanescente alimenta a emissão da nebulosa.', fact: 'A supernova que a originou foi observada no ano 1054.', source: 'https://science.nasa.gov/asset/webb/crab-nebula-nircam-and-miri-image/', sourceLabel: 'NASA · Webb', imageCredit: 'NASA, ESA, CSA, STScI; processamento: Joseph DePasquale', distance: '6.500 anos-luz' },
  { name: 'Nebulosa da Águia', group: 'Nebulosa', style: 'eagle', summary: 'Pilares de gás e poeira', detail: 'Região de formação estelar famosa pelos Pilares da Criação. A imagem mostra gás e poeira interestelares; não é um objeto do Sistema Solar.', fact: 'A cerca de 6.500 anos-luz; os pilares são esculpidos pela radiação de estrelas jovens.', source: 'https://science.nasa.gov/asset/hubble/eagle-nebula-pillars-of-creation/', sourceLabel: 'NASA · Hubble', imageCredit: 'NASA, ESA, and the Hubble Heritage Team (STScI/AURA)', distance: '6.500 anos-luz' },
  { name: 'Sol', group: 'Estrela', style: 'sun', summary: 'Estrela central do Sistema Solar', detail: 'O Sol é a estrela que fornece luz e energia ao Sistema Solar. Sua gravidade mantém planetas, planetas anões, cometas e outros corpos em órbita.', fact: 'Estudar atividade solar e vento solar é uma próxima expansão útil para as aulas.', source: 'https://science.nasa.gov/sun/', sourceLabel: 'NASA · Sol' },
  { name: 'Plutão', group: 'Corpo menor', style: 'pluto', summary: 'Planeta anão do cinturão de Kuiper', detail: 'Mundo gelado com cinco luas conhecidas, explorado de perto pela missão New Horizons. Sua classificação como planeta anão ajuda a discutir como a ciência organiza categorias.', fact: 'Sua lua Caronte é grande em relação ao próprio Plutão.', source: 'https://science.nasa.gov/dwarf-planets/pluto/', sourceLabel: 'NASA · Plutão' },
  { name: 'Ceres', group: 'Corpo menor', style: 'ceres', summary: 'Planeta anão do cinturão de asteroides', detail: 'O maior objeto do cinturão principal entre Marte e Júpiter. Ceres é classificado como planeta anão e foi visitado pela missão Dawn.', fact: 'Sua posição liga o estudo dos planetas anões ao cinturão de asteroides.', source: 'https://science.nasa.gov/dwarf-planets/ceres/', sourceLabel: 'NASA · Ceres' },
  { name: 'Éris', group: 'Corpo menor', style: 'eris', summary: 'Planeta anão além de Netuno', detail: 'Um mundo gelado transnetuniano. A descoberta de Éris ajudou a motivar a definição moderna de planeta e a reclassificação de Plutão.', fact: 'Éris possui uma lua conhecida, Disnomia.', source: 'https://science.nasa.gov/dwarf-planets/eris/', sourceLabel: 'NASA · Éris' },
  { name: 'Haumea', group: 'Corpo menor', style: 'haumea', summary: 'Planeta anão de rotação muito rápida', detail: 'Mundo transnetuniano alongado pela rotação rápida, com duas luas conhecidas e um anel.', fact: 'Sua rotação dura aproximadamente quatro horas.', source: 'https://science.nasa.gov/dwarf-planets/haumea/', sourceLabel: 'NASA · Haumea' },
  { name: 'Makemake', group: 'Corpo menor', style: 'makemake', summary: 'Mundo gelado do cinturão de Kuiper', detail: 'Um dos maiores objetos conhecidos da região transnetuniana e um dos cinco planetas anões reconhecidos pela União Astronômica Internacional.', fact: 'Possui uma pequena lua conhecida informalmente como MK 2.', source: 'https://science.nasa.gov/dwarf-planets/makemake/', sourceLabel: 'NASA · Makemake' },
  { name: 'Cometas', group: 'Corpo menor', style: 'comet', summary: 'Gelo, poeira e atividade solar', detail: 'Corpos ricos em gelo e poeira. Ao se aproximarem do Sol, liberam gás e poeira; a cauda aponta para longe do Sol, influenciada pela luz e pelo vento solar.', fact: 'Muitos cometas de período curto vêm da região do cinturão de Kuiper.', source: 'https://science.nasa.gov/solar-system/comets/facts/', sourceLabel: 'NASA · Cometas' },
  { name: 'Cinturão de Kuiper', group: 'Região', style: 'kuiper', summary: 'Reservatório de mundos gelados', detail: 'Região em forma de disco além de Netuno, com corpos gelados, planetas anões e cometas. Sua faixa principal começa perto da órbita de Netuno.', fact: 'Plutão, Haumea e Makemake estão entre seus objetos conhecidos.', source: 'https://science.nasa.gov/solar-system/kuiper-belt/facts/', sourceLabel: 'NASA · Cinturão de Kuiper' },
  { name: 'Nuvem de Oort', group: 'Região', style: 'oort', summary: 'Reservatório distante, ainda não observado diretamente', detail: 'Modelo de uma região muito distante e aproximadamente esférica que pode fornecer cometas de longo período. É importante marcar que sua estrutura é inferida, não fotografada diretamente.', fact: 'Não está representada na escala da cena 3D.', source: 'https://science.nasa.gov/solar-system/oort-cloud/', sourceLabel: 'NASA · Nuvem de Oort' },
]

type LessonPlan = {
  title: string
  target: string
  objective: string
  question: string
  choices: string[]
  correct: number
  explanation: string
  steps: string[]
}

export const lessons: LessonPlan[] = [
  {
    title: 'A distância muda o ano?', target: 'Terra',
    objective: 'Investigar a relação entre o tamanho da órbita e o período orbital.',
    question: 'Mantendo a mesma estrela, se a distância orbital dobrar, quanto fica o período?',
    choices: ['Dobra: 2 anos', 'Cerca de 2,8 anos', 'Fica quatro vezes maior'], correct: 1,
    explanation: 'Pela 3ª lei de Kepler, T² é proporcional a³. Então T cresce com a distância elevada a 3/2: 2^(3/2) ≈ 2,83.',
    steps: ['Registre sua previsão antes de abrir o experimento.', 'No experimento, mantenha a massa da estrela em 1 massa solar.', 'Mude a distância de 1 AU para 2 AU e compare os períodos calculados.'],
  },
  {
    title: 'Uma estrela mais massiva', target: 'Saturno',
    objective: 'Observar como a massa central altera o período e a velocidade orbital.',
    question: 'Na mesma órbita, uma estrela com o dobro da massa faz o período ficar…',
    choices: ['Maior, por um fator √2', 'Igual', 'Menor, por um fator 1/√2'], correct: 2,
    explanation: 'No modelo de dois corpos com massa do planeta desprezível, T² = a³/M. Dobrar M reduz T para 1/√2 do valor original; a velocidade circular aumenta por √2.',
    steps: ['Anote sua previsão para período e velocidade.', 'Mantenha a distância em 1 AU.', 'Aumente a massa central de 1 para 2 massas solares e leia os resultados.'],
  },
  {
    title: 'Terra e Marte', target: 'Marte',
    objective: 'Relacionar distância média e duração do ano dos planetas.',
    question: 'Marte está mais distante do Sol que a Terra. Seu ano é…',
    choices: ['Mais curto que o da Terra', 'Próximo de 1 ano', 'Mais longo que o da Terra'], correct: 2,
    explanation: 'Marte leva cerca de 1,88 anos terrestres para completar uma órbita. Pela 3ª lei de Kepler, um semieixo maior corresponde a um período maior quando a massa central é a mesma.',
    steps: ['Compare as distâncias médias de Terra e Marte no painel de dados.', 'Compare os períodos orbitais mostrados nos mesmos painéis.', 'Use o experimento para testar uma órbita de 1,52 AU ao redor de uma massa solar.'],
  },
  {
    title: 'Velocidade em uma órbita', target: 'Mercúrio',
    objective: 'Investigar como a velocidade circular depende da distância e da gravidade central.',
    question: 'Na mesma estrela, um corpo em órbita circular mais distante se move…',
    choices: ['Mais devagar', 'Com a mesma velocidade', 'Mais rápido'], correct: 0,
    explanation: 'Para uma órbita circular, v = √(GM/r). A gravidade fornece a aceleração centrípeta; aumentando r, a velocidade orbital circular diminui.',
    steps: ['Preveja o sentido da mudança antes de mexer nos controles.', 'Mantenha a massa central em 1 massa solar.', 'Aumente a distância orbital e observe velocidade e gráfico de posição.'],
  },
]

// Pré-carrega TODAS as texturas (uma chamada por URL, para bater com a chave de cache do useTexture).
// Evita o "pulo" de FlatPlanet -> TexturedPlanet e alimenta a tela de carregamento (useProgress).
if (typeof window !== 'undefined') {
  Object.values(textures).forEach((url) => useTexture.preload(url))
  Object.values(nebulaTextures).forEach((url) => useTexture.preload(url))
  useTexture.preload('/textures/saturn-ring.png')
}
