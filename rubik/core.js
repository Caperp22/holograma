// Lógica del cubo Rubik 3x3: modelo de 54 stickers + guía por el método para principiantes.
// Orientación fija: amarillo arriba (U), blanco abajo (D), verde al frente (F).

export const FACES = ['U', 'R', 'F', 'D', 'L', 'B'];
export const NORM = { U: [0, 1, 0], R: [1, 0, 0], F: [0, 0, 1], D: [0, -1, 0], L: [-1, 0, 0], B: [0, 0, -1] };
export const COLOR_NAMES = ['amarillo', 'naranja', 'verde', 'blanco', 'rojo', 'azul'];
const U = 0, R = 1, F = 2, D = 3, L = 4, B = 5;

const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const key = (p, n) => p.join(',') + '|' + n.join(',');

export const SLOTS = [];
const IDX = {};
FACES.forEach((f, fi) => {
  const n = NORM[f], ax = n.findIndex(v => v !== 0), o = [0, 1, 2].filter(i => i !== ax);
  for (const a of [-1, 0, 1]) for (const b of [-1, 0, 1]) {
    const p = [0, 0, 0]; p[ax] = n[ax]; p[o[0]] = a; p[o[1]] = b;
    IDX[key(p, n)] = SLOTS.length; SLOTS.push({ p, n, face: fi });
  }
});
export const SOLVED = SLOTS.map(s => s.face);

// giro horario visto desde la cara: -90° alrededor de su normal
function rotCW(v, n) { const c = cross(n, v), d = dot(n, v); return [-c[0] + n[0] * d, -c[1] + n[1] * d, -c[2] + n[2] * d]; }

export const MOVES = {};
for (const f of FACES) {
  const n = NORM[f];
  const P = SLOTS.map((s, i) => dot(s.p, n) === 1 ? IDX[key(rotCW(s.p, n), rotCW(s.n, n))] : i);
  const P2 = P.map(i => P[i]), P3 = P2.map(i => P[i]);
  MOVES[f] = P; MOVES[f + '2'] = P2; MOVES[f + "'"] = P3;
}
export const MOVE_LIST = Object.keys(MOVES);

export function apply(s, m) { const P = MOVES[m], o = new Array(54); for (let i = 0; i < 54; i++) o[P[i]] = s[i]; return o; }
export function applySeq(s, seq) { for (const m of seq) s = apply(s, m); return s; }
export function inverse(m) { return m.endsWith('2') ? m : m.endsWith("'") ? m[0] : m + "'"; }
export function parse(str) { return str.trim().split(/\s+/).filter(Boolean); }
export function scramble(n = 25) {
  const out = []; let last = '';
  while (out.length < n) { const f = FACES[Math.random() * 6 | 0]; if (f === last) continue; last = f; out.push(f + ['', "'", '2'][Math.random() * 3 | 0]); }
  return out;
}

/* ---------- piezas ---------- */
const slotsAt = {};
SLOTS.forEach((s, i) => { const k = s.p.join(','); (slotsAt[k] = slotsAt[k] || []).push(i); });
function findPiece(s, cols) {
  for (const k in slotsAt) { const sl = slotsAt[k]; if (sl.length !== cols.length) continue; const cs = sl.map(i => s[i]); if (cols.every(c => cs.includes(c))) return { p: SLOTS[sl[0]].p, slots: sl }; }
  return null;
}
const solvedAt = (s, p) => slotsAt[p.join(',')].every(i => s[i] === SLOTS[i].face);
const faceAtSlot = (p, n) => IDX[key(p, n)];
const fx = x => x > 0 ? R : L, fz = z => z > 0 ? F : B;
const RIGHT = { [F]: R, [R]: B, [B]: L, [L]: F }, LEFT = { [F]: L, [L]: B, [B]: R, [R]: F }, BACK = { [F]: B, [B]: F, [R]: L, [L]: R };
function frontOf(x, z) { return x > 0 ? (z > 0 ? F : R) : (z > 0 ? L : B); }
function conj(alg, front) {
  const map = { F: FACES[front], R: FACES[RIGHT[front]], L: FACES[LEFT[front]], B: FACES[BACK[front]], U: 'U', D: 'D' };
  return parse(alg).map(m => map[m[0]] + m.slice(1));
}
const uTurns = k => [[], ['U'], ['U2'], ["U'"]][((k % 4) + 4) % 4];
const cname = c => COLOR_NAMES[c];

