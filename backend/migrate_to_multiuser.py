"""
Script de migración para convertir la base de datos a multiusuario.
IMPORTANTE: Este script preserva TODOS los datos existentes.
"""
import psycopg2
from psycopg2 import sql
import hashlib
from datetime import datetime

DATABASE_URL = "postgresql://postgres:PeHfNymchdyGqbeldaJuKvMClxicQfJA@crossover.proxy.rlwy.net:13369/railway"

# Credenciales del usuario de tu madre (las credenciales actuales hardcodeadas)
MADRE_USERNAME = "DoñaAraña76sanjuan"
MADRE_PASSWORD = "ja6ju4ma28monstruito"
MADRE_EMAIL = "dona.arana@contabilidad.com"

def hash_password(password: str) -> str:
    """Hash de la contraseña usando SHA-256"""
    return hashlib.sha256(password.encode()).hexdigest()

def migrate_database():
    print("🚀 INICIANDO MIGRACIÓN A MULTIUSUARIO")
    print("=" * 70)

    try:
        conn = psycopg2.connect(DATABASE_URL)
        conn.autocommit = False
        cursor = conn.cursor()

        # =========================================
        # PASO 1: Crear tabla de usuarios
        # =========================================
        print("\n📦 PASO 1: Creando tabla de usuarios...")
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS usuarios (
                id SERIAL PRIMARY KEY,
                username VARCHAR(255) UNIQUE NOT NULL,
                email VARCHAR(255) UNIQUE NOT NULL,
                password_hash VARCHAR(255) NOT NULL,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            );
            CREATE INDEX IF NOT EXISTS idx_usuarios_username ON usuarios(username);
            CREATE INDEX IF NOT EXISTS idx_usuarios_email ON usuarios(email);
        """)
        print("   ✅ Tabla usuarios creada")

        # =========================================
        # PASO 2: Crear usuario para tu madre
        # =========================================
        print(f"\n👤 PASO 2: Creando usuario para tu madre ({MADRE_USERNAME})...")
        password_hash = hash_password(MADRE_PASSWORD)

        cursor.execute("""
            INSERT INTO usuarios (username, email, password_hash)
            VALUES (%s, %s, %s)
            ON CONFLICT (username) DO NOTHING
            RETURNING id;
        """, (MADRE_USERNAME, MADRE_EMAIL, password_hash))

        result = cursor.fetchone()
        if result:
            madre_user_id = result[0]
            print(f"   ✅ Usuario creado con ID: {madre_user_id}")
        else:
            # Si ya existe, obtener el ID
            cursor.execute("SELECT id FROM usuarios WHERE username = %s", (MADRE_USERNAME,))
            madre_user_id = cursor.fetchone()[0]
            print(f"   ⚠️  Usuario ya existía. ID: {madre_user_id}")

        # =========================================
        # PASO 3: Añadir columna user_id a movimientos_diarios
        # =========================================
        print("\n📊 PASO 3: Actualizando tabla movimientos_diarios...")

        # Verificar si la columna ya existe
        cursor.execute("""
            SELECT column_name
            FROM information_schema.columns
            WHERE table_name='movimientos_diarios' AND column_name='user_id';
        """)

        if not cursor.fetchone():
            # Añadir columna user_id (temporal nullable)
            cursor.execute("ALTER TABLE movimientos_diarios ADD COLUMN user_id INTEGER;")
            print("   ✅ Columna user_id añadida")

            # Asignar todos los movimientos existentes al usuario de tu madre
            cursor.execute("UPDATE movimientos_diarios SET user_id = %s WHERE user_id IS NULL;", (madre_user_id,))
            count = cursor.rowcount
            print(f"   ✅ {count} movimientos asignados al usuario")

            # Hacer la columna NOT NULL y añadir foreign key
            cursor.execute("ALTER TABLE movimientos_diarios ALTER COLUMN user_id SET NOT NULL;")
            cursor.execute("""
                ALTER TABLE movimientos_diarios
                ADD CONSTRAINT fk_movimientos_user
                FOREIGN KEY (user_id) REFERENCES usuarios(id);
            """)
            cursor.execute("CREATE INDEX IF NOT EXISTS idx_movimientos_user_id ON movimientos_diarios(user_id);")

            # Eliminar constraint de fecha única (ahora debe ser única por usuario)
            cursor.execute("""
                ALTER TABLE movimientos_diarios
                DROP CONSTRAINT IF EXISTS movimientos_diarios_fecha_key;
            """)
            cursor.execute("""
                CREATE UNIQUE INDEX IF NOT EXISTS idx_movimientos_user_fecha
                ON movimientos_diarios(user_id, fecha);
            """)
            print("   ✅ Constraints actualizados")
        else:
            print("   ⚠️  Columna user_id ya existe, saltando...")

        # =========================================
        # PASO 4: Añadir columna user_id a ingresos
        # =========================================
        print("\n💰 PASO 4: Actualizando tabla ingresos...")

        cursor.execute("""
            SELECT column_name
            FROM information_schema.columns
            WHERE table_name='ingresos' AND column_name='user_id';
        """)

        if not cursor.fetchone():
            cursor.execute("ALTER TABLE ingresos ADD COLUMN user_id INTEGER;")
            cursor.execute("UPDATE ingresos SET user_id = %s WHERE user_id IS NULL;", (madre_user_id,))
            count = cursor.rowcount
            print(f"   ✅ {count} ingresos asignados al usuario")

            cursor.execute("ALTER TABLE ingresos ALTER COLUMN user_id SET NOT NULL;")
            cursor.execute("""
                ALTER TABLE ingresos
                ADD CONSTRAINT fk_ingresos_user
                FOREIGN KEY (user_id) REFERENCES usuarios(id);
            """)
            cursor.execute("CREATE INDEX IF NOT EXISTS idx_ingresos_user_id ON ingresos(user_id);")
        else:
            print("   ⚠️  Columna user_id ya existe, saltando...")

        # =========================================
        # PASO 5: Añadir columna user_id a gastos
        # =========================================
        print("\n💸 PASO 5: Actualizando tabla gastos...")

        cursor.execute("""
            SELECT column_name
            FROM information_schema.columns
            WHERE table_name='gastos' AND column_name='user_id';
        """)

        if not cursor.fetchone():
            cursor.execute("ALTER TABLE gastos ADD COLUMN user_id INTEGER;")
            cursor.execute("UPDATE gastos SET user_id = %s WHERE user_id IS NULL;", (madre_user_id,))
            count = cursor.rowcount
            print(f"   ✅ {count} gastos asignados al usuario")

            cursor.execute("ALTER TABLE gastos ALTER COLUMN user_id SET NOT NULL;")
            cursor.execute("""
                ALTER TABLE gastos
                ADD CONSTRAINT fk_gastos_user
                FOREIGN KEY (user_id) REFERENCES usuarios(id);
            """)
            cursor.execute("CREATE INDEX IF NOT EXISTS idx_gastos_user_id ON gastos(user_id);")
        else:
            print("   ⚠️  Columna user_id ya existe, saltando...")

        # =========================================
        # PASO 6: Añadir columna user_id a etiquetas
        # =========================================
        print("\n🏷️  PASO 6: Actualizando tabla etiquetas...")

        cursor.execute("""
            SELECT column_name
            FROM information_schema.columns
            WHERE table_name='etiquetas' AND column_name='user_id';
        """)

        if not cursor.fetchone():
            cursor.execute("ALTER TABLE etiquetas ADD COLUMN user_id INTEGER;")
            cursor.execute("UPDATE etiquetas SET user_id = %s WHERE user_id IS NULL;", (madre_user_id,))
            count = cursor.rowcount
            print(f"   ✅ {count} etiquetas asignadas al usuario")

            cursor.execute("ALTER TABLE etiquetas ALTER COLUMN user_id SET NOT NULL;")
            cursor.execute("""
                ALTER TABLE etiquetas
                ADD CONSTRAINT fk_etiquetas_user
                FOREIGN KEY (user_id) REFERENCES usuarios(id);
            """)
            cursor.execute("CREATE INDEX IF NOT EXISTS idx_etiquetas_user_id ON etiquetas(user_id);")

            # Eliminar constraint de nombre único (ahora debe ser único por usuario)
            cursor.execute("ALTER TABLE etiquetas DROP CONSTRAINT IF EXISTS etiquetas_nombre_key;")
            cursor.execute("""
                CREATE UNIQUE INDEX IF NOT EXISTS idx_etiquetas_user_nombre
                ON etiquetas(user_id, nombre);
            """)
            print("   ✅ Constraints actualizados")
        else:
            print("   ⚠️  Columna user_id ya existe, saltando...")

        # =========================================
        # PASO 7: Añadir columna user_id a notificaciones_calendario
        # =========================================
        print("\n🔔 PASO 7: Actualizando tabla notificaciones_calendario...")

        cursor.execute("""
            SELECT column_name
            FROM information_schema.columns
            WHERE table_name='notificaciones_calendario' AND column_name='user_id';
        """)

        if not cursor.fetchone():
            cursor.execute("ALTER TABLE notificaciones_calendario ADD COLUMN user_id INTEGER;")
            cursor.execute("UPDATE notificaciones_calendario SET user_id = %s WHERE user_id IS NULL;", (madre_user_id,))
            count = cursor.rowcount
            print(f"   ✅ {count} notificaciones asignadas al usuario")

            cursor.execute("ALTER TABLE notificaciones_calendario ALTER COLUMN user_id SET NOT NULL;")
            cursor.execute("""
                ALTER TABLE notificaciones_calendario
                ADD CONSTRAINT fk_notificaciones_user
                FOREIGN KEY (user_id) REFERENCES usuarios(id);
            """)
            cursor.execute("CREATE INDEX IF NOT EXISTS idx_notificaciones_user_id ON notificaciones_calendario(user_id);")
        else:
            print("   ⚠️  Columna user_id ya existe, saltando...")

        # =========================================
        # COMMIT DE TODOS LOS CAMBIOS
        # =========================================
        conn.commit()
        print("\n" + "=" * 70)
        print("✅ MIGRACIÓN COMPLETADA CON ÉXITO")
        print("=" * 70)
        print(f"\n📝 RESUMEN:")
        print(f"   - Usuario creado: {MADRE_USERNAME}")
        print(f"   - Email: {MADRE_EMAIL}")
        print(f"   - Contraseña: (la misma de antes)")
        print(f"   - ID de usuario: {madre_user_id}")
        print(f"\n🔐 Todos los datos existentes han sido asignados a este usuario.")
        print(f"   Tu madre puede seguir usando las mismas credenciales de siempre.")

        cursor.close()
        conn.close()

        return True

    except Exception as e:
        print(f"\n❌ ERROR EN LA MIGRACIÓN: {e}")
        if conn:
            conn.rollback()
            print("⚠️  Rollback ejecutado. La base de datos no ha sido modificada.")
        return False

if __name__ == "__main__":
    print("\n⚠️  ADVERTENCIA: Este script modificará la estructura de la base de datos.")
    print("   Todos los datos existentes se preservarán y asignarán al usuario de tu madre.")

    respuesta = input("\n¿Deseas continuar? (escribe 'SI' para confirmar): ")

    if respuesta.upper() == "SI":
        success = migrate_database()
        if success:
            print("\n🎉 ¡Listo! Ahora el sistema es multiusuario.")
        else:
            print("\n❌ La migración falló. Revisa los errores arriba.")
    else:
        print("\n❌ Migración cancelada.")
