#!/usr/bin/env python3
"""
Script para verificar gastos recurrentes en la base de datos
"""

import sqlite3
from pathlib import Path

def check_recurring_expenses():
    db_path = Path(__file__).parent / "contabilidad.db"
    
    if not db_path.exists():
        print(f"❌ No se encontró la base de datos en {db_path}")
        return
    
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    try:
        # Verificar estructura de la tabla gastos
        print("🔍 Estructura de la tabla gastos:")
        cursor.execute("PRAGMA table_info(gastos)")
        columns = cursor.fetchall()
        for column in columns:
            print(f"  - {column[1]} ({column[2]})")
        
        print("\n" + "="*50)
        
        # Verificar gastos recurrentes
        print("🔍 Gastos con es_recurrente = 1:")
        cursor.execute("SELECT id, etiqueta, monto, fecha, es_recurrente, recurrente_id FROM gastos WHERE es_recurrente = 1")
        recurring = cursor.fetchall()
        
        if recurring:
            for gasto in recurring:
                print(f"  - ID: {gasto[0]}, Etiqueta: {gasto[1]}, Monto: {gasto[2]}, Fecha: {gasto[3]}, Recurrente ID: {gasto[5]}")
        else:
            print("  No se encontraron gastos recurrentes")
        
        print("\n" + "="*50)
        
        # Verificar todos los gastos de los últimos días
        print("🔍 Todos los gastos de los últimos 10 días:")
        cursor.execute("""
            SELECT id, etiqueta, monto, fecha, es_recurrente, recurrente_id 
            FROM gastos 
            WHERE fecha >= date('now', '-10 days') 
            ORDER BY fecha DESC
        """)
        recent = cursor.fetchall()
        
        if recent:
            for gasto in recent:
                recurring_text = "SÍ" if gasto[4] else "NO"
                print(f"  - {gasto[3]}: {gasto[1]} ({gasto[2]}€) - Recurrente: {recurring_text}")
        else:
            print("  No se encontraron gastos recientes")
        
    except Exception as e:
        print(f"❌ Error: {e}")
    finally:
        conn.close()

if __name__ == "__main__":
    check_recurring_expenses()