from pydantic import BaseModel, EmailStr, Field

class UserCreate(BaseModel):
    full_name: str = Field(min_length=2, max_length=120)
    email: EmailStr
    password: str = Field(min_length=8, max_length=72)
    role: str = Field(default="student")
    school_name: str | None = None

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class ForgotPasswordIn(BaseModel):
    email: EmailStr

class ResetPasswordIn(BaseModel):
    email: EmailStr
    code: str = Field(min_length=4, max_length=12)
    new_password: str = Field(min_length=8, max_length=72)

class AdminPasswordIn(BaseModel):
    password: str = Field(min_length=8, max_length=72)

class UserOut(BaseModel):
    id: int
    full_name: str
    email: EmailStr
    role: str
    school_name: str | None = None
    is_verified: bool = False
    reset_requested: bool = False
    model_config = {"from_attributes": True}

class TokenOut(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut
