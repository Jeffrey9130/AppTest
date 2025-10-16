from fastapi import FastAPI, HTTPException, Depends, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from datetime import datetime, timedelta
from typing import Optional
import csv
import io
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.lib import colors

from .models import (
    UserCreate, UserLogin, Token, User,
    CategoryCreate, CategoryUpdate, Category,
    ExpenseCreate, ExpenseUpdate, ExpenseResponse,
    MonthlyStats, YearlyStats
)
from .auth import (
    get_password_hash, verify_password, create_access_token, get_current_user_id
)
from . import database as db

app = FastAPI(title="Accounting API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {"message": "Accounting API"}

@app.get("/health")
def health_check():
    return {"status": "ok"}

@app.post("/api/auth/register", response_model=Token)
def register(user_data: UserCreate):
    if db.get_user_by_username(user_data.username):
        raise HTTPException(status_code=400, detail="Username already registered")
    if db.get_user_by_email(user_data.email):
        raise HTTPException(status_code=400, detail="Email already registered")
    
    hashed_password = get_password_hash(user_data.password)
    user = db.create_user(user_data.username, user_data.email, hashed_password)
    
    access_token = create_access_token(data={"sub": user["id"]})
    return {"access_token": access_token, "token_type": "bearer"}

@app.post("/api/auth/login", response_model=Token)
def login(user_data: UserLogin):
    user = db.get_user_by_username(user_data.username)
    if not user or not verify_password(user_data.password, user["hashed_password"]):
        raise HTTPException(status_code=401, detail="Incorrect username or password")
    
    access_token = create_access_token(data={"sub": user["id"]})
    return {"access_token": access_token, "token_type": "bearer"}

@app.get("/api/auth/me", response_model=User)
def get_current_user(user_id: int = Depends(get_current_user_id)):
    user = db.get_user_by_id(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user

@app.get("/api/categories", response_model=list[Category])
def list_categories(user_id: int = Depends(get_current_user_id)):
    return db.get_categories_by_user(user_id)

@app.post("/api/categories", response_model=Category)
def create_category(category_data: CategoryCreate, user_id: int = Depends(get_current_user_id)):
    category = db.create_category(user_id, category_data.name, category_data.color)
    return category

@app.put("/api/categories/{category_id}", response_model=Category)
def update_category(category_id: int, category_data: CategoryUpdate, user_id: int = Depends(get_current_user_id)):
    category = db.get_category_by_id(category_id)
    if not category:
        raise HTTPException(status_code=404, detail="Category not found")
    if category["user_id"] != user_id:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    updated = db.update_category(category_id, category_data.name, category_data.color)
    return updated

@app.delete("/api/categories/{category_id}")
def delete_category(category_id: int, user_id: int = Depends(get_current_user_id)):
    category = db.get_category_by_id(category_id)
    if not category:
        raise HTTPException(status_code=404, detail="Category not found")
    if category["user_id"] != user_id:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    db.delete_category(category_id)
    return {"message": "Category deleted"}

@app.get("/api/expenses", response_model=list[ExpenseResponse])
def list_expenses(
    category_id: Optional[int] = None,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    user_id: int = Depends(get_current_user_id)
):
    start = datetime.fromisoformat(start_date) if start_date else None
    end = datetime.fromisoformat(end_date) if end_date else None
    
    expenses = db.get_expenses_by_user(user_id, category_id, start, end)
    
    result = []
    for expense in expenses:
        category = db.get_category_by_id(expense["category_id"])
        result.append({
            **expense,
            "category_name": category["name"] if category else "Unknown",
            "category_color": category["color"] if category else None
        })
    
    return sorted(result, key=lambda x: x["date"], reverse=True)

@app.post("/api/expenses", response_model=ExpenseResponse)
def create_expense(expense_data: ExpenseCreate, user_id: int = Depends(get_current_user_id)):
    category = db.get_category_by_id(expense_data.category_id)
    if not category:
        raise HTTPException(status_code=404, detail="Category not found")
    if category["user_id"] != user_id:
        raise HTTPException(status_code=403, detail="Not authorized to use this category")
    
    expense = db.create_expense(
        user_id, 
        expense_data.category_id, 
        expense_data.amount,
        expense_data.description,
        expense_data.date
    )
    
    return {
        **expense,
        "category_name": category["name"],
        "category_color": category["color"]
    }

@app.put("/api/expenses/{expense_id}", response_model=ExpenseResponse)
def update_expense(expense_id: int, expense_data: ExpenseUpdate, user_id: int = Depends(get_current_user_id)):
    expense = db.get_expense_by_id(expense_id)
    if not expense:
        raise HTTPException(status_code=404, detail="Expense not found")
    if expense["user_id"] != user_id:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    if expense_data.category_id:
        category = db.get_category_by_id(expense_data.category_id)
        if not category or category["user_id"] != user_id:
            raise HTTPException(status_code=403, detail="Invalid category")
    
    updated = db.update_expense(
        expense_id,
        expense_data.category_id,
        expense_data.amount,
        expense_data.description,
        expense_data.date
    )
    
    category = db.get_category_by_id(updated["category_id"])
    return {
        **updated,
        "category_name": category["name"] if category else "Unknown",
        "category_color": category["color"] if category else None
    }

@app.delete("/api/expenses/{expense_id}")
def delete_expense(expense_id: int, user_id: int = Depends(get_current_user_id)):
    expense = db.get_expense_by_id(expense_id)
    if not expense:
        raise HTTPException(status_code=404, detail="Expense not found")
    if expense["user_id"] != user_id:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    db.delete_expense(expense_id)
    return {"message": "Expense deleted"}

@app.get("/api/stats/monthly", response_model=MonthlyStats)
def get_monthly_stats(year: int, month: int, user_id: int = Depends(get_current_user_id)):
    start_date = datetime(year, month, 1)
    if month == 12:
        end_date = datetime(year + 1, 1, 1) - timedelta(days=1)
    else:
        end_date = datetime(year, month + 1, 1) - timedelta(days=1)
    
    expenses = db.get_expenses_by_user(user_id, start_date=start_date, end_date=end_date)
    
    total = sum(exp["amount"] for exp in expenses)
    by_category = {}
    
    for exp in expenses:
        category = db.get_category_by_id(exp["category_id"])
        cat_name = category["name"] if category else "Unknown"
        by_category[cat_name] = by_category.get(cat_name, 0) + exp["amount"]
    
    return {
        "year": year,
        "month": month,
        "total_expenses": total,
        "expenses_by_category": by_category,
        "expense_count": len(expenses)
    }

@app.get("/api/stats/yearly", response_model=YearlyStats)
def get_yearly_stats(year: int, user_id: int = Depends(get_current_user_id)):
    start_date = datetime(year, 1, 1)
    end_date = datetime(year, 12, 31, 23, 59, 59)
    
    expenses = db.get_expenses_by_user(user_id, start_date=start_date, end_date=end_date)
    
    total = sum(exp["amount"] for exp in expenses)
    by_category = {}
    monthly_breakdown = {}
    
    for exp in expenses:
        category = db.get_category_by_id(exp["category_id"])
        cat_name = category["name"] if category else "Unknown"
        by_category[cat_name] = by_category.get(cat_name, 0) + exp["amount"]
        
        month_key = exp["date"].strftime("%Y-%m")
        monthly_breakdown[month_key] = monthly_breakdown.get(month_key, 0) + exp["amount"]
    
    return {
        "year": year,
        "total_expenses": total,
        "monthly_breakdown": monthly_breakdown,
        "expenses_by_category": by_category,
        "expense_count": len(expenses)
    }

@app.get("/api/export/csv")
def export_csv(
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    user_id: int = Depends(get_current_user_id)
):
    start = datetime.fromisoformat(start_date) if start_date else None
    end = datetime.fromisoformat(end_date) if end_date else None
    
    expenses = db.get_expenses_by_user(user_id, start_date=start, end_date=end)
    
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["Date", "Category", "Amount", "Description"])
    
    for exp in sorted(expenses, key=lambda x: x["date"]):
        category = db.get_category_by_id(exp["category_id"])
        cat_name = category["name"] if category else "Unknown"
        writer.writerow([
            exp["date"].strftime("%Y-%m-%d"),
            cat_name,
            exp["amount"],
            exp["description"]
        ])
    
    output.seek(0)
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=expenses.csv"}
    )