/* ---------- metas de cada etapa ---------- */
const H = [[1, 1], [1, -1], [-1, -1], [-1, 1]];
const DEDGES = [[0, -1, 1], [1, -1, 0], [0, -1, -1], [-1, -1, 0]];
const MEDGES = H.map(([x, z]) => [x, 0, z]);
const UEDGES = [[0, 1, 1], [1, 1, 0], [0, 1, -1], [-1, 1, 0]];
const goals = [
  s => DEDGES.every(p => solvedAt(s, p)),
  s => H.every(([x, z]) => solvedAt(s, [x, -1, z])),
  s => MEDGES.every(p => solvedAt(s, p)),
  s => UEDGES.every(p => s[faceAtSlot(p, NORM.U)] === U),
  s => UEDGES.every(p => solvedAt(s, p)),
  s => H.every(([x, z]) => { const p = [x, 1, z], want = [U, fx(x), fz(z)]; const cs = slotsAt[p.join(',')].map(i => s[i]); return want.every(c => cs.includes(c)); }),
  s => s.every((c, i) => c === SLOTS[i].face),
];
export function stageDone(s, k) { for (let i = 0; i < k; i++) if (!goals[i](s)) return false; return true; }
export function currentStage(s) { for (let i = 0; i < 7; i++) if (!goals[i](s)) return i + 1; return 8; }

export const STAGES = [
  { name: 'Cruz blanca', goal: 'Forma una cruz blanca abajo. Cada arista debe coincidir también con el color del centro de su lado.' },
  { name: 'Esquinas blancas', goal: 'Completa la cara blanca de abajo con sus 4 esquinas, cada una alineada con los centros de sus lados.' },
  { name: 'Segunda capa', goal: 'Coloca las 4 aristas de la capa del medio (las que no tienen amarillo).' },
  { name: 'Cruz amarilla', goal: 'Forma una cruz amarilla arriba. No importa aún si los lados coinciden.' },
  { name: 'Aristas amarillas', goal: 'Pon cada arista de arriba bajo el centro de su color.' },
  { name: 'Ubicar esquinas', goal: 'Lleva cada esquina de arriba a su lugar, aunque todavía esté girada.' },
  { name: 'Orientar esquinas', goal: 'Gira las esquinas de arriba hasta que todo el cubo quede armado.' },
];

/* ---------- etapa 1: cruz (búsqueda IDA* arista por arista) ---------- */
const OPP = { U: 'D', D: 'U', R: 'L', L: 'R', F: 'B', B: 'F' };
const distCache = {};
function distTo(t) {
  if (distCache[t]) return distCache[t];
  const d = new Array(54).fill(99); d[t] = 0; let q = [t];
  while (q.length) { const nq = []; for (const x of q) for (const m of MOVE_LIST) { const y = MOVES[m][x]; if (d[y] > d[x] + 1) { d[y] = d[x] + 1; nq.push(y); } } q = nq; }
  return distCache[t] = d;
}
function ida(locs, targets, maxD = 9) {
  const tabs = targets.map(distTo), path = [];
  const h = l => { let m = 0; for (let i = 0; i < l.length; i++) { const v = tabs[i][l[i]]; if (v > m) m = v; } return m; };
  function dfs(l, g, bound, last) {
    const hh = h(l); if (hh === 0) return true; if (g + hh > bound) return false;
    for (const m of MOVE_LIST) {
      const f = m[0]; if (last && (f === last || (OPP[f] === last && f < last))) continue;
      const P = MOVES[m]; path.push(m);
      if (dfs(l.map(x => P[x]), g + 1, bound, f)) return true;
      path.pop();
    }
    return false;
  }
  for (let b = h(locs); b <= maxD; b++) if (dfs(locs, 0, b, null)) return path.slice();
  return null;
}
function whiteSlot(s, p) { return slotsAt[p.join(',')].find(i => s[i] === D); }
function solveCross(s) {
  const groups = [];
  for (let guard = 0; guard < 4 && !goals[0](s); guard++) {
    const placed = DEDGES.filter(p => solvedAt(s, p));
    let best = null;
    for (const p of DEDGES) {
      if (solvedAt(s, p)) continue;
      const side = p[0] ? fx(p[0]) : fz(p[2]);
      const pc = findPiece(s, [D, side]);
      const set = [...placed, p];
      const locs = set.map(q => { const sd = q[0] ? fx(q[0]) : fz(q[2]); return whiteSlot(s, findPiece(s, [D, sd]).p); });
      const tg = set.map(q => faceAtSlot(q, NORM.D));
      const sol = ida(locs, tg);
      if (sol && (!best || sol.length < best.sol.length)) best = { sol, side, pc };
    }
    s = applySeq(s, best.sol);
    groups.push({ stage: 1, title: `Arista blanco-${cname(best.side)}`, text: `Lleva la arista blanca y ${cname(best.side)} abajo, justo debajo del centro ${cname(best.side)}, sin desarmar las que ya pusiste.`, moves: best.sol });
  }
  return { s, groups };
}

