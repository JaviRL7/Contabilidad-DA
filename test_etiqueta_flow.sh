#!/bin/bash

echo "🧪 TESTING PASO 2 - Flujo completo de creación de etiquetas"

# Verificar que el backend esté corriendo
echo "1️⃣ Verificando backend..."
response=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:8000/api/etiquetas/)
if [ "$response" = "200" ]; then
    echo "✅ Backend corriendo correctamente"
else
    echo "❌ Backend no disponible (HTTP $response)"
    exit 1
fi

# Contar etiquetas iniciales
echo "2️⃣ Contando etiquetas iniciales..."
inicial=$(curl -s http://localhost:8000/api/etiquetas/ | grep -o '"nombre":' | wc -l)
echo "📊 Etiquetas iniciales: $inicial"

# Probar creación de nueva etiqueta de ingreso
echo "3️⃣ Probando POST de nueva etiqueta de ingreso..."
new_etiqueta=$(curl -s -X POST http://localhost:8000/api/etiquetas/ \
  -H "Content-Type: application/json" \
  -d '{"nombre": "Test Flujo Ingreso", "tipo": "ingreso"}')

if echo "$new_etiqueta" | grep -q '"id"'; then
    echo "✅ Etiqueta de ingreso creada:"
    echo "$new_etiqueta" | grep -o '"nombre":"[^"]*"' 
    echo "$new_etiqueta" | grep -o '"tipo":"[^"]*"'
else
    echo "❌ Error creando etiqueta de ingreso:"
    echo "$new_etiqueta"
fi

# Probar creación de nueva etiqueta de gasto
echo "4️⃣ Probando POST de nueva etiqueta de gasto..."
new_etiqueta=$(curl -s -X POST http://localhost:8000/api/etiquetas/ \
  -H "Content-Type: application/json" \
  -d '{"nombre": "Test Flujo Gasto", "tipo": "gasto"}')

if echo "$new_etiqueta" | grep -q '"id"'; then
    echo "✅ Etiqueta de gasto creada:"
    echo "$new_etiqueta" | grep -o '"nombre":"[^"]*"'
    echo "$new_etiqueta" | grep -o '"tipo":"[^"]*"'
else
    echo "❌ Error creando etiqueta de gasto:"
    echo "$new_etiqueta"
fi

# Verificar total final
echo "5️⃣ Contando etiquetas finales..."
final=$(curl -s http://localhost:8000/api/etiquetas/ | grep -o '"nombre":' | wc -l)
echo "📊 Etiquetas finales: $final"
echo "📈 Diferencia: $((final - inicial))"

# Contar por tipo
echo "6️⃣ Verificando tipos..."
ingresos=$(curl -s http://localhost:8000/api/etiquetas/ | grep -o '"tipo":"ingreso"' | wc -l)
gastos=$(curl -s http://localhost:8000/api/etiquetas/ | grep -o '"tipo":"gasto"' | wc -l)
echo "📈 Ingresos: $ingresos"
echo "📉 Gastos: $gastos"

echo ""
echo "🎉 Test del flujo completado"
echo "🔗 Verificar manualmente:"
echo "   1. Abrir http://localhost:3000"
echo "   2. Ir a Historial > Añadir Movimiento"
echo "   3. En selector de etiqueta de Ingreso > + Crear nueva etiqueta"
echo "   4. Verificar que se abre modal (no alert)"
echo "   5. Crear etiqueta y verificar auto-selección"