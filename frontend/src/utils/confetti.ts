import confetti from 'canvas-confetti'

// Función para mostrar mensaje de felicitación
const showCelebrationMessage = () => {
  // Crear elemento del mensaje
  const messageElement = document.createElement('div')
  messageElement.innerHTML = `
    <div class="fixed top-6 right-6 z-50 animate-bounce">
      <div class="bg-gradient-to-r from-pink-500 to-purple-600 text-white px-6 py-4 rounded-2xl shadow-2xl border-2 border-white transform transition-all duration-500 hover:scale-105">
        <div class="flex items-center gap-3">
          <div class="text-2xl">🎉</div>
          <div>
            <div class="font-bold text-lg">¡Enhorabuena mamá!</div>
            <div class="text-sm opacity-90">Eres la mejor, te quiero ❤️</div>
          </div>
        </div>
      </div>
    </div>
  `
  
  // Agregar al DOM
  document.body.appendChild(messageElement)
  
  // Remover después de 4 segundos con animación
  setTimeout(() => {
    const messageDiv = messageElement.querySelector('div') as HTMLElement
    if (messageDiv) {
      messageDiv.style.transform = 'translateX(100%) scale(0.8)'
      messageDiv.style.opacity = '0'
    }
    
    setTimeout(() => {
      if (document.body.contains(messageElement)) {
        document.body.removeChild(messageElement)
      }
    }, 500)
  }, 4000)
}

export const triggerConfetti = () => {
  // Confetti desde múltiples posiciones para mejor efecto
  const duration = 3000
  const end = Date.now() + duration

  const colors = ['#ff69b4', '#ff1493', '#8a2be2', '#9370db', '#ba55d3']

  const frame = () => {
    confetti({
      particleCount: 5,
      spread: 55,
      origin: { x: 0.1, y: 0.6 },
      colors: colors
    })
    
    confetti({
      particleCount: 5,
      spread: 55,
      origin: { x: 0.9, y: 0.6 },
      colors: colors
    })

    if (Date.now() < end) {
      requestAnimationFrame(frame)
    }
  }

  // Mostrar mensaje personalizado
  showCelebrationMessage()
  
  // Iniciar confetti
  frame()
}