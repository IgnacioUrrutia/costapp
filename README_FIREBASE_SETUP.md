# README: Configuración y Despliegue en Firebase

Esta guía orienta a la IA desarrolladora en los pasos necesarios para configurar el entorno de Firebase y publicar la aplicación.

## 🔑 1. Configuración de Firebase Console
1. **Crear un nuevo proyecto:** Llamarlo `gastos-mensuales-app`.
2. **Habilitar Autenticación:** Activar "Email/Password" y opcionalmente "Google".
3. **Crear base de datos Firestore:** Iniciar en "Modo de Producción" (luego aplicar las reglas de `README_DATABASE.md`).
4. **Habilitar Hosting:** Preparar para el despliegue de la aplicación web.

## 🛠️ 2. Inicialización Local
La IA debe ejecutar los siguientes comandos en la raíz del proyecto:

```bash
# Instalar dependencias de Firebase
npm install firebase

# Inicializar Firebase CLI
firebase init
```

Durante `firebase init`, se debe seleccionar:
- **Hosting:** Configurar como Single Page App (SPA).
- **Public Directory:** `dist` (si se usa Vite).
- **GitHub Actions:** Opcional, para despliegue automático.

## 🌐 3. Variables de Entorno
Configurar un archivo `.env` en la raíz de React con las credenciales de Firebase:

```text
VITE_FIREBASE_API_KEY=tu_api_key
VITE_FIREBASE_AUTH_DOMAIN=tu_auth_domain
VITE_FIREBASE_PROJECT_ID=tu_project_id
VITE_FIREBASE_STORAGE_BUCKET=tu_storage_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=tu_sender_id
VITE_FIREBASE_APP_ID=tu_app_id
```

## 🚀 4. Despliegue (Build & Deploy)
Para subir la aplicación a internet:

```bash
# Generar la versión de producción
npm run build

# Desplegar a Firebase
firebase deploy
```

---
**Nota Final:** Asegurarse de que el dominio autorizado en Firebase Auth incluya el dominio generado por Firebase Hosting para que el Login funcione correctamente.