@app.get("/api/export/pdf")
def export_pdf(
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    user_id: int = Depends(get_current_user_id)
):
    start = datetime.fromisoformat(start_date) if start_date else None
    end = datetime.fromisoformat(end_date) if end_date else None
    
    expenses = db.get_expenses_by_user(user_id, start_date=start, end_date=end)
    
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=letter)
    elements = []
    
    styles = getSampleStyleSheet()
    elements.append(Paragraph("Expense Report", styles['Title']))
    
    data = [["Date", "Category", "Amount", "Description"]]
    total = 0
    
    for exp in sorted(expenses, key=lambda x: x["date"]):
        category = db.get_category_by_id(exp["category_id"])
        cat_name = category["name"] if category else "Unknown"
        data.append([
            exp["date"].strftime("%Y-%m-%d"),
            cat_name,
            f"${exp['amount']:.2f}",
            exp["description"]
        ])
        total += exp["amount"]
    
    data.append(["", "", f"${total:.2f}", "Total"])
    
    table = Table(data)
    table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, 0), 14),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
        ('BACKGROUND', (0, 1), (-1, -2), colors.beige),
        ('GRID', (0, 0), (-1, -1), 1, colors.black),
        ('BACKGROUND', (0, -1), (-1, -1), colors.lightgrey),
        ('FONTNAME', (0, -1), (-1, -1), 'Helvetica-Bold'),
    ]))
    
    elements.append(table)
    doc.build(elements)
    
    buffer.seek(0)
    return StreamingResponse(
        buffer,
        media_type="application/pdf",
        headers={"Content-Disposition": "attachment; filename=expenses.pdf"}
    )
