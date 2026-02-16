# 🛠️ Service Manager Web

[Português](./README.pt-br.md) | [English](./README.md) | **Español**

![Badge Status](https://img.shields.io/badge/Estado-Completado-success)
![Badge Node](https://img.shields.io/badge/Node.js-v18+-green)
![Badge Firebird](https://img.shields.io/badge/Base_de_Datos-FirebirdSQL-orange)
![Badge License](https://img.shields.io/badge/Licencia-MIT-blue)

> **Modernización de la Gestión de Órdenes de Servicio:** Aplicación web Fullstack desarrollada para integrar y modernizar flujos de trabajo en centros de soporte técnico que utilizan bases de datos legadas (Firebird SQL).

## 🎯 Sobre el Proyecto

Este proyecto surge de la necesidad de agilizar la atención en entornos de asistencia técnica. El objetivo principal fue crear una interfaz web moderna, responsiva y ágil que consume datos directamente de un ERP Desktop legado, sin necesidad de migraciones complejas de datos.

El sistema permite que los técnicos gestionen Órdenes de Servicio (OS) en tiempo real, capturen firmas digitales y eliminen el uso de papel físico en las operaciones diarias, facilitando la rutina y acelerando los procedimientos estándar de la empresa.

## ✨ Funcionalidades Clave

* **📊 Dashboard Interactivo:** Vista general de OS nuevas, en progreso y completadas con indicadores de rendimiento en tiempo real.
* **📋 Flujo de Trabajo Moderno:** Actualización rápida de estados (Nueva → En Progreso → Completada) mediante una interfaz limpia y enfocada en el técnico.
* **✍️ Firma Digital:** Captura de firmas directamente en pantalla (touch o mouse) usando `signature_pad`.
* **🖨️ Impresión Inteligente:** Diseño CSS optimizado tanto para impresoras térmicas (ticket) como para hojas A4 estándar.
* **🔍 Búsqueda Optimizada:** Búsqueda inteligente de clientes y OS diseñada para manejar las restricciones de la base de datos legada de manera eficiente.

## 🛠️ Tecnologías Utilizadas

* **Backend:** Node.js, Express.js.
* **Frontend:** EJS (Server-side rendering), CSS3 Responsivo, JavaScript (ES6+).
* **Base de Datos:** Firebird SQL (Integración directa vía `node-firebird`).
* **Herramientas:** `dotenv` (variables de entorno), `express-session` (autenticación).

## 📸 Screenshots

| Dashboard | Editor de OS |
| :---: | :---: |
| <img src="https://github.com/user-attachments/assets/9bf82179-53c5-44db-83ce-3b4fcf974111" width="400"> | <img src="https://github.com/user-attachments/assets/7fec92ac-73a2-4c5d-ae22-ca274ed741b4" width="400"> |

| Flujo Kanban | Firma Digital |
| :---: | :---: |
| <img src="https://github.com/user-attachments/assets/ee7f9aab-adb0-4c16-ad36-2acb867d4e51" width="400"> | <img src="https://github.com/user-attachments/assets/bbb76887-f5d6-4208-9ddf-79fe4a65b225" width="400"> |

## 🚀 Cómo Empezar

### Requisitos previos

* [Node.js](https://nodejs.org/) instalado (v18 o superior).
* Motor de Firebird instalado (o acceso a un archivo `.FDB`).

### Instalación

1. **Clonar y configurar el proyecto:**

   ```bash
   # Clonar el repositorio
   git clone [https://github.com/theussant/service-manager-web.git](https://github.com/theussant/service-manager-web.git)
   cd service-manager-web

   # Instalar dependencias
   npm install

   # Configurar ambiente (Copie el .env.example a .env y configure sus credenciales)
   cp .env.example .env

   # Ejecutar la aplicación
   npm start