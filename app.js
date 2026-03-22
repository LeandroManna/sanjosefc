// San Jose FC - App Logic
let jugadores = [];
let partidos = [];

async function loadData() {
  const [jRes, pRes] = await Promise.all([
    fetch('data/jugadores.json'),
    fetch('data/partidos.json')
  ]);
  jugadores = await jRes.json();
  partidos = await pRes.json();
  partidos.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
  renderAll();
}

function getResultado(p) {
  const gL = p.condicion === 'local' ? p.golesLocal : p.golesVisitante;
  const gV = p.condicion === 'local' ? p.golesVisitante : p.golesLocal;
  if (gL > gV) return 'W';
  if (gL < gV) return 'L';
  return 'D';
}

function getNombreJugador(id, formato = 'apodo') {
  const j = jugadores.find(j => j.id === id);
  if (!j) return 'Desconocido';
  if (formato === 'apodo') return j.apodo || j.nombre;
  if (formato === 'completo') return `${j.nombre} "${j.apodo}" ${j.apellido}`;
  return `${j.nombre} ${j.apellido}`;
}

function calcularEstadisticas() {
  const stats = {};
  jugadores.forEach(j => {
    stats[j.id] = { goles: 0, amarillas: 0, rojas: 0, partidos: 0 };
  });
  partidos.forEach(p => {
    // Partidos jugados: se lee del array explícito "jugadores" del partido
    if (Array.isArray(p.jugadores)) {
      p.jugadores.forEach(id => {
        if (stats[id]) stats[id].partidos++;
      });
    }
    p.goles.forEach(g => {
      if (stats[g.jugadorId]) stats[g.jugadorId].goles++;
    });
    p.amarillas.forEach(a => {
      if (stats[a.jugadorId]) stats[a.jugadorId].amarillas++;
    });
    p.rojas.forEach(r => {
      if (stats[r.jugadorId]) stats[r.jugadorId].rojas++;
    });
  });
  return stats;
}

function calcularResumenEquipo() {
  let g = 0, e = 0, p = 0, gf = 0, gc = 0;
  partidos.forEach(part => {
    const propio = part.condicion === 'local' ? part.golesLocal : part.golesVisitante;
    const rival = part.condicion === 'local' ? part.golesVisitante : part.golesLocal;
    gf += propio; gc += rival;
    if (propio > rival) g++;
    else if (propio < rival) p++;
    else e++;
  });
  return { pj: partidos.length, g, e, p, gf, gc, dg: gf - gc, pts: g * 3 + e };
}

function renderResumen() {
  const r = calcularResumenEquipo();
  document.getElementById('stat-pj').textContent = r.pj;
  document.getElementById('stat-g').textContent = r.g;
  document.getElementById('stat-e').textContent = r.e;
  document.getElementById('stat-p').textContent = r.p;
  document.getElementById('stat-gf').textContent = r.gf;
  document.getElementById('stat-gc').textContent = r.gc;
  document.getElementById('stat-dg').textContent = (r.dg > 0 ? '+' : '') + r.dg;
  document.getElementById('stat-pts').textContent = r.pts;

  // Forma reciente (últimos 5)
  const ultimos = [...partidos].slice(0, 5);
  const formaEl = document.getElementById('forma-reciente');
  formaEl.innerHTML = ultimos.map(p => {
    const res = getResultado(p);
    const cls = res === 'W' ? 'forma-w' : res === 'L' ? 'forma-l' : 'forma-d';
    return `<span class="forma-badge ${cls}">${res}</span>`;
  }).join('');
}

function renderPartidos() {
  const tbody = document.getElementById('tabla-partidos');
  tbody.innerHTML = partidos.map(p => {
    const res = getResultado(p);
    const resCls = res === 'W' ? 'text-success' : res === 'L' ? 'text-danger' : 'text-warning';
    const resLabel = res === 'W' ? 'VICTORIA' : res === 'L' ? 'DERROTA' : 'EMPATE';
    const gLocal = p.condicion === 'local' ? p.golesLocal : p.golesVisitante;
    const gRival = p.condicion === 'local' ? p.golesVisitante : p.golesLocal;
    const dg = gLocal - gRival;
    const dgStr = (dg > 0 ? '+' : '') + dg;
    const fecha = new Date(p.fecha + 'T00:00:00').toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric' });
    const golesStr = p.goles.length > 0
      ? p.goles.map(g => `<span class="goleador-tag">⚽ ${getNombreJugador(g.jugadorId)} ${g.minuto}'</span>`).join(' ')
      : '<span class="text-muted small">—</span>';
    const condBadge = p.condicion === 'local'
      ? '<span class="badge badge-local">LOCAL</span>'
      : '<span class="badge badge-visita">VISITA</span>';

    return `
      <tr class="partido-row" data-res="${res}">
        <td><span class="fecha-texto">${fecha}</span></td>
        <td>${condBadge}</td>
        <td class="rival-nombre">${p.rival}</td>
        <td class="text-center">
          <span class="marcador">${gLocal} - ${gRival}</span>
        </td>
        <td class="text-center">
          <span class="dg-badge ${dg > 0 ? 'dg-pos' : dg < 0 ? 'dg-neg' : 'dg-neu'}">${dgStr}</span>
        </td>
        <td class="text-center"><span class="resultado-tag ${resCls}">${resLabel}</span></td>
        <td class="goles-cell">${golesStr}</td>
      </tr>`;
  }).join('');
}

