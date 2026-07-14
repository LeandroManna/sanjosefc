// San Jose FC — Dashboard público
// Tiempos: 1er tiempo = min 1–35 | 2do tiempo = min 36–70
const T1_MAX = 35;

let jugadores  = [];
let partidos   = [];
let posiciones = [];
let torneos    = [];
let torneoActivo = null;
let partidosTorneo = [];
let posicionesTorneo = [];

// ── CARGA DE DATOS ────────────────────────────────────────────────────────────
async function loadData() {
  try {
    const [jRes, pRes, posRes, torRes] = await Promise.all([
      fetch('data/jugadores.json'),
      fetch('data/partidos.json'),
      fetch('data/posiciones.json'),
      fetch('data/torneos.json'),
    ]);
    jugadores  = await jRes.json();
    partidos   = await pRes.json();
    posiciones = await posRes.json();
    torneos    = await torRes.json();
    torneoActivo = torneos.find(t => t.activo) || torneos[0] || null;
    partidos.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
    aplicarTorneoActivo();
    renderAll();
  } catch (e) {
    console.error('Error cargando datos:', e);
  }
}

// ── HELPERS ───────────────────────────────────────────────────────────────────
function getResultado(p) {
  const prop = p.condicion === 'local' ? p.golesLocal : p.golesVisitante;
  const riv  = p.condicion === 'local' ? p.golesVisitante : p.golesLocal;
  return prop > riv ? 'W' : prop < riv ? 'L' : 'D';
}

function getNombre(id) {
  const j = jugadores.find(j => j.id === id);
  return j ? (j.apodo || j.nombre) : '?';
}

function esPrimerTiempo(min) { return min <= T1_MAX; }

function aplicarTorneoActivo() {
  const tid = torneoActivo?.id;
  partidosTorneo = partidos
    .filter(p => !tid || !p.torneoId || p.torneoId === tid)
    .sort((a, b) => new Date(b.fecha) - new Date(a.fecha));

  const tieneTorneoId = posiciones.some(p => p.torneoId);
  posicionesTorneo = tieneTorneoId && tid
    ? posiciones.filter(p => p.torneoId === tid)
    : posiciones;
}

function seleccionarTorneo(id) {
  torneoActivo = torneos.find(t => t.id === Number(id)) || torneoActivo;
  aplicarTorneoActivo();
  renderAll();
}

// ── CÁLCULOS ──────────────────────────────────────────────────────────────────
function calcularResumen() {
  let g = 0, e = 0, p = 0, gf = 0, gc = 0;
  partidosTorneo.forEach(pt => {
    const prop = pt.condicion === 'local' ? pt.golesLocal  : pt.golesVisitante;
    const riv  = pt.condicion === 'local' ? pt.golesVisitante : pt.golesLocal;
    gf += prop; gc += riv;
    if (prop > riv) g++; else if (prop < riv) p++; else e++;
  });
  return { pj: partidosTorneo.length, g, e, p, gf, gc, dg: gf - gc, pts: g * 3 + e };
}

function calcularStatsJugadores() {
  const stats = {};
  jugadores.forEach(j => { stats[j.id] = { goles:0, amarillas:0, rojas:0, partidos:0 }; });
  partidosTorneo.forEach(pt => {
    (pt.jugadores || []).forEach(id => { if (stats[id]) stats[id].partidos++; });
    (pt.goles     || []).forEach(g  => { if (stats[g.jugadorId]) stats[g.jugadorId].goles++;     });
    (pt.amarillas || []).forEach(a  => { if (stats[a.jugadorId]) stats[a.jugadorId].amarillas++; });
    (pt.rojas     || []).forEach(r  => { if (stats[r.jugadorId]) stats[r.jugadorId].rojas++;     });
  });
  return stats;
}

function calcularGolesPorTiempo() {
  let t1 = 0, t2 = 0;
  partidosTorneo.forEach(pt => (pt.goles || []).forEach(g => {
    esPrimerTiempo(g.minuto) ? t1++ : t2++;
  }));
  const tot = t1 + t2 || 1;
  const ppj = partidosTorneo.length || 1;
  return { t1, t2, total: t1 + t2,
    pct1: Math.round(t1/tot*100), pct2: Math.round(t2/tot*100),
    prom1: (t1/ppj).toFixed(2),   prom2: (t2/ppj).toFixed(2) };
}

