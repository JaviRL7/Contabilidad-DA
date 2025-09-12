from fastapi import APIRouter, HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel
from datetime import datetime, timedelta
import jwt
import hashlib
import os

router = APIRouter(prefix="/auth", tags=["auth"])
security = HTTPBearer()

# Configuración de autenticación
SECRET_KEY = os.getenv("SECRET_KEY", "tu-clave-secreta-muy-segura-para-dona-arana-76")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_HOURS = 24

# Credenciales hardcodeadas como solicitaste
VALID_USERNAME = "DoñaAraña76sanjuan"
VALID_PASSWORD = "ja6ju4ma28monstruito"

class LoginRequest(BaseModel):
    username: str
    password: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str

def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(hours=ACCESS_TOKEN_EXPIRE_HOURS)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def verify_token(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        payload = jwt.decode(credentials.credentials, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise HTTPException(status_code=401, detail="Token inválido")
        return username
    except jwt.PyJWTError:
        raise HTTPException(status_code=401, detail="Token inválido")

@router.post("/login", response_model=TokenResponse)
async def login(login_request: LoginRequest):
    # Verificar credenciales
    if login_request.username != VALID_USERNAME or login_request.password != VALID_PASSWORD:
        raise HTTPException(
            status_code=401,
            detail="Credenciales incorrectas"
        )
    
    # Crear token de acceso
    access_token = create_access_token(data={"sub": login_request.username})
    
    return {
        "access_token": access_token,
        "token_type": "bearer"
    }

@router.post("/verify")
async def verify_access(username: str = Depends(verify_token)):
    return {"valid": True, "username": username}

@router.post("/logout")
async def logout():
    # En una implementación real podrías invalidar el token
    # Por simplicidad, el logout se maneja en el frontend
    return {"message": "Sesión cerrada correctamente"}