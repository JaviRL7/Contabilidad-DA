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

// Interceptor para requests - agregar auth headers si existen
api.interceptors.request.use(
  (config) => {
    // Agregar headers de autenticación si existen
    const token = localStorage.getItem('auth_token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
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