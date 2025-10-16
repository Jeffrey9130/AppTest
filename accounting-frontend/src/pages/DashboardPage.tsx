import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Wallet, Plus, Edit, Trash2, Download, LogOut } from 'lucide-react';
import {
  logout,
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  getExpenses,
  createExpense,
  updateExpense,
  deleteExpense,
  getMonthlyStats,
  getYearlyStats,
  downloadCSV,
  downloadPDF,
  Category,
  Expense,
  MonthlyStats,
  YearlyStats,
} from '@/lib/api';

interface DashboardPageProps {
  onLogout: () => void;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

export default function DashboardPage({ onLogout }: DashboardPageProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [monthlyStats, setMonthlyStats] = useState<MonthlyStats | null>(null);
  const [yearlyStats, setYearlyStats] = useState<YearlyStats | null>(null);
  
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);
  const [expenseDialogOpen, setExpenseDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  
  const [categoryName, setCategoryName] = useState('');
  const [categoryColor, setCategoryColor] = useState('#0088FE');
  
  const [expenseAmount, setExpenseAmount] = useState('');
  const [expenseDescription, setExpenseDescription] = useState('');
  const [expenseCategory, setExpenseCategory] = useState('');
  const [expenseDate, setExpenseDate] = useState(new Date().toISOString().split('T')[0]);
  
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterStartDate, setFilterStartDate] = useState('');
  const [filterEndDate, setFilterEndDate] = useState('');

  useEffect(() => {
    loadCategories();
    loadExpenses();
    loadMonthlyStats();
    loadYearlyStats();
  }, []);

  useEffect(() => {
    loadMonthlyStats();
  }, [selectedYear, selectedMonth]);

  useEffect(() => {
    loadYearlyStats();
  }, [selectedYear]);

  useEffect(() => {
    loadExpenses();
  }, [filterCategory, filterStartDate, filterEndDate]);

  const loadCategories = async () => {
    const result = await getCategories();
    if (result.data) {
      setCategories(result.data);
    }
  };

  const loadExpenses = async () => {
    const filters: any = {};
    if (filterCategory !== 'all') {
      filters.category_id = parseInt(filterCategory);
    }
    if (filterStartDate) {
      filters.start_date = filterStartDate + 'T00:00:00';
    }
    if (filterEndDate) {
      filters.end_date = filterEndDate + 'T23:59:59';
    }
    
    const result = await getExpenses(filters);
    if (result.data) {
      setExpenses(result.data);
    }
  };

  const loadMonthlyStats = async () => {
    const result = await getMonthlyStats(selectedYear, selectedMonth);
    if (result.data) {
      setMonthlyStats(result.data);
    }
  };

  const loadYearlyStats = async () => {
    const result = await getYearlyStats(selectedYear);
    if (result.data) {
      setYearlyStats(result.data);
    }
  };

  const handleCreateCategory = async () => {
    if (!categoryName) return;
    
    if (editingCategory) {
      await updateCategory(editingCategory.id, categoryName, categoryColor);
    } else {
      await createCategory(categoryName, categoryColor);
    }
    
    setCategoryDialogOpen(false);
    setCategoryName('');
    setCategoryColor('#0088FE');
    setEditingCategory(null);
    loadCategories();
  };

  const handleDeleteCategory = async (id: number) => {
    if (confirm('Are you sure you want to delete this category?')) {
      await deleteCategory(id);
      loadCategories();
    }
  };

  const handleCreateExpense = async () => {
    if (!expenseAmount || !expenseCategory || !expenseDescription) return;
    
    const data = {
      category_id: parseInt(expenseCategory),
      amount: parseFloat(expenseAmount),
      description: expenseDescription,
      date: expenseDate + 'T12:00:00',
    };
    
    if (editingExpense) {
      await updateExpense(editingExpense.id, data);
    } else {
      await createExpense(data);
    }
    
    setExpenseDialogOpen(false);
    setExpenseAmount('');
    setExpenseDescription('');
    setExpenseCategory('');
    setExpenseDate(new Date().toISOString().split('T')[0]);
    setEditingExpense(null);
    loadExpenses();
    loadMonthlyStats();
    loadYearlyStats();
  };

