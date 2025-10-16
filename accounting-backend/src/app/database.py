from typing import Optional
from datetime import datetime

users_db: dict[int, dict] = {}
categories_db: dict[int, dict] = {}
expenses_db: dict[int, dict] = {}

user_id_counter = 1
category_id_counter = 1
expense_id_counter = 1

def get_user_by_username(username: str) -> Optional[dict]:
    for user in users_db.values():
        if user["username"] == username:
            return user
    return None

def get_user_by_email(email: str) -> Optional[dict]:
    for user in users_db.values():
        if user["email"] == email:
            return user
    return None

def get_user_by_id(user_id: int) -> Optional[dict]:
    return users_db.get(user_id)

def create_user(username: str, email: str, hashed_password: str) -> dict:
    global user_id_counter
    user = {
        "id": user_id_counter,
        "username": username,
        "email": email,
        "hashed_password": hashed_password
    }
    users_db[user_id_counter] = user
    user_id_counter += 1
    return user

def get_categories_by_user(user_id: int) -> list[dict]:
    return [cat for cat in categories_db.values() if cat["user_id"] == user_id]

def get_category_by_id(category_id: int) -> Optional[dict]:
    return categories_db.get(category_id)

def create_category(user_id: int, name: str, color: Optional[str]) -> dict:
    global category_id_counter
    category = {
        "id": category_id_counter,
        "user_id": user_id,
        "name": name,
        "color": color
    }
    categories_db[category_id_counter] = category
    category_id_counter += 1
    return category

def update_category(category_id: int, name: Optional[str], color: Optional[str]) -> Optional[dict]:
    category = categories_db.get(category_id)
    if not category:
        return None
    if name is not None:
        category["name"] = name
    if color is not None:
        category["color"] = color
    return category

def delete_category(category_id: int) -> bool:
    if category_id in categories_db:
        del categories_db[category_id]
        return True
    return False

def get_expenses_by_user(user_id: int, category_id: Optional[int] = None, 
                         start_date: Optional[datetime] = None, 
                         end_date: Optional[datetime] = None) -> list[dict]:
    expenses = [exp for exp in expenses_db.values() if exp["user_id"] == user_id]
    if category_id:
        expenses = [exp for exp in expenses if exp["category_id"] == category_id]
    if start_date:
        expenses = [exp for exp in expenses if exp["date"] >= start_date]
    if end_date:
        expenses = [exp for exp in expenses if exp["date"] <= end_date]
    return expenses

def get_expense_by_id(expense_id: int) -> Optional[dict]:
    return expenses_db.get(expense_id)

def create_expense(user_id: int, category_id: int, amount: float, 
                  description: str, date: datetime) -> dict:
    global expense_id_counter
    expense = {
        "id": expense_id_counter,
        "user_id": user_id,
        "category_id": category_id,
        "amount": amount,
        "description": description,
        "date": date,
        "created_at": datetime.now()
    }
    expenses_db[expense_id_counter] = expense
    expense_id_counter += 1
    return expense

def update_expense(expense_id: int, category_id: Optional[int], 
                  amount: Optional[float], description: Optional[str], 
                  date: Optional[datetime]) -> Optional[dict]:
    expense = expenses_db.get(expense_id)
    if not expense:
        return None
    if category_id is not None:
        expense["category_id"] = category_id
    if amount is not None:
        expense["amount"] = amount
    if description is not None:
        expense["description"] = description
    if date is not None:
        expense["date"] = date
    return expense

def delete_expense(expense_id: int) -> bool:
    if expense_id in expenses_db:
        del expenses_db[expense_id]
        return True
    return False
