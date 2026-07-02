from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.deps import get_current_user
from app.core.security import create_access_token, generate_otp, hash_password, verify_password
from app.database import get_db
from app.models.account import Account
from app.models.otp import OtpSession
from app.models.user import User
from app.schemas.user import OTPSendRequest, OTPVerifyRequest, Token, UserLogin, UserOut, UserRegister
from app.services.notifications import notify

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register", response_model=Token)
def register(data: UserRegister, db: Session = Depends(get_db)):
    if db.query(User).filter(User.email == data.email).first():
        raise HTTPException(status_code=400, detail="Email already registered")
    if db.query(User).filter(User.mobile == data.mobile).first():
        raise HTTPException(status_code=400, detail="Mobile number already registered")

    user = User(
        email=data.email,
        full_name=data.full_name,
        hashed_password=hash_password(data.password),
        mobile=data.mobile,
        role="customer",
    )
    db.add(user)
    db.flush()

    account = Account(user_id=user.id, account_type="savings", balance=0.0)
    db.add(account)
    db.commit()
    db.refresh(user)

    token = create_access_token({"sub": str(user.id), "role": user.role})
    return Token(access_token=token, token_type="bearer", user=UserOut.model_validate(user))


@router.post("/login", response_model=Token)
def login(data: UserLogin, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == data.email).first()
    if not user or not verify_password(data.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    if not user.is_active:
        raise HTTPException(status_code=403, detail="Account is disabled")

    if user.role == "customer":
        now = datetime.now(timezone.utc)
        notify(
            db,
            user.id,
            "Login Alert",
            f"You signed in to NovBank Internet Banking on {now.strftime('%d %b %Y at %I:%M %p')} UTC. If this wasn't you, contact support immediately.",
            type="alert",
            related_url="/support",
        )
        db.commit()

    token = create_access_token({"sub": str(user.id), "role": user.role})
    return Token(access_token=token, token_type="bearer", user=UserOut.model_validate(user))


@router.get("/me", response_model=UserOut)
def me(current_user: User = Depends(get_current_user)):
    return UserOut.model_validate(current_user)


@router.post("/otp/send")
def send_otp(data: OTPSendRequest, db: Session = Depends(get_db)):
    # In demo mode, always use the configured demo OTP
    otp_code = settings.demo_otp

    expires_at = datetime.now(timezone.utc) + timedelta(minutes=settings.otp_expire_minutes)
    otp_session = OtpSession(
        mobile=data.mobile,
        otp_code=otp_code,
        purpose="login",
        expires_at=expires_at,
    )
    db.add(otp_session)
    db.commit()

    return {"message": "OTP sent successfully", "demo_otp": settings.demo_otp}


@router.post("/otp/verify", response_model=Token)
def verify_otp(data: OTPVerifyRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.mobile == data.mobile).first()
    if not user:
        raise HTTPException(status_code=404, detail="Mobile number not registered")
    if not user.is_active:
        raise HTTPException(status_code=403, detail="Account is disabled")

    # Accept the demo OTP or a valid DB session OTP
    valid = data.otp_code == settings.demo_otp
    if not valid:
        now = datetime.now(timezone.utc)
        otp_session = (
            db.query(OtpSession)
            .filter(
                OtpSession.mobile == data.mobile,
                OtpSession.otp_code == data.otp_code,
                OtpSession.is_used == False,  # noqa: E712
                OtpSession.expires_at > now,
            )
            .order_by(OtpSession.created_at.desc())
            .first()
        )
        if not otp_session:
            raise HTTPException(status_code=400, detail="Invalid or expired OTP")
        otp_session.is_used = True
        db.commit()

    token = create_access_token({"sub": str(user.id), "role": user.role})
    return Token(access_token=token, token_type="bearer", user=UserOut.model_validate(user))
