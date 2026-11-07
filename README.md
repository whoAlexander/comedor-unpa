# 🍽️ Gestión Integral del Comedor Universitario UNPA-UACO

Este proyecto es un sistema web completo desarrollado para administrar los pedidos, pagos y entregas del comedor de la Universidad Nacional de la Patagonia Austral (Unidad Académica Caleta Olivia). 

## 🚀 Enlaces del Proyecto
- **Frontend (Sitio Web):** [https://tu-enlace-de-netlify.netlify.app](https://tu-enlace-de-netlify.netlify.app)
- **Backend (API):** [https://comedor-unpa-jptp.onrender.com/docs](https://comedor-unpa-jptp.onrender.com/docs)

## 🛠️ Tecnologías Utilizadas

El proyecto utiliza una arquitectura *Split-Stack* (Frontend y Backend separados) para garantizar escalabilidad e independencia de capas.

**Frontend:**
- React + TypeScript
- Vite (Empaquetador)
- Despliegue: Netlify

**Backend:**
- Python + FastAPI
- Despliegue: Render

**Base de Datos:**
- MongoDB Atlas (NoSQL en la nube)

## ✨ Características Principales
- **Gestión de Usuarios y Roles:** Perfiles de acceso para estudiantes, docentes y nodocentes.
- **Sistema de Precios Dinámicos:** Implementación de cálculo de menús según el rol (Ej: Menú Estudiantil $2.050, Menú Docente $4.100 - $4.500).
- **Ciclo de Vida del Pedido:** Manejo estructurado del estado del pedido (Pendiente, Pagado, Preparado, Entregado).
- **Retiro Inteligente:** Sistema de validación de recojo de viandas mediante lectura de códigos QR.
- **Accesibilidad:** Barra de herramientas nativa para ajustar el tamaño del texto y el contraste visual de la interfaz.

## ⚙️ Instalación y Ejecución Local

Para ejecutar este proyecto en un entorno de desarrollo local, se requiere **Node.js/Yarn** y **Python 3**.

### 1. Clonar el repositorio
```bash
git clone [https://github.com/whoAlexander/comedor-uaco.git](https://github.com/whoAlexander/comedor-uaco.git)
cd comedor-uaco
