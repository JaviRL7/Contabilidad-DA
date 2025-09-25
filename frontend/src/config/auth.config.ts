// src/config/auth.config.ts
// Configuración de autenticación - NO incluir en git público

const AUTH_CONFIG = {
  // Credenciales codificadas en base64 para mayor seguridad
  credentials: {
    username: atob('RG/DsWFBcmHDsWE3NnNhbmp1YW4='),
    password: atob('amE2anU0bWEyOG1vbnN0cnVpdG8=')
  }
};

export const getAuthCredentials = () => {
  return AUTH_CONFIG.credentials;
};

export default AUTH_CONFIG;