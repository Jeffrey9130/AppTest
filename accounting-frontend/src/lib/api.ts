const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

interface ApiResponse<T> {
  data?: T;
  error?: string;
}

class ApiClient {
  private token: string | null = null;

  constructor() {
    this.token = localStorage.getItem('token');
  }

  setToken(token: string) {
    this.token = token;
    localStorage.setItem('token', token);
  }

  clearToken() {
    this.token = null;
    localStorage.removeItem('token');
  }

  async request<T>(endpoint: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    try {
      const response = await fetch(`${API_URL}${endpoint}`, {
        ...options,
        headers,
      });

      if (!response.ok) {
        if (response.status === 401) {
          this.clearToken();
          window.location.href = '/login';
        }
        const errorData = await response.json().catch(() => ({ detail: 'Request failed' }));
        return { error: errorData.detail || 'Request failed' };
      }

      const data = await response.json();
      return { data };
    } catch (error) {
      return { error: error instanceof Error ? error.message : 'Network error' };
    }
  }

  async get<T>(endpoint: string) {
    return this.request<T>(endpoint, { method: 'GET' });
  }

  async post<T>(endpoint: string, body: unknown) {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: JSON.stringify(body),
    });
  }

  async put<T>(endpoint: string, body: unknown) {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: JSON.stringify(body),
    });
  }

  async delete<T>(endpoint: string) {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }
}

export const api = new ApiClient();

export interface User {
  id: number;
  username: string;
  email: string;
}

export interface Category {
  id: number;
  user_id: number;
  name: string;
  color: string | null;
}

export interface Expense {
  id: number;
  user_id: number;
  category_id: number;
  category_name: string;
  category_color: string | null;
  amount: number;
  description: string;
  date: string;
  created_at: string;
}

export interface MonthlyStats {
  year: number;
  month: number;
  total_expenses: number;
  expenses_by_category: Record<string, number>;
  expense_count: number;
}

export interface YearlyStats {
  year: number;
  total_expenses: number;
  monthly_breakdown: Record<string, number>;
  expenses_by_category: Record<string, number>;
  expense_count: number;
}

export async function login(username: string, password: string) {
  const result = await api.post<{ access_token: string; token_type: string }>(
    '/api/auth/login',
    { username, password }
  );
  if (result.data) {
    api.setToken(result.data.access_token);
  }
  return result;
}

export async function register(username: string, email: string, password: string) {
  const result = await api.post<{ access_token: string; token_type: string }>(
    '/api/auth/register',
    { username, email, password }
  );
  if (result.data) {
    api.setToken(result.data.access_token);
  }
  return result;
}

export async function getCurrentUser() {
  return api.get<User>('/api/auth/me');
}

export async function getCategories() {
  return api.get<Category[]>('/api/categories');
}

export async function createCategory(name: string, color: string) {
  return api.post<Category>('/api/categories', { name, color });
}

export async function updateCategory(id: number, name: string, color: string) {
  return api.put<Category>(`/api/categories/${id}`, { name, color });
}

export async function deleteCategory(id: number) {
  return api.delete(`/api/categories/${id}`);
}

export async function getExpenses(filters?: {
  category_id?: number;
  start_date?: string;
  end_date?: string;
}) {
  const params = new URLSearchParams();
  if (filters?.category_id) params.append('category_id', filters.category_id.toString());
  if (filters?.start_date) params.append('start_date', filters.start_date);
  if (filters?.end_date) params.append('end_date', filters.end_date);
  
  const query = params.toString();
  return api.get<Expense[]>(`/api/expenses${query ? `?${query}` : ''}`);
}

export async function createExpense(data: {
  category_id: number;
  amount: number;
  description: string;
  date: string;
}) {
  return api.post<Expense>('/api/expenses', data);
}

export async function updateExpense(id: number, data: {
  category_id?: number;
  amount?: number;
  description?: string;
  date?: string;
}) {
  return api.put<Expense>(`/api/expenses/${id}`, data);
}

export async function deleteExpense(id: number) {
  return api.delete(`/api/expenses/${id}`);
}

export async function getMonthlyStats(year: number, month: number) {
  return api.get<MonthlyStats>(`/api/stats/monthly?year=${year}&month=${month}`);
}

export async function getYearlyStats(year: number) {
  return api.get<YearlyStats>(`/api/stats/yearly?year=${year}`);
}

export async function downloadCSV(filters?: { start_date?: string; end_date?: string }) {
  const params = new URLSearchParams();
  if (filters?.start_date) params.append('start_date', filters.start_date);
  if (filters?.end_date) params.append('end_date', filters.end_date);
  
  const query = params.toString();
  const token = localStorage.getItem('token');
  
  try {
    const response = await fetch(
      `${API_URL}/api/export/csv${query ? `?${query}` : ''}`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      }
    );
    
    if (!response.ok) {
      throw new Error('Failed to download CSV');
    }
    
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `expenses_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  } catch (error) {
    console.error('CSV download failed:', error);
    alert('Failed to download CSV. Please try again.');
  }
}

export async function downloadPDF(filters?: { start_date?: string; end_date?: string }) {
  const params = new URLSearchParams();
  if (filters?.start_date) params.append('start_date', filters.start_date);
  if (filters?.end_date) params.append('end_date', filters.end_date);
  
  const query = params.toString();
  const token = localStorage.getItem('token');
  
  try {
    const response = await fetch(
      `${API_URL}/api/export/pdf${query ? `?${query}` : ''}`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      }
    );
    
    if (!response.ok) {
      throw new Error('Failed to download PDF');
    }
    
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `expenses_${new Date().toISOString().split('T')[0]}.pdf`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  } catch (error) {
    console.error('PDF download failed:', error);
    alert('Failed to download PDF. Please try again.');
  }
}

export function logout() {
  api.clearToken();
}
