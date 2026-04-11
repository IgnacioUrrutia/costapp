# CostApp — Backlog de Producto

> Basado en investigación de mercado 2025: análisis de YNAB, Monarch Money, tendencias LatAm,
> pain points reales de usuarios (overspending 55.9%, deuda récord, falta de fondo de emergencia).
> Objetivo: pasar de "app que reporta" a "app que cambia comportamiento financiero".

---

## Estado actual

La app base está completa y desplegada. Todas las funciones del MVP están operativas.
El foco ahora es **retención, diferenciación y nuevos modos**.

---

## TIER 1 — Quick Wins
*Alto impacto, poco esfuerzo. Próximas sesiones.*

- [x] **Proyección de fin de mes**
  Widget en Dashboard: "Si sigues gastando igual, terminarás el mes con $X".
  Cálculo: promedio diario actual × días restantes del mes.

- [x] **Emergency Fund Tracker**
  Widget en Dashboard: meta visual de 3 meses de gastos como fondo de emergencia.
  El 55% de los usuarios no tiene este colchón — es el feature más buscado.

- [x] **Gráfico de torta por categoría en Dashboard**
  Ya existe en ResumenAnual, traerlo al Dashboard principal con Recharts PieChart.

- [x] **Streak de presupuesto**
  Contador: "Llevas X días sin exceder tu presupuesto diario".
  Gamificación simple — aumenta el engagement y la retención.

- [x] **Swipe to delete en mobile**
  Gesto nativo en filas de gastos/recurrentes. UX esperada en cualquier app móvil.

- [x] **Auto dark/light por hora**
  Dark mode automático de 20:00 a 07:00. Toggle manual como override.
  Toggle en Configuración > Apariencia para activar/desactivar.

- [x] **Búsqueda global**
  Barra central o Cmd+K que busca en gastos, tarjetas, deudas y metas a la vez.

---

## TIER 2 — Core Features
*Las funciones que hacen que los usuarios se queden. Alta retención según research.*

- [x] **AI Coach local (sin API externa)**
  Panel colapsable en Dashboard con hasta 4 insights del mes:
  spikes por categoría, desviaciones vs mes anterior, ritmo de gasto, presupuestos excedidos.

- [x] **Cash Flow Projection 3-6 meses**
  Página `/proyeccion` con AreaChart y tabla mes a mes.
  Promedio de últimos 3 meses como base del gasto estimado.

- [x] **Zero-Based Budgeting mode**
  Página `/presupuesto` — asigna cada peso a una categoría, barra de progreso hacia $0 sin asignar.
  Botón "Distribuir restante" reparte automáticamente el sobrante.

- [x] **Modo Pareja / Familia**
  Página `/familia` con 3 tabs: Grupo (personas), Gastos (split con cuotas), Balances (quién debe qué).
  Datos locales en Firestore. Sin sincronización entre cuentas (arquitectura lista para expandir).

- [x] **Onboarding guiado al primer login**
  Modal 3 pasos (sueldo → saldo débito → done) cuando salary=0.
  Se muestra automáticamente y se puede posponer.

- [ ] **PDF mensual automático**
  Generado el día 1 de cada mes, guardado en historial dentro de la app.
  El usuario lo recibe sin tener que pedirlo.

- [x] **Side hustle / ingresos variables tracker**
  Tags por fuente en ingresos adicionales: Freelance, Arriendo, Bono, Horas Extra, Venta, Otro.
  Gráfico de desglose por fuente cuando hay más de un tipo.

---

## TIER 3 — Modo Tarjetas
*Menú propio separado. Switch de modo en el header.*
*Prerequisito: implementar ModeContext con switch PERSONAL | TARJETAS.*

- [x] **Arquitectura de modos**
  `ModeContext` con estado global del modo activo.
  Switch PERSONAL | TARJETAS en Navbar. ModeProvider en App.jsx.

- [x] **Vista tarjeta física realista**
  Card visual con chip EMV, número enmascarado (•••• •••• •••• 1234), banco y gradiente.

- [x] **Estado de cuenta por período de corte**
  Tabla de gastos por período (fecha de corte → fecha de corte), no por mes calendario.
  Fecha de corte y fecha de pago configurables por tarjeta.

- [x] **Listado de cuotas activas**
  Ver todas las compras en cuotas: cuánto se ha pagado, cuánto falta, fecha de término.
  Alerta cuando queda 1 cuota.

- [x] **Simulador de cuotas con CAE**
  Input: monto compra, número de cuotas, tasa de interés.
  Output: monto real pagado, costo financiero total, CAE calculado.

- [x] **Split de gasto entre personas**
  En página Familia: registra gasto, elige quién pagó, asigna cuota por persona.
  Botón "Dividir parejo" o montos manuales. Balance neto por persona con desglose.

- [ ] **Límite de gasto por categoría por tarjeta**
  Presupuesto específico por tarjeta + categoría (no solo global).
  Alerta al acercarse al límite.

---

## TIER 4 — Engagement y Retención Profunda
*Lo que hace que los usuarios vuelvan todos los días.*

- [ ] **Widget Android**
  Saldo disponible en la pantalla de inicio sin abrir la app (Capacitor plugin).

- [x] **Logros / Badges**
  11 logros: Primer Paso, Presupuestador, Meta Alcanzada, Libre de Deudas, Racha 7d/30d,
  Colchón Inicial, Planificador, Mes Verde, Tarjeta Registrada, Mes Consistente.
  Página `/logros` con barra de progreso y estado bloqueado/desbloqueado.

- [x] **Notificación de gasto inusual**
  Detecta si el gasto de hoy supera 3x el promedio del mismo día de la semana (últimas 4 semanas).
  Aparece en el panel de notificaciones del Navbar.

- [x] **Educación financiera contextual**
  Panel colapsable en Dashboard con tips contextuales según datos del usuario:
  deudas → avalancha/bola de nieve, sin fondo emergencia → cómo crearlo, tarjetas → CAE, etc.
  8 tips rotatorios por día, descartables individualmente.

- [ ] **"Loud budgeting" — compartir límites**
  Feature para mostrar a amigos/familia tus límites de gasto de forma transparente.
  Link compartible con vista pública limitada (solo categorías y % usado).

---

## TIER 5 — Modo Cripto
*Dejar para después. Prerequisito: arquitectura de modos del Tier 3 lista.*

- [ ] Portfolio con balance total en CLP/USD
- [ ] Integración CoinGecko API para precios en tiempo real
- [ ] P&L realizado y no realizado
- [ ] DCA tracker (Dollar Cost Averaging)
- [ ] Import desde Binance CSV / Buda / Orionx
- [ ] Alertas de precio configurables
- [ ] Informe tributario de ganancias de capital

---

## Notas de arquitectura para modos

```
Header:  [ PERSONAL ]  [ TARJETAS ]  [ CRIPTO ]   ← selector de modo
Sidebar: cambia completamente según el modo activo
Rutas:   /personal/*, /tarjetas-pro/*, /cripto/*
Datos:   /users/{uid}/personal/expenses
         /users/{uid}/cards/transactions
         /users/{uid}/crypto/portfolio
```

Cada modo es independiente. Los datos no se cruzan entre modos.
