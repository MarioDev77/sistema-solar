/* Rodar: npx tsx components/solar/hand/__tests__/planet-spin.selftest.ts  (física do giro do planeta) */
import { PlanetOverrides } from '../planet-overrides'

let fails = 0
const check = (n: string, ok: boolean, x = '') => { console.log(`${ok ? '  ok ' : ' FAIL'}  ${n}${x ? ' — ' + x : ''}`); if (!ok) fails++ }
const o = new PlanetOverrides()
const run = (sec: number) => { for (let i = 0; i < sec * 60; i++) o.stepSpin(1 / 60) }

o.setSpin('Terra', 3, true); run(1)
check('com a mão girando, a velocidade sobe até perto da desejada', o.spinSpeed('Terra') > 2.8, o.spinSpeed('Terra').toFixed(2))
o.setSpin('Terra', 6, true); run(1)
check('acelerar o gesto acelera o giro', o.spinSpeed('Terra') > 5.5)
const a1 = o.spinAngle('Terra')
o.setSpin('Terra', 0, false); run(1)
check('ao soltar, mantém inércia (não para de repente)', o.spinSpeed('Terra') > 1.5, o.spinSpeed('Terra').toFixed(2))
run(8)
check('a inércia acaba parando sozinha', o.spinSpeed('Terra') === 0)
check('o ângulo acumulado é preservado depois de parar', o.spinAngle('Terra') > a1)
o.setSpin('Marte', -4, true); run(1)
check('sentido anti-horário gira para o lado oposto', o.spinSpeed('Marte') < -3.5 && o.spinAngle('Marte') < 0)
o.restoreAll(); run(10)
check('restaurar tudo também freia o giro', o.spinSpeed('Marte') === 0)
console.log(fails === 0 ? '\nTudo certo.' : `\n${fails} falha(s).`); process.exit(fails ? 1 : 0)