  const handleDeleteExpense = async (id: number) => {
    if (confirm('Are you sure you want to delete this expense?')) {
      await deleteExpense(id);
      loadExpenses();
      loadMonthlyStats();
      loadYearlyStats();
    }
  };

  const handleEditCategory = (category: Category) => {
    setEditingCategory(category);
    setCategoryName(category.name);
    setCategoryColor(category.color || '#0088FE');
    setCategoryDialogOpen(true);
  };

  const handleEditExpense = (expense: Expense) => {
    setEditingExpense(expense);
    setExpenseAmount(expense.amount.toString());
    setExpenseDescription(expense.description);
    setExpenseCategory(expense.category_id.toString());
    setExpenseDate(expense.date.split('T')[0]);
    setExpenseDialogOpen(true);
  };

  const handleLogout = () => {
    logout();
    onLogout();
  };

  const handleExportCSV = () => {
    const filters: any = {};
    if (filterStartDate) {
      filters.start_date = filterStartDate + 'T00:00:00';
    }
    if (filterEndDate) {
      filters.end_date = filterEndDate + 'T23:59:59';
    }
    downloadCSV(filters);
  };

  const handleExportPDF = () => {
    const filters: any = {};
    if (filterStartDate) {
      filters.start_date = filterStartDate + 'T00:00:00';
    }
    if (filterEndDate) {
      filters.end_date = filterEndDate + 'T23:59:59';
    }
    downloadPDF(filters);
  };

  const monthlyChartData = monthlyStats
    ? Object.entries(monthlyStats.expenses_by_category).map(([name, value]) => ({
        name,
        amount: value,
      }))
    : [];

  const yearlyChartData = yearlyStats
    ? Object.entries(yearlyStats.monthly_breakdown).map(([month, value]) => ({
        month,
        amount: value,
      }))
    : [];

  const categoryPieData = monthlyStats
    ? Object.entries(monthlyStats.expenses_by_category).map(([name, value]) => ({
        name,
        value,
      }))
    : [];

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-blue-600 p-2 rounded-lg">
              <Wallet className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Accounting App</h1>
          </div>
          <Button variant="outline" onClick={handleLogout}>
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <Tabs defaultValue="expenses" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="expenses">Expenses</TabsTrigger>
            <TabsTrigger value="categories">Categories</TabsTrigger>
            <TabsTrigger value="monthly">Monthly Stats</TabsTrigger>
            <TabsTrigger value="yearly">Yearly Stats</TabsTrigger>
          </TabsList>