/* ---------- etapa 2: esquinas blancas ---------- */
function solveCorners(s) {
  const groups = [];
  for (const [x, z] of H) {
    const target = [x, -1, z]; if (solvedAt(s, target)) continue;
    const cols = [D, fx(x), fz(z)], nm = `blanco-${cname(fx(x))}-${cname(fz(z))}`;
    const Y = FACES[RIGHT[frontOf(x, z)]], sexy = [Y, 'U', Y + "'", "U'"];
    let pc = findPiece(s, cols);
    if (pc.p[1] === -1) {
      const Y2 = FACES[RIGHT[frontOf(pc.p[0], pc.p[2])]], pop = [Y2, 'U', Y2 + "'", "U'"];
      s = applySeq(s, pop);
      groups.push({ stage: 2, title: `Sacar la esquina ${nm}`, text: `La esquina ${nm} está abajo pero en mal sitio o girada. Súbela con ${pop.join(' ')}.`, moves: pop });
      pc = findPiece(s, cols);
    }
    let k = 0; while (!(pc.p[0] === x && pc.p[2] === z) && k < 4) { s = apply(s, 'U'); k++; pc = findPiece(s, cols); }
    if (k % 4) groups.push({ stage: 2, title: `Esquina ${nm}`, text: `Gira la capa de arriba hasta dejar la esquina ${nm} justo encima de su lugar.`, moves: uTurns(k) });
    let reps = 0; const mv = [];
    while (!solvedAt(s, target) && reps < 6) { s = applySeq(s, sexy); mv.push(...sexy); reps++; }
    groups.push({ stage: 2, title: `Bajar la esquina ${nm}`, text: `Repite ${sexy.join(' ')} hasta que la esquina quede en su sitio con el blanco abajo (${reps} ${reps > 1 ? 'veces' : 'vez'}).`, moves: mv });
  }
  return { s, groups };
}

/* ---------- etapa 3: segunda capa ---------- */
const RIGHT_ALG = "U R U' R' U' F' U F", LEFT_ALG = "U' L' U L U F U' F'";
function solveMiddle(s) {
  const groups = [];
  for (const p of MEDGES) {
    if (solvedAt(s, p)) continue;
    const cols = [fx(p[0]), fz(p[2])], nm = `${cname(cols[0])}-${cname(cols[1])}`;
    let pc = findPiece(s, cols);
    if (pc.p[1] === 0) {
      const alg = conj(RIGHT_ALG, frontOf(pc.p[0], pc.p[2])); s = applySeq(s, alg);
      groups.push({ stage: 3, title: `Sacar la arista ${nm}`, text: `La arista ${nm} está en la capa del medio pero mal puesta. Sácala hacia arriba con ${alg.join(' ')}.`, moves: alg });
    }
    let k = 0, side, top;
    for (; k < 4; k++) {
      pc = findPiece(s, cols);
      side = pc.slots.find(i => SLOTS[i].n[1] === 0); top = pc.slots.find(i => SLOTS[i].n[1] === 1);
      if (SLOTS[side].face === s[side]) break;
      s = apply(s, 'U');
    }
    const front = s[side], toRight = s[top] === RIGHT[front];
    if (k % 4) groups.push({ stage: 3, title: `Arista ${nm}`, text: `Gira arriba hasta que la arista ${nm} forme una T con el centro ${cname(front)} (su color de lado coincide con ese centro).`, moves: uTurns(k) });
    const alg = conj(toRight ? RIGHT_ALG : LEFT_ALG, front); s = applySeq(s, alg);
    groups.push({ stage: 3, title: `Bajar la arista ${nm}`, text: `Mirando la cara ${cname(front)}, baja la arista hacia la ${toRight ? 'derecha' : 'izquierda'} con ${alg.join(' ')}.`, moves: alg });
  }
  return { s, groups };
}

