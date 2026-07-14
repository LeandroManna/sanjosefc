# San Jose FC Dashboard

Dashboard publico de estadisticas para **San Jose FC**, equipo de futbol amateur de San Salvador de Jujuy.

El proyecto esta pensado para publicarse en **GitHub Pages** y funcionar sin backend: la interfaz carga archivos JSON locales con torneos, partidos, posiciones, plantel y estadisticas.

## Objetivo

Centralizar la informacion deportiva del equipo en una pagina simple, clara y compartible con el plantel:

- resultados por torneo;
- tabla de posiciones;
- resumen de rendimiento;
- historial de partidos;
- ranking de goleadores;
- estadisticas individuales del plantel;
- comparacion entre torneo actual e historicos.

## Estado Actual

El dashboard soporta multiples torneos. Actualmente conserva el historico del **Apertura 2026** y muestra por defecto el **Clausura 2026** como torneo activo.

Los datos se actualizan manualmente a partir de los flyers oficiales de la liga y de la informacion interna del equipo, especialmente los autores de los goles de San Jose FC.

## Tecnologias

- HTML5
- CSS3
- JavaScript vanilla
- Bootstrap 5
- JSON como fuente de datos
- GitHub Pages para publicacion

No requiere build, servidor ni base de datos para la version publica.

## Estructura

```text
sanjosefc/
|-- index.html              # Dashboard publico
|-- app.js                  # Carga de datos, calculos y renderizado
|-- assets/                 # Favicons, iconos y recursos visuales
|-- data/
|   |-- equipos.json        # Equipos registrados
|   |-- jugadores.json      # Plantel
|   |-- partidos.json       # Partidos, goles, tarjetas y convocados
|   |-- posiciones.json     # Tablas de posiciones por torneo
|   `-- torneos.json        # Torneos disponibles y torneo activo
`-- README.md               # Documentacion del proyecto
```

## Datos

### Torneos

Archivo: `data/torneos.json`

Cada torneo define su nombre, fase, fechas y si esta activo:

```json
{
  "id": 2,
  "nombre": "Clausura 2026",
  "anio": 2026,
  "fase": "clausura",
  "activo": 1,
  "fecha_inicio": "2026-07-11",
  "fecha_fin": null
}
```

El dashboard toma como predeterminado el torneo con `activo: 1`, pero permite cambiar entre torneos desde la interfaz.

### Partidos

Archivo: `data/partidos.json`

Cada partido debe indicar a que torneo pertenece mediante `torneoId`.

```json
{
  "id": 28,
  "torneoId": 2,
  "fecha": "2026-07-11",
  "equipoId": 11,
  "rival": "Cucharita ST",
  "golesLocal": 1,
  "golesVisitante": 0,
  "condicion": "local",
  "jornada": 1,
  "jugadores": [1, 2, 3, 4, 5, 8],
  "goles": [
    { "jugadorId": 8, "minuto": 20 }
  ],
  "amarillas": [],
  "rojas": []
}
```

Reglas importantes:

- `condicion` puede ser `local` o `visitante`.
- `golesLocal` y `golesVisitante` siempre representan el marcador oficial local/visitante.
- Los goles de San Jose se cargan en `goles` con el `jugadorId` correspondiente.
- Los `jugadorId` salen de `data/jugadores.json`.
- No se deben inventar resultados: solo se cargan partidos observados en flyers oficiales o datos confirmados.

### Posiciones

Archivo: `data/posiciones.json`

Las posiciones tambien usan `torneoId`, lo que permite guardar tablas historicas y actuales en el mismo archivo.

```json
{
  "torneoId": 2,
  "equipoNombre": "San Jose ST",
  "equipoId": 6,
  "pj": 1,
  "pg": 1,
  "pp": 0,
  "pe": 0,
  "gf": 1,
  "gc": 0,
  "dg": 1,
  "puntos": 3,
  "fechaActualizacion": "2026-07-11"
}
```

La tabla del dashboard debe coincidir con el flyer oficial de la liga cuando exista una tabla publicada.

### Equipos

Archivo: `data/equipos.json`

Solo se agregan equipos confirmados. En flyers de la liga, los equipos de la categoria estandar se identifican porque terminan en `ST`.

Si aparece un equipo nuevo terminado en `ST`, se agrega al listado, pero no se completan partidos que no figuren en los resultados oficiales.

## Publicacion en GitHub Pages

1. Subir los cambios al repositorio.
2. En GitHub, ir a **Settings > Pages**.
3. Seleccionar **Deploy from a branch**.
4. Elegir la rama principal y la carpeta raiz.
5. GitHub Pages publicara el sitio como pagina estatica.

Como no hay proceso de build, cualquier cambio en `index.html`, `app.js`, `assets/` o `data/` queda disponible despues del deploy de GitHub Pages.

## Flujo Recomendado de Actualizacion

1. Revisar el flyer oficial de resultados.
2. Cargar solo partidos de la categoria estandar (`ST`).
3. Agregar equipos nuevos terminados en `ST` si aparecen.
4. Cargar el partido de San Jose con resultado, rival, condicion y jornada.
5. Cargar goleadores confirmados por el equipo.
6. Actualizar la tabla de posiciones solo con datos oficiales.
7. Validar que el dashboard muestre correctamente el torneo activo.

## Criterios del Proyecto

- El dashboard debe ser facil de consultar desde el celular.
- El torneo actual debe verse primero.
- Los torneos anteriores deben quedar disponibles como historial.
- Los datos visibles deben priorizar exactitud sobre completitud.
- No se generan resultados al azar.
- Las estadisticas de goleadores se actualizan solo con informacion confirmada.
