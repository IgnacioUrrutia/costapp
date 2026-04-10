# README: Frontend y Experiencia de Usuario (UI/UX)

Esta guía detalla la lógica de la interfaz y la funcionalidad de exportación requerida para la aplicación de costos.

## 🎨 Diseño Visual
- **Tema:** Dark Mode / Light Mode automático basado en preferencias del sistema.
- **Paleta de Colores Sugerida:** Indigo-600 para acciones principales, Slate-50/900 para fondos.
- **Librería de Componentes:** Se recomienda usar **Tailwind CSS** puro o con **Headless UI** para modales y dropdowns.

## 🧩 Componentes Principales

### 1. Dashboard (Vista General)
- **Cards de Resumen:** Mostrar el balance actual, gasto total del mes en curso y proyección de gasto a final de mes.
- **Gráficos:**
  - `PieChart`: Proporción de gastos por categoría (Vivienda vs Comida vs Transporte).
  - `BarChart`: Comparativa de gastos mes a mes (últimos 6 meses).

### 2. Tabla de Gastos
- Filtros rápidos por categoría y mes.
- Acciones de "Eliminar" y "Editar" para cada fila.
- **Scroll Infinito o Paginación** si hay más de 50 registros.

### 3. Formulario de Ingreso
- Campo de monto con máscara numérica (ej: "$ 0.00").
- Selector de fecha (por defecto hoy).
- Botón de envío que valide que el monto sea mayor a cero.

## 📑 Funcionalidad de Exportación a Excel
El botón "Exportar Reporte" debe generar un archivo `.xlsx` usando la librería `xlsx`.

### Estructura del Excel:
1. **Hoja 1 (Detalle):**
   - Columnas: Fecha, Categoría, Descripción, Monto.
   - La última fila debe contener una **fórmula de Excel** sumando la columna de montos: `=SUMA(D2:D[n])`.
2. **Hoja 2 (Resumen por Categoría):**
   - Una tabla dinámica simulada que agrupe cuánto se gastó en cada categoría.
   - Un gráfico básico insertado si la librería lo permite (opcional, pero recomendado).

## 🧮 Lógica de Cálculos
- **Cálculo de Promedio Diario:** `(Gasto Total Mes) / (Días transcurridos del mes)`.
- **Alerta de Presupuesto:** Si el gasto de una categoría supera el 90% del presupuesto asignado, mostrar una advertencia visual (color rojo).
