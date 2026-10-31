// Simulador de Partidos — modelo simplificado e editável.
// As "alavancas" (0 a 1) são uma interpretação aproximada de planos e declarações públicas.
const LEV = {
  tax: 'Taxação dos ricos', state: 'Tamanho do Estado', priv: 'Privatização',
  wage: 'Pressão salarial', guns: 'Flexibilização de armas', police: 'Policiamento e punição',
  social: 'Gasto social', labor: 'Proteção trabalhista', open: 'Abertura / livre mercado',
  civil: 'Agenda de direitos civis', calote: 'Reestruturação da dívida', index: 'Indexação salarial'
};
const PARTIES = [
  { id: 'PT', cor: '#d62828',
    p: { tax: .6, state: .7, priv: .15, wage: .5, guns: .1, police: .45, social: .8, labor: .75, open: .5, civil: .8, calote: 0, index: 0 },
    txt: 'Plano registrado no TSE: jornada de 40h, novo Ministério da Segurança Pública, educação integral e manutenção do arcabouço fiscal. Histórico de ênfase em crédito, obras e programas sociais.',
    src: 'https://congressoemfoco.com.br/noticia/121121/pt-registra-novo-plano-de-governo-de-lula-no-tse-veja-a-integra' },
  { id: 'PL', cor: '#1d4ed8',
    p: { tax: .15, state: .3, priv: .75, wage: .2, guns: .9, police: .85, social: .35, labor: .3, open: .75, civil: .2, calote: 0, index: 0 },
    txt: 'Programas do campo bolsonarista: desestatização, liberdade econômica, previdência por capitalização, acesso a armas como política de segurança e penas mais duras. Valores tradicionais como eixo.',
    src: 'https://www.poder360.com.br/eleicoes/leia-os-principais-pontos-do-plano-de-governo-de-bolsonaro/' },
  { id: 'PCO', cor: '#7f1d1d',
    p: { tax: .9, state: .95, priv: 0, wage: 1, guns: .5, police: .2, social: .9, labor: 1, open: .1, civil: .5, calote: .8, index: 1 },
    txt: 'Programa 2026: salário mínimo de R$ 7.500, escala móvel (reajuste a cada 3% de inflação), 35h semanais, estatização do sistema financeiro, cancelamento de dívidas, reforma agrária e fim das privatizações.',
    src: 'https://www.dgabc.com.br/Noticia/4347909/rui-costa-pimenta-quer-ampliar-direitos-trabalhistas-e-verbas-da-saude' },
  { id: 'PSOL', cor: '#f59e0b',
    p: { tax: .85, state: .8, priv: .05, wage: .5, guns: .05, police: .25, social: .9, labor: .8, open: .3, civil: .95, calote: .4, index: 0 },
    txt: 'Taxação de grandes fortunas, auditoria da dívida pública, saúde pública com gestão direta, renda básica, segurança cidadã com desmilitarização, política de drogas como saúde pública e agenda de direitos sexuais e LGBT.',
    src: 'https://www.congressoemfoco.com.br/noticia/77056/todas-as-propostas-dos-presidenciaveis' },
  { id: 'NOVO', cor: '#ea580c',
    p: { tax: .1, state: .15, priv: .95, wage: .1, guns: .5, police: .55, social: .3, labor: .2, open: .95, civil: .5, calote: 0, index: 0 },
    txt: 'Estado mínimo focado em saúde, educação e segurança, privatização de estatais (inclusive Petrobras), reforma tributária sem aumento de carga, desburocratização e flexibilização trabalhista.',
    src: 'https://www.brasildefato.com.br/2022/07/30/partido-novo-lanca-felipe-d-avila-a-presidencia-neste-sabado-30-o-que-pensa-e-quem-e-ele' },
  { id: 'PSDB', cor: '#0891b2',
    p: { tax: .45, state: .45, priv: .5, wage: .3, guns: .3, police: .5, social: .55, labor: .45, open: .7, civil: .6, calote: 0, index: 0 },
    txt: 'Manifesto de 2018: Estado "nem máximo nem mínimo", mas eficiente; reforma tributária que simplifica e tem progressividade; abertura para privatizações; corte de privilégios.',
    src: 'https://cartacapital.com.br/politica/em-documento-psdb-prega-estado-nem-maximo-nem-minimo' }
];
const N = 32; // trimestres = 8 anos
const cl = (x, a, b) => Math.max(a, Math.min(b, x));
function rng(a) { return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
// Choques externos IGUAIS para todos os partidos (mesma semente).
function shocks(seed) {
  const r = rng(seed), z = () => Math.sqrt(-2 * Math.log(r() + 1e-9)) * Math.cos(6.283 * r()), s = [];
  for (let t = 0; t < N; t++) s.push({ g: .35 * z(), i: .6 * z() });
  s[6].g -= 1.8; s[7].g -= .8; s[20].g -= 1; s[20].i += 2.5;
  return s;
}
function sim(p, A, sh) {
  let gdp = 100, u = 10, crime = 100, debt = 70, inf = 4, conf = 1, rights = 50; const H = [];
  for (let t = 0; t < N; t++) {
    const spend = .15 + .12 * p.state + .05 * p.social + .03 * p.police;
    const rev = (.17 + .14 * p.tax) * (1 - .3 * A.lf * p.tax * p.tax);
    const ds = Math.max(0, (debt - 100) / 80);
    const imp = A.mult * ((p.state - .45) * .6 + (p.social - .45) * .5 + (p.wage - .3) * .3);
    const ct = 1 + .3 * (p.open - .5) + .25 * (p.priv - .5) * (t < 16 ? 1 : .4) - A.lf * .5 * (p.tax - .3) - .5 * p.calote - .4 * ds - .25 * Math.max(0, inf - 8) / 8;
    conf += (ct - conf) * .15;
    const g = .45 + 1.1 * (conf - 1) + .5 * imp - .8 * ds - .06 * Math.max(0, inf - 6) + sh[t].g;
    gdp *= 1 + g / 100;
    debt = (debt + 25 * (spend - rev) + debt * .01) / (1 + g / 100);
    if (t < 8) { debt -= p.priv * 5 / 8; debt *= 1 - .025 * p.calote; }
    let it = 3.5 + 7 * Math.max(0, imp) + 6 * p.wage * p.wage + 5 * ds + 4 * p.calote - 2 * Math.max(0, -imp) + sh[t].i;
    it *= 1 + .5 * p.index; inf = Math.max(1, inf + (it - inf) * .2);
    const us = 8.5 + 2.5 * (p.labor - .5) + 4 * Math.max(0, p.wage - .45) - 2 * (p.state - .45) - 1.5 * (p.open - .5) + .5 * Math.max(0, inf - 8);
    u = cl(u + (us - u) * .12 - .8 * (g - .45), 3, 25);
    const d = -1.2 * (p.police - .4) - (p.social - .4) * (t > 6 ? 1 : .3) + .08 * (u - 10) - A.guns * (p.guns - .3) + .15;
    crime *= 1 + d / 100;
    const rt = 100 * (.35 * p.social + .25 * p.labor + .2 * p.civil + .2 * (.5 * p.open + .5 * (1 - p.tax))) * (1 - .5 * ds);
    rights += (rt - rights) * .08;
    H.push({ gdp, u, crime, debt, inf, rights });
  }
  return H;
}
function score(h, W) {
  const f = h[h.length - 1];
  const eco = cl(50 + (f.gdp - 115) * 1.5 - Math.max(0, f.debt - 70) * .5 - Math.max(0, f.inf - 6) * 2, 0, 100);
  const job = cl(100 - (f.u - 4) * 8, 0, 100), sec = cl(150 - f.crime, 0, 100), dir = cl(f.rights, 0, 100);
  const tw = W.eco + W.job + W.sec + W.dir || 1;
  return { eco, job, sec, dir, total: (eco * W.eco + job * W.job + sec * W.sec + dir * W.dir) / tw };
}
if (typeof module !== 'undefined') module.exports = { PARTIES, shocks, sim, score };

// ---------- Interface ----------
if (typeof document !== 'undefined') {
  const $ = id => document.getElementById(id);
  const SL = [
    ['wEco', 'Peso: Economia', 1, 0, 3, 'w'], ['wJob', 'Peso: Empregos', 1, 0, 3, 'w'], ['wSec', 'Peso: Segurança', 1, 0, 3, 'w'], ['wDir', 'Peso: Direitos', 1, 0, 3, 'w'],
    ['aMult', 'Efeito do gasto público no crescimento', 1, .3, 1.7, 'a'], ['aLf', 'Sensibilidade do investimento a impostos', .5, 0, 1, 'a'],
    ['aGuns', 'Efeito de mais armas sobre o crime (-1 piora, +1 reduz)', 0, -1, 1, 'a']
  ];
  $('ctl').innerHTML = SL.map(s => `<label>${s[1]}: <b id="v_${s[0]}">${s[2]}</b><input type="range" id="${s[0]}" min="${s[4]}" max="${s[5] === 'w' ? s[4] + 3 : s[4]}" step="0.1" value="${s[2]}"></label>`).join('');
  SL.forEach(s => { const e = $(s[0]); e.min = s[3]; e.max = s[4]; e.oninput = () => { $('v_' + s[0]).textContent = e.value; }; });
  $('cards').innerHTML = PARTIES.map(P => `<article class="card" style="--c:${P.cor}"><h3>${P.id}</h3><p>${P.txt}</p><div class="lv">${Object.keys(LEV).map(k => `<span title="${LEV[k]}: ${P.p[k]}">${LEV[k]}<i><b style="width:${P.p[k] * 100}%"></b></i></span>`).join('')}</div><a href="${P.src}" target="_blank" rel="noopener">fonte</a></article>`).join('');
  let R = [];
  function run() {
    const A = { mult: +$('aMult').value, lf: +$('aLf').value, guns: +$('aGuns').value };
    const W = { eco: +$('wEco').value, job: +$('wJob').value, sec: +$('wSec').value, dir: +$('wDir').value };
    const sh = shocks(+$('seed').value || 1);
    R = PARTIES.map(P => { const h = sim(P.p, A, sh); return { P, h, s: score(h, W) }; }).sort((a, b) => b.s.total - a.s.total);
    $('rank').innerHTML = '<tr><th>#</th><th>Partido</th><th>Nota final</th><th>Economia</th><th>Empregos</th><th>Segurança</th><th>Direitos</th><th>PIB</th><th>Desemp.</th><th>Dívida</th><th>Inflação</th></tr>' +
      R.map((r, i) => { const f = r.h[N - 1]; return `<tr><td>${i + 1}</td><td style="color:${r.P.cor}"><b>${r.P.id}</b></td><td><b>${r.s.total.toFixed(0)}</b></td><td>${r.s.eco.toFixed(0)}</td><td>${r.s.job.toFixed(0)}</td><td>${r.s.sec.toFixed(0)}</td><td>${r.s.dir.toFixed(0)}</td><td>${f.gdp.toFixed(0)}</td><td>${f.u.toFixed(1)}%</td><td>${f.debt.toFixed(0)}%</td><td>${f.inf.toFixed(1)}%</td></tr>`; }).join('');
    draw();
  }
  function draw() {
    const k = $('metric').value, c = $('chart'), x = c.getContext('2d'), w = c.width, hh = c.height;
    const css = getComputedStyle(document.body), fg = css.color;
    x.clearRect(0, 0, w, hh);
    const all = R.flatMap(r => r.h.map(q => q[k])), mn = Math.min(...all), mx = Math.max(...all), pad = 36;
    x.strokeStyle = fg; x.globalAlpha = .25; x.strokeRect(pad, 10, w - pad - 10, hh - 30); x.globalAlpha = 1; x.fillStyle = fg; x.font = '11px sans-serif';
    x.fillText(mx.toFixed(0), 2, 20); x.fillText(mn.toFixed(0), 2, hh - 22); x.fillText('ano 0', pad, hh - 6); x.fillText('ano 8', w - 42, hh - 6);
    R.forEach(r => { x.strokeStyle = r.P.cor; x.lineWidth = 2; x.beginPath(); r.h.forEach((q, t) => { const px = pad + (w - pad - 10) * t / (N - 1), py = 10 + (hh - 30) * (1 - (q[k] - mn) / (mx - mn || 1)); t ? x.lineTo(px, py) : x.moveTo(px, py); }); x.stroke(); });
    $('leg').innerHTML = R.map(r => `<span style="color:${r.P.cor}">■ ${r.P.id}</span>`).join(' ');
  }
  $('go').onclick = run; $('metric').onchange = draw; run();
}
