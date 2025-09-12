import axios from 'axios'
import { API_BASE_URL } from '../utils/constants'

// Configuración base de axios
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  }
})

// Interceptor para requests - agregar auth headers y forzar HTTPS en producción
api.interceptors.request.use(
  (config) => {
    // CRITICAL FIX: Forzar HTTPS en producción
    if (typeof window !== 'undefined' && 
        window.location.hostname === 'contabilidad-da-production.up.railway.app') {
      // Si estamos en producción, forzar HTTPS en todas las URLs
      if (config.url && config.url.includes('web-production-a862.up.railway.app')) {
        config.url = config.url.replace('http://', 'https://');
      }
      if (config.baseURL && config.baseURL.includes('web-production-a862.up.railway.app')) {
        config.baseURL = config.baseURL.replace('http://', 'https://');
      }
    }
    
    // Agregar headers de autenticación si existen
    const token = localStorage.getItem('auth_token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    
    // Debug logging
    if (import.meta.env.MODE === 'development') {
      // eslint-disable-next-line no-console
      console.log('🔄 Request:', config.method?.toUpperCase(), config.baseURL + config.url);
    }
    
    return config
  },
  (error) => {
    console.error('❌ Error en request:', error)
    return Promise.reject(error)
  }
)

// Interceptor para responses - manejar errores globalmente
api.interceptors.response.use(
  (response) => {
    // Log successful requests in development
    if (import.meta.env.MODE === 'development') {
      // eslint-disable-next-line no-console
      console.log('✅ API Success:', response.config.method?.toUpperCase(), response.config.url)
    }
    return response
  },
  (error) => {
    // Log detailed error information
    const errorDetails = {
      status: error.response?.status,
      statusText: error.response?.statusText,
      url: error.config?.url,
      method: error.config?.method?.toUpperCase(),
      message: error.response?.data?.message || error.message
    }
    
    console.error('❌ API Error:', errorDetails)
    
    // Handle specific error types
    if (error.response?.status === 401) {
      // Unauthorized - clear auth and redirect to login
      localStorage.removeItem('auth_token')
      console.warn('🔐 Token expirado - limpiando autenticación')
    } else if (error.response?.status === 404) {
      console.warn('🔍 Recurso no encontrado:', error.config?.url)
    } else if (error.response?.status >= 500) {
      console.error('😵 Error del servidor:', error.response?.status)
    }
    
    return Promise.reject(error)
  }
)

export default api