# ⚽ San Jose FC — Dashboard

Panel de estadísticas del equipo **San Jose FC**, San Salvador de Jujuy.

Desarrollado para publicarse en **GitHub Pages** (solo HTML, CSS, JS, Bootstrap y JSON).

## 📁 Estructura del proyecto

```
sanjosefc/
├── index.html          ← Dashboard principal
├── app.js              ← Lógica de carga y renderizado
└── data/
    ├── jugadores.json  ← Plantel: nombre, apellido, apodo, posición, número
    └── partidos.json   ← Resultados, goles, amarillas, rojas por partido
```

## 🚀 Publicar en GitHub Pages

1. Crear un repositorio en GitHub (ej: `sanjosefc`)
2. Subir todos los archivos manteniendo la estructura de carpetas
3. Ir a **Settings → Pages → Source: Deploy from branch → main / root**
4. En segundos la página estará en: `https://tuusuario.github.io/sanjosefc`

## ✏️ Cómo cargar datos

### Agregar un partido (`data/partidos.json`)

```json
{
  "id": 7,
  "fecha": "2025-04-13",
  "rival": "Nombre del rival",
  "golesLocal": 2,
  "golesVisitante": 1,
  "condicion": "local",
  "torneo": "Liga Amateur Jujuy",
  "jornada": 7,
  "goles": [
    { "jugadorId": 6, "minuto": 15 },
    { "jugadorId": 10, "minuto": 70 }
  ],
  "amarillas": [
    { "jugadorId": 4, "minuto": 55 }
  ],
  "rojas": []
}
```

> `condicion` puede ser `"local"` o `"visitante"`  
> Los `jugadorId` corresponden al campo `id` de `jugadores.json`

### Agregar un jugador (`data/jugadores.json`)

```json
{
  "id": 11,
  "nombre": "Juan",
  "apellido": "Pérez",
  "apodo": "Juancho",
  "posicion": "Delantero",
  "numero": 18,
  "foto": null
}
```

## 📊 Funcionalidades

- Resumen de temporada: PJ, V, E, D, GF, GC, DG, Puntos
- Forma reciente (últimos 5 partidos)
- Historial de partidos con filtro por resultado
- Goles por jugador y minuto en cada partido
- Gráfico de distribución de resultados (donut SVG)
- Ranking de goleadores con barras de progreso
- Tabla completa del plantel: goles, amarillas, rojas, partidos jugados

## 🤖 Próximamente

- Bot de Telegram para cargar resultados y eventos de partido desde el celular ni bien termina el partido.