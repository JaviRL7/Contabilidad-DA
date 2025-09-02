# Contabilidad-DA

Sistema de contabilidad personal con arquitectura moderna separando frontend y backend.

## 🚀 Tecnologías

**Backend:**
- FastAPI (Python)
- SQLAlchemy ORM
- SQLite Database
- Documentación automática

**Frontend:**
- React + TypeScript
- Vite (Build tool)
- Tailwind CSS
- Axios (HTTP client)

## 📦 Instalación

### Backend
```bash
cd backend
python -m venv venv
source venv/bin/activate  # Linux/Mac
pip install -r requirements.txt
python init_db.py
python run_dev.py
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

## 📱 Funcionalidades

- Visualización de movimientos diarios
- Gestión de ingresos y gastos
- Cálculo automático de balances
- API REST completa
- Interfaz responsive

## 🗄️ Estructura

```
contabilidad-web/
├── backend/          # API FastAPI
├── frontend/         # App React
└── docker-compose.yml
```

## 📄 API Endpoints

- `GET /api/movimientos/` - Listar movimientos
- `POST /api/movimientos/` - Crear movimiento
- `GET /api/etiquetas/` - Listar etiquetas

Desarrollado con ❤️ para gestión de finanzas personales.
