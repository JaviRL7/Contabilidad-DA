from sqlalchemy import Column, Integer, String, Float, Date, DateTime, Boolean, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base

class MovimientoDiario(Base):
    __tablename__ = "movimientos_diarios"
    
    id = Column(Integer, primary_key=True, index=True)
    fecha = Column(Date, unique=True, nullable=False, index=True)
    ingreso_total = Column(Float, default=0.0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relaciones
    ingresos = relationship("Ingreso", back_populates="movimiento", cascade="all, delete-orphan")
    gastos = relationship("Gasto", back_populates="movimiento", cascade="all, delete-orphan")

class Ingreso(Base):
    __tablename__ = "ingresos"
    
    id = Column(Integer, primary_key=True, index=True)
    fecha = Column(Date, ForeignKey("movimientos_diarios.fecha"), nullable=False, index=True)
    monto = Column(Float, nullable=False)
    etiqueta = Column(String, nullable=False, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relación
    movimiento = relationship("MovimientoDiario", back_populates="ingresos")

class Gasto(Base):
    __tablename__ = "gastos"
    
    id = Column(Integer, primary_key=True, index=True)
    fecha = Column(Date, ForeignKey("movimientos_diarios.fecha"), nullable=False, index=True)
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
    nombre = Column(String, unique=True, nullable=False)
    tipo = Column(String, nullable=False, default='gasto', index=True)  # 'gasto' o 'ingreso'
    es_predefinida = Column(Boolean, default=False)
    es_esencial = Column(Boolean, default=False)

class NotificacionCalendario(Base):
    __tablename__ = "notificaciones_calendario"
    
    id = Column(Integer, primary_key=True, index=True)
    fecha = Column(Date, nullable=False, index=True)
    texto_descriptivo = Column(String, nullable=False)
    etiqueta = Column(String, nullable=True)  # Etiqueta opcional para precargar al crear movimiento
    tipo = Column(String, nullable=False, default='general', index=True)  # 'general', 'ingreso', 'gasto'
    esta_vencida = Column(Boolean, default=False, index=True)  # True si la fecha ya pasó
    fue_convertida_movimiento = Column(Boolean, default=False)  # True si ya se creó el movimiento
    fue_cancelada = Column(Boolean, default=False)  # True si fue cancelada por el usuario
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())