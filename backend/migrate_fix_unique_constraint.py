#!/usr/bin/env python3
"""
Migración para corregir la constraint UNIQUE en movimientos_diarios.

PROBLEMA:
- Actualmente existe: UNIQUE(fecha) - solo la fecha
- Necesitamos: UNIQUE(fecha, user_id) - fecha por usuario

Este script:
1. Elimina la constraint vieja ix_movimientos_diarios_fecha
2. Crea la nueva constraint uix_movimientos_fecha_user (fecha, user_id)
"""

import os
import sys
from pathlib import Path

# Agregar el directorio raíz al path
sys.path.insert(0, str(Path(__file__).parent.parent))

from sqlalchemy import text, inspect
from core.database import engine

def migrate_fix_unique_constraint():
    """Migrar constraint UNIQUE de movimientos_diarios"""

    print("🔄 Iniciando migración: corregir UNIQUE constraint en movimientos_diarios...")

    try:
        with engine.connect() as conn:
            # Iniciar transacción
            trans = conn.begin()

            try:
                # Verificar constraints existentes
                inspector = inspect(engine)
                constraints = inspector.get_unique_constraints('movimientos_diarios')
                indexes = inspector.get_indexes('movimientos_diarios')

                print(f"📊 Constraints existentes: {constraints}")
                print(f"📊 Indexes existentes: {indexes}")

                # Eliminar la constraint vieja si existe
                # Puede ser una UNIQUE constraint o un UNIQUE INDEX
                constraint_dropped = False

                # Intentar eliminar como constraint
                try:
                    conn.execute(text("""
                        ALTER TABLE movimientos_diarios
                        DROP CONSTRAINT IF EXISTS ix_movimientos_diarios_fecha
                    """))
                    print("✅ Constraint 'ix_movimientos_diarios_fecha' eliminada")
                    constraint_dropped = True
                except Exception as e:
                    print(f"⚠️  No se pudo eliminar como CONSTRAINT: {e}")

                # Intentar eliminar como índice único
                try:
                    conn.execute(text("""
                        DROP INDEX IF EXISTS ix_movimientos_diarios_fecha
                    """))
                    print("✅ Index 'ix_movimientos_diarios_fecha' eliminado")
                    constraint_dropped = True
                except Exception as e:
                    print(f"⚠️  No se pudo eliminar como INDEX: {e}")

                if not constraint_dropped:
                    print("⚠️  No se encontró la constraint/index vieja, continuando...")

                # Verificar si la nueva constraint ya existe
                has_new_constraint = any(
                    c.get('name') == 'uix_movimientos_fecha_user'
                    for c in constraints
                )

                if has_new_constraint:
                    print("✅ La nueva constraint 'uix_movimientos_fecha_user' ya existe")
                else:
                    # Crear la nueva constraint compuesta
                    conn.execute(text("""
                        ALTER TABLE movimientos_diarios
                        ADD CONSTRAINT uix_movimientos_fecha_user
                        UNIQUE (fecha, user_id)
                    """))
                    print("✅ Nueva constraint 'uix_movimientos_fecha_user' creada (fecha, user_id)")

                # Commit de la transacción
                trans.commit()

                print("🎉 Migración completada exitosamente")
                return True

            except Exception as e:
                trans.rollback()
                raise e

    except Exception as e:
        print(f"❌ Error durante migración: {str(e)}")
        import traceback
        traceback.print_exc()
        return False

def verify_migration():
    """Verificar que la migración se aplicó correctamente"""
    print("\n🔍 Verificando migración...")

    try:
        inspector = inspect(engine)
        constraints = inspector.get_unique_constraints('movimientos_diarios')
        indexes = inspector.get_indexes('movimientos_diarios')

        print("\n📊 Estado actual:")
        print(f"  Constraints: {constraints}")
        print(f"  Indexes: {indexes}")

        # Verificar que existe la nueva constraint
        has_new_constraint = any(
            c.get('name') == 'uix_movimientos_fecha_user'
            for c in constraints
        )

        if has_new_constraint:
            print("\n✅ VERIFICACIÓN EXITOSA: La constraint correcta está en su lugar")
            return True
        else:
            print("\n⚠️  ADVERTENCIA: No se encontró la constraint esperada")
            return False

    except Exception as e:
        print(f"\n❌ Error al verificar: {str(e)}")
        return False

if __name__ == "__main__":
    print("=" * 60)
    print("MIGRACIÓN: Fix UNIQUE constraint en movimientos_diarios")
    print("=" * 60)

    success = migrate_fix_unique_constraint()

    if success:
        verify_migration()

    sys.exit(0 if success else 1)
