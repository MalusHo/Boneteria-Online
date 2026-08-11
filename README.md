
  # Carrito de compras app

  This is a code bundle for Carrito de compras app. The original project is available at https://www.figma.com/design/ltTxg2H4vILCzvxjvxfYPN/Carrito-de-compras-app.

  # 🛒 Application - Carrito de Compras con Firebase & React

Una aplicación web de comercio electrónico moderna, rápida y segura construida con **React**, **TypeScript** y **Firebase**. El sistema cuenta con autenticación de usuarios, gestión de carrito en tiempo real, control de accesos por roles (Admin/Usuario) y un sistema robusto de procesamiento de pedidos con validación atómica de inventario.

---

## Características Principales

* **Autenticación Completa y Segura:** Registro de usuarios, inicio de sesión y verificación obligatoria por correo electrónico mediante Firebase Auth.
* **Control de Acceso basado en Roles (RBAC):** * *Usuarios:* Navegan por productos, gestionan su carrito y visualizan exclusivamente sus propios pedidos de forma histórica.
    * *Administradores:* Acceso global para visualizar, auditar y actualizar el estado de todos los pedidos del sistema en tiempo real.
* **Gestión de Carrito Dinámica:** Permite añadir, remover y actualizar cantidades de productos, respetando los límites de stock disponibles en tiempo real.
* **Transacciones Atómicas (Anti-Race Conditions):** El procesamiento de compras implementa `runTransaction` de Firestore, asegurando la regla estricta de *Lecturas primero, Escrituras después*. Esto previene errores de sobreventa si dos usuarios compran el mismo producto en el mismo milisegundo.
* **Sincronización en Tiempo Real:** Interfaz reactiva gracias a listeners dinámicos (`onSnapshot`) que actualizan el catálogo de productos y estados de órdenes de inmediato sin recargar la página.

---

## Tecnologías Utilizadas

* **Frontend:** React, TypeScript, Context API (Gestión de Estado Global).
* **Empaquetador:** Vite (Compilación optimizada y hashes de producción).
* **Backend as a Service (BaaS):** Firebase.
    * **Firebase Authentication:** Registro, login y verificación.
    * **Cloud Firestore:** Base de datos NoSQL para persistencia en tiempo real.

---

## Estructura de la Base de Datos (Cloud Firestore)

El sistema utiliza tres colecciones principales estructuradas en documentos NoSQL:

### 1. Colección `users`
| Campo | Tipo | Descripción |
| :--- | :--- | :--- |
| `name` | string | Nombre completo del usuario |
| `email` | string | Correo electrónico de registro |
| `role` | string | Rol asignado (`"user"` o `"admin"`) |

### 2. Colección `products`
| Campo | Tipo | Descripción |
| :--- | :--- | :--- |
| `name` | string | Nombre del artículo |
| `description`| string | Detalle del producto |
| `price` | number | Precio unitario |
| `category` | string | Categoría principal |
| `subcategory` | string | Subcategoría de ordenamiento |
| `stock` | number | Inventario disponible en almacén |
| `image` | string | URL o ruta de la imagen del producto |

### 3. Colección `orders`
| Campo | Tipo | Descripción |
| :--- | :--- | :--- |
| `userId` | string | ID del cliente que realizó la compra |
| `items` | array | Lista de productos comprados (`Product` + `quantity`) |
| `total` | number | Monto total de la transacción |
| `status` | string | Estado (`"pending"`, `"processing"`, `"ready-for-pickup"`, `"completed"`) |
| `createdAt` | timestamp| Fecha y hora exacta de la creación de la orden |

---

## Instalación y Configuración Local

Sigue estos pasos para levantar el entorno de desarrollo local:

### 1. Clonar el repositorio privado
```bash
git clone [https://github.com/MalusHo/Boneteria-Online.git]https://github.com/MalusHo/Boneteria-Online.git)
cd Boneteria-Online
```

## 2. Instalar las dependencias del proyecto
```bash
npm install
```

## 3. Configurar variables de entorno
Crea un archivo llamado .env.local en la raíz del proyecto y agrega tus credenciales de configuración de Firebase (este archivo está protegido y excluido en el .gitignore):

```bash
Fragmento de código
VITE_FIREBASE_API_KEY=tu_api_key
VITE_FIREBASE_AUTH_DOMAIN=tu_auth_domain
VITE_FIREBASE_PROJECT_ID=tu_project_id
VITE_FIREBASE_STORAGE_BUCKET=tu_storage_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=tu_messaging_sender_id
VITE_FIREBASE_APP_ID=tu_app_id
```
## 4. Ejecutar la aplicación en desarrollo
```bash
npm run dev
```
Abre http://localhost:5173 en tu navegador para ver el resultado.

## 5. Compilar para Producción
Para verificar la integridad de los tipos de TypeScript y generar el build optimizado:
```bash  
npm run build
```

## Web del proyecto
Puedes entrar a la web para verificarla por el siguiente link: https://boneteriaec.web.app/

### Notas de Seguridad y Git
  
El repositorio cuenta con un archivo .gitignore estricto que previene la fuga de credenciales locales (.env), carpetas de dependencias pesadas (node_modules/), y directorios temporales de compilación en producción (dist/, build/), garantizando un entorno de desarrollo limpio y seguro para el equipo de trabajo.