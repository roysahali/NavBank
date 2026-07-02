from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.database import Base, engine

# Register ALL models with SQLAlchemy before create_all
import app.models.user  # noqa: F401
import app.models.account  # noqa: F401
import app.models.transaction  # noqa: F401
import app.models.beneficiary  # noqa: F401
import app.models.upi  # noqa: F401
import app.models.credit_card  # noqa: F401
import app.models.loan  # noqa: F401
import app.models.otp  # noqa: F401
import app.models.notification  # noqa: F401
import app.models.support  # noqa: F401
import app.models.chat  # noqa: F401
import app.models.deposit_request  # noqa: F401
import app.models.audit_log  # noqa: F401
import app.models.loan_application  # noqa: F401

from app.api.routes import auth, accounts, transactions, admin, health
from app.api.routes import beneficiaries, upi, credit_cards, loans, dashboard, reports
from app.api.routes import notifications, support, chat, deposits, audit, loan_applications


@asynccontextmanager
async def lifespan(_: FastAPI):
    Base.metadata.create_all(bind=engine)
    yield


app = FastAPI(
    title=settings.app_name,
    version=settings.app_version,
    docs_url="/api/docs",
    redoc_url="/api/redoc",
    openapi_url="/api/openapi.json",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health.router, prefix="/api")
app.include_router(auth.router, prefix="/api")
app.include_router(accounts.router, prefix="/api")
app.include_router(transactions.router, prefix="/api")
app.include_router(beneficiaries.router, prefix="/api")
app.include_router(upi.router, prefix="/api")
app.include_router(credit_cards.router, prefix="/api")
app.include_router(loans.router, prefix="/api")
app.include_router(dashboard.router, prefix="/api")
app.include_router(reports.router, prefix="/api")
app.include_router(notifications.router, prefix="/api")
app.include_router(support.router, prefix="/api")
app.include_router(chat.router, prefix="/api")
app.include_router(deposits.router, prefix="/api")
app.include_router(audit.router, prefix="/api")
app.include_router(loan_applications.router, prefix="/api")
app.include_router(admin.router, prefix="/api")
