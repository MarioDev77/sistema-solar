/**
 * Catálogo de fórmulas de Física para o MODO PROFESSOR.
 * Cobre o currículo do Ensino Fundamental II, Ensino Médio e o início do Ensino Superior.
 * Todas as calculadoras trabalham em unidades do SI; cada campo converte a unidade exibida
 * (ex.: UA -> m) por meio do fator `k`.
 */

export type Level = 'F' | 'M' | 'S'
export const levelLabels: Record<Level, string> = { F: 'Fundamental', M: 'Médio', S: 'Avançado' }

export type Inp = {
  /** símbolo exibido */ s: string
  /** descrição curta */ l: string
  /** unidade exibida */ u: string
  /** valor inicial (na unidade exibida) */ d: number
  /** fator para converter a unidade exibida em SI */ k?: number
  /** preenche com dados do planeta selecionado */ p?: 'mass' | 'radius' | 'axis'
}
export type Calc = {
  inputs: Inp[]
  /** nome do resultado */ out: string
  /** unidade do resultado */ ou: string
  /** divisor SI -> unidade do resultado */ od?: number
  fn: (v: number[]) => number
}
export type Formula = {
  id: string
  cat: string
  name: string
  expr: string
  vars: [string, string, string][]
  use: string
  ex?: string
  level: Level
  calc?: Calc
}

export const categories = [
  { id: 'cinematica', label: 'Cinemática' },
  { id: 'circular', label: 'Movimento circular' },
  { id: 'dinamica', label: 'Dinâmica' },
  { id: 'energia', label: 'Trabalho e energia' },
  { id: 'impulso', label: 'Momento linear' },
  { id: 'gravitacao', label: 'Gravitação e astronomia' },
  { id: 'fluidos', label: 'Fluidos' },
  { id: 'termo', label: 'Termologia' },
  { id: 'ondas', label: 'Oscilações e ondas' },
  { id: 'optica', label: 'Óptica' },
  { id: 'eletro', label: 'Eletricidade' },
  { id: 'magneto', label: 'Magnetismo' },
  { id: 'moderna', label: 'Física moderna' },
] as const

/** Constantes físicas (SI 2019 / CODATA 2022, arredondadas para uso em sala). */
export const constants: { name: string; sym: string; value: string; unit: string }[] = [
  { name: 'Velocidade da luz no vácuo', sym: 'c', value: '299 792 458', unit: 'm/s (exata)' },
  { name: 'Constante gravitacional', sym: 'G', value: '6,674 × 10⁻¹¹', unit: 'N·m²/kg²' },
  { name: 'Aceleração normal da gravidade', sym: 'g', value: '9,80665', unit: 'm/s² (usual: 9,8 ou 10)' },
  { name: 'Constante de Planck', sym: 'h', value: '6,626 070 15 × 10⁻³⁴', unit: 'J·s (exata)' },
  { name: 'Constante de Planck reduzida', sym: 'ħ', value: '1,054 572 × 10⁻³⁴', unit: 'J·s' },
  { name: 'Constante de Boltzmann', sym: 'k_B', value: '1,380 649 × 10⁻²³', unit: 'J/K (exata)' },
  { name: 'Constante de Avogadro', sym: 'N_A', value: '6,022 140 76 × 10²³', unit: 'mol⁻¹ (exata)' },
  { name: 'Constante universal dos gases', sym: 'R', value: '8,314 462', unit: 'J/(mol·K)' },
  { name: 'Carga elementar', sym: 'e', value: '1,602 176 634 × 10⁻¹⁹', unit: 'C (exata)' },
  { name: 'Constante eletrostática', sym: 'k', value: '8,988 × 10⁹', unit: 'N·m²/C²' },
  { name: 'Permissividade do vácuo', sym: 'ε₀', value: '8,854 188 × 10⁻¹²', unit: 'F/m' },
  { name: 'Permeabilidade do vácuo', sym: 'μ₀', value: '1,256 637 × 10⁻⁶', unit: 'T·m/A' },
  { name: 'Constante de Stefan–Boltzmann', sym: 'σ', value: '5,670 374 × 10⁻⁸', unit: 'W/(m²·K⁴)' },
  { name: 'Constante de Wien', sym: 'b', value: '2,897 772 × 10⁻³', unit: 'm·K' },
  { name: 'Massa do elétron', sym: 'mₑ', value: '9,109 384 × 10⁻³¹', unit: 'kg' },
  { name: 'Massa do próton', sym: 'mₚ', value: '1,672 622 × 10⁻²⁷', unit: 'kg' },
  { name: 'Massa do nêutron', sym: 'mₙ', value: '1,674 927 × 10⁻²⁷', unit: 'kg' },
  { name: 'Unidade astronômica', sym: 'UA', value: '1,495 979 × 10¹¹', unit: 'm (exata)' },
  { name: 'Ano-luz', sym: 'al', value: '9,460 73 × 10¹⁵', unit: 'm' },
  { name: 'Parsec', sym: 'pc', value: '3,085 678 × 10¹⁶', unit: 'm (≈ 3,26 al)' },
  { name: 'Massa do Sol', sym: 'M☉', value: '1,989 × 10³⁰', unit: 'kg' },
  { name: 'Raio do Sol', sym: 'R☉', value: '6,957 × 10⁸', unit: 'm' },
  { name: 'Luminosidade do Sol', sym: 'L☉', value: '3,828 × 10²⁶', unit: 'W' },
  { name: 'Massa da Terra', sym: 'M⊕', value: '5,972 × 10²⁴', unit: 'kg' },
  { name: 'Raio médio da Terra', sym: 'R⊕', value: '6,371 × 10⁶', unit: 'm' },
  { name: 'Velocidade do som no ar (20 °C)', sym: 'v_som', value: '343', unit: 'm/s' },
  { name: 'Pressão atmosférica normal', sym: 'atm', value: '101 325', unit: 'Pa' },
  { name: 'Zero Celsius', sym: '0 °C', value: '273,15', unit: 'K' },
  { name: 'Calor específico da água', sym: 'c_água', value: '4 186 (≈ 1 cal/g·°C)', unit: 'J/(kg·K)' },
  { name: 'Densidade da água', sym: 'ρ_água', value: '1 000', unit: 'kg/m³' },
  { name: 'Elétron-volt', sym: 'eV', value: '1,602 177 × 10⁻¹⁹', unit: 'J' },
  { name: 'Unidade de massa atômica', sym: 'u', value: '1,660 539 × 10⁻²⁷', unit: 'kg' },
]

/** Dados físicos dos planetas (NASA Goddard Fact Sheet), em SI, para preencher as calculadoras. */
export const planetPhysics: Record<string, { mass: number; radius: number; axis: number }> = {
  'Mercúrio': { mass: 3.301e23, radius: 2.4397e6, axis: 0.387 },
  'Vênus': { mass: 4.867e24, radius: 6.0518e6, axis: 0.723 },
  'Terra': { mass: 5.972e24, radius: 6.371e6, axis: 1.0 },
  'Marte': { mass: 6.417e23, radius: 3.3895e6, axis: 1.524 },
  'Júpiter': { mass: 1.898e27, radius: 6.9911e7, axis: 5.204 },
  'Saturno': { mass: 5.683e26, radius: 5.8232e7, axis: 9.583 },
  'Urano': { mass: 8.681e25, radius: 2.5362e7, axis: 19.19 },
  'Netuno': { mass: 1.024e26, radius: 2.4622e7, axis: 30.07 },
  'Plutão': { mass: 1.303e22, radius: 1.1883e6, axis: 39.48 },
}

// ---------- constantes numéricas usadas nas calculadoras ----------
const G = 6.6743e-11
const C = 299792458
const g0 = 9.80665
const H = 6.62607015e-34
const R_GAS = 8.314462618
const E_CH = 1.602176634e-19
const K_COUL = 8.9875517923e9
const MU0 = 1.25663706127e-6
const SIGMA = 5.670374419e-8
const AU = 1.495978707e11
const M_SUN = 1.98847e30
const L_SUN = 3.828e26
const rad = (deg: number) => (deg * Math.PI) / 180

const i = (s: string, l: string, u: string, d: number, k?: number, p?: Inp['p']): Inp => ({ s, l, u, d, k, p })
const v = (s: string, m: string, u: string): [string, string, string] => [s, m, u]

