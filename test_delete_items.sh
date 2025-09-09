#!/bin/bash

echo "🧪 TESTING PASO 3.1 - Eliminación de items individuales en EditModal"

# 1. Crear movimiento de prueba con múltiples ingresos
echo "1️⃣ Creando movimiento de prueba..."
response=$(curl -s -X POST http://localhost:8000/api/movimientos/ \
  -H "Content-Type: application/json" \
  -d '{
    "fecha": "2025-09-10",
    "ingresos": [
      {"monto": 500, "etiqueta": "Ingreso 1"},
      {"monto": 300, "etiqueta": "Ingreso 2"},
      {"monto": 200, "etiqueta": "Ingreso 3"}
    ],
    "gastos": [
      {"monto": 100, "etiqueta": "Gasto 1"},
      {"monto": 50, "etiqueta": "Gasto 2"}
    ]
  }')

echo "✅ Movimiento creado"

# 2. Obtener el movimiento para ver IDs
echo "2️⃣ Obteniendo IDs de items..."
movimiento=$(curl -s "http://localhost:8000/api/movimientos/2025-09-10")
echo "📋 Movimiento con IDs:"
echo "$movimiento" | grep -o '"id":[^,}]*' | head -5

# 3. Extraer primer ID de ingreso para prueba de eliminación
primer_ingreso_id=$(echo "$movimiento" | grep -o '"ingresos":\[.*\]' | grep -o '"id":[0-9]*' | head -1 | grep -o '[0-9]*')
primer_gasto_id=$(echo "$movimiento" | grep -o '"gastos":\[.*\]' | grep -o '"id":[0-9]*' | head -1 | grep -o '[0-9]*')

echo "🎯 Primer ingreso ID: $primer_ingreso_id"
echo "🎯 Primer gasto ID: $primer_gasto_id"

# 4. Probar eliminación de ingreso individual
echo "3️⃣ Probando eliminación de ingreso individual..."
delete_response=$(curl -s -X DELETE "http://localhost:8000/api/movimientos/2025-09-10/ingreso/$primer_ingreso_id")
echo "Respuesta DELETE ingreso: $delete_response"

# 5. Verificar que se eliminó correctamente
echo "4️⃣ Verificando eliminación..."
movimiento_after=$(curl -s "http://localhost:8000/api/movimientos/2025-09-10")
ingresos_count_after=$(echo "$movimiento_after" | grep -o '"ingresos":\[[^]]*\]' | grep -o '"id":' | wc -l)
echo "📊 Ingresos después de eliminar: $ingresos_count_after (debería ser 2)"

# 6. Probar eliminación de gasto individual
echo "5️⃣ Probando eliminación de gasto individual..."
delete_response2=$(curl -s -X DELETE "http://localhost:8000/api/movimientos/2025-09-10/gasto/$primer_gasto_id")
echo "Respuesta DELETE gasto: $delete_response2"

# 7. Verificar eliminación de gasto
echo "6️⃣ Verificando eliminación de gasto..."
movimiento_final=$(curl -s "http://localhost:8000/api/movimientos/2025-09-10")
gastos_count_final=$(echo "$movimiento_final" | grep -o '"gastos":\[[^]]*\]' | grep -o '"id":' | wc -l)
echo "📊 Gastos después de eliminar: $gastos_count_final (debería ser 1)"

echo ""
echo "🎉 Test completado!"
echo "📝 Verificaciones manuales:"
echo "   1. Abrir http://localhost:3000"  
echo "   2. Editar movimiento 2025-09-10"
echo "   3. Probar botones de basura en cada item"
echo "   4. Verificar que items se eliminan correctamente"
echo "   5. Verificar que totales se recalculan"