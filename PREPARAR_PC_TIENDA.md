# 🏪 Preparar PC de Tienda - Instalación desde CERO

## 🎯 **IMPORTANTE**: Para PC sin nada instalado

Si el PC de la tienda está completamente limpio (sin Node.js, Python, Git, etc.), necesitas seguir estos pasos **EN ORDEN**:

---

## 📦 **OPCIÓN 1: Preparación Manual (Recomendada)**

### **Paso 1: Conseguir el código**
Tienes varias opciones:

**A) Descargar ZIP desde GitHub:**
1. Ir a: https://github.com/JaviRL7/Contabilidad-DA
2. Clic en botón verde "Code" 
3. Clic en "Download ZIP"
4. Extraer en `C:\ContabilidadTienda\`

**B) Pedirle a alguien que te pase una copia en USB**

### **Paso 2: Instalar prerrequisitos**
**EN EL PC DE LA TIENDA**, descargar e instalar:

1. **Node.js** (OBLIGATORIO)
   - URL: https://nodejs.org/
   - Descargar la versión LTS (la verde, recomendada)
   - Ejecutar el instalador con opciones por defecto
   - ✅ **Reiniciar PC después de instalar**

2. **Python** (OBLIGATORIO)  
   - URL: https://www.python.org/downloads/
   - Descargar Python 3.11 o superior
   - ⚠️ **MUY IMPORTANTE**: Marcar la casilla "Add Python to PATH"
   - Ejecutar instalador con opciones por defecto
   - ✅ **Reiniciar PC después de instalar**

### **Paso 3: Ejecutar instalador**
1. Ir a la carpeta donde está el proyecto
2. **Doble clic en `INSTALAR_TIENDA.bat`**
3. Seguir las instrucciones
4. ¡Listo!

---

## 📦 **OPCIÓN 2: Instalador Offline (Avanzado)**

Si quieres que sea MÁS FÁCIL para tu madre, puedes crear un paquete con todo incluido:

### **Para preparar el paquete offline:**

1. **En un PC con internet** (el tuyo):
   - Descargar Node.js installer: `node-v20.x.x-x64.msi`
   - Descargar Python installer: `python-3.11.x-amd64.exe`
   - Descargar el proyecto como ZIP
   - Meter todo en una carpeta llamada "ContabilidadCompleta"

2. **Crear script de instalación automática** (siguiente archivo)

---

## 🔧 **Instalador Automático Completo**

Voy a crear un script que instale TODO automáticamente...

---

## ⚠️ **IMPORTANTE - Limitaciones**

### **Lo que SÍ funciona:**
- ✅ El instalador detecta automáticamente si falta algo
- ✅ Te dice exactamente qué descargar y de dónde
- ✅ Abre automáticamente las páginas de descarga
- ✅ Una vez instalado Node.js y Python, funciona perfectamente

### **Lo que NO puede hacer automáticamente:**
- ❌ No puede instalar Node.js/Python sin permisos de administrador
- ❌ No puede descargar archivos desde internet automáticamente
- ❌ Necesita que alguien haga la instalación inicial de prerrequisitos

---

## 💡 **Recomendación Final**

**Para el PC de tu madre:**

1. **Tú primero** (en tu PC):
   - Descarga Node.js installer
   - Descarga Python installer  
   - Descarga el proyecto ZIP
   - Los metes todos en un USB

2. **En el PC de la tienda**:
   - Copiar todo del USB al PC
   - Instalar Node.js (reiniciar)
   - Instalar Python con "Add to PATH" (reiniciar)
   - Ejecutar `INSTALAR_TIENDA.bat`

3. **¿Necesitas ayuda?**
   - Puedes hacerlo tú remotamente con TeamViewer/AnyDesk
   - O pedirle a alguien técnico que lo haga una vez
   - Una vez instalado, tu madre puede usarlo sin problemas

---

## 🎯 **¿Vale la pena?**

**SÍ, totalmente** porque:
- ✅ Solo se hace UNA VEZ la instalación inicial
- ✅ Después tu madre solo hace doble clic para usarlo
- ✅ Se abre automáticamente en el navegador
- ✅ Interfaz súper fácil de usar
- ✅ Guarda todo automáticamente
- ✅ Backups automáticos opcionales

**La instalación inicial es un poco técnica, pero el uso diario es súper simple.**