          <TabsContent value="expenses" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Expenses</CardTitle>
                    <CardDescription>Manage your expenses</CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Dialog open={expenseDialogOpen} onOpenChange={setExpenseDialogOpen}>
                      <DialogTrigger asChild>
                        <Button onClick={() => {
                          setEditingExpense(null);
                          setExpenseAmount('');
                          setExpenseDescription('');
                          setExpenseCategory('');
                          setExpenseDate(new Date().toISOString().split('T')[0]);
                        }}>
                          <Plus className="w-4 h-4 mr-2" />
                          Add Expense
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>{editingExpense ? 'Edit Expense' : 'Add New Expense'}</DialogTitle>
                          <DialogDescription>
                            {editingExpense ? 'Update expense details' : 'Enter expense information'}
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div>
                            <Label htmlFor="amount">Amount</Label>
                            <Input
                              id="amount"
                              type="number"
                              step="0.01"
                              placeholder="0.00"
                              value={expenseAmount}
                              onChange={(e) => setExpenseAmount(e.target.value)}
                            />
                          </div>
                          <div>
                            <Label htmlFor="description">Description</Label>
                            <Input
                              id="description"
                              placeholder="What was this for?"
                              value={expenseDescription}
                              onChange={(e) => setExpenseDescription(e.target.value)}
                            />
                          </div>
                          <div>
                            <Label htmlFor="category">Category</Label>
                            <Select value={expenseCategory} onValueChange={setExpenseCategory}>
                              <SelectTrigger>
                                <SelectValue placeholder="Select category" />
                              </SelectTrigger>
                              <SelectContent>
                                {categories.map((cat) => (
                                  <SelectItem key={cat.id} value={cat.id.toString()}>
                                    {cat.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label htmlFor="date">Date</Label>
                            <Input
                              id="date"
                              type="date"
                              value={expenseDate}
                              onChange={(e) => setExpenseDate(e.target.value)}
                            />
                          </div>
                          <Button onClick={handleCreateExpense} className="w-full">
                            {editingExpense ? 'Update Expense' : 'Add Expense'}
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                    <Button variant="outline" onClick={handleExportCSV}>
                      <Download className="w-4 h-4 mr-2" />
                      CSV
                    </Button>
                    <Button variant="outline" onClick={handleExportPDF}>
                      <Download className="w-4 h-4 mr-2" />
                      PDF
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="filterCategory">Filter by Category</Label>
                      <Select value={filterCategory} onValueChange={setFilterCategory}>
                        <SelectTrigger>
                          <SelectValue placeholder="All categories" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Categories</SelectItem>
                          {categories.map((cat) => (
                            <SelectItem key={cat.id} value={cat.id.toString()}>
                              {cat.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="startDate">Start Date</Label>
                      <Input
                        id="startDate"
                        type="date"
                        value={filterStartDate}
                        onChange={(e) => setFilterStartDate(e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="endDate">End Date</Label>
                      <Input
                        id="endDate"
                        type="date"
                        value={filterEndDate}
                        onChange={(e) => setFilterEndDate(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Date</TableHead>
                          <TableHead>Description</TableHead>
                          <TableHead>Category</TableHead>
                          <TableHead className="text-right">Amount</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {expenses.map((expense) => (
                          <TableRow key={expense.id}>
                            <TableCell>{new Date(expense.date).toLocaleDateString()}</TableCell>
                            <TableCell>{expense.description}</TableCell>
                            <TableCell>
                              <Badge
                                style={{
                                  backgroundColor: expense.category_color || '#0088FE',
                                }}
                              >
                                {expense.category_name}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right font-medium">
                              ${expense.amount.toFixed(2)}
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleEditExpense(expense)}
                                >
                                  <Edit className="w-4 h-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleDeleteExpense(expense.id)}
                                >
                                  <Trash2 className="w-4 h-4 text-red-600" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                        {expenses.length === 0 && (
                          <TableRow>
                            <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                              No expenses found
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="categories" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Categories</CardTitle>
                    <CardDescription>Manage expense categories</CardDescription>
                  </div>
                  <Dialog open={categoryDialogOpen} onOpenChange={setCategoryDialogOpen}>
                    <DialogTrigger asChild>
                      <Button onClick={() => {
                        setEditingCategory(null);
                        setCategoryName('');
                        setCategoryColor('#0088FE');
                      }}>
                        <Plus className="w-4 h-4 mr-2" />
                        Add Category
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>{editingCategory ? 'Edit Category' : 'Add New Category'}</DialogTitle>
                        <DialogDescription>
                          {editingCategory ? 'Update category details' : 'Create a new expense category'}
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="categoryName">Name</Label>
                          <Input
                            id="categoryName"
                            placeholder="e.g., Food, Transport, Entertainment"
                            value={categoryName}
                            onChange={(e) => setCategoryName(e.target.value)}
                          />
                        </div>
                        <div>
                          <Label htmlFor="categoryColor">Color</Label>
                          <Input
                            id="categoryColor"
                            type="color"
                            value={categoryColor}
                            onChange={(e) => setCategoryColor(e.target.value)}
                          />
                        </div>
                        <Button onClick={handleCreateCategory} className="w-full">
                          {editingCategory ? 'Update Category' : 'Create Category'}
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {categories.map((category) => (
                    <Card key={category.id}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div
                              className="w-4 h-4 rounded-full"
                              style={{ backgroundColor: category.color || '#0088FE' }}
                            />
                            <span className="font-medium">{category.name}</span>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEditCategory(category)}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteCategory(category.id)}
                            >
                              <Trash2 className="w-4 h-4 text-red-600" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                  {categories.length === 0 && (
                    <div className="col-span-3 text-center py-8 text-gray-500">
                      No categories yet. Add one to get started!
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="monthly" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Monthly Statistics</CardTitle>
                    <CardDescription>View your monthly spending patterns</CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Select
                      value={selectedMonth.toString()}
                      onValueChange={(val) => setSelectedMonth(parseInt(val))}
                    >
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Array.from({ length: 12 }, (_, i) => i + 1).map((month) => (
                          <SelectItem key={month} value={month.toString()}>
                            {new Date(2000, month - 1).toLocaleString('default', { month: 'long' })}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Select
                      value={selectedYear.toString()}
                      onValueChange={(val) => setSelectedYear(parseInt(val))}
                    >
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i).map((year) => (
                          <SelectItem key={year} value={year.toString()}>
                            {year}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {monthlyStats && (
                  <div className="space-y-6">
                    <div className="grid grid-cols-3 gap-4">
                      <Card>
                        <CardHeader className="pb-3">
                          <CardTitle className="text-sm font-medium text-gray-600">
                            Total Expenses
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="text-3xl font-bold text-blue-600">
                            ${monthlyStats.total_expenses.toFixed(2)}
                          </div>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardHeader className="pb-3">
                          <CardTitle className="text-sm font-medium text-gray-600">
                            Transactions
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="text-3xl font-bold text-green-600">
                            {monthlyStats.expense_count}
                          </div>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardHeader className="pb-3">
                          <CardTitle className="text-sm font-medium text-gray-600">
                            Avg per Transaction
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="text-3xl font-bold text-purple-600">
                            $
                            {monthlyStats.expense_count > 0
                              ? (monthlyStats.total_expenses / monthlyStats.expense_count).toFixed(2)
                              : '0.00'}
                          </div>
                        </CardContent>
                      </Card>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-lg">Spending by Category</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={monthlyChartData}>
                              <CartesianGrid strokeDasharray="3 3" />
                              <XAxis dataKey="name" />
                              <YAxis />
                              <Tooltip />
                              <Bar dataKey="amount" fill="#0088FE" />
                            </BarChart>
                          </ResponsiveContainer>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader>
                          <CardTitle className="text-lg">Category Distribution</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <ResponsiveContainer width="100%" height={300}>
                            <PieChart>
                              <Pie
                                data={categoryPieData}
                                cx="50%"
                                cy="50%"
                                labelLine={false}
                                label={(entry) => entry.name}
                                outerRadius={100}
                                fill="#8884d8"
                                dataKey="value"
                              >
                                {categoryPieData.map((_, index) => (
                                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                              </Pie>
                              <Tooltip />
                            </PieChart>
                          </ResponsiveContainer>
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                )}
                {!monthlyStats && (
                  <div className="text-center py-8 text-gray-500">
                    No data available for this month
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="yearly" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Yearly Statistics</CardTitle>
                    <CardDescription>View your annual spending trends</CardDescription>
                  </div>
                  <Select
                    value={selectedYear.toString()}
                    onValueChange={(val) => setSelectedYear(parseInt(val))}
                  >
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i).map((year) => (
                        <SelectItem key={year} value={year.toString()}>
                          {year}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardHeader>
              <CardContent>
                {yearlyStats && (
                  <div className="space-y-6">
                    <div className="grid grid-cols-3 gap-4">
                      <Card>
                        <CardHeader className="pb-3">
                          <CardTitle className="text-sm font-medium text-gray-600">
                            Total Expenses
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="text-3xl font-bold text-blue-600">
                            ${yearlyStats.total_expenses.toFixed(2)}
                          </div>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardHeader className="pb-3">
                          <CardTitle className="text-sm font-medium text-gray-600">
                            Transactions
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="text-3xl font-bold text-green-600">
                            {yearlyStats.expense_count}
                          </div>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardHeader className="pb-3">
                          <CardTitle className="text-sm font-medium text-gray-600">
                            Monthly Average
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="text-3xl font-bold text-purple-600">
                            ${(yearlyStats.total_expenses / 12).toFixed(2)}
                          </div>
                        </CardContent>
                      </Card>
                    </div>

                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Monthly Breakdown</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ResponsiveContainer width="100%" height={400}>
                          <BarChart data={yearlyChartData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="month" />
                            <YAxis />
                            <Tooltip />
                            <Legend />
                            <Bar dataKey="amount" fill="#82ca9d" />
                          </BarChart>
                        </ResponsiveContainer>
                      </CardContent>
                    </Card>
                  </div>
                )}
                {!yearlyStats && (
                  <div className="text-center py-8 text-gray-500">
                    No data available for this year
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