export const formulas: Formula[] = [
  // ======================= CINEMÁTICA =======================
  { id: 'vm', cat: 'cinematica', level: 'F', name: 'Velocidade média', expr: 'vₘ = Δs / Δt',
    vars: [v('vₘ', 'velocidade média', 'm/s'), v('Δs', 'variação de posição (deslocamento)', 'm'), v('Δt', 'intervalo de tempo', 's')],
    use: 'Quão rápido um corpo se desloca, em média, num trecho. Para converter: 1 m/s = 3,6 km/h.',
    ex: 'Um carro percorre 150 km em 2 h: vₘ = 75 km/h.',
    calc: { inputs: [i('Δs', 'deslocamento', 'm', 100), i('Δt', 'tempo', 's', 20)], out: 'vₘ', ou: 'm/s', fn: ([ds, dt]) => ds / dt } },
  { id: 'am', cat: 'cinematica', level: 'F', name: 'Aceleração média', expr: 'aₘ = Δv / Δt',
    vars: [v('aₘ', 'aceleração média', 'm/s²'), v('Δv', 'variação de velocidade', 'm/s'), v('Δt', 'intervalo de tempo', 's')],
    use: 'Mede quão rapidamente a velocidade muda.',
    ex: 'De 0 a 100 km/h (27,8 m/s) em 8 s: a ≈ 3,5 m/s².',
    calc: { inputs: [i('Δv', 'variação de velocidade', 'm/s', 27.8), i('Δt', 'tempo', 's', 8)], out: 'aₘ', ou: 'm/s²', fn: ([dv, dt]) => dv / dt } },
  { id: 'mu', cat: 'cinematica', level: 'F', name: 'MU — função horária da posição', expr: 's = s₀ + v·t',
    vars: [v('s', 'posição final', 'm'), v('s₀', 'posição inicial', 'm'), v('v', 'velocidade (constante)', 'm/s'), v('t', 'tempo', 's')],
    use: 'Movimento uniforme: velocidade constante e aceleração nula.',
    calc: { inputs: [i('s₀', 'posição inicial', 'm', 0), i('v', 'velocidade', 'm/s', 5), i('t', 'tempo', 's', 10)], out: 's', ou: 'm', fn: ([s0, vel, t]) => s0 + vel * t } },
  { id: 'muv-v', cat: 'cinematica', level: 'M', name: 'MUV — velocidade em função do tempo', expr: 'v = v₀ + a·t',
    vars: [v('v', 'velocidade final', 'm/s'), v('v₀', 'velocidade inicial', 'm/s'), v('a', 'aceleração (constante)', 'm/s²'), v('t', 'tempo', 's')],
    use: 'Movimento uniformemente variado: aceleração constante.',
    calc: { inputs: [i('v₀', 'velocidade inicial', 'm/s', 0), i('a', 'aceleração', 'm/s²', 2), i('t', 'tempo', 's', 5)], out: 'v', ou: 'm/s', fn: ([v0, a, t]) => v0 + a * t } },
  { id: 'muv-s', cat: 'cinematica', level: 'M', name: 'MUV — posição em função do tempo', expr: 's = s₀ + v₀·t + ½·a·t²',
    vars: [v('s', 'posição final', 'm'), v('s₀', 'posição inicial', 'm'), v('v₀', 'velocidade inicial', 'm/s'), v('a', 'aceleração', 'm/s²'), v('t', 'tempo', 's')],
    use: 'Dá a posição a qualquer instante num movimento com aceleração constante.',
    calc: { inputs: [i('s₀', 'posição inicial', 'm', 0), i('v₀', 'velocidade inicial', 'm/s', 0), i('a', 'aceleração', 'm/s²', 2), i('t', 'tempo', 's', 5)], out: 's', ou: 'm', fn: ([s0, v0, a, t]) => s0 + v0 * t + 0.5 * a * t * t } },
  { id: 'torricelli', cat: 'cinematica', level: 'M', name: 'Equação de Torricelli', expr: 'v² = v₀² + 2·a·Δs',
    vars: [v('v', 'velocidade final', 'm/s'), v('v₀', 'velocidade inicial', 'm/s'), v('a', 'aceleração', 'm/s²'), v('Δs', 'deslocamento', 'm')],
    use: 'Relaciona velocidades e deslocamento sem precisar do tempo.',
    calc: { inputs: [i('v₀', 'velocidade inicial', 'm/s', 0), i('a', 'aceleração', 'm/s²', 2), i('Δs', 'deslocamento', 'm', 25)], out: 'v', ou: 'm/s', fn: ([v0, a, ds]) => Math.sqrt(v0 * v0 + 2 * a * ds) } },
  { id: 'vm-muv', cat: 'cinematica', level: 'M', name: 'Velocidade média no MUV', expr: 'vₘ = (v₀ + v) / 2',
    vars: [v('vₘ', 'velocidade média', 'm/s'), v('v₀', 'velocidade inicial', 'm/s'), v('v', 'velocidade final', 'm/s')],
    use: 'Só vale quando a aceleração é constante (média aritmética das velocidades).' },
  { id: 'queda-h', cat: 'cinematica', level: 'F', name: 'Queda livre — altura', expr: 'h = ½·g·t²',
    vars: [v('h', 'altura percorrida', 'm'), v('g', 'aceleração da gravidade', 'm/s²'), v('t', 'tempo de queda', 's')],
    use: 'Sem resistência do ar, todos os corpos caem com a mesma aceleração g (na Terra, ≈ 9,8 m/s²).',
    ex: 'Em 2 s de queda: h ≈ 19,6 m.',
    calc: { inputs: [i('g', 'gravidade', 'm/s²', 9.8), i('t', 'tempo', 's', 2)], out: 'h', ou: 'm', fn: ([g, t]) => 0.5 * g * t * t } },
  { id: 'queda-v', cat: 'cinematica', level: 'M', name: 'Queda livre — velocidade ao atingir o solo', expr: 'v = g·t = √(2·g·h)',
    vars: [v('v', 'velocidade final', 'm/s'), v('g', 'gravidade', 'm/s²'), v('h', 'altura', 'm')],
    use: 'Vem de Torricelli com v₀ = 0.',
    calc: { inputs: [i('g', 'gravidade', 'm/s²', 9.8), i('h', 'altura', 'm', 20)], out: 'v', ou: 'm/s', fn: ([g, h]) => Math.sqrt(2 * g * h) } },
  { id: 'lanc-v', cat: 'cinematica', level: 'M', name: 'Lançamento vertical — altura máxima', expr: 'h_máx = v₀² / (2·g)',
    vars: [v('h_máx', 'altura máxima', 'm'), v('v₀', 'velocidade de lançamento', 'm/s'), v('g', 'gravidade', 'm/s²')],
    use: 'No ponto mais alto a velocidade vertical é zero. Tempo de subida: t = v₀/g.',
    calc: { inputs: [i('v₀', 'velocidade inicial', 'm/s', 20), i('g', 'gravidade', 'm/s²', 9.8)], out: 'h_máx', ou: 'm', fn: ([v0, g]) => (v0 * v0) / (2 * g) } },
  { id: 'lanc-h', cat: 'cinematica', level: 'M', name: 'Lançamento horizontal — alcance', expr: 'A = v₀·√(2h / g)',
    vars: [v('A', 'alcance horizontal', 'm'), v('v₀', 'velocidade horizontal', 'm/s'), v('h', 'altura de lançamento', 'm'), v('g', 'gravidade', 'm/s²')],
    use: 'Movimento composto: MU na horizontal e queda livre na vertical (independentes).',
    calc: { inputs: [i('v₀', 'velocidade horizontal', 'm/s', 10), i('h', 'altura', 'm', 20), i('g', 'gravidade', 'm/s²', 9.8)], out: 'A', ou: 'm', fn: ([v0, h, g]) => v0 * Math.sqrt((2 * h) / g) } },
  { id: 'lanc-obl', cat: 'cinematica', level: 'M', name: 'Lançamento oblíquo — alcance', expr: 'A = v₀²·sen(2θ) / g',
    vars: [v('A', 'alcance (mesmo nível)', 'm'), v('v₀', 'velocidade de lançamento', 'm/s'), v('θ', 'ângulo com a horizontal', '°'), v('g', 'gravidade', 'm/s²')],
    use: 'Alcance máximo em θ = 45°. Altura máxima: H = v₀²sen²θ / 2g. Tempo de voo: T = 2v₀senθ / g.',
    calc: { inputs: [i('v₀', 'velocidade inicial', 'm/s', 20), i('θ', 'ângulo', '°', 45), i('g', 'gravidade', 'm/s²', 9.8)], out: 'A', ou: 'm', fn: ([v0, th, g]) => (v0 * v0 * Math.sin(2 * rad(th))) / g } },
  { id: 'vrel', cat: 'cinematica', level: 'M', name: 'Velocidade relativa (mesma direção)', expr: 'v_rel = v_A − v_B',
    vars: [v('v_rel', 'velocidade de A em relação a B', 'm/s'), v('v_A, v_B', 'velocidades em relação ao solo', 'm/s')],
    use: 'Sentidos opostos: somam-se os módulos. Mesmo sentido: subtraem-se.' },

  // ======================= MOVIMENTO CIRCULAR =======================
  { id: 'freq', cat: 'circular', level: 'F', name: 'Período e frequência', expr: 'f = 1 / T',
    vars: [v('f', 'frequência', 'Hz'), v('T', 'período', 's')],
    use: 'Período é o tempo de uma volta (ou ciclo); frequência é quantas voltas por segundo.',
    calc: { inputs: [i('T', 'período', 's', 0.5)], out: 'f', ou: 'Hz', fn: ([t]) => 1 / t } },
  { id: 'omega', cat: 'circular', level: 'M', name: 'Velocidade angular', expr: 'ω = Δφ / Δt = 2π / T = 2π·f',
    vars: [v('ω', 'velocidade angular', 'rad/s'), v('Δφ', 'ângulo varrido', 'rad'), v('T', 'período', 's'), v('f', 'frequência', 'Hz')],
    use: 'Uma volta completa = 2π rad = 360°.',
    calc: { inputs: [i('T', 'período', 's', 24, 3600)], out: 'ω', ou: 'rad/s', fn: ([t]) => (2 * Math.PI) / t } },
  { id: 'v-wr', cat: 'circular', level: 'M', name: 'Velocidade escalar × angular', expr: 'v = ω·R',
    vars: [v('v', 'velocidade escalar (linear)', 'm/s'), v('ω', 'velocidade angular', 'rad/s'), v('R', 'raio da trajetória', 'm')],
    use: 'Quanto mais longe do eixo, maior a velocidade linear para a mesma ω.',
    calc: { inputs: [i('ω', 'velocidade angular', 'rad/s', 2), i('R', 'raio', 'm', 3)], out: 'v', ou: 'm/s', fn: ([w, r]) => w * r } },
  { id: 'ac', cat: 'circular', level: 'M', name: 'Aceleração centrípeta', expr: 'a_c = v² / R = ω²·R',
    vars: [v('a_c', 'aceleração centrípeta', 'm/s²'), v('v', 'velocidade escalar', 'm/s'), v('R', 'raio', 'm'), v('ω', 'velocidade angular', 'rad/s')],
    use: 'Aponta para o centro da curva e muda a direção da velocidade.',
    calc: { inputs: [i('v', 'velocidade', 'm/s', 10), i('R', 'raio', 'm', 50)], out: 'a_c', ou: 'm/s²', fn: ([vel, r]) => (vel * vel) / r } },
  { id: 'fc', cat: 'circular', level: 'M', name: 'Força centrípeta', expr: 'F_c = m·v² / R',
    vars: [v('F_c', 'força centrípeta', 'N'), v('m', 'massa', 'kg'), v('v', 'velocidade', 'm/s'), v('R', 'raio', 'm')],
    use: 'Não é uma força nova: é a resultante que aponta para o centro (tensão, atrito, gravidade…).',
    calc: { inputs: [i('m', 'massa', 'kg', 1000), i('v', 'velocidade', 'm/s', 10), i('R', 'raio', 'm', 50)], out: 'F_c', ou: 'N', fn: ([m, vel, r]) => (m * vel * vel) / r } },
  { id: 'torque', cat: 'circular', level: 'M', name: 'Momento de uma força (torque)', expr: 'M = F·d·senθ',
    vars: [v('M', 'momento da força', 'N·m'), v('F', 'força', 'N'), v('d', 'braço de alavanca', 'm'), v('θ', 'ângulo entre F e o braço', '°')],
    use: 'Equilíbrio de rotação: ΣM = 0. Equilíbrio de translação: ΣF = 0.',
    calc: { inputs: [i('F', 'força', 'N', 50), i('d', 'braço', 'm', 0.4), i('θ', 'ângulo', '°', 90)], out: 'M', ou: 'N·m', fn: ([f, d, th]) => f * d * Math.sin(rad(th)) } },
  { id: 'i-rot', cat: 'circular', level: 'S', name: 'Dinâmica da rotação', expr: 'τ = I·α      L = I·ω      E_rot = ½·I·ω²',
    vars: [v('τ', 'torque resultante', 'N·m'), v('I', 'momento de inércia', 'kg·m²'), v('α', 'aceleração angular', 'rad/s²'), v('L', 'momento angular', 'kg·m²/s'), v('E_rot', 'energia cinética de rotação', 'J')],
    use: 'Analogia com a translação: F→τ, m→I, a→α, v→ω. Sem torque externo, L se conserva (patinador que fecha os braços).' },
  { id: 'cm', cat: 'circular', level: 'M', name: 'Centro de massa (dois corpos)', expr: 'x_cm = (m₁·x₁ + m₂·x₂) / (m₁ + m₂)',
    vars: [v('x_cm', 'posição do centro de massa', 'm'), v('m₁, m₂', 'massas', 'kg'), v('x₁, x₂', 'posições', 'm')],
    use: 'Ponto onde o sistema se comporta como se toda a massa estivesse concentrada. Sol–Júpiter: o centro de massa fica quase na superfície do Sol.',
    calc: { inputs: [i('m₁', 'massa 1', 'kg', 2), i('x₁', 'posição 1', 'm', 0), i('m₂', 'massa 2', 'kg', 1), i('x₂', 'posição 2', 'm', 3)], out: 'x_cm', ou: 'm', fn: ([m1, x1, m2, x2]) => (m1 * x1 + m2 * x2) / (m1 + m2) } },

  // ======================= DINÂMICA =======================
  { id: 'n2', cat: 'dinamica', level: 'F', name: '2ª lei de Newton', expr: 'F_R = m·a',
    vars: [v('F_R', 'força resultante', 'N'), v('m', 'massa', 'kg'), v('a', 'aceleração', 'm/s²')],
    use: 'A aceleração é proporcional à força resultante e inversamente proporcional à massa. 1ª lei: F_R = 0 ⇒ v constante. 3ª lei: ação e reação (corpos diferentes, mesmo módulo).',
    calc: { inputs: [i('m', 'massa', 'kg', 10), i('a', 'aceleração', 'm/s²', 3)], out: 'F_R', ou: 'N', fn: ([m, a]) => m * a } },
  { id: 'peso', cat: 'dinamica', level: 'F', name: 'Peso', expr: 'P = m·g',
    vars: [v('P', 'peso', 'N'), v('m', 'massa', 'kg'), v('g', 'gravidade local', 'm/s²')],
    use: 'Massa é a quantidade de matéria (não muda); peso é a força gravitacional (muda de lugar para lugar). Na Lua g ≈ 1,6 m/s².',
    calc: { inputs: [i('m', 'massa', 'kg', 60), i('g', 'gravidade', 'm/s²', 9.8)], out: 'P', ou: 'N', fn: ([m, g]) => m * g } },
  { id: 'atrito', cat: 'dinamica', level: 'M', name: 'Força de atrito', expr: 'F_at = μ·N',
    vars: [v('F_at', 'força de atrito', 'N'), v('μ', 'coeficiente de atrito (estático ou cinético)', '—'), v('N', 'força normal', 'N')],
    use: 'Estático: F_at ≤ μₑ·N (cresce até o limite). Cinético: F_at = μ_c·N, com μ_c < μₑ.',
    calc: { inputs: [i('μ', 'coeficiente', '', 0.3), i('N', 'normal', 'N', 200)], out: 'F_at', ou: 'N', fn: ([mu, n]) => mu * n } },
  { id: 'hooke', cat: 'dinamica', level: 'M', name: 'Lei de Hooke (força elástica)', expr: 'F = k·x',
    vars: [v('F', 'força elástica', 'N'), v('k', 'constante elástica da mola', 'N/m'), v('x', 'deformação', 'm')],
    use: 'Vale no regime elástico. O sinal negativo (F = −kx) indica força restauradora.',
    calc: { inputs: [i('k', 'constante da mola', 'N/m', 200), i('x', 'deformação', 'm', 0.1)], out: 'F', ou: 'N', fn: ([k, x]) => k * x } },
  { id: 'plano', cat: 'dinamica', level: 'M', name: 'Plano inclinado (com atrito)', expr: 'a = g·(senθ − μ·cosθ)',
    vars: [v('a', 'aceleração ao longo do plano', 'm/s²'), v('g', 'gravidade', 'm/s²'), v('θ', 'ângulo de inclinação', '°'), v('μ', 'atrito cinético', '—')],
    use: 'Componentes do peso: Pₓ = P·senθ (paralela) e P_y = P·cosθ (normal, N = P·cosθ). Sem atrito: a = g·senθ.',
    calc: { inputs: [i('g', 'gravidade', 'm/s²', 9.8), i('θ', 'ângulo', '°', 30), i('μ', 'atrito', '', 0.1)], out: 'a', ou: 'm/s²', fn: ([g, th, mu]) => g * (Math.sin(rad(th)) - mu * Math.cos(rad(th))) } },
  { id: 'atwood', cat: 'dinamica', level: 'M', name: 'Máquina de Atwood', expr: 'a = (m₂ − m₁)·g / (m₁ + m₂)',
    vars: [v('a', 'aceleração do sistema', 'm/s²'), v('m₁, m₂', 'massas (m₂ > m₁)', 'kg'), v('g', 'gravidade', 'm/s²')],
    use: 'Tração no fio: T = 2·m₁·m₂·g / (m₁ + m₂).',
    calc: { inputs: [i('m₁', 'massa 1', 'kg', 2), i('m₂', 'massa 2', 'kg', 3), i('g', 'gravidade', 'm/s²', 9.8)], out: 'a', ou: 'm/s²', fn: ([m1, m2, g]) => ((m2 - m1) * g) / (m1 + m2) } },
  { id: 'vterm', cat: 'dinamica', level: 'S', name: 'Velocidade terminal (arrasto quadrático)', expr: 'v_t = √(2·m·g / (ρ·C_d·A))',
    vars: [v('v_t', 'velocidade terminal', 'm/s'), v('m', 'massa', 'kg'), v('ρ', 'densidade do fluido', 'kg/m³'), v('C_d', 'coeficiente de arrasto', '—'), v('A', 'área frontal', 'm²')],
    use: 'Quando o arrasto F = ½ρC_dAv² iguala o peso, a aceleração zera.',
    calc: { inputs: [i('m', 'massa', 'kg', 80), i('ρ', 'densidade do ar', 'kg/m³', 1.2), i('C_d', 'coef. de arrasto', '', 1), i('A', 'área frontal', 'm²', 0.7)], out: 'v_t', ou: 'm/s', fn: ([m, rho, cd, a]) => Math.sqrt((2 * m * g0) / (rho * cd * a)) } },

  // ======================= TRABALHO E ENERGIA =======================
  { id: 'trabalho', cat: 'energia', level: 'M', name: 'Trabalho de uma força', expr: 'W = F·d·cosθ',
    vars: [v('W', 'trabalho', 'J'), v('F', 'força', 'N'), v('d', 'deslocamento', 'm'), v('θ', 'ângulo entre F e d', '°')],
    use: 'θ = 0°: trabalho motor (positivo); θ = 90°: nulo; θ = 180°: resistente (negativo).',
    calc: { inputs: [i('F', 'força', 'N', 50), i('d', 'deslocamento', 'm', 10), i('θ', 'ângulo', '°', 0)], out: 'W', ou: 'J', fn: ([f, d, th]) => f * d * Math.cos(rad(th)) } },
  { id: 'potencia', cat: 'energia', level: 'M', name: 'Potência', expr: 'P = W / Δt = F·v',
    vars: [v('P', 'potência', 'W'), v('W', 'trabalho ou energia', 'J'), v('Δt', 'tempo', 's'), v('v', 'velocidade', 'm/s')],
    use: '1 W = 1 J/s. 1 cv ≈ 735 W; 1 hp ≈ 746 W.',
    calc: { inputs: [i('W', 'trabalho', 'J', 5000), i('Δt', 'tempo', 's', 10)], out: 'P', ou: 'W', fn: ([w, dt]) => w / dt } },
  { id: 'ec', cat: 'energia', level: 'M', name: 'Energia cinética', expr: 'E_c = ½·m·v²',
    vars: [v('E_c', 'energia cinética', 'J'), v('m', 'massa', 'kg'), v('v', 'velocidade', 'm/s')],
    use: 'Dobrar a velocidade quadruplica a energia cinética — por isso a gravidade de um acidente cresce tanto com a velocidade.',
    calc: { inputs: [i('m', 'massa', 'kg', 1000), i('v', 'velocidade', 'm/s', 20)], out: 'E_c', ou: 'J', fn: ([m, vel]) => 0.5 * m * vel * vel } },
  { id: 'ep', cat: 'energia', level: 'M', name: 'Energia potencial gravitacional', expr: 'E_p = m·g·h',
    vars: [v('E_p', 'energia potencial', 'J'), v('m', 'massa', 'kg'), v('g', 'gravidade', 'm/s²'), v('h', 'altura em relação à referência', 'm')],
    use: 'Vale perto da superfície (g constante). Para grandes distâncias, use E_p = −GMm/r.',
    calc: { inputs: [i('m', 'massa', 'kg', 2), i('g', 'gravidade', 'm/s²', 9.8), i('h', 'altura', 'm', 10)], out: 'E_p', ou: 'J', fn: ([m, g, h]) => m * g * h } },
  { id: 'epe', cat: 'energia', level: 'M', name: 'Energia potencial elástica', expr: 'E_pe = ½·k·x²',
    vars: [v('E_pe', 'energia elástica', 'J'), v('k', 'constante da mola', 'N/m'), v('x', 'deformação', 'm')],
    use: 'Energia armazenada numa mola comprimida ou esticada.',
    calc: { inputs: [i('k', 'constante', 'N/m', 200), i('x', 'deformação', 'm', 0.1)], out: 'E_pe', ou: 'J', fn: ([k, x]) => 0.5 * k * x * x } },
  { id: 'twe', cat: 'energia', level: 'M', name: 'Teorema trabalho–energia', expr: 'W_resultante = ΔE_c = ½·m·v² − ½·m·v₀²',
    vars: [v('W_resultante', 'trabalho da força resultante', 'J'), v('ΔE_c', 'variação da energia cinética', 'J')],
    use: 'O trabalho total sobre o corpo é igual à variação da sua energia cinética.' },
  { id: 'em', cat: 'energia', level: 'M', name: 'Conservação da energia mecânica', expr: 'E_m = E_c + E_p = constante',
    vars: [v('E_m', 'energia mecânica', 'J')],
    use: 'Vale quando só forças conservativas (peso, elástica) realizam trabalho. Com atrito: E_final = E_inicial − W_atrito.' },
  { id: 'rend', cat: 'energia', level: 'M', name: 'Rendimento', expr: 'η = P_útil / P_total',
    vars: [v('η', 'rendimento (0 a 1)', '—'), v('P_útil', 'potência útil', 'W'), v('P_total', 'potência total recebida', 'W')],
    use: 'Nenhuma máquina real tem η = 1: parte da energia sempre se dissipa.',
    calc: { inputs: [i('P_útil', 'potência útil', 'W', 800), i('P_total', 'potência total', 'W', 1000)], out: 'η', ou: '', fn: ([u, t]) => u / t } },

  // ======================= MOMENTO LINEAR =======================
  { id: 'q', cat: 'impulso', level: 'M', name: 'Quantidade de movimento', expr: 'Q = m·v',
    vars: [v('Q', 'quantidade de movimento (momento linear)', 'kg·m/s'), v('m', 'massa', 'kg'), v('v', 'velocidade', 'm/s')],
    use: 'Grandeza vetorial, com a direção da velocidade.',
    calc: { inputs: [i('m', 'massa', 'kg', 70), i('v', 'velocidade', 'm/s', 5)], out: 'Q', ou: 'kg·m/s', fn: ([m, vel]) => m * vel } },
  { id: 'impulso', cat: 'impulso', level: 'M', name: 'Impulso e teorema do impulso', expr: 'I = F·Δt = ΔQ',
    vars: [v('I', 'impulso', 'N·s'), v('F', 'força média', 'N'), v('Δt', 'duração da força', 's'), v('ΔQ', 'variação da quantidade de movimento', 'kg·m/s')],
    use: 'Explica airbags e cintos: aumentar Δt reduz a força média para o mesmo ΔQ.',
    calc: { inputs: [i('F', 'força média', 'N', 500), i('Δt', 'duração', 's', 0.2)], out: 'I', ou: 'N·s', fn: ([f, dt]) => f * dt } },
  { id: 'cons-q', cat: 'impulso', level: 'M', name: 'Conservação da quantidade de movimento', expr: 'Q_antes = Q_depois',
    vars: [v('Q', 'momento total do sistema', 'kg·m/s')],
    use: 'Vale em sistemas isolados (explosões, colisões, propulsão de foguetes).' },
  { id: 'inelastica', cat: 'impulso', level: 'M', name: 'Colisão perfeitamente inelástica', expr: "v' = (m₁·v₁ + m₂·v₂) / (m₁ + m₂)",
    vars: [v("v'", 'velocidade final dos corpos juntos', 'm/s'), v('m₁, m₂', 'massas', 'kg'), v('v₁, v₂', 'velocidades iniciais', 'm/s')],
    use: 'Os corpos seguem unidos; a energia cinética não se conserva (parte vira calor e deformação).',
    calc: { inputs: [i('m₁', 'massa 1', 'kg', 1000), i('v₁', 'velocidade 1', 'm/s', 20), i('m₂', 'massa 2', 'kg', 1500), i('v₂', 'velocidade 2', 'm/s', 0)], out: "v'", ou: 'm/s', fn: ([m1, v1, m2, v2]) => (m1 * v1 + m2 * v2) / (m1 + m2) } },
  { id: 'restit', cat: 'impulso', level: 'M', name: 'Coeficiente de restituição', expr: 'e = v_afastamento / v_aproximação',
    vars: [v('e', 'coeficiente de restituição', '—')],
    use: 'e = 1: elástica (E_c conservada); 0 < e < 1: parcialmente elástica; e = 0: perfeitamente inelástica.' },

  // ======================= GRAVITAÇÃO E ASTRONOMIA =======================
  { id: 'newton-grav', cat: 'gravitacao', level: 'M', name: 'Lei da Gravitação Universal', expr: 'F = G·m₁·m₂ / r²',
    vars: [v('F', 'força de atração gravitacional', 'N'), v('G', 'constante gravitacional (6,674×10⁻¹¹)', 'N·m²/kg²'), v('m₁, m₂', 'massas', 'kg'), v('r', 'distância entre os centros', 'm')],
    use: 'Todo corpo atrai todo outro corpo. A força cai com o quadrado da distância.',
    ex: 'Terra–Lua: F ≈ 2 × 10²⁰ N.',
    calc: { inputs: [i('m₁', 'massa 1', 'kg', 5.972e24, 1, 'mass'), i('m₂', 'massa 2', 'kg', 7.342e22), i('r', 'distância', 'km', 384400, 1000)], out: 'F', ou: 'N', fn: ([m1, m2, r]) => (G * m1 * m2) / (r * r) } },
  { id: 'g-sup', cat: 'gravitacao', level: 'M', name: 'Gravidade na superfície de um astro', expr: 'g = G·M / R²',
    vars: [v('g', 'aceleração da gravidade', 'm/s²'), v('M', 'massa do astro', 'kg'), v('R', 'raio do astro', 'm')],
    use: 'Por isso o seu peso muda de planeta para planeta, mas a sua massa não. Nos gigantes gasosos o resultado usa o raio médio; a rotação rápida reduz o valor no equador (Júpiter: ≈ 24,8 m/s²).',
    calc: { inputs: [i('M', 'massa', 'kg', 5.972e24, 1, 'mass'), i('R', 'raio', 'km', 6371, 1000, 'radius')], out: 'g', ou: 'm/s²', fn: ([m, r]) => (G * m) / (r * r) } },
  { id: 'v-orb', cat: 'gravitacao', level: 'M', name: 'Velocidade orbital (órbita circular)', expr: 'v = √(G·M / r)',
    vars: [v('v', 'velocidade orbital', 'm/s'), v('M', 'massa do corpo central', 'kg'), v('r', 'raio da órbita', 'm')],
    use: 'A gravidade faz o papel de força centrípeta: G·M·m/r² = m·v²/r. Quanto mais longe, mais lento.',
    ex: 'Terra em torno do Sol (1 UA): ≈ 29,8 km/s.',
    calc: { inputs: [i('M', 'massa central', 'kg', M_SUN), i('r', 'raio da órbita', 'UA', 1, AU, 'axis')], out: 'v', ou: 'km/s', od: 1000, fn: ([m, r]) => Math.sqrt((G * m) / r) } },
  { id: 'v-esc', cat: 'gravitacao', level: 'M', name: 'Velocidade de escape', expr: 'v_e = √(2·G·M / R)',
    vars: [v('v_e', 'velocidade de escape', 'm/s'), v('M', 'massa do astro', 'kg'), v('R', 'raio do astro', 'm')],
    use: 'Velocidade mínima (sem propulsão) para escapar da gravidade de um astro. É √2 vezes a velocidade orbital rasante.',
    ex: 'Terra: ≈ 11,2 km/s.',
    calc: { inputs: [i('M', 'massa', 'kg', 5.972e24, 1, 'mass'), i('R', 'raio', 'km', 6371, 1000, 'radius')], out: 'v_e', ou: 'km/s', od: 1000, fn: ([m, r]) => Math.sqrt((2 * G * m) / r) } },
  { id: 'kepler3', cat: 'gravitacao', level: 'F', name: '3ª lei de Kepler (Sol, anos e UA)', expr: 'T² = a³',
    vars: [v('T', 'período orbital', 'anos'), v('a', 'semieixo maior da órbita', 'UA')],
    use: 'Forma simplificada para corpos que orbitam o Sol, com T em anos terrestres e a em unidades astronômicas.',
    ex: 'Marte: a = 1,52 UA ⇒ T = √(1,52³) ≈ 1,88 ano.',
    calc: { inputs: [i('a', 'semieixo maior', 'UA', 1.524, AU, 'axis')], out: 'T', ou: 'anos', fn: ([a]) => Math.pow(a / AU, 1.5) } },
  { id: 'kepler3-g', cat: 'gravitacao', level: 'S', name: '3ª lei de Kepler (forma geral de Newton)', expr: 'T² = 4π²·a³ / (G·M)',
    vars: [v('T', 'período orbital', 's'), v('a', 'semieixo maior', 'm'), v('M', 'massa do corpo central', 'kg')],
    use: 'Permite “pesar” astros: medindo T e a de uma lua, descobre-se a massa do planeta.',
    calc: { inputs: [i('a', 'semieixo maior', 'UA', 1, AU, 'axis'), i('M', 'massa central', 'kg', M_SUN)], out: 'T', ou: 'dias', od: 86400, fn: ([a, m]) => 2 * Math.PI * Math.sqrt((a * a * a) / (G * m)) } },
  { id: 'kepler1', cat: 'gravitacao', level: 'M', name: '1ª lei de Kepler (órbitas elípticas)', expr: 'r = a·(1 − e²) / (1 + e·cosν)',
    vars: [v('r', 'distância ao Sol', 'm'), v('a', 'semieixo maior', 'm'), v('e', 'excentricidade (0 ≤ e < 1)', '—'), v('ν', 'anomalia verdadeira', '°')],
    use: 'Os planetas descrevem elipses com o Sol num dos focos. e = 0 é um círculo.' },
  { id: 'kepler2', cat: 'gravitacao', level: 'M', name: '2ª lei de Kepler (lei das áreas)', expr: 'ΔA / Δt = constante      v_p·r_p = v_a·r_a',
    vars: [v('ΔA', 'área varrida pelo raio vetor', 'm²'), v('v_p, r_p', 'velocidade e distância no periélio', 'm/s, m'), v('v_a, r_a', 'velocidade e distância no afélio', 'm/s, m')],
    use: 'O planeta é mais rápido perto do Sol (periélio) e mais lento longe (afélio): conservação do momento angular.' },
  { id: 'excent', cat: 'gravitacao', level: 'M', name: 'Excentricidade da órbita', expr: 'e = (r_a − r_p) / (r_a + r_p)      r_p = a(1 − e)      r_a = a(1 + e)',
    vars: [v('e', 'excentricidade', '—'), v('r_a', 'distância no afélio', 'UA'), v('r_p', 'distância no periélio', 'UA')],
    use: 'Terra: e ≈ 0,017 (quase circular). Mercúrio: e ≈ 0,21.',
    calc: { inputs: [i('r_a', 'afélio', 'UA', 1.0167), i('r_p', 'periélio', 'UA', 0.9833)], out: 'e', ou: '', fn: ([ra, rp]) => (ra - rp) / (ra + rp) } },
  { id: 'ep-grav', cat: 'gravitacao', level: 'S', name: 'Energia potencial gravitacional (geral)', expr: 'E_p = −G·M·m / r',
    vars: [v('E_p', 'energia potencial', 'J'), v('M, m', 'massas', 'kg'), v('r', 'distância ao centro', 'm')],
    use: 'Referência no infinito (E_p = 0). Energia total da órbita: E = −GMm / 2a. Se E ≥ 0, o corpo escapa.',
    calc: { inputs: [i('M', 'massa do astro', 'kg', 5.972e24, 1, 'mass'), i('m', 'massa do corpo', 'kg', 1000), i('r', 'distância', 'km', 6771, 1000)], out: 'E_p', ou: 'J', fn: ([M, m, r]) => (-G * M * m) / r } },
  { id: 'densidade-astro', cat: 'gravitacao', level: 'M', name: 'Densidade média de um astro', expr: 'ρ = M / V = 3M / (4π·R³)',
    vars: [v('ρ', 'densidade média', 'kg/m³'), v('M', 'massa', 'kg'), v('R', 'raio', 'm')],
    use: 'Saturno (≈ 690 kg/m³) é menos denso que a água — “boiaria”.',
    calc: { inputs: [i('M', 'massa', 'kg', 5.683e26, 1, 'mass'), i('R', 'raio', 'km', 58232, 1000, 'radius')], out: 'ρ', ou: 'kg/m³', fn: ([m, r]) => (3 * m) / (4 * Math.PI * r * r * r) } },
  { id: 'sinodico', cat: 'gravitacao', level: 'M', name: 'Período sinódico', expr: '1 / S = | 1 / T₁ − 1 / T₂ |',
    vars: [v('S', 'período sinódico', 'dias ou anos'), v('T₁, T₂', 'períodos siderais dos dois planetas', 'mesma unidade')],
    use: 'Tempo entre dois alinhamentos consecutivos (ex.: oposições de Marte, a cada ≈ 780 dias).',
    calc: { inputs: [i('T₁', 'período do planeta 1', 'dias', 365.25), i('T₂', 'período do planeta 2', 'dias', 687)], out: 'S', ou: 'dias', fn: ([t1, t2]) => 1 / Math.abs(1 / t1 - 1 / t2) } },
  { id: 'schwarz', cat: 'gravitacao', level: 'S', name: 'Raio de Schwarzschild (buraco negro)', expr: 'r_s = 2·G·M / c²',
    vars: [v('r_s', 'raio do horizonte de eventos', 'm'), v('M', 'massa', 'kg'), v('c', 'velocidade da luz', 'm/s')],
    use: 'Se toda a massa M coubesse dentro de r_s, nem a luz escaparia. Para o Sol: ≈ 2,95 km.',
    calc: { inputs: [i('M', 'massa', 'kg', M_SUN)], out: 'r_s', ou: 'km', od: 1000, fn: ([m]) => (2 * G * m) / (C * C) } },
  { id: 'fluxo', cat: 'gravitacao', level: 'M', name: 'Brilho: lei do inverso do quadrado', expr: 'F = L / (4π·d²)',
    vars: [v('F', 'fluxo de energia recebido', 'W/m²'), v('L', 'luminosidade da fonte', 'W'), v('d', 'distância', 'm')],
    use: 'Dobrar a distância reduz o brilho a 1/4. A “constante solar” na Terra vale ≈ 1 361 W/m².',
    calc: { inputs: [i('L', 'luminosidade', 'W', L_SUN), i('d', 'distância', 'UA', 1, AU, 'axis')], out: 'F', ou: 'W/m²', fn: ([l, d]) => l / (4 * Math.PI * d * d) } },
  { id: 'teq', cat: 'gravitacao', level: 'S', name: 'Temperatura de equilíbrio de um planeta', expr: 'T_eq = [ L·(1 − A) / (16π·σ·d²) ]^¼',
    vars: [v('T_eq', 'temperatura de equilíbrio', 'K'), v('L', 'luminosidade da estrela', 'W'), v('A', 'albedo (fração refletida)', '—'), v('σ', 'constante de Stefan–Boltzmann', 'W/m²K⁴'), v('d', 'distância à estrela', 'm')],
    use: 'Ignora o efeito estufa. Terra: ≈ 255 K (−18 °C); a atmosfera eleva a média real para ≈ 288 K.',
    calc: { inputs: [i('A', 'albedo', '', 0.3), i('d', 'distância', 'UA', 1, AU, 'axis')], out: 'T_eq', ou: 'K', fn: ([a, d]) => Math.pow((L_SUN * (1 - a)) / (16 * Math.PI * SIGMA * d * d), 0.25) } },
  { id: 'tam-ang', cat: 'gravitacao', level: 'M', name: 'Tamanho angular (aproximação de ângulos pequenos)', expr: 'θ = D / d      (θ em radianos)',
    vars: [v('θ', 'tamanho angular', 'rad'), v('D', 'diâmetro real do objeto', 'm'), v('d', 'distância', 'm')],
    use: '1 rad ≈ 206 265″. É por isso que Sol e Lua têm quase o mesmo tamanho aparente (≈ 0,5°).',
    calc: { inputs: [i('D', 'diâmetro', 'km', 3474, 1000), i('d', 'distância', 'km', 384400, 1000)], out: 'θ', ou: '°', od: Math.PI / 180, fn: ([D, d]) => D / d } },
  { id: 'paralaxe', cat: 'gravitacao', level: 'M', name: 'Paralaxe estelar', expr: 'd = 1 / p',
    vars: [v('d', 'distância', 'parsecs'), v('p', 'paralaxe', 'segundos de arco')],
    use: '1 pc = distância de uma estrela com paralaxe de 1″ ≈ 3,26 anos-luz.',
    calc: { inputs: [i('p', 'paralaxe', '″', 0.768)], out: 'd', ou: 'pc', fn: ([p]) => 1 / p } },
  { id: 'hubble', cat: 'gravitacao', level: 'S', name: 'Lei de Hubble–Lemaître', expr: 'v = H₀·d',
    vars: [v('v', 'velocidade de recessão', 'km/s'), v('H₀', 'constante de Hubble (≈ 70)', 'km/s/Mpc'), v('d', 'distância', 'Mpc')],
    use: 'Quanto mais longe a galáxia, mais rápido ela se afasta. O redshift é z = Δλ/λ₀ ≈ v/c.',
    calc: { inputs: [i('H₀', 'constante de Hubble', 'km/s/Mpc', 70), i('d', 'distância', 'Mpc', 100)], out: 'v', ou: 'km/s', fn: ([h0, d]) => h0 * d } },

  // ======================= FLUIDOS =======================
  { id: 'dens', cat: 'fluidos', level: 'F', name: 'Densidade (massa específica)', expr: 'ρ = m / V',
    vars: [v('ρ', 'densidade', 'kg/m³'), v('m', 'massa', 'kg'), v('V', 'volume', 'm³')],
    use: '1 g/cm³ = 1 000 kg/m³. 1 L = 1 dm³ = 10⁻³ m³.',
    calc: { inputs: [i('m', 'massa', 'kg', 7.8), i('V', 'volume', 'L', 1, 1e-3)], out: 'ρ', ou: 'kg/m³', fn: ([m, V]) => m / V } },
  { id: 'pressao', cat: 'fluidos', level: 'F', name: 'Pressão', expr: 'p = F / A',
    vars: [v('p', 'pressão', 'Pa (N/m²)'), v('F', 'força perpendicular', 'N'), v('A', 'área', 'm²')],
    use: 'Mesma força em área menor ⇒ pressão maior (faca afiada, salto agulha).',
    calc: { inputs: [i('F', 'força', 'N', 600), i('A', 'área', 'cm²', 200, 1e-4)], out: 'p', ou: 'Pa', fn: ([f, a]) => f / a } },
  { id: 'stevin', cat: 'fluidos', level: 'M', name: 'Teorema de Stevin (pressão hidrostática)', expr: 'p = p₀ + ρ·g·h',
    vars: [v('p', 'pressão na profundidade h', 'Pa'), v('p₀', 'pressão na superfície', 'Pa'), v('ρ', 'densidade do líquido', 'kg/m³'), v('h', 'profundidade', 'm')],
    use: 'A cada ≈ 10 m de água a pressão sobe ≈ 1 atm.',
    calc: { inputs: [i('p₀', 'pressão na superfície', 'Pa', 101325), i('ρ', 'densidade', 'kg/m³', 1000), i('h', 'profundidade', 'm', 10)], out: 'p', ou: 'Pa', fn: ([p0, rho, h]) => p0 + rho * g0 * h } },
  { id: 'pascal', cat: 'fluidos', level: 'M', name: 'Princípio de Pascal (prensa hidráulica)', expr: 'F₁ / A₁ = F₂ / A₂',
    vars: [v('F₁, F₂', 'forças nos êmbolos', 'N'), v('A₁, A₂', 'áreas dos êmbolos', 'm²')],
    use: 'O acréscimo de pressão se transmite integralmente. Ganha-se força, mas o êmbolo menor percorre distância maior.',
    calc: { inputs: [i('F₁', 'força de entrada', 'N', 100), i('A₁', 'área de entrada', 'cm²', 10, 1e-4), i('A₂', 'área de saída', 'cm²', 500, 1e-4)], out: 'F₂', ou: 'N', fn: ([f1, a1, a2]) => (f1 * a2) / a1 } },
  { id: 'empuxo', cat: 'fluidos', level: 'M', name: 'Empuxo (Princípio de Arquimedes)', expr: 'E = ρ_fluido·g·V_deslocado',
    vars: [v('E', 'empuxo', 'N'), v('ρ_fluido', 'densidade do fluido', 'kg/m³'), v('g', 'gravidade', 'm/s²'), v('V_deslocado', 'volume de fluido deslocado', 'm³')],
    use: 'Flutua se ρ_corpo < ρ_fluido. Peso aparente: P_ap = P − E.',
    calc: { inputs: [i('ρ_fluido', 'densidade do fluido', 'kg/m³', 1000), i('V', 'volume submerso', 'L', 5, 1e-3)], out: 'E', ou: 'N', fn: ([rho, V]) => rho * g0 * V } },
  { id: 'continuidade', cat: 'fluidos', level: 'M', name: 'Equação da continuidade e vazão', expr: 'Q = A·v = V / Δt      A₁·v₁ = A₂·v₂',
    vars: [v('Q', 'vazão volumétrica', 'm³/s'), v('A', 'área da seção', 'm²'), v('v', 'velocidade do fluido', 'm/s')],
    use: 'Fluido incompressível: onde o tubo estreita, a velocidade aumenta.',
    calc: { inputs: [i('A₁', 'área 1', 'cm²', 20, 1e-4), i('v₁', 'velocidade 1', 'm/s', 2), i('A₂', 'área 2', 'cm²', 5, 1e-4)], out: 'v₂', ou: 'm/s', fn: ([a1, v1, a2]) => (a1 * v1) / a2 } },
  { id: 'bernoulli', cat: 'fluidos', level: 'S', name: 'Equação de Bernoulli', expr: 'p + ½·ρ·v² + ρ·g·h = constante',
    vars: [v('p', 'pressão', 'Pa'), v('ρ', 'densidade', 'kg/m³'), v('v', 'velocidade', 'm/s'), v('h', 'altura', 'm')],
    use: 'Conservação de energia em fluido ideal: onde a velocidade é maior, a pressão é menor (sustentação de asas).' },

  // ======================= TERMOLOGIA =======================
  { id: 'escalas', cat: 'termo', level: 'F', name: 'Conversão de escalas de temperatura', expr: 'T_K = T_C + 273,15      T_F = 1,8·T_C + 32',
    vars: [v('T_C', 'temperatura em Celsius', '°C'), v('T_K', 'temperatura em Kelvin', 'K'), v('T_F', 'temperatura em Fahrenheit', '°F')],
    use: 'Variações: ΔT_K = ΔT_C = (5/9)·ΔT_F.',
    calc: { inputs: [i('T_C', 'temperatura', '°C', 25)], out: 'T_F', ou: '°F', fn: ([c]) => 1.8 * c + 32 } },
  { id: 'dilat', cat: 'termo', level: 'M', name: 'Dilatação térmica linear', expr: 'ΔL = α·L₀·Δθ',
    vars: [v('ΔL', 'variação de comprimento', 'm'), v('α', 'coeficiente de dilatação linear', '°C⁻¹'), v('L₀', 'comprimento inicial', 'm'), v('Δθ', 'variação de temperatura', '°C')],
    use: 'Superficial: ΔA = β·A₀·Δθ (β = 2α). Volumétrica: ΔV = γ·V₀·Δθ (γ = 3α).',
    calc: { inputs: [i('α', 'coef. (aço ≈ 1,2e-5)', '°C⁻¹', 1.2e-5), i('L₀', 'comprimento inicial', 'm', 10), i('Δθ', 'variação de temperatura', '°C', 40)], out: 'ΔL', ou: 'mm', od: 1e-3, fn: ([a, l0, dt]) => a * l0 * dt } },
  { id: 'calor-sens', cat: 'termo', level: 'M', name: 'Calor sensível', expr: 'Q = m·c·Δθ',
    vars: [v('Q', 'quantidade de calor', 'J'), v('m', 'massa', 'kg'), v('c', 'calor específico', 'J/(kg·K)'), v('Δθ', 'variação de temperatura', 'K')],
    use: 'Calor que muda a temperatura. 1 cal = 4,186 J. c_água = 4 186 J/(kg·K).',
    calc: { inputs: [i('m', 'massa', 'kg', 1), i('c', 'calor específico', 'J/(kg·K)', 4186), i('Δθ', 'variação de temperatura', 'K', 80)], out: 'Q', ou: 'kJ', od: 1000, fn: ([m, c, dt]) => m * c * dt } },
  { id: 'calor-lat', cat: 'termo', level: 'M', name: 'Calor latente (mudança de fase)', expr: 'Q = m·L',
    vars: [v('Q', 'calor trocado', 'J'), v('m', 'massa', 'kg'), v('L', 'calor latente', 'J/kg')],
    use: 'A temperatura não muda durante a mudança de fase. Fusão do gelo: L = 3,34×10⁵ J/kg; vaporização da água: 2,26×10⁶ J/kg.',
    calc: { inputs: [i('m', 'massa', 'kg', 0.5), i('L', 'calor latente', 'J/kg', 334000)], out: 'Q', ou: 'kJ', od: 1000, fn: ([m, l]) => m * l } },
  { id: 'cap-term', cat: 'termo', level: 'M', name: 'Capacidade térmica e equilíbrio térmico', expr: 'C = Q / Δθ = m·c      ΣQ = 0',
    vars: [v('C', 'capacidade térmica', 'J/K'), v('ΣQ', 'soma dos calores trocados', 'J')],
    use: 'Em sistema isolado, o calor cedido é igual ao recebido (em módulo): Q_cedido + Q_recebido = 0.' },
  { id: 'fourier', cat: 'termo', level: 'M', name: 'Condução térmica (lei de Fourier)', expr: 'Φ = k·A·Δθ / L',
    vars: [v('Φ', 'fluxo de calor', 'W'), v('k', 'condutividade térmica', 'W/(m·K)'), v('A', 'área', 'm²'), v('Δθ', 'diferença de temperatura', 'K'), v('L', 'espessura', 'm')],
    use: 'Isolantes têm k pequeno (isopor, lã); metais têm k grande.',
    calc: { inputs: [i('k', 'condutividade', 'W/(m·K)', 0.8), i('A', 'área', 'm²', 2), i('Δθ', 'ΔT', 'K', 20), i('L', 'espessura', 'cm', 20, 0.01)], out: 'Φ', ou: 'W', fn: ([k, a, dt, l]) => (k * a * dt) / l } },
  { id: 'gas-ideal', cat: 'termo', level: 'M', name: 'Equação de Clapeyron (gás ideal)', expr: 'p·V = n·R·T',
    vars: [v('p', 'pressão', 'Pa'), v('V', 'volume', 'm³'), v('n', 'quantidade de matéria', 'mol'), v('R', '8,314', 'J/(mol·K)'), v('T', 'temperatura absoluta', 'K')],
    use: 'Sempre use T em kelvin. Com p em atm e V em L: R ≈ 0,082 atm·L/(mol·K).',
    calc: { inputs: [i('n', 'quantidade', 'mol', 1), i('T', 'temperatura', 'K', 273.15), i('V', 'volume', 'L', 22.4, 1e-3)], out: 'p', ou: 'Pa', fn: ([n, T, V]) => (n * R_GAS * T) / V } },
  { id: 'lei-geral', cat: 'termo', level: 'M', name: 'Lei geral dos gases', expr: 'p₁·V₁ / T₁ = p₂·V₂ / T₂',
    vars: [v('p, V, T', 'pressão, volume e temperatura (K)', '—')],
    use: 'Casos particulares: isotérmica (Boyle, p·V = const), isobárica (Charles, V/T = const), isocórica (Gay-Lussac, p/T = const).',
    calc: { inputs: [i('p₁', 'pressão 1', 'atm', 1, 101325), i('V₁', 'volume 1', 'L', 10, 1e-3), i('T₁', 'temperatura 1', 'K', 300), i('V₂', 'volume 2', 'L', 5, 1e-3), i('T₂', 'temperatura 2', 'K', 300)], out: 'p₂', ou: 'atm', od: 101325, fn: ([p1, v1, t1, v2, t2]) => (p1 * v1 * t2) / (t1 * v2) } },
  { id: 'primeira-lei', cat: 'termo', level: 'M', name: '1ª lei da Termodinâmica', expr: 'ΔU = Q − W',
    vars: [v('ΔU', 'variação da energia interna', 'J'), v('Q', 'calor recebido pelo gás', 'J'), v('W', 'trabalho realizado pelo gás', 'J')],
    use: 'Conservação da energia. Trabalho a pressão constante: W = p·ΔV. Gás monoatômico ideal: U = (3/2)·n·R·T.',
    calc: { inputs: [i('Q', 'calor recebido', 'J', 500), i('W', 'trabalho realizado', 'J', 200)], out: 'ΔU', ou: 'J', fn: ([q, w]) => q - w } },
  { id: 'carnot', cat: 'termo', level: 'M', name: 'Rendimento de máquinas térmicas', expr: 'η = 1 − Q_f / Q_q      η_Carnot = 1 − T_f / T_q',
    vars: [v('η', 'rendimento', '—'), v('Q_q, Q_f', 'calor da fonte quente / rejeitado à fria', 'J'), v('T_q, T_f', 'temperaturas das fontes (K)', 'K')],
    use: '2ª lei: nenhuma máquina térmica atinge η = 1. O ciclo de Carnot é o máximo possível entre duas temperaturas.',
    calc: { inputs: [i('T_q', 'fonte quente', 'K', 600), i('T_f', 'fonte fria', 'K', 300)], out: 'η_Carnot', ou: '', fn: ([tq, tf]) => 1 - tf / tq } },
  { id: 'entropia', cat: 'termo', level: 'S', name: 'Variação de entropia', expr: 'ΔS = Q / T',
    vars: [v('ΔS', 'variação de entropia', 'J/K'), v('Q', 'calor trocado reversivelmente', 'J'), v('T', 'temperatura absoluta', 'K')],
    use: 'Em processos espontâneos de um sistema isolado, ΔS ≥ 0.',
    calc: { inputs: [i('Q', 'calor', 'J', 1000), i('T', 'temperatura', 'K', 300)], out: 'ΔS', ou: 'J/K', fn: ([q, t]) => q / t } },
  { id: 'stefan', cat: 'termo', level: 'M', name: 'Lei de Stefan–Boltzmann (radiação)', expr: 'P = σ·A·T⁴',
    vars: [v('P', 'potência irradiada', 'W'), v('σ', '5,67×10⁻⁸', 'W/(m²·K⁴)'), v('A', 'área da superfície', 'm²'), v('T', 'temperatura absoluta', 'K')],
    use: 'Dobrar a temperatura multiplica a potência por 16. Para uma estrela esférica: L = 4π·R²·σ·T⁴.',
    calc: { inputs: [i('R', 'raio da esfera', 'm', 6.957e8), i('T', 'temperatura', 'K', 5772)], out: 'L', ou: 'W', fn: ([r, t]) => 4 * Math.PI * r * r * SIGMA * Math.pow(t, 4) } },
  { id: 'wien', cat: 'termo', level: 'M', name: 'Lei do deslocamento de Wien', expr: 'λ_máx = b / T',
    vars: [v('λ_máx', 'comprimento de onda de maior emissão', 'm'), v('b', '2,898×10⁻³', 'm·K'), v('T', 'temperatura', 'K')],
    use: 'Estrelas quentes são azuladas; frias, avermelhadas. O Sol (5 772 K) emite mais no verde (≈ 500 nm).',
    calc: { inputs: [i('T', 'temperatura', 'K', 5772)], out: 'λ_máx', ou: 'nm', od: 1e-9, fn: ([t]) => 2.897771955e-3 / t } },

  // ======================= OSCILAÇÕES E ONDAS =======================
  { id: 'onda', cat: 'ondas', level: 'F', name: 'Equação fundamental da ondulatória', expr: 'v = λ·f',
    vars: [v('v', 'velocidade de propagação', 'm/s'), v('λ', 'comprimento de onda', 'm'), v('f', 'frequência', 'Hz')],
    use: 'A frequência é definida pela fonte; a velocidade, pelo meio.',
    calc: { inputs: [i('λ', 'comprimento de onda', 'm', 0.5), i('f', 'frequência', 'Hz', 680)], out: 'v', ou: 'm/s', fn: ([l, f]) => l * f } },
  { id: 'mhs-mola', cat: 'ondas', level: 'M', name: 'MHS — sistema massa–mola', expr: 'T = 2π·√(m / k)      ω = √(k / m)',
    vars: [v('T', 'período', 's'), v('m', 'massa', 'kg'), v('k', 'constante da mola', 'N/m')],
    use: 'O período não depende da amplitude. Posição: x = A·cos(ωt + φ). Energia: E = ½·k·A².',
    calc: { inputs: [i('m', 'massa', 'kg', 0.5), i('k', 'constante da mola', 'N/m', 50)], out: 'T', ou: 's', fn: ([m, k]) => 2 * Math.PI * Math.sqrt(m / k) } },
  { id: 'pendulo', cat: 'ondas', level: 'M', name: 'Pêndulo simples', expr: 'T = 2π·√(L / g)',
    vars: [v('T', 'período', 's'), v('L', 'comprimento do fio', 'm'), v('g', 'gravidade local', 'm/s²')],
    use: 'Para ângulos pequenos (< 15°). Não depende da massa! Útil para medir g.',
    calc: { inputs: [i('L', 'comprimento', 'm', 1), i('g', 'gravidade', 'm/s²', 9.8)], out: 'T', ou: 's', fn: ([l, g]) => 2 * Math.PI * Math.sqrt(l / g) } },
  { id: 'corda', cat: 'ondas', level: 'M', name: 'Velocidade da onda numa corda', expr: 'v = √(T / μ)',
    vars: [v('v', 'velocidade da onda', 'm/s'), v('T', 'tração', 'N'), v('μ', 'densidade linear (m/L)', 'kg/m')],
    use: 'Mais tensão ⇒ onda mais rápida (afinação de instrumentos de corda).',
    calc: { inputs: [i('T', 'tração', 'N', 100), i('μ', 'densidade linear', 'kg/m', 0.01)], out: 'v', ou: 'm/s', fn: ([t, mu]) => Math.sqrt(t / mu) } },
  { id: 'harmonicos', cat: 'ondas', level: 'M', name: 'Harmônicos em cordas e tubos', expr: 'Corda / tubo aberto: fₙ = n·v / (2L)      Tubo fechado: fₙ = (2n − 1)·v / (4L)',
    vars: [v('fₙ', 'frequência do harmônico n', 'Hz'), v('n', 'ordem do harmônico (1, 2, 3…)', '—'), v('v', 'velocidade da onda', 'm/s'), v('L', 'comprimento', 'm')],
    use: 'Ondas estacionárias: a corda tem nós nas extremidades. O tubo fechado só tem harmônicos ímpares.',
    calc: { inputs: [i('n', 'harmônico', '', 1), i('v', 'velocidade', 'm/s', 343), i('L', 'comprimento', 'm', 0.5)], out: 'fₙ', ou: 'Hz', fn: ([n, vel, l]) => (n * vel) / (2 * l) } },
  { id: 'doppler', cat: 'ondas', level: 'M', name: 'Efeito Doppler (som)', expr: "f' = f·(v + v_o) / (v − v_f)",
    vars: [v("f'", 'frequência percebida', 'Hz'), v('f', 'frequência emitida', 'Hz'), v('v', 'velocidade do som', 'm/s'), v('v_o', 'velocidade do observador (aproximando-se: +)', 'm/s'), v('v_f', 'velocidade da fonte (aproximando-se: +)', 'm/s')],
    use: 'Aproximação ⇒ som mais agudo; afastamento ⇒ mais grave. Na luz, é o desvio para o vermelho / azul.',
    calc: { inputs: [i('f', 'frequência emitida', 'Hz', 440), i('v', 'velocidade do som', 'm/s', 343), i('v_o', 'observador', 'm/s', 0), i('v_f', 'fonte', 'm/s', 30)], out: "f'", ou: 'Hz', fn: ([f, vel, vo, vf]) => (f * (vel + vo)) / (vel - vf) } },
  { id: 'nivel-sonoro', cat: 'ondas', level: 'M', name: 'Intensidade e nível sonoro', expr: 'I = P / A      β = 10·log₁₀(I / I₀)      I₀ = 10⁻¹² W/m²',
    vars: [v('I', 'intensidade', 'W/m²'), v('β', 'nível sonoro', 'dB'), v('I₀', 'limiar de audição', 'W/m²')],
    use: 'Cada +10 dB multiplica a intensidade por 10. Conversa ≈ 60 dB; show de rock ≈ 110 dB.',
    calc: { inputs: [i('I', 'intensidade', 'W/m²', 1e-6)], out: 'β', ou: 'dB', fn: ([I]) => 10 * Math.log10(I / 1e-12) } },
  { id: 'interf', cat: 'ondas', level: 'M', name: 'Interferência de ondas', expr: 'Construtiva: Δ = n·λ      Destrutiva: Δ = (n + ½)·λ',
    vars: [v('Δ', 'diferença de percurso', 'm'), v('λ', 'comprimento de onda', 'm'), v('n', 'inteiro (0, 1, 2…)', '—')],
    use: 'Fontes em fase: diferença de percurso múltipla de λ reforça a onda; meio-múltiplo anula.' },
  { id: 'young', cat: 'ondas', level: 'M', name: 'Fenda dupla de Young', expr: 'Δy = λ·D / d',
    vars: [v('Δy', 'distância entre franjas brilhantes', 'm'), v('λ', 'comprimento de onda', 'm'), v('D', 'distância às fendas ao anteparo', 'm'), v('d', 'distância entre as fendas', 'm')],
    use: 'Prova do caráter ondulatório da luz. Rede de difração: d·senθ = n·λ.',
    calc: { inputs: [i('λ', 'comprimento de onda', 'nm', 600, 1e-9), i('D', 'distância ao anteparo', 'm', 2), i('d', 'distância entre fendas', 'mm', 0.5, 1e-3)], out: 'Δy', ou: 'mm', od: 1e-3, fn: ([l, D, d]) => (l * D) / d } },

  // ======================= ÓPTICA =======================
  { id: 'reflexao', cat: 'optica', level: 'F', name: 'Lei da reflexão', expr: 'θᵢ = θᵣ',
    vars: [v('θᵢ', 'ângulo de incidência', '°'), v('θᵣ', 'ângulo de reflexão', '°')],
    use: 'Os ângulos são medidos em relação à normal à superfície. Espelho plano: imagem virtual, simétrica, do mesmo tamanho.' },
  { id: 'n-ind', cat: 'optica', level: 'M', name: 'Índice de refração', expr: 'n = c / v',
    vars: [v('n', 'índice de refração', '—'), v('c', 'velocidade da luz no vácuo', 'm/s'), v('v', 'velocidade da luz no meio', 'm/s')],
    use: 'Água: n ≈ 1,33; vidro: ≈ 1,5; diamante: ≈ 2,42.',
    calc: { inputs: [i('v', 'velocidade no meio', 'm/s', 2.25e8)], out: 'n', ou: '', fn: ([vel]) => C / vel } },
  { id: 'snell', cat: 'optica', level: 'M', name: 'Lei de Snell–Descartes (refração)', expr: 'n₁·senθ₁ = n₂·senθ₂',
    vars: [v('n₁, n₂', 'índices dos meios', '—'), v('θ₁', 'ângulo de incidência', '°'), v('θ₂', 'ângulo de refração', '°')],
    use: 'Ao entrar num meio mais refringente, o raio se aproxima da normal.',
    calc: { inputs: [i('n₁', 'meio 1', '', 1), i('θ₁', 'incidência', '°', 30), i('n₂', 'meio 2', '', 1.5)], out: 'θ₂', ou: '°', fn: ([n1, t1, n2]) => (Math.asin((n1 * Math.sin(rad(t1))) / n2) * 180) / Math.PI } },
  { id: 'limite', cat: 'optica', level: 'M', name: 'Ângulo limite e reflexão total', expr: 'sen θ_L = n_menor / n_maior',
    vars: [v('θ_L', 'ângulo limite', '°')],
    use: 'Acima de θ_L, toda a luz é refletida (fibra óptica, miragens, prismas de binóculos).',
    calc: { inputs: [i('n_maior', 'meio mais refringente', '', 1.5), i('n_menor', 'meio menos refringente', '', 1)], out: 'θ_L', ou: '°', fn: ([nM, nm]) => (Math.asin(nm / nM) * 180) / Math.PI } },
  { id: 'gauss', cat: 'optica', level: 'M', name: 'Equação de Gauss (espelhos e lentes)', expr: '1 / f = 1 / p + 1 / p′',
    vars: [v('f', 'distância focal', 'm'), v('p', 'distância do objeto', 'm'), v("p′", 'distância da imagem', 'm')],
    use: 'Convenção: p′ > 0 imagem real; p′ < 0 imagem virtual. Espelho esférico: f = R/2.',
    calc: { inputs: [i('f', 'distância focal', 'cm', 10, 0.01), i('p', 'objeto', 'cm', 30, 0.01)], out: "p′", ou: 'cm', od: 0.01, fn: ([f, p]) => 1 / (1 / f - 1 / p) } },
  { id: 'aumento', cat: 'optica', level: 'M', name: 'Aumento linear transversal', expr: 'A = i / o = − p′ / p',
    vars: [v('A', 'aumento (A < 0: imagem invertida)', '—'), v('i, o', 'tamanhos da imagem e do objeto', 'm')],
    use: '|A| > 1: ampliada; |A| < 1: reduzida.',
    calc: { inputs: [i('p', 'objeto', 'cm', 30), i("p′", 'imagem', 'cm', 15)], out: 'A', ou: '', fn: ([p, pl]) => -pl / p } },
  { id: 'dioptria', cat: 'optica', level: 'M', name: 'Vergência (dioptria) de uma lente', expr: 'V = 1 / f      1/f = (n − 1)·(1/R₁ + 1/R₂)',
    vars: [v('V', 'vergência', 'di (m⁻¹)'), v('f', 'distância focal', 'm')],
    use: 'O “grau” dos óculos é a vergência. Miopia: lente divergente (V < 0); hipermetropia: convergente (V > 0).',
    calc: { inputs: [i('f', 'distância focal', 'cm', -50, 0.01)], out: 'V', ou: 'di', fn: ([f]) => 1 / f } },

  // ======================= ELETRICIDADE =======================
  { id: 'carga', cat: 'eletro', level: 'M', name: 'Quantização da carga', expr: 'Q = n·e',
    vars: [v('Q', 'carga elétrica', 'C'), v('n', 'número de elétrons em excesso/falta', '—'), v('e', '1,602×10⁻¹⁹', 'C')],
    use: 'A carga só existe em múltiplos inteiros da carga elementar.',
    calc: { inputs: [i('n', 'nº de elétrons', '', 1e12)], out: 'Q', ou: 'nC', od: 1e-9, fn: ([n]) => n * E_CH } },
  { id: 'coulomb', cat: 'eletro', level: 'M', name: 'Lei de Coulomb', expr: 'F = k·|Q₁·Q₂| / d²',
    vars: [v('F', 'força elétrica', 'N'), v('k', '8,99×10⁹', 'N·m²/C²'), v('Q₁, Q₂', 'cargas', 'C'), v('d', 'distância', 'm')],
    use: 'Cargas iguais repelem; opostas atraem. Mesma forma da gravitação, mas muito mais intensa.',
    calc: { inputs: [i('Q₁', 'carga 1', 'μC', 2, 1e-6), i('Q₂', 'carga 2', 'μC', 3, 1e-6), i('d', 'distância', 'cm', 10, 0.01)], out: 'F', ou: 'N', fn: ([q1, q2, d]) => (K_COUL * Math.abs(q1 * q2)) / (d * d) } },
  { id: 'campo-e', cat: 'eletro', level: 'M', name: 'Campo elétrico', expr: 'E = F / q = k·Q / d²',
    vars: [v('E', 'campo elétrico', 'N/C ou V/m'), v('q', 'carga de prova', 'C'), v('Q', 'carga geradora', 'C'), v('d', 'distância', 'm')],
    use: 'Campo uniforme entre placas paralelas: E = U / d.',
    calc: { inputs: [i('Q', 'carga geradora', 'μC', 2, 1e-6), i('d', 'distância', 'cm', 10, 0.01)], out: 'E', ou: 'N/C', fn: ([q, d]) => (K_COUL * q) / (d * d) } },
  { id: 'pot-e', cat: 'eletro', level: 'M', name: 'Potencial elétrico e trabalho', expr: 'V = k·Q / d      W = q·(V_A − V_B)',
    vars: [v('V', 'potencial elétrico', 'V'), v('W', 'trabalho da força elétrica', 'J'), v('q', 'carga deslocada', 'C')],
    use: 'Energia potencial elétrica: E_p = k·Q·q / d. U = ddp = V_A − V_B.',
    calc: { inputs: [i('Q', 'carga geradora', 'μC', 2, 1e-6), i('d', 'distância', 'cm', 10, 0.01)], out: 'V', ou: 'V', fn: ([q, d]) => (K_COUL * q) / d } },
  { id: 'corrente', cat: 'eletro', level: 'F', name: 'Corrente elétrica', expr: 'i = ΔQ / Δt',
    vars: [v('i', 'corrente elétrica', 'A'), v('ΔQ', 'carga que atravessa a seção', 'C'), v('Δt', 'tempo', 's')],
    use: '1 A = 1 C/s. 1 Ah = 3 600 C (capacidade de baterias).',
    calc: { inputs: [i('ΔQ', 'carga', 'C', 30), i('Δt', 'tempo', 's', 10)], out: 'i', ou: 'A', fn: ([q, t]) => q / t } },
  { id: 'ohm1', cat: 'eletro', level: 'F', name: '1ª lei de Ohm', expr: 'U = R·i',
    vars: [v('U', 'tensão (ddp)', 'V'), v('R', 'resistência elétrica', 'Ω'), v('i', 'corrente', 'A')],
    use: 'Vale para resistores ôhmicos (R constante).',
    calc: { inputs: [i('R', 'resistência', 'Ω', 20), i('i', 'corrente', 'A', 3)], out: 'U', ou: 'V', fn: ([r, c]) => r * c } },
  { id: 'ohm2', cat: 'eletro', level: 'M', name: '2ª lei de Ohm (resistividade)', expr: 'R = ρ·L / A',
    vars: [v('R', 'resistência', 'Ω'), v('ρ', 'resistividade do material', 'Ω·m'), v('L', 'comprimento', 'm'), v('A', 'área da seção', 'm²')],
    use: 'Fio mais longo ou mais fino ⇒ maior resistência. Cobre: ρ ≈ 1,7×10⁻⁸ Ω·m.',
    calc: { inputs: [i('ρ', 'resistividade', 'Ω·m', 1.7e-8), i('L', 'comprimento', 'm', 100), i('A', 'área da seção', 'mm²', 1.5, 1e-6)], out: 'R', ou: 'Ω', fn: ([rho, l, a]) => (rho * l) / a } },
  { id: 'pot-el', cat: 'eletro', level: 'F', name: 'Potência elétrica', expr: 'P = U·i = R·i² = U² / R',
    vars: [v('P', 'potência', 'W'), v('U', 'tensão', 'V'), v('i', 'corrente', 'A'), v('R', 'resistência', 'Ω')],
    use: 'Um chuveiro de 5 500 W em 220 V consome ≈ 25 A.',
    calc: { inputs: [i('U', 'tensão', 'V', 220), i('i', 'corrente', 'A', 25)], out: 'P', ou: 'W', fn: ([u, c]) => u * c } },
  { id: 'energia-el', cat: 'eletro', level: 'F', name: 'Energia elétrica e consumo', expr: 'E = P·Δt',
    vars: [v('E', 'energia consumida', 'J ou kWh'), v('P', 'potência', 'W'), v('Δt', 'tempo', 's ou h')],
    use: '1 kWh = 3,6×10⁶ J. Custo = energia (kWh) × tarifa (R$/kWh).',
    calc: { inputs: [i('P', 'potência', 'W', 5500), i('Δt', 'tempo', 'min', 30, 60)], out: 'E', ou: 'kWh', od: 3.6e6, fn: ([p, t]) => p * t } },
  { id: 'serie', cat: 'eletro', level: 'M', name: 'Associação de resistores', expr: 'Série: R = R₁ + R₂ + …      Paralelo: 1/R = 1/R₁ + 1/R₂ + …',
    vars: [v('R', 'resistência equivalente', 'Ω')],
    use: 'Série: mesma corrente. Paralelo: mesma tensão (a resistência equivalente é menor que a menor).',
    calc: { inputs: [i('R₁', 'resistor 1', 'Ω', 20), i('R₂', 'resistor 2', 'Ω', 30)], out: 'R_paralelo', ou: 'Ω', fn: ([r1, r2]) => (r1 * r2) / (r1 + r2) } },
  { id: 'gerador', cat: 'eletro', level: 'M', name: 'Gerador real', expr: 'U = ε − r·i',
    vars: [v('U', 'tensão nos terminais', 'V'), v('ε', 'força eletromotriz', 'V'), v('r', 'resistência interna', 'Ω'), v('i', 'corrente', 'A')],
    use: 'Em curto-circuito U = 0 e i = ε/r. Receptor: U = ε′ + r′·i.',
    calc: { inputs: [i('ε', 'fem', 'V', 12), i('r', 'resistência interna', 'Ω', 0.5), i('i', 'corrente', 'A', 4)], out: 'U', ou: 'V', fn: ([e, r, c]) => e - r * c } },
  { id: 'kirchhoff', cat: 'eletro', level: 'M', name: 'Leis de Kirchhoff', expr: 'Nós: Σi_entram = Σi_saem      Malhas: ΣU = 0',
    vars: [v('i', 'correntes', 'A'), v('U', 'tensões', 'V')],
    use: 'Conservação da carga (nós) e da energia (malhas).' },
  { id: 'capacitor', cat: 'eletro', level: 'M', name: 'Capacitor', expr: 'C = Q / U = ε₀·A / d      E = ½·C·U²',
    vars: [v('C', 'capacitância', 'F'), v('Q', 'carga armazenada', 'C'), v('U', 'tensão', 'V'), v('A', 'área das placas', 'm²'), v('d', 'distância entre as placas', 'm')],
    use: 'Energia guardada no campo elétrico entre as placas.',
    calc: { inputs: [i('C', 'capacitância', 'μF', 100, 1e-6), i('U', 'tensão', 'V', 12)], out: 'E', ou: 'mJ', od: 1e-3, fn: ([c, u]) => 0.5 * c * u * u } },
  { id: 'rc', cat: 'eletro', level: 'S', name: 'Circuito RC (constante de tempo)', expr: 'τ = R·C      U_C(t) = ε·(1 − e^(−t/τ))',
    vars: [v('τ', 'constante de tempo', 's'), v('R', 'resistência', 'Ω'), v('C', 'capacitância', 'F')],
    use: 'Em t = τ o capacitor atinge ≈ 63 % da carga final.',
    calc: { inputs: [i('R', 'resistência', 'kΩ', 10, 1000), i('C', 'capacitância', 'μF', 100, 1e-6)], out: 'τ', ou: 's', fn: ([r, c]) => r * c } },

  // ======================= MAGNETISMO =======================
  { id: 'f-mag', cat: 'magneto', level: 'M', name: 'Força magnética sobre carga em movimento', expr: 'F = |q|·v·B·senθ',
    vars: [v('F', 'força magnética', 'N'), v('q', 'carga', 'C'), v('v', 'velocidade', 'm/s'), v('B', 'campo magnético', 'T'), v('θ', 'ângulo entre v e B', '°')],
    use: 'A força é sempre perpendicular à velocidade: não realiza trabalho (muda a direção, não o módulo de v). Regra da mão direita.',
    calc: { inputs: [i('q', 'carga', 'C', 1.602e-19), i('v', 'velocidade', 'm/s', 1e6), i('B', 'campo', 'mT', 50, 1e-3), i('θ', 'ângulo', '°', 90)], out: 'F', ou: 'N', fn: ([q, vel, b, th]) => Math.abs(q) * vel * b * Math.sin(rad(th)) } },
  { id: 'raio-mag', cat: 'magneto', level: 'M', name: 'Raio da trajetória circular num campo B', expr: 'R = m·v / (|q|·B)',
    vars: [v('R', 'raio da trajetória', 'm'), v('m', 'massa da partícula', 'kg'), v('v', 'velocidade', 'm/s'), v('q', 'carga', 'C'), v('B', 'campo', 'T')],
    use: 'Base de espectrômetros de massa e aceleradores (ciclotron). Período: T = 2π·m / (|q|·B).',
    calc: { inputs: [i('m', 'massa', 'kg', 9.109e-31), i('v', 'velocidade', 'm/s', 1e6), i('q', 'carga', 'C', 1.602e-19), i('B', 'campo', 'mT', 1, 1e-3)], out: 'R', ou: 'mm', od: 1e-3, fn: ([m, vel, q, b]) => (m * vel) / (Math.abs(q) * b) } },
  { id: 'f-fio', cat: 'magneto', level: 'M', name: 'Força magnética sobre um fio com corrente', expr: 'F = B·i·L·senθ',
    vars: [v('F', 'força', 'N'), v('B', 'campo', 'T'), v('i', 'corrente', 'A'), v('L', 'comprimento do fio no campo', 'm'), v('θ', 'ângulo entre fio e B', '°')],
    use: 'Princípio do motor elétrico.',
    calc: { inputs: [i('B', 'campo', 'T', 0.5), i('i', 'corrente', 'A', 10), i('L', 'comprimento', 'm', 0.2), i('θ', 'ângulo', '°', 90)], out: 'F', ou: 'N', fn: ([b, c, l, th]) => b * c * l * Math.sin(rad(th)) } },
  { id: 'b-fio', cat: 'magneto', level: 'M', name: 'Campo magnético de condutores', expr: 'Fio: B = μ₀·i / (2π·d)      Espira: B = μ₀·i / (2R)      Solenoide: B = μ₀·n·i',
    vars: [v('B', 'campo magnético', 'T'), v('μ₀', '4π×10⁻⁷', 'T·m/A'), v('i', 'corrente', 'A'), v('d, R', 'distância / raio', 'm'), v('n', 'espiras por metro', 'm⁻¹')],
    use: 'Corrente elétrica gera campo magnético (Oersted).',
    calc: { inputs: [i('i', 'corrente', 'A', 10), i('d', 'distância ao fio', 'cm', 5, 0.01)], out: 'B (fio reto)', ou: 'μT', od: 1e-6, fn: ([c, d]) => (MU0 * c) / (2 * Math.PI * d) } },
  { id: 'fluxo-mag', cat: 'magneto', level: 'M', name: 'Fluxo magnético', expr: 'Φ = B·A·cosθ',
    vars: [v('Φ', 'fluxo magnético', 'Wb (T·m²)'), v('B', 'campo', 'T'), v('A', 'área', 'm²'), v('θ', 'ângulo entre B e a normal', '°')],
    use: 'Número de linhas de campo que atravessam a superfície.',
    calc: { inputs: [i('B', 'campo', 'T', 0.2), i('A', 'área', 'cm²', 100, 1e-4), i('θ', 'ângulo', '°', 0)], out: 'Φ', ou: 'mWb', od: 1e-3, fn: ([b, a, th]) => b * a * Math.cos(rad(th)) } },
  { id: 'faraday', cat: 'magneto', level: 'M', name: 'Lei de Faraday–Lenz (indução)', expr: 'ε = −ΔΦ / Δt      ε = B·L·v (barra em movimento)',
    vars: [v('ε', 'força eletromotriz induzida', 'V'), v('ΔΦ', 'variação do fluxo', 'Wb'), v('Δt', 'tempo', 's')],
    use: 'O sinal (−) é a lei de Lenz: a corrente induzida se opõe à variação de fluxo que a causou. Base dos geradores e dínamos.',
    calc: { inputs: [i('B', 'campo', 'T', 0.5), i('L', 'comprimento da barra', 'm', 0.4), i('v', 'velocidade', 'm/s', 3)], out: 'ε', ou: 'V', fn: ([b, l, vel]) => b * l * vel } },
  { id: 'trafo', cat: 'magneto', level: 'M', name: 'Transformador ideal', expr: 'U₁ / U₂ = N₁ / N₂ = i₂ / i₁',
    vars: [v('U₁, U₂', 'tensões no primário e secundário', 'V'), v('N₁, N₂', 'espiras', '—'), v('i₁, i₂', 'correntes', 'A')],
    use: 'Só funciona com corrente alternada. P₁ = P₂ (sem perdas).',
    calc: { inputs: [i('U₁', 'tensão primária', 'V', 220), i('N₁', 'espiras primárias', '', 1000), i('N₂', 'espiras secundárias', '', 100)], out: 'U₂', ou: 'V', fn: ([u1, n1, n2]) => (u1 * n2) / n1 } },
  { id: 'maxwell-c', cat: 'magneto', level: 'S', name: 'Velocidade das ondas eletromagnéticas', expr: 'c = 1 / √(μ₀·ε₀) = λ·f',
    vars: [v('c', 'velocidade da luz', 'm/s'), v('μ₀', 'permeabilidade do vácuo', 'T·m/A'), v('ε₀', 'permissividade do vácuo', 'F/m')],
    use: 'Maxwell mostrou que a luz é uma onda eletromagnética. Sol → Terra: ≈ 8 min 20 s.',
    calc: { inputs: [i('μ₀', 'permeabilidade', 'T·m/A', 1.25663706127e-6), i('ε₀', 'permissividade', 'F/m', 8.8541878188e-12)], out: 'c', ou: 'm/s', fn: ([mu, ep]) => 1 / Math.sqrt(mu * ep) } },

  // ======================= FÍSICA MODERNA =======================
  { id: 'emc2', cat: 'moderna', level: 'M', name: 'Equivalência massa–energia', expr: 'E = m·c²',
    vars: [v('E', 'energia', 'J'), v('m', 'massa', 'kg'), v('c', 'velocidade da luz', 'm/s')],
    use: 'O Sol converte ≈ 4 milhões de toneladas de massa em energia por segundo.',
    calc: { inputs: [i('m', 'massa', 'g', 1, 1e-3)], out: 'E', ou: 'J', fn: ([m]) => m * C * C } },
  { id: 'gama', cat: 'moderna', level: 'M', name: 'Dilatação do tempo (relatividade restrita)', expr: 'Δt = γ·Δt₀      γ = 1 / √(1 − v²/c²)',
    vars: [v('Δt', 'tempo medido por quem vê o corpo em movimento', 's'), v('Δt₀', 'tempo próprio', 's'), v('γ', 'fator de Lorentz', '—'), v('v', 'velocidade', 'm/s')],
    use: 'Relógios em movimento andam mais devagar. Contração do comprimento: L = L₀ / γ.',
    calc: { inputs: [i('v', 'velocidade (fração de c)', '×c', 0.8, C)], out: 'γ', ou: '', fn: ([vel]) => 1 / Math.sqrt(1 - (vel * vel) / (C * C)) } },
  { id: 'foton', cat: 'moderna', level: 'M', name: 'Energia do fóton', expr: 'E = h·f = h·c / λ',
    vars: [v('E', 'energia do fóton', 'J ou eV'), v('h', '6,626×10⁻³⁴', 'J·s'), v('f', 'frequência', 'Hz'), v('λ', 'comprimento de onda', 'm')],
    use: 'A luz se comporta como partículas (fótons) com energia quantizada. 1 eV = 1,602×10⁻¹⁹ J.',
    calc: { inputs: [i('λ', 'comprimento de onda', 'nm', 500, 1e-9)], out: 'E', ou: 'eV', od: E_CH, fn: ([l]) => (H * C) / l } },
  { id: 'fotoeletrico', cat: 'moderna', level: 'M', name: 'Efeito fotoelétrico (Einstein)', expr: 'E_c,máx = h·f − φ',
    vars: [v('E_c,máx', 'energia cinética máxima dos elétrons', 'J'), v('φ', 'função trabalho do metal', 'J ou eV')],
    use: 'Só há emissão se h·f ≥ φ, independentemente da intensidade da luz.',
    calc: { inputs: [i('λ', 'comprimento de onda', 'nm', 250, 1e-9), i('φ', 'função trabalho', 'eV', 4.3, E_CH)], out: 'E_c,máx', ou: 'eV', od: E_CH, fn: ([l, phi]) => Math.max(0, (H * C) / l - phi) } },
  { id: 'broglie', cat: 'moderna', level: 'S', name: 'Comprimento de onda de de Broglie', expr: 'λ = h / (m·v) = h / p',
    vars: [v('λ', 'comprimento de onda associado', 'm'), v('h', 'constante de Planck', 'J·s'), v('p', 'momento linear', 'kg·m/s')],
    use: 'Toda matéria tem caráter ondulatório (dualidade onda–partícula).',
    calc: { inputs: [i('m', 'massa', 'kg', 9.109e-31), i('v', 'velocidade', 'm/s', 1e6)], out: 'λ', ou: 'nm', od: 1e-9, fn: ([m, vel]) => H / (m * vel) } },
  { id: 'incerteza', cat: 'moderna', level: 'S', name: 'Princípio da incerteza de Heisenberg', expr: 'Δx·Δp ≥ ħ / 2      ħ = h / 2π',
    vars: [v('Δx', 'incerteza na posição', 'm'), v('Δp', 'incerteza no momento', 'kg·m/s')],
    use: 'Não é falha de medição: é uma propriedade fundamental da natureza.' },
  { id: 'bohr', cat: 'moderna', level: 'S', name: 'Níveis de energia do hidrogênio (Bohr)', expr: 'Eₙ = −13,6 eV / n²',
    vars: [v('Eₙ', 'energia do nível n', 'eV'), v('n', 'número quântico principal (1, 2, 3…)', '—')],
    use: 'Um fóton emitido na transição n → m tem energia E = Eₙ − Eₘ.',
    calc: { inputs: [i('n', 'nível', '', 2)], out: 'Eₙ', ou: 'eV', fn: ([n]) => -13.6 / (n * n) } },
  { id: 'decaimento', cat: 'moderna', level: 'M', name: 'Decaimento radioativo e meia-vida', expr: 'N = N₀·(½)^(t / t½) = N₀·e^(−λ·t)      λ = ln 2 / t½',
    vars: [v('N', 'núcleos restantes', '—'), v('N₀', 'núcleos iniciais', '—'), v('t½', 'meia-vida', 's'), v('λ', 'constante de decaimento', 's⁻¹')],
    use: 'A cada meia-vida, metade dos núcleos radioativos se desintegra. Carbono-14: t½ ≈ 5 730 anos.',
    calc: { inputs: [i('N₀', 'núcleos iniciais', '', 1000), i('t', 'tempo', 'anos', 11460), i('t½', 'meia-vida', 'anos', 5730)], out: 'N', ou: '', fn: ([n0, t, th]) => n0 * Math.pow(0.5, t / th) } },
  { id: 'defeito', cat: 'moderna', level: 'S', name: 'Energia de ligação nuclear', expr: 'E_lig = Δm·c²',
    vars: [v('E_lig', 'energia de ligação', 'J ou MeV'), v('Δm', 'defeito de massa', 'kg')],
    use: '1 u·c² ≈ 931,5 MeV. Fusão (Sol) e fissão (usinas) liberam energia por esse mesmo princípio.',
    calc: { inputs: [i('Δm', 'defeito de massa', 'u', 0.0304, 1.66053906892e-27)], out: 'E_lig', ou: 'MeV', od: E_CH * 1e6, fn: ([dm]) => dm * C * C } },
]

