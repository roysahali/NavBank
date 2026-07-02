"""Run once to populate the database with realistic Indian banking demo data.
Usage: python seed.py
"""
from __future__ import annotations

import os
import random
import string
import sys
from datetime import datetime, timedelta, timezone

sys.path.insert(0, os.path.dirname(__file__))

from app.database import Base, SessionLocal, engine

# Import ALL models so SQLAlchemy registers them
import app.models.user  # noqa
import app.models.account  # noqa
import app.models.transaction  # noqa
import app.models.beneficiary  # noqa
import app.models.upi  # noqa
import app.models.credit_card  # noqa
import app.models.loan  # noqa
import app.models.otp  # noqa
import app.models.notification  # noqa
import app.models.support  # noqa
import app.models.chat  # noqa
import app.models.deposit_request  # noqa
import app.models.loan_application  # noqa
import app.models.audit_log  # noqa

from app.models.user import User
from app.models.account import Account
from app.models.transaction import Transaction
from app.models.beneficiary import Beneficiary
from app.models.upi import UpiVpa, UpiTransaction
from app.models.credit_card import CreditCard, CreditCardTransaction
from app.models.loan import Loan, EmiPayment
from app.models.notification import Notification
from app.models.support import SupportTicket, SupportMessage
from app.core.security import hash_password

Base.metadata.create_all(bind=engine)
db = SessionLocal()


def gen_ref(mode: str) -> str:
    suffix = "".join(random.choices(string.ascii_uppercase + string.digits, k=8))
    return f"{mode.upper()}{datetime.now().strftime('%Y%m%d')}{suffix}"


def days_ago(n: int) -> datetime:
    return datetime.now(timezone.utc) - timedelta(days=n)