/* ---------- etapas 4-6: combinaciones de algoritmos (búsqueda corta) ---------- */
function macroSearch(s, macros, goal, maxDepth) {
  if (goal(s)) return [];
  let fr = [{ s, path: [] }];
  for (let d = 1; d <= maxDepth; d++) {
    const nf = [];
    for (const nd of fr) for (const mc of macros) {
      const last = nd.path[nd.path.length - 1];
      if (last && last.u && mc.u) continue;
      const s2 = applySeq(nd.s, mc.moves), path = nd.path.concat([mc]);
      if (goal(s2)) return path;
      nf.push({ s: s2, path });
    }
    fr = nf;
  }
  return null;
}
const uMacros = (stage, text) => [1, 2, 3].map(k => ({ u: true, moves: uTurns(k), stage, title: 'Ajustar arriba', text }));
function algMacros(stage, alg, title, text) {
  return [F, R, B, L].map(f => { const mv = conj(alg, f); return { moves: mv, stage, title, text: text.replace('{alg}', mv.join(' ')).replace('{cara}', cname(f)) }; });
}
function solveByMacros(s, stage, macros, depth) {
  const path = macroSearch(s, macros, st => stageDone(st, stage), depth);
  if (!path) throw new Error('sin solución en etapa ' + stage);
  const groups = path.map(m => ({ stage: m.stage, title: m.title, text: m.text, moves: m.moves }));
  return { s: applySeq(s, groups.flatMap(g => g.moves)), groups };
}
const stageMacros = {
  4: [...uMacros(4, 'Gira la capa de arriba para dejar la figura amarilla en la posición correcta: la L arriba a la izquierda, o la línea horizontal.'),
      ...algMacros(4, "F R U R' U' F'", 'Algoritmo de la cruz', 'Con la cara {cara} al frente, aplica {alg}. La figura amarilla avanza: punto → L → línea → cruz.')],
  5: [...uMacros(5, 'Gira arriba hasta que coincidan con su centro la mayor cantidad posible de aristas amarillas.'),
      ...algMacros(5, "R U R' U R U2 R' U", 'Intercambiar aristas', 'Con la cara {cara} al frente, aplica {alg}. Intercambia las aristas de arriba de la cara de frente y la de la izquierda.')],
  6: [...uMacros(6, 'Gira arriba para alinear.'),
      ...algMacros(6, "U R U' L' U R' U' L", 'Mover esquinas', 'Con la cara {cara} al frente, aplica {alg}. La esquina de frente-derecha se queda quieta y las otras tres rotan de lugar.')],
};

/* ---------- etapa 7: orientar esquinas ---------- */
function solveOrient(s) {
  const groups = [], ufr = faceAtSlot([1, 1, 1], NORM.U);
  const allUp = st => H.every(([x, z]) => st[faceAtSlot([x, 1, z], NORM.U)] === U);
  for (let i = 0; i < 4 && !allUp(s); i++) {
    let k = 0; while (s[ufr] === U && k < 4) { s = apply(s, 'U'); k++; }
    if (k % 4) groups.push({ stage: 7, title: 'Siguiente esquina', text: 'Gira SOLO la capa de arriba para llevar a la posición frente-derecha-arriba una esquina que aún no tenga el amarillo arriba.', moves: uTurns(k) });
    const mv = []; let r = 0;
    while (s[ufr] !== U && r < 6) { const a = ["R'", "D'", 'R', 'D']; s = applySeq(s, a); mv.push(...a); r++; }
    groups.push({ stage: 7, title: 'Girar esquina', text: `Repite R' D' R D hasta que el amarillo de esa esquina quede arriba (${r} veces). Tranquilo: la parte de abajo se desarma un rato y se arregla sola al final.`, moves: mv });
  }
  let k = 0; while (!goals[6](s) && k < 4) { s = apply(s, 'U'); k++; }
  if (k % 4) groups.push({ stage: 7, title: 'Último giro', text: 'Gira la capa de arriba y el cubo queda armado.', moves: uTurns(k) });
  return { s, groups };
}

/* ---------- plan ---------- */
export function solveStage(s, stage) {
  if (stage === 1) return solveCross(s);
  if (stage === 2) return solveCorners(s);
  if (stage === 3) return solveMiddle(s);
  if (stage === 4) return solveByMacros(s, 4, stageMacros[4], 5);
  if (stage === 5) return solveByMacros(s, 5, stageMacros[5], 4);
  if (stage === 6) return solveByMacros(s, 6, stageMacros[6], 3);
  return solveOrient(s);
}
// Plan desde el estado actual hasta completar la etapa `upTo` (incluida).
export function plan(s, upTo = 7) {
  const groups = [];
  for (let st = currentStage(s); st <= upTo; st++) { const r = solveStage(s, st); groups.push(...r.groups.filter(g => g.moves.length)); s = r.s; }
  return groups;
}
// Estado listo para practicar la etapa `level` (todo lo anterior resuelto, esa etapa no).
export function levelStart(level) {
  for (let t = 0; t < 50; t++) {
    let s = applySeq(SOLVED, scramble());
    for (let st = 1; st < level; st++) s = solveStage(s, st).s;
    if (!goals[level - 1](s)) return s;
  }
  return applySeq(SOLVED, scramble());
}

export const MOVE_TEXT = {
  U: 'Arriba hacia la izquierda', "U'": 'Arriba hacia la derecha',
  D: 'Abajo hacia la derecha', "D'": 'Abajo hacia la izquierda',
  R: 'Derecha hacia arriba', "R'": 'Derecha hacia abajo',
  L: 'Izquierda hacia abajo', "L'": 'Izquierda hacia arriba',
  F: 'Frente en sentido del reloj', "F'": 'Frente contra el reloj',
  B: 'Atrás: su fila de arriba va hacia la izquierda', "B'": 'Atrás: su fila de arriba va hacia la derecha',
};
export function moveText(m) { return m.endsWith('2') ? MOVE_TEXT[m[0]] + ', dos veces' : MOVE_TEXT[m]; }
