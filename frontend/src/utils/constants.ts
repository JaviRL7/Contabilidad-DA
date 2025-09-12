// src/utils/constants.ts

// Detectar si estamos en producción basado en la URL actual
const isProduction = typeof window !== 'undefined' && 
  (window.location.hostname === 'contabilidad-da-production.up.railway.app' || 
   import.meta.env.PROD);

// Configuración de API con detección automática de entorno
export const API_BASE_URL = isProduction 
  ? 'https://web-production-a862.up.railway.app/api'
  : import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

// Log para debugging (solo en desarrollo)
if (!isProduction) {
  console.log('🔗 API_BASE_URL configurada:', API_BASE_URL);
  console.log('🌍 Entorno:', isProduction ? 'Production' : 'Development');
}

export const ETIQUETAS_PREDEFINIDAS = {
  gastos: ['Comida', 'Transporte', 'Casa', 'Ropa', 'Salud', 'Entretenimiento', 'Facturas', 'Otros'],
  ingresos: ['Trabajo', 'Freelance', 'Inversiones', 'Otros']
};

// ⚠️ Ojo: mejor no dejar credenciales hardcodeadas en el frontend.
// Cualquiera que abra el inspector las puede ver.
export const AUTH_CREDENTIALS = {
  username: 'DoñaAraña76sanjuan',
  password: 'ja6ju4ma28monstruito'
};