function renderEstadisticas() {
  const stats = calcularEstadisticas();
  const datos = jugadores.map(j => ({ ...j, ...stats[j.id] }));
  datos.sort((a, b) => b.goles - a.goles || b.partidos - a.partidos);

  const tbody = document.getElementById('tabla-jugadores');
  tbody.innerHTML = datos.map((j, i) => {
    const initials = (j.nombre[0] + j.apellido[0]).toUpperCase();
    const colors = ['#e63946','#2a9d8f','#e9c46a','#f4a261','#264653','#8338ec','#3a86ff','#fb5607','#06d6a0','#118ab2'];
    const color = colors[i % colors.length];
    return `
      <tr>
        <td>
          <div class="jugador-info">
            <div class="avatar" style="background:${color}">${initials}</div>
            <div>
              <div class="jugador-nombre">${j.nombre} ${j.apellido}</div>
              <div class="jugador-apodo">${j.apodo}</div>
            </div>
          </div>
        </td>
        <td class="text-center"><span class="num-badge">${j.numero}</span></td>
        <td class="text-center">${j.posicion}</td>
        <td class="text-center"><span class="stat-gol">${j.goles}</span></td>
        <td class="text-center"><span class="stat-amarilla">🟨 ${j.amarillas}</span></td>
        <td class="text-center"><span class="stat-roja">🟥 ${j.rojas}</span></td>
        <td class="text-center">${j.partidos}</td>
      </tr>`;
  }).join('');

  // Goleadores top (máximo 5)
  const top5 = datos.filter(j => j.goles > 0).slice(0, 5);
  const maxGoles = top5[0]?.goles || 1;
  document.getElementById('top-goleadores').innerHTML = top5.map((j, i) => {
    const pct = Math.round((j.goles / maxGoles) * 100);
    const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : '';
    return `
      <div class="top-goleador-item">
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

function renderGraficoResultados() {
  const conteo = { W: 0, D: 0, L: 0 };
  partidos.forEach(p => conteo[getResultado(p)]++);

  const total = partidos.length || 1;
  const pctW = Math.round((conteo.W / total) * 100);
  const pctD = Math.round((conteo.D / total) * 100);
  const pctL = Math.round((conteo.L / total) * 100);

  // Donut SVG simple
  const radius = 60;
  const cx = 80, cy = 80;
  function arc(pct, offset) {
    if (pct === 0) return '';
    const a = pct / 100 * 360;
    const startAngle = offset / 100 * 360 - 90;
    const endAngle = startAngle + a;
    const x1 = cx + radius * Math.cos(startAngle * Math.PI / 180);
    const y1 = cy + radius * Math.sin(startAngle * Math.PI / 180);
    const x2 = cx + radius * Math.cos(endAngle * Math.PI / 180);
    const y2 = cy + radius * Math.sin(endAngle * Math.PI / 180);
    const large = a > 180 ? 1 : 0;
    return `M ${cx} ${cy} L ${x1} ${y1} A ${radius} ${radius} 0 ${large} 1 ${x2} ${y2} Z`;
  }

  const svgEl = document.getElementById('donut-resultados');
  svgEl.innerHTML = `
    <path d="${arc(pctW, 0)}" fill="#4caf50" opacity="0.9"/>
    <path d="${arc(pctD, pctW)}" fill="#ffc107" opacity="0.9"/>
    <path d="${arc(pctL, pctW + pctD)}" fill="#f44336" opacity="0.9"/>
    <circle cx="${cx}" cy="${cy}" r="35" fill="var(--card-bg)"/>
    <text x="${cx}" y="${cy - 6}" text-anchor="middle" fill="var(--text-primary)" font-size="18" font-weight="bold">${partidos.length}</text>
    <text x="${cx}" y="${cy + 12}" text-anchor="middle" fill="var(--text-muted)" font-size="9">PARTIDOS</text>
  `;

  document.getElementById('leyenda-resultados').innerHTML = `
    <div class="leyenda-item"><span class="dot" style="background:#4caf50"></span> Victorias <strong>${conteo.W}</strong></div>
    <div class="leyenda-item"><span class="dot" style="background:#ffc107"></span> Empates <strong>${conteo.D}</strong></div>
    <div class="leyenda-item"><span class="dot" style="background:#f44336"></span> Derrotas <strong>${conteo.L}</strong></div>
  `;
}

function filterPartidos(filtro) {
  document.querySelectorAll('.btn-filtro').forEach(b => b.classList.remove('active'));
  event.target.classList.add('active');
  const rows = document.querySelectorAll('#tabla-partidos tr');
  rows.forEach(row => {
    if (filtro === 'all' || row.dataset.res === filtro) {
      row.style.display = '';
    } else {
      row.style.display = 'none';
    }
  });
}

function renderAll() {
  renderResumen();
  renderPartidos();
  renderEstadisticas();
  renderGraficoResultados();
}

window.filterPartidos = filterPartidos;
document.addEventListener('DOMContentLoaded', loadData);