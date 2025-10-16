from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime

class User(BaseModel):
    id: int
    username: str
    email: EmailStr
    hashed_password: str

class UserCreate(BaseModel):
    username: str
    email: EmailStr
    password: str

class UserLogin(BaseModel):
    username: str
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str

class Category(BaseModel):
    id: int
    user_id: int
    name: str
    color: Optional[str] = None

class CategoryCreate(BaseModel):
    name: str
    color: Optional[str] = None

class CategoryUpdate(BaseModel):
    name: Optional[str] = None
    color: Optional[str] = None

class Expense(BaseModel):
    id: int
    user_id: int
    category_id: int
    amount: float
    description: str
    date: datetime
    created_at: datetime

class ExpenseCreate(BaseModel):
    category_id: int
    amount: float
    description: str
    date: datetime

class ExpenseUpdate(BaseModel):
    category_id: Optional[int] = None
    amount: Optional[float] = None
    description: Optional[str] = None
    date: Optional[datetime] = None

class ExpenseResponse(BaseModel):
    id: int
    user_id: int
    category_id: int
    category_name: str
    category_color: Optional[str]
    amount: float
    description: str
    date: datetime
    created_at: datetime

class MonthlyStats(BaseModel):
    year: int
    month: int
    total_expenses: float
    expenses_by_category: dict[str, float]
    expense_count: int

class YearlyStats(BaseModel):
    year: int
    total_expenses: float
    monthly_breakdown: dict[str, float]
    expenses_by_category: dict[str, float]
    expense_count: int