function calcularTarjetasPorTiempo() {
  let a1=0,a2=0,r1=0,r2=0;
  partidosTorneo.forEach(pt => {
    (pt.amarillas||[]).forEach(t => esPrimerTiempo(t.minuto) ? a1++ : a2++);
    (pt.rojas    ||[]).forEach(t => esPrimerTiempo(t.minuto) ? r1++ : r2++);
  });
  const ppj = partidosTorneo.length || 1;
  return { a1, a2, r1, r2,
    totalA: a1+a2, totalR: r1+r2,
    promA: ((a1+a2)/ppj).toFixed(2), promR: ((r1+r2)/ppj).toFixed(2) };
}

// ── RENDER CABECERA ───────────────────────────────────────────────────────────
function renderHeader() {
  const el = document.getElementById('torneo-nombre');
  if (el && torneoActivo) el.textContent = torneoActivo.nombre;
}

function renderTorneosNav() {
  const el = document.getElementById('torneo-tabs');
  if (!el) return;

  el.innerHTML = torneos.map(t => `
    <button class="torneo-tab ${torneoActivo?.id === t.id ? 'active' : ''}" onclick="seleccionarTorneo(${t.id})">
      ${t.nombre}
    </button>
  `).join('');
}

// ── RENDER RESUMEN ────────────────────────────────────────────────────────────
function renderResumen() {
  const r = calcularResumen();
  document.getElementById('stat-pj').textContent  = r.pj;
  document.getElementById('stat-g').textContent   = r.g;
  document.getElementById('stat-e').textContent   = r.e;
  document.getElementById('stat-p').textContent   = r.p;
  document.getElementById('stat-gf').textContent  = r.gf;
  document.getElementById('stat-gc').textContent  = r.gc;
  document.getElementById('stat-dg').textContent  = (r.dg > 0 ? '+' : '') + r.dg;
  document.getElementById('stat-pts').textContent = r.pts;

  // Forma reciente (últimos 5)
  document.getElementById('forma-reciente').innerHTML = partidosTorneo.slice(0, 5).map(p => {
    const res = getResultado(p);
    const cls = res === 'W' ? 'forma-w' : res === 'L' ? 'forma-l' : 'forma-d';
    return `<span class="forma-badge ${cls}">${res}</span>`;
  }).join('');
}

// ── RENDER POSICIONES ─────────────────────────────────────────────────────────
function renderPosiciones() {
  const el = document.getElementById('seccion-posiciones');
  if (!el) return;

  if (!posicionesTorneo.length) {
    el.innerHTML = `<div class="card-dark mb-4">
      <div class="section-title mb-2">🏆 TABLA DE POSICIONES</div>
      <p class="text-muted text-center py-3" style="font-family:'Barlow Condensed',sans-serif;letter-spacing:1px">
        La tabla se publica los martes o miércoles — volvé pronto
      </p></div>`;
    return;
  }

  // Ya viene ordenada del JSON (exportada por puntos DESC, dg DESC)
  const fechaInfo = posicionesTorneo[0]?.fechaActualizacion
    ? `<span class="pos-fecha">Actualizado: ${
        new Date(posicionesTorneo[0].fechaActualizacion + 'T00:00:00')
          .toLocaleDateString('es-AR', {day:'2-digit',month:'long',year:'numeric'})
      }</span>`
    : '';

  const filas = posicionesTorneo.map((eq, i) => {
    const pos   = i + 1;
    const esSJ  = eq.equipoNombre.toLowerCase().includes('san jose') ||
                  eq.equipoNombre.toLowerCase().includes('san josé');
    const posLabel = pos === 1 ? '🥇' : pos === 2 ? '🥈' : pos === 3 ? '🥉' : pos;
    const dgCls    = eq.dg > 0 ? 'dg-pos' : eq.dg < 0 ? 'dg-neg' : 'dg-neu';

    return `<tr class="${esSJ ? 'fila-propia' : ''}">
      <td class="text-center pos-num" style="color:${pos<=3?'var(--accent)':'var(--text-muted)'}">${posLabel}</td>
      <td class="equipo-nombre-cell ${esSJ ? 'text-verde-glow fw-bold' : ''}">${esSJ ? '⚡ ' : ''}${eq.equipoNombre}</td>
      <td class="text-center stat-cell">${eq.pj}</td>
      <td class="text-center stat-cell text-success">${eq.pg}</td>
      <td class="text-center stat-cell text-danger">${eq.pp}</td>
      <td class="text-center stat-cell text-warning">${eq.pe}</td>
      <td class="text-center stat-cell">${eq.gf}</td>
      <td class="text-center stat-cell">${eq.gc}</td>
      <td class="text-center"><span class="dg-badge ${dgCls}">${eq.dg > 0 ? '+' : ''}${eq.dg}</span></td>
      <td class="text-center pts-cell">${eq.puntos}</td>
    </tr>`;
  }).join('');

  el.innerHTML = `<div class="card-dark mb-4">
    <div class="d-flex align-items-center justify-content-between flex-wrap gap-2 mb-3">
      <div class="section-title mb-0">🏆 TABLA DE POSICIONES</div>
      ${fechaInfo}
    </div>
    <div class="table-responsive-wrap">
      <table class="table-dark-custom">
        <thead><tr>
          <th class="text-center">#</th>
          <th>Equipo</th>
          <th class="text-center" title="Partidos Jugados">PJ</th>
          <th class="text-center" title="Ganados">PG</th>
          <th class="text-center" title="Perdidos">PP</th>
          <th class="text-center" title="Empatados">PE</th>
          <th class="text-center" title="Goles a Favor">GF</th>
          <th class="text-center" title="Goles en Contra">GC</th>
          <th class="text-center" title="Diferencia de Goles">DG</th>
          <th class="text-center" title="Puntos">PTS</th>
        </tr></thead>
        <tbody>${filas}</tbody>
      </table>
    </div>
  </div>`;
}

