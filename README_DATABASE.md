# README: Estructura de la Base de Datos (Firestore)

Esta guía define cómo se debe estructurar la base de datos NoSQL en Firebase Firestore para que el sistema de costos sea eficiente y escalable.

## 🗄️ Colecciones

### 1. `users` (Colección)
Almacena la información de perfil y configuraciones del usuario.
- **Documento ID:** `UID` (proporcionado por Firebase Auth)
- **Campos:**
  - `email`: (String) Correo del usuario.
  - `displayName`: (String) Nombre para mostrar.
  - `currency`: (String) Moneda por defecto (ej: "USD", "COP").
  - `monthlyBudget`: (Number) Presupuesto total mensual global.
  - `createdAt`: (Timestamp) Fecha de registro.

### 2. `expenses` (Colección)
Contiene cada transacción/gasto individual.
- **Campos:**
  - `userId`: (String) UID del usuario dueño del gasto.
  - `amount`: (Number) El monto gastado (obligatorio).
  - `category`: (String) El nombre de la categoría (ej: "Vivienda", "Comida").
  - `description`: (String) Nota breve opcional.
  - `date`: (Timestamp) Fecha en que ocurrió el gasto.
  - `createdAt`: (Timestamp) Fecha de creación del registro.

### 3. `categories` (Colección o Constante)
*Recomendación:* Mantener una lista constante en el código para mayor velocidad, pero si se desea que el usuario las personalice, usar esta colección.
- **Campos:**
  - `name`: (String) Nombre legible.
  - `icon`: (String) Nombre del icono de Lucide.
  - `color`: (String) Código Hexadecimal (ej: "#EF4444").

## 🔐 Reglas de Seguridad (Security Rules)
Es vital que un usuario **solo pueda leer y escribir su propia data**. La IA desarrolladora debe aplicar estas reglas básicas:

```js
service cloud.firestore {
  match /databases/{database}/documents {
    match /expenses/{expenseId} {
      allow read, write: if request.auth != null && request.auth.uid == resource.data.userId;
      allow create: if request.auth != null && request.auth.uid == request.resource.data.userId;
    }
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

## 📊 Índices Requeridos
Se necesitará un índice compuesto para consultas eficientes en el Dashboard:
- `userId` (Ascendente) + `date` (Descendente)
- `userId` (Ascendente) + `category` (Ascendente) + `date` (Descendente)
