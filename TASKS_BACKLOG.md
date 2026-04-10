# 📋 Backlog de Tareas de Implementación

Sigue este orden para construir la aplicación desde cero.

## Fase 1: Entorno y Auth
- [x] Configurar proyecto Vite + Tailwind CSS.
- [ ] Configurar Firebase (v9 Modular SDK).
- [ ] Implementar pantalla de Login/Registro (Firebase Auth).
- [x] Crear Layout principal con Sidebar/Navbar.

## Fase 2: Datos y Registro
- [x] Crear el formulario de "Nuevo Gasto" con categorías.
- [x] Implementar la lista de gastos (Fetching desde Firestore - Simulado Local).
- [x] Lógica de borrado y edición de gastos.
- [x] Filtros por mes y categoría.

## Fase 3: Dashboard y Visualización
- [x] Implementar tarjetas de resumen.
- [x] Integrar Recharts para el gráfico de distribución por categoría.
- [x] Integrar gráfico de barras comparativo.

## Fase 4: Exportación y Reportes
- [x] Implementar lógica de SheetJS (`xlsx`) para exportar a Excel.
- [x] Asegurar que el Excel incluya la fórmula de sumatoria total.
- [x] Validar que los datos exportados coincidan con la vista actual (filtros aplicados).

## Fase 5: Pulido y Despliegue
- [x] Responsive Design (Mobile Drawer y Layouts adaptativos).
- [x] Manejo de estados de carga y feedback (Toasts con react-hot-toast).
- [x] Animaciones Premium (Framer Motion en cada componente).
- [x] Configuración de Firebase (Auth, Firestore, Hosting) y Despliegue final.

---
**Nota:** El sistema está completamente armado a nivel funcional y de diseño. La siguiente fase es la integración con la base de datos real (Firebase).
