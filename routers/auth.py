from fastapi import APIRouter, HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
import jwt
import hashlib
import os
import re

from core.database import get_db
from models.models import Usuario

router = APIRouter(prefix="/auth", tags=["auth"])
security = HTTPBearer()

# Configuración de autenticación
SECRET_KEY = os.getenv("SECRET_KEY", "tu-clave-secreta-muy-segura-para-dona-arana-76")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_HOURS = 24

class LoginRequest(BaseModel):
    username: str
    password: str

class RegisterRequest(BaseModel):
    username: str
    email: str
    password: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str
    username: str
    user_id: int

def hash_password(password: str) -> str:
    """Hash de la contraseña usando SHA-256"""
    return hashlib.sha256(password.encode()).hexdigest()

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verificar contraseña"""
    return hash_password(plain_password) == hashed_password

def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(hours=ACCESS_TOKEN_EXPIRE_HOURS)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
):
    """Obtener usuario actual desde el token"""
    try:
        payload = jwt.decode(credentials.credentials, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: int = payload.get("user_id")
        if user_id is None:
            raise HTTPException(status_code=401, detail="Token inválido")

        # Obtener usuario de la BD
        user = db.query(Usuario).filter(Usuario.id == user_id).first()
        if user is None:
            raise HTTPException(status_code=401, detail="Usuario no encontrado")

        return user
    except jwt.PyJWTError:
        raise HTTPException(status_code=401, detail="Token inválido")

# Mantener compatibilidad con verify_token para código existente
def verify_token(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        payload = jwt.decode(credentials.credentials, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise HTTPException(status_code=401, detail="Token inválido")
        return username
    except jwt.PyJWTError:
        raise HTTPException(status_code=401, detail="Token inválido")

@router.post("/register", response_model=TokenResponse)
async def register(register_request: RegisterRequest, db: Session = Depends(get_db)):
    """Registrar un nuevo usuario"""

    # Validar username (solo letras, números, guiones y guiones bajos)
    if not re.match(r'^[a-zA-Z0-9_-]+$', register_request.username):
        raise HTTPException(
            status_code=400,
            detail="El username solo puede contener letras, números, guiones y guiones bajos"
        )

    # Validar longitud de username
    if len(register_request.username) < 3 or len(register_request.username) > 50:
        raise HTTPException(
            status_code=400,
            detail="El username debe tener entre 3 y 50 caracteres"
        )

    # Validar email básico
    if not re.match(r'^[^@]+@[^@]+\.[^@]+$', register_request.email):
        raise HTTPException(
            status_code=400,
            detail="Email inválido"
        )

    # Validar longitud de contraseña
    if len(register_request.password) < 6:
        raise HTTPException(
            status_code=400,
            detail="La contraseña debe tener al menos 6 caracteres"
        )

    # Verificar que username no existe
    existing_user = db.query(Usuario).filter(Usuario.username == register_request.username).first()
    if existing_user:
        raise HTTPException(
            status_code=400,
            detail="El username ya está en uso"
        )

    # Verificar que email no existe
    existing_email = db.query(Usuario).filter(Usuario.email == register_request.email).first()
    if existing_email:
        raise HTTPException(
            status_code=400,
            detail="El email ya está registrado"
        )

    # Crear nuevo usuario
    new_user = Usuario(
        username=register_request.username,
        email=register_request.email,
        password_hash=hash_password(register_request.password)
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    # Crear token de acceso
    access_token = create_access_token(data={
        "sub": new_user.username,
        "user_id": new_user.id
    })

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "username": new_user.username,
        "user_id": new_user.id
    }

@router.post("/login", response_model=TokenResponse)
async def login(login_request: LoginRequest, db: Session = Depends(get_db)):
    """Iniciar sesión con username/email y contraseña"""

    # Buscar usuario por username o email
    user = db.query(Usuario).filter(
        (Usuario.username == login_request.username) |
        (Usuario.email == login_request.username)
    ).first()

    if not user or not verify_password(login_request.password, user.password_hash):
        raise HTTPException(
            status_code=401,
            detail="Credenciales incorrectas"
        )

    # Crear token de acceso
    access_token = create_access_token(data={
        "sub": user.username,
        "user_id": user.id
    })

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "username": user.username,
        "user_id": user.id
    }

@router.post("/verify")
async def verify_access(user: Usuario = Depends(get_current_user)):
    return {
        "valid": True,
        "username": user.username,
        "user_id": user.id,
        "email": user.email
    }

@router.get("/me")
async def get_me(user: Usuario = Depends(get_current_user)):
    """Obtener información del usuario actual"""
    return {
        "id": user.id,
        "username": user.username,
        "email": user.email,
        "created_at": user.created_at
    }

@router.post("/logout")
async def logout():
    # En una implementación real podrías invalidar el token
    # Por simplicidad, el logout se maneja en el frontend
    return {"message": "Sesión cerrada correctamente"}