from sqlalchemy import Column, Integer, String, Float, Date, DateTime, Boolean, ForeignKey, UniqueConstraint
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from core.database import Base

class Usuario(Base):
    __tablename__ = "usuarios"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, nullable=False, index=True)
    email = Column(String, unique=True, nullable=False, index=True)
    password_hash = Column(String, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relaciones
    movimientos = relationship("MovimientoDiario", back_populates="usuario", cascade="all, delete-orphan")
    etiquetas = relationship("Etiqueta", back_populates="usuario", cascade="all, delete-orphan")
    notificaciones = relationship("NotificacionCalendario", back_populates="usuario", cascade="all, delete-orphan")

class MovimientoDiario(Base):
    __tablename__ = "movimientos_diarios"
    __table_args__ = (
        UniqueConstraint('fecha', 'user_id', name='uix_movimientos_fecha_user'),
    )

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("usuarios.id"), nullable=False, index=True)
    fecha = Column(Date, nullable=False, index=True)
    ingreso_total = Column(Float, default=0.0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relaciones
    usuario = relationship("Usuario", back_populates="movimientos")
    ingresos = relationship("Ingreso", back_populates="movimiento", cascade="all, delete-orphan")
    gastos = relationship("Gasto", back_populates="movimiento", cascade="all, delete-orphan")

class Ingreso(Base):
    __tablename__ = "ingresos"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("usuarios.id"), nullable=False, index=True)
    movimiento_id = Column(Integer, ForeignKey("movimientos_diarios.id", ondelete="CASCADE"), nullable=False, index=True)
    fecha = Column(Date, nullable=False, index=True)
    monto = Column(Float, nullable=False)
    etiqueta = Column(String, nullable=False, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relación
    movimiento = relationship("MovimientoDiario", back_populates="ingresos")

class Gasto(Base):
    __tablename__ = "gastos"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("usuarios.id"), nullable=False, index=True)
    movimiento_id = Column(Integer, ForeignKey("movimientos_diarios.id", ondelete="CASCADE"), nullable=False, index=True)
    fecha = Column(Date, nullable=False, index=True)
    monto = Column(Float, nullable=False)
    etiqueta = Column(String, nullable=False, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Campos para gastos recurrentes
    es_recurrente = Column(Boolean, default=False)
    recurrente_id = Column(Integer, nullable=True)  # ID del gasto recurrente que lo generó

    # Relación
    movimiento = relationship("MovimientoDiario", back_populates="gastos")

class Etiqueta(Base):
    __tablename__ = "etiquetas"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("usuarios.id"), nullable=False, index=True)
    nombre = Column(String, nullable=False)
    tipo = Column(String, nullable=False, default='gasto', index=True)  # 'gasto' o 'ingreso'
    es_predefinida = Column(Boolean, default=False)
    es_esencial = Column(Boolean, default=False)

    # Relación
    usuario = relationship("Usuario", back_populates="etiquetas")

class NotificacionCalendario(Base):
    __tablename__ = "notificaciones_calendario"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("usuarios.id"), nullable=False, index=True)
    fecha = Column(Date, nullable=False, index=True)
    texto_descriptivo = Column(String, nullable=False)
    etiqueta = Column(String, nullable=True)  # Etiqueta opcional para precargar al crear movimiento
    tipo = Column(String, nullable=False, default='general', index=True)  # 'general', 'ingreso', 'gasto'
    esta_vencida = Column(Boolean, default=False, index=True)  # True si la fecha ya pasó
    fue_convertida_movimiento = Column(Boolean, default=False)  # True si ya se creó el movimiento
    fue_cancelada = Column(Boolean, default=False)  # True si fue cancelada por el usuario
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relación
    usuario = relationship("Usuario", back_populates="notificaciones")