// ── RENDER TIEMPOS ────────────────────────────────────────────────────────────
function renderTiempos() {
  const el = document.getElementById('seccion-tiempos');
  if (!el) return;
  const g = calcularGolesPorTiempo();
  const t = calcularTarjetasPorTiempo();

  const pct1   = g.t1 + g.t2 === 0 ? 50 : g.pct1;
  const domina = g.t1 > g.t2 ? '↑ 1er tiempo' : g.t2 > g.t1 ? '↑ 2do tiempo' : '↔ Parejo';

  function barraDual(v1, v2, c1, c2, label1='1er T', label2='2do T') {
    const tot = v1+v2 || 1;
    const p1  = Math.round(v1/tot*100);
    return `<div class="barra-dual-wrap">
      <span class="barra-dual-label">${label1} <b>${v1}</b></span>
      <div class="barra-dual">
        <div style="width:${p1}%;background:${c1}"></div>
        <div style="width:${100-p1}%;background:${c2}"></div>
      </div>
      <span class="barra-dual-label">${label2} <b>${v2}</b></span>
    </div>`;
  }

  el.innerHTML = `<div class="card-dark mb-4">
    <div class="section-title mb-3">⏱ RENDIMIENTO POR TIEMPO</div>
    <div class="row g-4">

      <!-- GOLES -->
      <div class="col-md-6">
        <div class="d-flex justify-content-between align-items-center mb-2">
          <span class="tiempo-label">Goles por tiempo</span>
          <span class="domina-badge">${domina}</span>
        </div>
        <div class="barra-split mb-3">
          <div class="barra-split-t1" style="width:${pct1}%"></div>
          <div class="barra-split-t2" style="width:${100-pct1}%"></div>
        </div>
        <div class="row g-2">
          <div class="col-6">
            <div class="tiempo-box border-verde">
              <div class="tiempo-box-label">1ER TIEMPO <span class="tiempo-rango">min 1–35</span></div>
              <div class="tiempo-box-valor">${g.t1}</div>
              <div class="tiempo-box-sub">goles · prom <b>${g.prom1}</b>/pj</div>
            </div>
          </div>
          <div class="col-6">
            <div class="tiempo-box border-azul">
              <div class="tiempo-box-label">2DO TIEMPO <span class="tiempo-rango">min 36–70</span></div>
              <div class="tiempo-box-valor text-azul">${g.t2}</div>
              <div class="tiempo-box-sub">goles · prom <b>${g.prom2}</b>/pj</div>
            </div>
          </div>
        </div>
      </div>

      <!-- TARJETAS -->
      <div class="col-md-6">
        <div class="tiempo-label mb-3">Disciplina por tiempo</div>
        <div class="row g-2 mb-3">
          <div class="col-6">
            <div class="tarj-box box-amarilla">
              <div class="tarj-icon">🟨</div>
              <div class="tarj-titulo">AMARILLAS</div>
              <div class="tarj-cifras">
                <div class="tarj-cifra"><span>${t.a1}</span><small>1er T</small></div>
                <div class="tarj-sep"></div>
                <div class="tarj-cifra"><span>${t.a2}</span><small>2do T</small></div>
              </div>
              <div class="tarj-total">Total ${t.totalA} · prom ${t.promA}/pj</div>
            </div>
          </div>
          <div class="col-6">
            <div class="tarj-box box-roja">
              <div class="tarj-icon">🟥</div>
              <div class="tarj-titulo">ROJAS</div>
              <div class="tarj-cifras">
                <div class="tarj-cifra"><span>${t.r1}</span><small>1er T</small></div>
                <div class="tarj-sep"></div>
                <div class="tarj-cifra"><span>${t.r2}</span><small>2do T</small></div>
              </div>
              <div class="tarj-total">Total ${t.totalR} · prom ${t.promR}/pj</div>
            </div>
          </div>
        </div>
        ${barraDual(t.a1, t.a2, '#ffc107', '#e67e00')}
        ${barraDual(t.r1, t.r2, '#f44336', '#a00')}
      </div>

    </div>
  </div>`;
}

