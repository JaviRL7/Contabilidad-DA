FROM node:20-alpine

# Establecer directorio de trabajo
WORKDIR /app

# Copiar package files
COPY package*.json ./

# Instalar dependencias
RUN npm install

# Copiar código fuente
COPY . .

# Construir la aplicación
RUN npm run build

# Exponer puerto
EXPOSE 4173

# Comando para ejecutar
CMD ["npm", "run", "preview", "--", "--host", "0.0.0.0"]