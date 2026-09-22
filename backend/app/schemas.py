from datetime import datetime
from pydantic import BaseModel, ConfigDict, Field

class LoginRequest(BaseModel):
    email: str
    password: str

class UserOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    email: str
    name: str
    role: str
    organization_id: str | None = None

class UserCreate(BaseModel):
    email: str
    name: str = Field(min_length=2, max_length=120)
    password: str = Field(min_length=8, max_length=128)
    role: str = "EMPLOYEE"
    organization_id: str | None = None

class OrganizationCreate(BaseModel):
    name: str = Field(min_length=2, max_length=150)
    slug: str = Field(min_length=2, max_length=80, pattern=r"^[a-z0-9-]+$")

class OrganizationOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    name: str
    slug: str
    is_active: bool

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut

class HVACControlRequest(BaseModel):
    setpoint: float | None = Field(default=None, ge=16, le=32)
    mode: str | None = None
    fan_speed: int | None = Field(default=None, ge=0, le=5)

class ChatRequest(BaseModel):
    message: str = Field(min_length=1, max_length=1000)

class AlertOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    severity: str
    title: str
    message: str
    status: str
    created_at: datetime
