# Contabilidad Doña Araña

*Dedicado a mi madre y a todos los pequeños comerciantes*

---

## Historia y Motivación

Mi madre tiene un local que ha llevado por muchos años completamente sola. Siempre quiso tener una aplicación para llevar las cuentas de la manera más automática y simple posible, sin tener que manejar un Excel enorme y complicado. Viendo esta necesidad, me dispuse a crear esta herramienta.

Trabajar para mi madre es un placer, porque ella me lo dio todo. Este proyecto está totalmente adaptado para los pequeños negocios llevados por personas de mediana edad que han llevado toda su vida sacrificándose por los demás sin parar. He desarrollado este software enfocándome en ellos, priorizando la facilidad de uso y el entendimiento intuitivo.

Este sistema está pensado para comerciantes, dueños de pequeños locales y emprendedores que necesitan una herramienta simple pero completa para gestionar sus finanzas diarias sin complicaciones técnicas.

---

## Vista General del Sistema

### Pantalla Principal - Historial de Movimientos
![Historial](frontend/public/c2.PNG)
*Vista principal donde se muestran todos los movimientos financieros organizados por día con balances automáticos.*

### Búsqueda Inteligente
![Búsqueda](frontend/public/c3.PNG)
*Sistema de búsqueda avanzado con filtros por fecha, tipo, etiqueta y monto para encontrar rápidamente cualquier transacción.*

### Gestión de Etiquetas
![Etiquetas](frontend/public/c4.PNG)
*Administración completa de categorías con diferenciación entre gastos esenciales y opcionales, colores personalizados y estadísticas.*

### Gastos Recurrentes
![Recurrentes](frontend/public/c5.PNG)
*Seguimiento de gastos que se repiten mensualmente para mejor planificación financiera.*

### Análisis de Desgloses
![Desgloses](frontend/public/c6.PNG)
*Análisis detallado con gráficos interactivos para entender patrones de gasto e ingreso por categorías.*

### Vista de Análisis Avanzado
![Análisis](frontend/public/c7.PNG)
*Dashboard completo con métricas, tendencias y análisis predictivo para toma de decisiones informadas.*

### Calendario Financiero
![Calendario](frontend/public/c8.PNG)
*Vista calendario que muestra el flujo financiero día a día con indicadores visuales de ingresos y gastos.*

---

## Tecnologías Utilizadas

### Backend - API Robusta
- **FastAPI**: Framework moderno de Python para APIs de alta performance
- **SQLAlchemy**: ORM avanzado para manejo de base de datos
- **SQLite**: Base de datos ligera pero potente
- **Uvicorn**: Servidor ASGI de alta velocidad
- **Documentación automática**: Swagger UI integrado

### Frontend - Interfaz Moderna
- **React 18**: Librería de interfaz de usuario con hooks modernos
- **TypeScript**: Tipado estático para mayor robustez del código
- **Vite**: Build tool ultra-rápido para desarrollo
- **Tailwind CSS**: Framework de CSS utilitario para diseño responsive
- **Lucide React**: Iconos modernos y consistentes
- **Axios**: Cliente HTTP para comunicación con la API

### Características Especiales
- **Responsive Design**: Optimizado para móviles y escritorio
- **Dark/Light Mode**: Tema claro y oscuro para comodidad visual
- **Real-time Updates**: Actualizaciones inmediatas sin recargar página
- **Validación Completa**: Validación tanto en frontend como backend
- **Análisis Visual**: Gráficos interactivos con múltiples tipos de visualización

---

## Estructura del Proyecto

```
contabilidad-web/
├── backend/                   # API Server (FastAPI)
│   ├── main.py               # Punto de entrada de la aplicación
│   ├── models.py             # Modelos de base de datos (SQLAlchemy)
│   ├── database.py           # Configuración de base de datos
│   ├── init_db.py            # Inicialización de base de datos
│   ├── run_dev.py            # Script de desarrollo
│   ├── requirements.txt      # Dependencias de Python
│   └── venv/                 # Entorno virtual
│
├── frontend/                 # Cliente React
│   ├── src/
│   │   ├── AppRefactored.tsx        # Componente principal
│   │   ├── components/
│   │   │   ├── dashboard/           # Componentes del dashboard
│   │   │   ├── forms/               # Formularios
│   │   │   ├── modals/              # Modales (crear/editar)
│   │   │   ├── views/               # Vistas principales
│   │   │   ├── charts/              # Componentes de gráficos
│   │   │   ├── ui/                  # Componentes UI reutilizables
│   │   │   ├── layout/              # Componentes de layout
│   │   │   ├── breakdown/           # Análisis y desgloses
│   │   │   └── analysis/            # Análisis avanzado
│   │   ├── utils/                   # Utilidades y helpers
│   │   └── types/                   # Definiciones de TypeScript
│   ├── public/               # Archivos estáticos del frontend
│   │   ├── Logo1.png        # Logo de la aplicación
│   │   └── c2.PNG - c8.PNG  # Screenshots de la aplicación
│   ├── package.json          # Dependencias de Node.js
│   ├── tailwind.config.js    # Configuración de Tailwind
│   ├── tsconfig.json         # Configuración de TypeScript
│   └── vite.config.ts        # Configuración de Vite
│
├── docker-compose.yml       # Configuración de Docker (opcional)
├── install.sh              # Script de instalación automática
└── README.md               # Este archivo
```

---

## Instalación y Configuración

### Instalación Rápida (Recomendada)
```bash
# Clonar el repositorio
git clone <repository-url>
cd contabilidad-web

# Ejecutar script de instalación automática
chmod +x install.sh
./install.sh
```

### Instalación Manual

