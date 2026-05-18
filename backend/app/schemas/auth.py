from pydantic import BaseModel
from typing import Optional

class Token(BaseModel):
    access_token: str
    token_type: str
    user: "UserOut"

class TokenData(BaseModel):
    username: Optional[str] = None

class UserCreate(BaseModel):
    username: str
    password: str
    full_name: str
    email: Optional[str] = None
    is_admin: bool = False

class UserOut(BaseModel):
    id: int
    username: str
    full_name: str
    email: Optional[str]
    is_admin: bool
    is_active: bool
    model_config = {"from_attributes": True}

class ChangePassword(BaseModel):
    current_password: str
    new_password: str
