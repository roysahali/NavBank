from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.deps import get_current_user
from app.database import get_db
from app.models.beneficiary import Beneficiary
from app.models.user import User
from app.schemas.beneficiary import BeneficiaryCreate, BeneficiaryOut

router = APIRouter(prefix="/beneficiaries", tags=["beneficiaries"])


@router.get("", response_model=list[BeneficiaryOut])
def list_beneficiaries(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return (
        db.query(Beneficiary)
        .filter(Beneficiary.user_id == current_user.id, Beneficiary.is_active == True)  # noqa: E712
        .order_by(Beneficiary.created_at.desc())
        .all()
    )


@router.post("", response_model=BeneficiaryOut, status_code=201)
def create_beneficiary(
    data: BeneficiaryCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    beneficiary = Beneficiary(
        user_id=current_user.id,
        name=data.name,
        account_number=data.account_number,
        ifsc_code=data.ifsc_code,
        bank_name=data.bank_name,
        alias=data.alias,
    )
    db.add(beneficiary)
    db.commit()
    db.refresh(beneficiary)
    return beneficiary


@router.delete("/{beneficiary_id}")
def delete_beneficiary(
    beneficiary_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    beneficiary = db.query(Beneficiary).filter(
        Beneficiary.id == beneficiary_id,
        Beneficiary.user_id == current_user.id,
    ).first()
    if not beneficiary:
        raise HTTPException(status_code=404, detail="Beneficiary not found")

    beneficiary.is_active = False
    db.commit()
    return {"message": "Beneficiary removed"}