#### 1. Backend (API)
```bash
cd backend

# Crear entorno virtual
python3 -m venv venv
source venv/bin/activate  # Linux/Mac
# o en Windows: venv\Scripts\activate

# Instalar dependencias
pip install -r requirements.txt

# Inicializar base de datos
python init_db.py

# Ejecutar servidor de desarrollo
python run_dev.py
```

El backend estará disponible en `http://localhost:8000`
- API Docs: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

#### 2. Frontend (Cliente React)
```bash
cd frontend

# Instalar dependencias
npm install

# Ejecutar en modo desarrollo
npm run dev
```

El frontend estará disponible en `http://localhost:5173`

---

## Funcionalidades Principales

### Gestión Financiera Completa
- **Registro de Movimientos**: Añade ingresos y gastos de forma rápida e intuitiva
- **Categorización Inteligente**: Sistema de etiquetas con colores y tipos (esencial/opcional)
- **Balance Automático**: Cálculo automático de balances diarios y acumulados
- **Historial Detallado**: Visualización chronológica de todos los movimientos

### Búsqueda y Filtrado Avanzado
- **Búsqueda por Texto**: Encuentra movimientos por descripción
- **Filtros por Fecha**: Rangos de fechas personalizables
- **Filtro por Tipo**: Ingresos, gastos o ambos
- **Filtro por Etiqueta**: Filtra por categorías específicas
- **Filtro por Monto**: Rangos de montos personalizables

### Análisis y Reportes
- **Gráficos Interactivos**: Múltiples tipos de visualización
- **Análisis por Categorías**: Distribución de gastos e ingresos
- **Tendencias Temporales**: Evolución de las finanzas en el tiempo
- **Gastos Esenciales vs Opcionales**: Análisis de prioridades
- **Vista Calendario**: Visualización mensual de flujo financiero

### Sistema de Etiquetas Avanzado
- **Creación Rápida**: Añade etiquetas sobre la marcha
- **Colores Personalizables**: Identifica visualmente las categorías
- **Tipos Diferenciados**: Distingue entre gastos e ingresos
- **Clasificación**: Marca gastos como esenciales u opcionales
- **Estadísticas**: Ve cuánto gastas en cada categoría

### Gastos Recurrentes
- **Seguimiento Mensual**: Identifica patrones de gasto
- **Planificación**: Anticipa gastos fijos
- **Análisis de Tendencias**: Ve cómo evolucionan tus gastos regulares

---

## Características de Diseño

### Responsive Design
- **Mobile First**: Optimizado para dispositivos móviles
- **Tablet Friendly**: Experiencia perfecta en tablets
- **Desktop Enhanced**: Aprovecha pantallas grandes

### Temas Visuales
- **Modo Oscuro**: Reduce fatiga visual en ambientes con poca luz
- **Modo Claro**: Interfaz clara y limpia para uso diario
- **Transiciones Suaves**: Animaciones elegantes entre estados

### Experiencia de Usuario
- **Navegación Intuitiva**: Header responsive con menú hamburguesa
- **Feedback Visual**: Confirmaciones y estados de carga
- **Accesibilidad**: Contraste adecuado y navegación por teclado

---

## Scripts Disponibles

### Backend
```bash
python run_dev.py          # Servidor de desarrollo
python init_db.py          # Inicializar base de datos
python -m pytest           # Ejecutar tests (si están configurados)
```

### Frontend
```bash
npm run dev                # Servidor de desarrollo
npm run build              # Build para producción
npm run preview            # Preview del build
npm run lint               # Linter
npm run typecheck          # Verificación de tipos TypeScript
```

---

## API Endpoints

### Movimientos
- `GET /api/movimientos/` - Obtener todos los movimientos
- `POST /api/movimientos/` - Crear nuevo movimiento
- `GET /api/movimientos/{id}` - Obtener movimiento específico
- `PUT /api/movimientos/{id}` - Actualizar movimiento
- `DELETE /api/movimientos/{id}` - Eliminar movimiento

### Etiquetas
- `GET /api/etiquetas/` - Obtener todas las etiquetas
- `POST /api/etiquetas/` - Crear nueva etiqueta
- `PUT /api/etiquetas/{id}` - Actualizar etiqueta
- `DELETE /api/etiquetas/{id}` - Eliminar etiqueta

### Búsqueda y Análisis
- `GET /api/movimientos/buscar` - Búsqueda avanzada
- `GET /api/analisis/resumen` - Resumen financiero
- `GET /api/analisis/categorias` - Análisis por categorías

---

## Contribuciones

Este proyecto está dedicado especialmente a mi madre y a todas las mujeres emprendedoras. Si tienes ideas para mejorarlo o quieres contribuir para ayudar a más pequeños empresarios, ¡todas las contribuciones son bienvenidas!

### Cómo Contribuir
1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

---

## Licencia

Este proyecto está bajo la Licencia MIT - ve el archivo `LICENSE` para más detalles.

---

## Mensaje Final

*Para mi madre: Gracias por ser mi inspiración constante. Por enseñarme que con trabajo duro y dedicación se puede lograr cualquier cosa. Por mostrarme lo que significa ser fuerte, independiente y nunca rendirse. Este pequeño proyecto es mi manera de decirte que admiro todo lo que has logrado y espero que esto pueda hacer tu día a día un poquito más fácil.*

*Para todas las mujeres emprendedoras: Ustedes son las verdaderas heroínas de nuestras comunidades. Siguen adelante, nunca se rindan, y sepan que hay quienes admiramos su fortaleza y dedicación.*

---

**Desarrollado con ❤️ por un hijo orgulloso para su heroína y todas las emprendedoras valientes.**

*Versión 1.0 - 2024*