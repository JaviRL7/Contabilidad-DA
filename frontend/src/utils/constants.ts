// src/utils/constants.ts
export const API_BASE_URL =
  import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

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
