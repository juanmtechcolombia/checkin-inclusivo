# Check-in Inclusivo 🏨✨

Este es el **MVP de la Aplicación de Check-in Inclusivo**, diseñado específicamente para huéspedes con ansiedad social. Permite completar la gran mayoría del proceso de registro de manera digital y planificar la llegada al lobby del hotel en franjas horarias con menor afluencia de personas (Lobby Silencioso).

## 🚀 Arquitectura General del Sistema

El proyecto está estructurado como un monorepositorio que utiliza **NPM Workspaces** para gestionar dependencias de forma centralizada y compartir tipados estáticos entre el backend y el frontend.

```mermaid
graph TD
    Client[Cliente Web / React SPA] <-->|HTTP/REST| API[NestJS API Gateway]
    API <-->|Prisma ORM| DB[(PostgreSQL Database)]
    API -->|Cifrado AES-256-CBC| Vault[Bóveda de Datos Sensibles]
    API <-->|Puertos/Adaptadores| PMS[Mock PMS / Integración Hotel]
    API <-->|Puertos/Adaptadores| Locks[Mock Cerraduras Inteligentes]
```

### Componentes Principales:
1. **`packages/shared`**: Definiciones comunes de TypeScript (Enums de estados, constantes, tipados de DTOs y tipos compartidos).
2. **`apps/api`**: Servidor NestJS con arquitectura hexagonal (puertos y adaptadores para integrarse con PMS, cerraduras y canales de notificación). Usa **Prisma ORM** y Postgres.
3. **`apps/web`**: SPA construida en React con Vite, TypeScript y TailwindCSS (o CSS nativo) que implementa las interfaces premium para el huésped y el panel del staff del hotel.

---

## 🛠️ Tecnologías Utilizadas

- **Monorepo**: NPM Workspaces
- **Backend**: NestJS (Node.js), TypeScript, Swagger, Jest
- **Frontend**: React 19, Vite, TypeScript, Lucide Icons, Vanilla CSS
- **Base de datos & ORM**: PostgreSQL, Prisma ORM
- **Seguridad**: JWT (Autenticación), Bóveda Criptográfica con `aes-256-cbc` y hashes SHA-256 para desafíos.
- **Entorno**: Docker, Docker Compose, Nginx (Servidor de Estáticos para React)

---

## 📂 Estructura de Directorios

```text
checkin-inclusivo/
├── apps/
│   ├── api/                   # Backend NestJS
│   │   ├── Dockerfile
│   │   ├── src/
│   │   │   ├── common/        # Helpers globales (Vault de seguridad)
│   │   │   ├── modules/       # Módulos del dominio (Auth, Check-in, Guest, Hotel, Integrations)
│   │   │   └── prisma/        # Esquema y semillas de base de datos
│   │   └── package.json
│   └── web/                   # Frontend React
│       ├── Dockerfile
│       ├── src/
│       │   ├── components/    # Componentes UI reutilizables
│       │   ├── pages/         # Vistas principales (StaffPanel, GuestPreCheckIn, etc.)
│       │   └── index.css      # Estilos generales
│       └── package.json
├── packages/
│   └── shared/                # Código común compartido
│       ├── src/               # Enums, Constantes, Tipados
│       └── package.json
├── docker-compose.yml         # Orquestación de contenedores
├── package.json               # Configuración del monorepositorio
└── tsconfig.base.json         # Configuración base de TypeScript
```

---

## 🏃 Cómo Ejecutar el Proyecto

### Opción 1: Ejecución con Docker Compose (Recomendado)
Para iniciar toda la infraestructura (Base de datos PostgreSQL, API backend y Frontend web) en un solo comando:

```bash
docker compose up -d --build
```

Esto levantará los siguientes servicios:
- **Base de datos**: PostgreSQL corriendo en el puerto `5432`.
- **Backend API**: NestJS en el puerto `3001` (Swagger docs disponibles en `http://localhost:3001/docs`).
- **Frontend Web**: React SPA servida con Nginx en el puerto `5173`.

#### Inicializar Base de Datos en Docker:
Para sincronizar las tablas del esquema Prisma y poblar los datos de prueba en la base de datos de Docker:
```bash
# 1. Pusa el esquema de base de datos
$env:DATABASE_URL="postgresql://checkin:checkin_pass@localhost:5432/checkin_inclusivo?schema=public"; npm run db:push

# 2. Ejecuta las semillas
$env:DATABASE_URL="postgresql://checkin:checkin_pass@localhost:5432/checkin_inclusivo?schema=public"; npm run seed
```

---

### Opción 2: Desarrollo Local (Sin Docker)
Si deseas ejecutar los servicios directamente en tu host:

1. **Instalar Dependencias**:
   ```bash
   npm install
   ```

2. **Configurar el archivo `.env`**:
   Copia el archivo `.env.example` como `.env` y ajusta las variables según sea necesario:
   ```bash
   cp .env.example .env
   ```

3. **Iniciar Base de Datos de Desarrollo**:
   Asegúrate de tener una instancia de PostgreSQL en ejecución o levanta solo el servicio de base de datos de docker:
   ```bash
   docker compose up -d postgres
   ```

4. **Sincronizar y Sembrar la Base de Datos**:
   ```bash
   npm run db:push
   npm run seed
   ```

5. **Iniciar en Modo Desarrollo**:
   ```bash
   npm run dev
   ```
   Esto levantará el frontend en `http://localhost:5173` y el backend en `http://localhost:3001` con recarga activa.

---

## 🔑 Credenciales y Códigos de Demostración

- **Acceso del Staff (Panel Hotelero)**:
  - **URL**: `http://localhost:5173/staff` (o a través del enlace de administración)
  - **Usuario**: `admin@hotelsereno.co`
  - **Contraseña**: `admin123`

- **Códigos de Reserva de Huéspedes**:
  - **Reserva SERENO-2024-001**: Huésped listo para iniciar el proceso de Check-in digital.
  - **Reserva SERENO-2024-004**: Huésped que ya completó todo el flujo y cuenta con su llave digital activa en la app.

---

## 📖 Documentación Detallada de Arquitectura

Para conocer a fondo el modelo de seguridad (Bóveda de Datos Sensibles), la máquina de estados del check-in, el flujo criptográfico de autenticación en los tótems/puertas y el diseño del esquema de la base de datos, lee:
👉 **[Documento de Arquitectura y Seguridad (docs/architecture.md)](file:///d:/DEV/checkin-inclusivo/docs/architecture.md)**
