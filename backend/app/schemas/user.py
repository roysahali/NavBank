from datetime import datetime
from typing import Optional

from pydantic import BaseModel, EmailStr


class UserRegister(BaseModel):
    email: EmailStr
    full_name: str
    password: str
    mobile: str


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class OTPSendRequest(BaseModel):
    mobile: str


class OTPVerifyRequest(BaseModel):
    mobile: str
    otp_code: str


class UserOut(BaseModel):
    id: int
    email: str
    full_name: str
    role: str
    mobile: str
    kyc_status: str
    is_active: bool
    created_at: datetime

    model_config = {"from_attributes": True}


class Token(BaseModel):
    access_token: str
    token_type: str
    user: UserOut


class AdminCreateUser(BaseModel):
    email: EmailStr
    full_name: str
    password: str
    mobile: str
    role: str = "customer"
    kyc_status: str = "verified"
    create_account: bool = True


class AdminUpdateUser(BaseModel):
    full_name: Optional[str] = None
    email: Optional[EmailStr] = None
    mobile: Optional[str] = None
    kyc_status: Optional[str] = None
    password: Optional[str] = None