// ── RENDER PARTIDOS ───────────────────────────────────────────────────────────
function renderPartidos() {
  const tbody = document.getElementById('tabla-partidos');
  tbody.innerHTML = partidosTorneo.map(p => {
    const res      = getResultado(p);
    const resCls   = res === 'W' ? 'text-success' : res === 'L' ? 'text-danger' : 'text-warning';
    const resLabel = res === 'W' ? 'VICTORIA' : res === 'L' ? 'DERROTA' : 'EMPATE';
    const gL       = p.condicion === 'local' ? p.golesLocal : p.golesVisitante;
    const gR       = p.condicion === 'local' ? p.golesVisitante : p.golesLocal;
    const dg       = gL - gR;
    const fecha    = new Date(p.fecha + 'T00:00:00').toLocaleDateString('es-AR', {day:'2-digit',month:'short',year:'numeric'});
    const condBadge= p.condicion === 'local'
      ? '<span class="badge badge-local">LOCAL</span>'
      : '<span class="badge badge-visita">VISITA</span>';
    const golesStr = (p.goles||[]).length
      ? (p.goles).map(g => `<span class="goleador-tag">⚽ ${getNombre(g.jugadorId)} ${g.minuto}'</span>`).join(' ')
      : '<span class="text-muted small">—</span>';

    return `<tr class="partido-row" data-res="${res}">
      <td><span class="fecha-texto">${fecha}</span></td>
      <td>${condBadge}</td>
      <td class="rival-nombre">${p.rival}</td>
      <td class="text-center"><span class="marcador">${gL} – ${gR}</span></td>
      <td class="text-center"><span class="dg-badge ${dg>0?'dg-pos':dg<0?'dg-neg':'dg-neu'}">${dg>0?'+':''}${dg}</span></td>
      <td class="text-center"><span class="resultado-tag ${resCls}">${resLabel}</span></td>
      <td class="goles-cell">${golesStr}</td>
    </tr>`;
  }).join('');
}

