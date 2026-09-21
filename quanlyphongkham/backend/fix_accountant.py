import os

file_path = "app/services/ai_tool_registry.py"
with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

old_revenue = """    async def _handle_get_daily_revenue(self, db: AsyncSession, user: User, args: dict) -> dict:
        from app.models.models import Billing, PaymentStatus
        from sqlalchemy import func
        import datetime
        
        target_date = args.get("date")
        if not target_date:
            target_date = datetime.date.today().isoformat()
            
        stmt = select(func.sum(Billing.total_amount), func.count(Billing.id)).where(
            func.date(Billing.created_at) == target_date,
            Billing.status == PaymentStatus.PAID
        )"""

new_revenue = """    async def _handle_get_daily_revenue(self, db: AsyncSession, user: User, args: dict) -> dict:
        from app.models.models import Billing, BillingStatus
        from sqlalchemy import func
        import datetime
        
        target_date = args.get("date")
        if not target_date:
            target_date = datetime.date.today().isoformat()
            
        stmt = select(func.sum(Billing.total_amount), func.count(Billing.id)).where(
            func.date(Billing.created_at) == target_date,
            Billing.status == BillingStatus.PAID
        )"""

content = content.replace(old_revenue, new_revenue)

old_unpaid = """    async def _handle_get_unpaid_invoices(self, db: AsyncSession, user: User, args: dict) -> dict:
        from app.models.models import Billing, PaymentStatus, Patient
        from sqlalchemy.orm import selectinload
        
        stmt = select(Billing).options(selectinload(Billing.patient)).where(
            Billing.status.in_([PaymentStatus.UNPAID, PaymentStatus.PARTIAL])
        ).order_by(Billing.created_at.desc()).limit(10)"""

new_unpaid = """    async def _handle_get_unpaid_invoices(self, db: AsyncSession, user: User, args: dict) -> dict:
        from app.models.models import Billing, BillingStatus, Patient
        from sqlalchemy.orm import selectinload
        
        stmt = select(Billing).options(selectinload(Billing.patient)).where(
            Billing.status.in_([BillingStatus.UNPAID, BillingStatus.PARTIALLY_PAID])
        ).order_by(Billing.created_at.desc()).limit(10)"""

content = content.replace(old_unpaid, new_unpaid)

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)
print("Patched revenue and unpaid invoices")