try:
    if db.query(User).count() > 0:
        print("Database already seeded. Delete banking.db to re-seed.")
        sys.exit(0)

    # ── USERS ──────────────────────────────────────────────────────────────
    admin_user = User(
        email="admin@novbank.in",
        full_name="Bank Admin",
        hashed_password=hash_password("Admin@123"),
        role="admin",
        mobile="9900000000",
        kyc_status="verified",
        pan_number="AAAPA9999A",
        address="NovBank HQ, BKC, Mumbai - 400051",
    )
    db.add(admin_user)

    rajesh = User(
        email="rajesh@novbank.in",
        full_name="Rajesh Kumar",
        hashed_password=hash_password("Rajesh@123"),
        role="customer",
        mobile="9876543210",
        kyc_status="verified",
        pan_number="ABCPK1234D",
        address="204, Andheri West, Mumbai - 400058",
    )
    priya = User(
        email="priya@novbank.in",
        full_name="Priya Sharma",
        hashed_password=hash_password("Priya@123"),
        role="customer",
        mobile="9845012345",
        kyc_status="verified",
        pan_number="BCDPS5678E",
        address="45, Lajpat Nagar, New Delhi - 110024",
    )
    amit = User(
        email="amit@novbank.in",
        full_name="Amit Patel",
        hashed_password=hash_password("Amit@123"),
        role="customer",
        mobile="9823456789",
        kyc_status="verified",
        pan_number="CDEAP9012F",
        address="12, Indiranagar, Bengaluru - 560038",
    )
    db.add_all([rajesh, priya, amit])
    db.flush()

    # ── ACCOUNTS ───────────────────────────────────────────────────────────
    rajesh_savings = Account(
        user_id=rajesh.id,
        account_type="savings",
        balance=124500.00,
        ifsc_code="NOVB0001001",
        branch_name="Mumbai Main Branch",
        interest_rate=3.5,
    )
    rajesh_current = Account(
        user_id=rajesh.id,
        account_type="current",
        balance=52000.00,
        ifsc_code="NOVB0001001",
        branch_name="Mumbai Main Branch",
        interest_rate=0.0,
    )
    priya_savings = Account(
        user_id=priya.id,
        account_type="savings",
        balance=67250.00,
        ifsc_code="NOVB0002001",
        branch_name="Delhi Central Branch",
        interest_rate=3.5,
    )
    amit_savings = Account(
        user_id=amit.id,
        account_type="savings",
        balance=231000.00,
        ifsc_code="NOVB0003001",
        branch_name="Bengaluru HSR Branch",
        interest_rate=3.5,
    )
    amit_current = Account(
        user_id=amit.id,
        account_type="current",
        balance=88000.00,
        ifsc_code="NOVB0003001",
        branch_name="Bengaluru HSR Branch",
        interest_rate=0.0,
    )
    db.add_all([rajesh_savings, rajesh_current, priya_savings, amit_savings, amit_current])
    db.flush()

    # ── TRANSACTIONS (25 for Rajesh) ───────────────────────────────────────
    # Spread across last 90 days with realistic Indian banking data

    txn_data = [
        # (days_ago, type, mode, amount, category, description, from_acc, to_acc, ref_mode, beneficiary_name)
        (90, "deposit", "NEFT", 85000.0, "salary", "Salary Credit - Infosys Ltd", None, rajesh_savings.id, "NEFT", "Infosys Ltd"),
        (88, "transfer", "IMPS", 28000.0, "rent", "Rent payment - Andheri West", rajesh_savings.id, None, "IMPS", None),
        (85, "transfer", "IMPS", 2400.0, "food", "BigBasket grocery order", rajesh_savings.id, None, "IMPS", "BigBasket"),
        (83, "transfer", "IMPS", 1200.0, "utilities", "BESCOM electricity bill", rajesh_savings.id, None, "IMPS", "BESCOM"),
        (80, "transfer", "IMPS", 649.0, "entertainment", "Netflix subscription", rajesh_savings.id, None, "IMPS", "Netflix India"),
        (75, "transfer", "IMPS", 3200.0, "fuel", "HP Petrol station - Andheri", rajesh_savings.id, None, "IMPS", "HP Fuel"),
        (72, "transfer", "IMPS", 850.0, "food", "Swiggy food order", rajesh_savings.id, None, "IMPS", "Swiggy"),
        (70, "transfer", "IMPS", 2800.0, "healthcare", "Apollo Pharmacy", rajesh_savings.id, None, "IMPS", "Apollo Pharmacy"),
        (68, "transfer", "IMPS", 4500.0, "shopping", "Flipkart order #FL789", rajesh_savings.id, None, "IMPS", "Flipkart"),
        (65, "withdrawal", "ATM", 10000.0, "other", "ATM withdrawal - Andheri West ATM", rajesh_savings.id, None, None, None),
        (62, "transfer", "NEFT", 5000.0, "other", "Mutual Fund SIP - HDFC Top 100", rajesh_savings.id, None, "NEFT", "HDFC Mutual Fund"),
        (60, "deposit", "NEFT", 85000.0, "salary", "Salary Credit - Infosys Ltd", None, rajesh_savings.id, "NEFT", "Infosys Ltd"),
        (58, "transfer", "IMPS", 28000.0, "rent", "Rent payment - Andheri West", rajesh_savings.id, None, "IMPS", None),
        (55, "transfer", "IMPS", 1890.0, "food", "Zomato food orders", rajesh_savings.id, None, "IMPS", "Zomato"),
        (52, "transfer", "NEFT", 850.0, "utilities", "Airtel broadband bill", rajesh_savings.id, None, "NEFT", "Airtel"),
        (48, "transfer", "IMPS", 12000.0, "shopping", "Amazon - Electronics", rajesh_savings.id, None, "IMPS", "Amazon India"),
        (45, "transfer", "IMPS", 2100.0, "healthcare", "Practo consultation + medicines", rajesh_savings.id, None, "IMPS", "Practo"),
        (42, "transfer", "IMPS", 1500.0, "entertainment", "BookMyShow - PVR Cinemas", rajesh_savings.id, None, "IMPS", "BookMyShow"),
        (38, "withdrawal", "ATM", 5000.0, "other", "ATM withdrawal - Bandra ATM", rajesh_savings.id, None, None, None),
        (35, "transfer", "NEFT", 5000.0, "other", "Mutual Fund SIP - HDFC Top 100", rajesh_savings.id, None, "NEFT", "HDFC Mutual Fund"),
        (30, "deposit", "NEFT", 85000.0, "salary", "Salary Credit - Infosys Ltd", None, rajesh_savings.id, "NEFT", "Infosys Ltd"),
        (28, "transfer", "IMPS", 28000.0, "rent", "Rent payment - Andheri West", rajesh_savings.id, None, "IMPS", None),
        (25, "transfer", "IMPS", 3500.0, "food", "Weekly grocery + dining", rajesh_savings.id, None, "IMPS", "BigBasket"),
        (20, "transfer", "IMPS", 7800.0, "shopping", "Myntra fashion sale", rajesh_savings.id, None, "IMPS", "Myntra"),
        (5, "transfer", "NEFT", 5000.0, "other", "Mutual Fund SIP - HDFC Top 100", rajesh_savings.id, None, "NEFT", "HDFC Mutual Fund"),
    ]

    for (day, txn_type, mode, amount, category, desc, from_id, to_id, ref_mode, bene_name) in txn_data:
        ref = gen_ref(ref_mode) if ref_mode else None
        txn = Transaction(
            from_account_id=from_id,
            to_account_id=to_id,
            amount=amount,
            transaction_type=txn_type,
            transfer_mode=mode,
            reference_number=ref,
            category=category,
            beneficiary_name=bene_name,
            status="completed",
            description=desc,
            created_at=days_ago(day),
        )
        db.add(txn)

    # A few transactions for Priya
    priya_txns = [
        Transaction(
            to_account_id=priya_savings.id,
            amount=45000.0,
            transaction_type="deposit",
            transfer_mode="NEFT",
            category="salary",
            reference_number=gen_ref("NEFT"),
            beneficiary_name="TCS Ltd",
            status="completed",
            description="Salary Credit - TCS Ltd",
            created_at=days_ago(30),
        ),
        Transaction(
            from_account_id=priya_savings.id,
            amount=15000.0,
            transaction_type="transfer",
            transfer_mode="NEFT",
            category="rent",
            reference_number=gen_ref("NEFT"),
            status="completed",
            description="Rent payment - Lajpat Nagar",
            created_at=days_ago(28),
        ),
    ]
    db.add_all(priya_txns)

    # ── UPI VPAs ───────────────────────────────────────────────────────────
    rajesh_vpa = UpiVpa(
        user_id=rajesh.id,
        vpa="rajesh.kumar@novbank",
        linked_account_id=rajesh_savings.id,
        is_primary=True,
        is_active=True,
    )
    priya_vpa = UpiVpa(
        user_id=priya.id,
        vpa="priya.sharma@novbank",
        linked_account_id=priya_savings.id,
        is_primary=True,
        is_active=True,
    )
    amit_vpa = UpiVpa(
        user_id=amit.id,
        vpa="amit.patel@novbank",
        linked_account_id=amit_savings.id,
        is_primary=True,
        is_active=True,
    )
    db.add_all([rajesh_vpa, priya_vpa, amit_vpa])
    db.flush()

    # ── UPI TRANSACTIONS (10 for Rajesh) ───────────────────────────────────
    upi_txn_data = [
        # (days_ago, sender_vpa, receiver_vpa, amount, note)
        (45, "rajesh.kumar@novbank", "priya.sharma@novbank", 500.0, "Split dinner"),
        (40, "priya.sharma@novbank", "rajesh.kumar@novbank", 200.0, "Movie tickets"),
        (35, "rajesh.kumar@novbank", "amit.patel@novbank", 1000.0, "Cricket match fee"),
        (30, "rajesh.kumar@novbank", "priya.sharma@novbank", 2500.0, "Office gift"),
        (25, "amit.patel@novbank", "rajesh.kumar@novbank", 750.0, "Lunch"),
        (20, "rajesh.kumar@novbank", "amit.patel@novbank", 4500.0, "Laptop bag split"),
        (15, "priya.sharma@novbank", "rajesh.kumar@novbank", 300.0, "Book cost"),
        (10, "rajesh.kumar@novbank", "priya.sharma@novbank", 1200.0, "Flight ticket share"),
        (7,  "rajesh.kumar@novbank", "amit.patel@novbank", 600.0, "Weekend trip fuel"),
        (3,  "amit.patel@novbank", "rajesh.kumar@novbank", 3000.0, "Medical expense help"),
    ]

    for (day, sender_vpa, receiver_vpa, amount, note) in upi_txn_data:
        upi_ref = f"UPI{datetime.now().strftime('%Y%m%d')}{''.join(random.choices(string.digits, k=12))}"
        # Create bank transaction
        if sender_vpa == "rajesh.kumar@novbank":
            from_acc = rajesh_savings.id
        elif sender_vpa == "priya.sharma@novbank":
            from_acc = priya_savings.id
        else:
            from_acc = amit_savings.id

        if receiver_vpa == "rajesh.kumar@novbank":
            to_acc = rajesh_savings.id
        elif receiver_vpa == "priya.sharma@novbank":
            to_acc = priya_savings.id
        else:
            to_acc = amit_savings.id

        bank_txn = Transaction(
            from_account_id=from_acc,
            to_account_id=to_acc,
            amount=amount,
            transaction_type="transfer",
            transfer_mode="UPI",
            reference_number=upi_ref,
            category="transfer",
            status="completed",
            description=note or f"UPI payment to {receiver_vpa}",
            created_at=days_ago(day),
        )
        db.add(bank_txn)
        db.flush()

        upi_txn = UpiTransaction(
            sender_vpa=sender_vpa,
            receiver_vpa=receiver_vpa,
            amount=amount,
            note=note,
            upi_reference=upi_ref,
            status="success",
            transaction_id=bank_txn.id,
            created_at=days_ago(day),
        )
        db.add(upi_txn)

    # ── CREDIT CARDS ───────────────────────────────────────────────────────
    rajesh_card1 = CreditCard(
        user_id=rajesh.id,
        card_number="4111 2345 6789 4821",
        cvv="356",
        card_type="VISA",
        card_variant="Platinum",
        credit_limit=500000.0,
        outstanding_amount=23450.0,
        available_limit=476550.0,
        billing_date=5,
        due_date_day=25,
        minimum_due=1173.0,
        reward_points=4820,
        status="active",
        expiry_month=12,
        expiry_year=2027,
    )
    rajesh_card2 = CreditCard(
        user_id=rajesh.id,
        card_number="5425 6789 1234 7392",
        cvv="781",
        card_type="MASTERCARD",
        card_variant="Gold",
        credit_limit=200000.0,
        outstanding_amount=8200.0,
        available_limit=191800.0,
        billing_date=10,
        due_date_day=30,
        minimum_due=410.0,
        reward_points=1640,
        status="active",
        expiry_month=6,
        expiry_year=2026,
    )
    priya_card1 = CreditCard(
        user_id=priya.id,
        card_number="6070 4321 8765 3456",
        cvv="412",
        card_type="RUPAY",
        card_variant="Classic",
        credit_limit=100000.0,
        outstanding_amount=0.0,
        available_limit=100000.0,
        billing_date=15,
        due_date_day=5,
        minimum_due=0.0,
        reward_points=890,
        status="active",
        expiry_month=8,
        expiry_year=2028,
    )
    db.add_all([rajesh_card1, rajesh_card2, priya_card1])
    db.flush()

    # Credit card transactions (5 for Rajesh card 1)
    cc_txns = [
        CreditCardTransaction(
            card_id=rajesh_card1.id,
            amount=3499.0,
            merchant_name="Amazon India",
            category="shopping",
            transaction_type="purchase",
            status="posted",
            created_at=days_ago(12),
        ),
        CreditCardTransaction(
            card_id=rajesh_card1.id,
            amount=850.0,
            merchant_name="Swiggy",
            category="food",
            transaction_type="purchase",
            status="posted",
            created_at=days_ago(9),
        ),
        CreditCardTransaction(
            card_id=rajesh_card1.id,
            amount=4200.0,
            merchant_name="Shell Fuel Station",
            category="fuel",
            transaction_type="purchase",
            status="posted",
            created_at=days_ago(7),
        ),
        CreditCardTransaction(
            card_id=rajesh_card1.id,
            amount=1100.0,
            merchant_name="PVR Cinemas",
            category="entertainment",
            transaction_type="purchase",
            status="posted",
            created_at=days_ago(4),
        ),
        CreditCardTransaction(
            card_id=rajesh_card1.id,
            amount=1800.0,
            merchant_name="BigBasket",
            category="food",
            transaction_type="purchase",
            status="posted",
            created_at=days_ago(2),
        ),
    ]
    db.add_all(cc_txns)

    # ── LOANS ──────────────────────────────────────────────────────────────
    rajesh_home_loan = Loan(
        user_id=rajesh.id,
        loan_type="home",
        loan_number="NOVB-HL-2021-00123",
        principal_amount=4500000.0,
        outstanding_amount=4230000.0,
        interest_rate=8.5,
        tenure_months=240,
        emi_amount=39168.0,
        disbursed_date="2021-06-01",
        next_due_date="2026-07-01",
        status="active",
        purpose="Purchase of 2BHK flat in Andheri West, Mumbai",
        linked_account_id=rajesh_savings.id,
    )
    rajesh_personal_loan = Loan(
        user_id=rajesh.id,
        loan_type="personal",
        loan_number="NOVB-PL-2024-00456",
        principal_amount=300000.0,
        outstanding_amount=185000.0,
        interest_rate=12.0,
        tenure_months=36,
        emi_amount=9965.0,
        disbursed_date="2024-01-15",
        next_due_date="2026-06-20",
        status="active",
        purpose="Home renovation",
        linked_account_id=rajesh_savings.id,
    )
    priya_personal_loan = Loan(
        user_id=priya.id,
        loan_type="personal",
        loan_number="NOVB-PL-2024-00789",
        principal_amount=150000.0,
        outstanding_amount=95000.0,
        interest_rate=13.0,
        tenure_months=24,
        emi_amount=7100.0,
        disbursed_date="2024-04-01",
        next_due_date="2026-07-05",
        status="active",
        purpose="Medical expenses",
        linked_account_id=priya_savings.id,
    )
    db.add_all([rajesh_home_loan, rajesh_personal_loan, priya_personal_loan])
    db.flush()

    # A few historical EMI payments for Rajesh home loan
    for i in range(1, 4):
        emi_pay = EmiPayment(
            loan_id=rajesh_home_loan.id,
            installment_number=i,
            amount_paid=39168.0,
            payment_date=(datetime.now() - timedelta(days=30 * (4 - i))).strftime("%Y-%m-%d"),
            status="paid",
        )
        db.add(emi_pay)

    # ── BENEFICIARIES (for Rajesh) ──────────────────────────────────────────
    benes = [
        Beneficiary(
            user_id=rajesh.id,
            name="Priya Sharma",
            account_number=priya_savings.account_number,
            ifsc_code="NOVB0002001",
            bank_name="NovBank",
            alias="Priya (Office)",
            is_active=True,
        ),
        Beneficiary(
            user_id=rajesh.id,
            name="Mom (HDFC)",
            account_number="50234567890123456",
            ifsc_code="HDFC0001234",
            bank_name="HDFC Bank",
            alias="Mom",
            is_active=True,
        ),
        Beneficiary(
            user_id=rajesh.id,
            name="Electricity Board",
            account_number="98765432109876543",
            ifsc_code="SBIN0001234",
            bank_name="SBI",
            alias="BESCOM",
            is_active=True,
        ),
    ]
    db.add_all(benes)

    db.commit()

    # ── NOTIFICATIONS & SUPPORT (Rajesh) ───────────────────────────────────
    try:
        # Notifications for Rajesh
        notif1 = Notification(
            user_id=rajesh.id,
            type="success",
            title="Salary Credited",
            message="₹85,000 has been credited to your savings account ACC ending 4821.",
            related_url="/transactions",
            is_read=False,
        )
        notif2 = Notification(
            user_id=rajesh.id,
            type="alert",
            title="EMI Due Soon",
            message="Your Home Loan EMI of ₹39,168 is due on July 1, 2026. Ensure sufficient balance.",
            related_url="/loans",
            is_read=False,
        )
        notif3 = Notification(
            user_id=rajesh.id,
            type="info",
            title="Account Statement Ready",
            message="Your account statement for May 2026 is ready for download.",
            related_url="/reports",
            is_read=True,
        )
        notif4 = Notification(
            user_id=rajesh.id,
            type="success",
            title="UPI Payment Successful",
            message="₹500 paid to priya.sharma@novbank successfully.",
            related_url="/upi",
            is_read=True,
        )
        notif5 = Notification(
            user_id=rajesh.id,
            type="warning",
            title="Credit Card Bill Due",
            message="Minimum due of ₹2,345 on your VISA Platinum card is due on June 25.",
            related_url="/credit-cards",
            is_read=False,
        )
        db.add_all([notif1, notif2, notif3, notif4, notif5])
        db.flush()

        # Support ticket 1 — resolved UPI dispute
        ticket1 = SupportTicket(
            user_id=rajesh.id,
            ticket_number="TKT-00001",
            subject="UPI payment failed but money deducted",
            category="upi",
            priority="high",
            status="resolved",
        )
        db.add(ticket1)
        db.flush()

        db.add(SupportMessage(
            ticket_id=ticket1.id,
            sender_id=rajesh.id,
            message="I made a UPI payment of ₹1,500 to a merchant but the money was deducted from my account and the merchant did not receive it. Transaction reference: UPI20260601XXXXX",
            is_admin_reply=False,
        ))
        db.add(SupportMessage(
            ticket_id=ticket1.id,
            sender_id=admin_user.id,
            message="We have investigated your case. The payment was reversed within 24 hours. Please check your account balance. We apologize for the inconvenience.",
            is_admin_reply=True,
        ))

        # Support ticket 2 — open credit card limit increase
        ticket2 = SupportTicket(
            user_id=rajesh.id,
            ticket_number="TKT-00002",
            subject="Request to increase credit card limit",
            category="card",
            priority="medium",
            status="open",
        )
        db.add(ticket2)
        db.flush()

        db.add(SupportMessage(
            ticket_id=ticket2.id,
            sender_id=rajesh.id,
            message="I would like to request an increase in my VISA Platinum credit card limit from ₹5,00,000 to ₹7,50,000. I have been a customer for 3 years with timely payments.",
            is_admin_reply=False,
        ))

        db.commit()
        print("Notifications and support tickets seeded.")
    except Exception as exc:
        db.rollback()
        print(f"Warning: could not seed notifications/support — {exc}")

    print("Seeded successfully!")
    print()
    print("Login credentials:")
    print("  Admin   -> admin@novbank.in   / Admin@123")
    print("  Rajesh  -> rajesh@novbank.in  / Rajesh@123  (main demo user)")
    print("  Priya   -> priya@novbank.in   / Priya@123")
    print("  Amit    -> amit@novbank.in    / Amit@123")
    print()
    print("OTP login: use mobile numbers above with demo OTP: 123456")

finally:
    db.close()
