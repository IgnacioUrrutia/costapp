# Proyecto: Sistema de Gestión de Gastos y Costos Mensuales

Este documento es el Plan Maestro para la creación de una aplicación web progresiva (PWA) diseñada para el rastreo de gastos personales, visualización de datos y exportación de reportes.

## 🎯 Objetivo
Crear una herramienta intuitiva que permita a los usuarios registrar cada gasto, categorizarlo automáticamente y visualizar su salud financiera mediante un dashboard interactivo, con la capacidad de exportar toda la data a Excel para análisis externos.

## 🛠️ Stack Tecnológico Recomendado
- **Frontend:** React.js (Vite) - Rápido, moderno y escalable.
- **Estilos:** Tailwind CSS - Para un diseño limpio y responsivo ("Mobile First").
- **Backend/Base de Datos:** Firebase Firestore - Base de Datos NoSQL en tiempo real.
- **Autenticación:** Firebase Auth - (Google Sign-In / Email-Password).
- **Hosting:** Firebase Hosting - Despliegue rápido y seguro.
- **Gráficos:** Recharts - Librería ligera para visualización de datos.
- **Exportación:** `xlsx` (SheetJS) - Para generar archivos Excel con tablas y fórmulas.
- **Iconos:** Lucide React - Iconografía moderna y minimalista.

## 📊 Categorías de Gastos a Implementar
La IA encargada del desarrollo debe incluir las siguientes categorías base:
1. **Vivienda:** Alquiler/Hipoteca, Servicios (Agua, Luz, Gas, Internet), Mantenimiento.
2. **Alimentación:** Supermercado, Restaurantes, Café/Snacks.
3. **Transporte:** Combustible, Transporte Público, Mantenimiento de Vehículo, Seguros.
4. **Salud:** Seguro Médico, Farmacia, Consultas.
5. **Entretenimiento:** Streaming (Netflix, Spotify), Cine, Hobbies.
6. **Educación:** Cursos, Libros, Mensualidades.
7. **Personal:** Gimnasio, Peluquería, Ropa.
8. **Financiero:** Deudas, Tarjetas de Crédito, Préstamos.
9. **Ahorro/Inversión:** Fondo de emergencia, Inversiones.

## 🚀 Funcionalidades Clave
1. **Dashboard Principal:** Tarjetas con (Gasto Total Mes, Gasto Diario Promedio, Categoría más alta). Gráfico de torta (Distribución por categoría) y Gráfico de barras (Gasto vs Presupuesto).
2. **Gestión de Gastos:** Formulario rápido para añadir gastos (Monto, Categoría, Fecha, Nota).
3. **Filtros Avanzados:** Por mes, por categoría o rango de fechas.
4. **Exportación Excel:** Botón "Exportar a Excel" que genere un archivo con:
   - Tabla detallada de todos los movimientos.
   - Resumen por categorías.
   - Sumatorias automáticas y fórmulas básicas de Excel pre-insertadas.
5. **Autenticación:** Registro de usuarios para que cada uno tenga su propia base de datos privada.

## 📂 Guías Adicionales
Para el desarrollo detallado, consulta:
- `README_DATABASE.md`: Estructura de la base de datos Firestore.
- `README_FRONTEND.md`: Detalles de UI/UX y Lógica de Cálculos.
- `README_FIREBASE_SETUP.md`: Guía de despliegue y configuración inicial.
- `TASKS_BACKLOG.md`: Lista paso a paso de tareas de desarrollo.