// ---------- utilidades ----------
const sup: Record<string, string> = { '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴', '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹', '-': '⁻' }

/** Formata o resultado em pt-BR; usa notação científica (a × 10ⁿ) para valores muito grandes ou pequenos. */
export function formatResult(x: number): string {
  if (!Number.isFinite(x)) return '—'
  if (x === 0) return '0'
  const abs = Math.abs(x)
  if (abs >= 1e6 || abs < 1e-3) {
    const [m, e] = x.toExponential(4).split('e')
    const mant = Number(m).toLocaleString('pt-BR', { maximumFractionDigits: 4 })
    const exp = String(Number(e)).split('').map((ch) => sup[ch] ?? ch).join('')
    return `${mant} × 10${exp}`
  }
  return x.toLocaleString('pt-BR', { maximumSignificantDigits: 6 })
}

/** Executa a calculadora com os textos digitados (já na unidade exibida). Retorna null se algo for inválido. */
export function runCalc(calc: Calc, raw: string[]): number | null {
  const values = calc.inputs.map((inp, idx) => {
    const n = Number(String(raw[idx] ?? '').replace(',', '.'))
    return Number.isFinite(n) && String(raw[idx] ?? '').trim() !== '' ? n * (inp.k ?? 1) : NaN
  })
  if (values.some((n) => Number.isNaN(n))) return null
  const result = calc.fn(values) / (calc.od ?? 1)
  return Number.isFinite(result) ? result : null
}

/** Valor inicial de cada campo, opcionalmente usando os dados do planeta indicado. */
export function defaultInputs(calc: Calc, planetName?: string): string[] {
  const phys = planetName ? planetPhysics[planetName] : undefined
  return calc.inputs.map((inp) => {
    let value = inp.d
    if (phys && inp.p) {
      const si = inp.p === 'mass' ? phys.mass : inp.p === 'radius' ? phys.radius : phys.axis * AU
      value = si / (inp.k ?? 1)
    }
    return String(Number(value.toPrecision(6)))
  })
}

/** O planeta preenche algum campo desta calculadora? */
export const usesPlanet = (calc: Calc) => calc.inputs.some((inp) => inp.p)
