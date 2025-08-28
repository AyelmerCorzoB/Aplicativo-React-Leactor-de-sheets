# 📊 Google Sheets DataTable App

Este proyecto es un **aplicativo en React + Next.js** que permite conectar datos en vivo desde **Google Sheets**, mostrarlos en una **tabla interactiva**, aplicar **filtros dinámicos**, y exportar la información a diferentes formatos (CSV / Excel).  

Incluye además gráficos con **Recharts** para visualizar las columnas categóricas.

---

## 🚀 Características
- 🔄 Conexión directa a Google Sheets (usando CSV export).
- ⚡ Caché local con expiración configurable.
- 🔍 Filtros y búsqueda en todas las columnas.
- 📑 Configuración de visibilidad de columnas.
- 📥 Exportación de datos (CSV / Excel).
- 📊 Gráficos automáticos para columnas categóricas.
- 🖼️ Header personalizable con logo.
- 🛠️ Hooks de optimización incluidos:
  - `useDebounce` → evita renders excesivos al escribir.
  - `useCache` → memoriza cálculos pesados.
  - `useIntersectionObserver` → para lazy loading.
  - `useVirtualScrolling` → tablas grandes más rápidas.
  - `usePerformanceMonitor` → mide tiempos de render.

---

## 📦 Instalación

Clona el repositorio e instala dependencias:

```bash
git clone https://github.com/tu-usuario/tu-repo.git
cd tu-repo
npm install
# o
yarn install
```

## ▶️ Uso
Configura tu hoja de Google Sheets:

1. Debe estar en "Cualquiera con el enlace → Lector".

2. Copia el spreadsheetId y el gid de la hoja.

Ejemplo de URL:

```bash
https://docs.google.com/spreadsheets/d/1AbCDefGhIJklmNOZ12345/edit#gid=123456

spreadsheetId = 1AbCDefGhIJklmNOZ12345
sheetGid = 123456
```

En tu componente usa el hook:

```tsx
import { useGoogleSheets } from "@/hooks/useGoogleSheets"

const { data, columns, loading, error } = useGoogleSheets(
  "1AbCDefGhIJklmNOPQRstuVWXYZ12345",
  "67890"
)
```
### Corre el proyecto:

```bash
npm run dev
# o
yarn dev
```

### 📊 Ejemplo de exportación
CSV → todos los datos como archivo plano.

Excel → mantiene filtros aplicados en la tabla.