// ── RENDER ESTADÍSTICAS JUGADORES ─────────────────────────────────────────────
function renderEstadisticas() {
  const stats = calcularStatsJugadores();
  const datos = jugadores.map(j => ({...j, ...stats[j.id]}))
                         .sort((a,b) => b.goles - a.goles || b.partidos - a.partidos);

  const colors = ['#e63946','#2a9d8f','#e9c46a','#f4a261','#264653','#8338ec','#3a86ff','#fb5607','#06d6a0','#118ab2'];
  document.getElementById('tabla-jugadores').innerHTML = datos.map((j,i) => {
    const ini   = (j.nombre[0] + j.apellido[0]).toUpperCase();
    const color = colors[i % colors.length];
    return `<tr>
      <td>
        <div class="jugador-info">
          <div class="avatar" style="background:${color}">${ini}</div>
          <div>
            <div class="jugador-nombre">${j.nombre} ${j.apellido}</div>
            <div class="jugador-apodo">${j.apodo}</div>
          </div>
        </div>
      </td>
      <td class="text-center"><span class="num-badge">${j.numero ?? '—'}</span></td>
      <td class="text-center">${j.posicion}</td>
      <td class="text-center"><span class="stat-gol">${j.goles}</span></td>
      <td class="text-center">🟨 ${j.amarillas}</td>
      <td class="text-center">🟥 ${j.rojas}</td>
      <td class="text-center">${j.partidos}</td>
    </tr>`;
  }).join('');

  // Top goleadores
  const top5    = datos.filter(j => j.goles > 0).slice(0, 5);
  const maxGols = top5[0]?.goles || 1;
  document.getElementById('top-goleadores').innerHTML = top5.map((j,i) => {
    const pct   = Math.round(j.goles / maxGols * 100);
    const medal = ['🥇','🥈','🥉'][i] || '';
    return `<div class="top-goleador-item">
      <div class="d-flex justify-content-between align-items-center mb-1">
        <span class="goleador-name">${medal} ${j.apodo} <small class="text-muted">${j.apellido}</small></span>
        <span class="goles-count">${j.goles} ⚽</span>
      </div>
      <div class="progress gol-bar">
        <div class="progress-bar" style="width:${pct}%"></div>
      </div>
    </div>`;
  }).join('') || '<p class="text-muted text-center">Sin goles registrados</p>';
}

// ── RENDER DONUT ──────────────────────────────────────────────────────────────
function renderDonut() {
  const conteo = {W:0,D:0,L:0};
  partidosTorneo.forEach(p => conteo[getResultado(p)]++);
  const total = partidosTorneo.length || 1;
  const pW = Math.round(conteo.W/total*100);
  const pD = Math.round(conteo.D/total*100);
  const pL = Math.round(conteo.L/total*100);

  const cx=80, cy=80, r=60;
  function arc(pct, off) {
    if (!pct) return '';
    const a  = pct/100*360;
    const sa = off/100*360 - 90;
    const ea = sa + a;
    const x1 = cx + r*Math.cos(sa*Math.PI/180), y1 = cy + r*Math.sin(sa*Math.PI/180);
    const x2 = cx + r*Math.cos(ea*Math.PI/180), y2 = cy + r*Math.sin(ea*Math.PI/180);
    return `M${cx} ${cy} L${x1} ${y1} A${r} ${r} 0 ${a>180?1:0} 1 ${x2} ${y2}Z`;
  }

  document.getElementById('donut-resultados').innerHTML = `
    <path d="${arc(pW,0)}"       fill="#4caf50" opacity=".9"/>
    <path d="${arc(pD,pW)}"      fill="#ffc107" opacity=".9"/>
    <path d="${arc(pL,pW+pD)}"   fill="#f44336" opacity=".9"/>
    <circle cx="${cx}" cy="${cy}" r="35" fill="var(--card-bg)"/>
    <text x="${cx}" y="${cy-6}"  text-anchor="middle" fill="var(--text-primary)" font-size="18" font-weight="bold">${partidosTorneo.length}</text>
    <text x="${cx}" y="${cy+12}" text-anchor="middle" fill="var(--text-muted)"   font-size="9">PARTIDOS</text>`;

  document.getElementById('leyenda-resultados').innerHTML = `
    <div class="leyenda-item"><span class="dot" style="background:#4caf50"></span>Victorias<strong>${conteo.W}</strong></div>
    <div class="leyenda-item"><span class="dot" style="background:#ffc107"></span>Empates<strong>${conteo.D}</strong></div>
    <div class="leyenda-item"><span class="dot" style="background:#f44336"></span>Derrotas<strong>${conteo.L}</strong></div>`;
}

// ── FILTRO PARTIDOS ───────────────────────────────────────────────────────────
function filterPartidos(filtro) {
  document.querySelectorAll('.btn-filtro').forEach(b => b.classList.remove('active'));
  event.target.classList.add('active');
  document.querySelectorAll('#tabla-partidos tr').forEach(row => {
    row.style.display = filtro === 'all' || row.dataset.res === filtro ? '' : 'none';
  });
}

// ── RENDER ALL ────────────────────────────────────────────────────────────────
function renderAll() {
  renderHeader();
  renderTorneosNav();
  renderResumen();
  renderPosiciones();
  renderTiempos();
  renderPartidos();
  renderEstadisticas();
  renderDonut();
}

window.filterPartidos = filterPartidos;
window.seleccionarTorneo = seleccionarTorneo;
document.addEventListener('DOMContentLoaded', loadData);
