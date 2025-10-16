# 账本应用 (Accounting App)

一个功能完整的全栈账本管理应用，支持支出跟踪、分类管理、统计分析和数据导出。

## 功能特性

- ✅ **用户认证**: 注册/登录系统（JWT认证）
- ✅ **支出管理**: 添加、编辑、删除支出记录
- ✅ **支出分类**: 创建和管理支出分类，支持自定义颜色
- ✅ **统计汇总**: 
  - 月度统计与图表展示
  - 年度统计与趋势分析
- ✅ **图表可视化**: 
  - 条形图展示分类支出
  - 饼图展示支出分布
  - 折线图展示年度趋势
- ✅ **数据导出**: 支持CSV和PDF格式导出
- ✅ **筛选功能**: 按分类、日期范围筛选支出

## 技术栈

### 后端
- **FastAPI**: Python Web框架
- **JWT**: 用户认证
- **ReportLab**: PDF生成
- **内存数据库**: 快速原型开发

### 前端
- **React 18**: UI框架
- **TypeScript**: 类型安全
- **Vite**: 构建工具
- **Tailwind CSS**: 样式框架
- **shadcn/ui**: UI组件库
- **Recharts**: 图表库
- **React Router**: 路由管理

## 已部署的应用

- **前端**: https://expense-tracker-app-55qbt6hg.devinapps.com
- **后端**: https://app-hnvjlfzc.fly.dev

## 本地开发

### 后端设置

```bash
cd accounting-backend
poetry install
poetry run fastapi dev src/app/main.py
```

后端将运行在 `http://localhost:8000`

### 前端设置

```bash
cd accounting-frontend
npm install
npm run dev
```

前端将运行在 `http://localhost:5173`

## 项目结构

```
.
├── accounting-backend/     # FastAPI后端
│   ├── src/
│   │   └── app/
│   │       ├── main.py     # API主文件
│   │       ├── models.py   # 数据模型
│   │       ├── auth.py     # 认证逻辑
│   │       └── database.py # 数据库操作
│   └── pyproject.toml      # Python依赖
│
└── accounting-frontend/    # React前端
    ├── src/
    │   ├── pages/          # 页面组件
    │   ├── lib/            # API客户端
    │   └── components/     # UI组件
    └── package.json        # Node.js依赖
```

## API端点

### 认证
- `POST /api/auth/register` - 用户注册
- `POST /api/auth/login` - 用户登录
- `GET /api/auth/me` - 获取当前用户

### 分类
- `GET /api/categories` - 获取分类列表
- `POST /api/categories` - 创建分类
- `PUT /api/categories/{id}` - 更新分类
- `DELETE /api/categories/{id}` - 删除分类

### 支出
- `GET /api/expenses` - 获取支出列表（支持筛选）
- `POST /api/expenses` - 创建支出
- `PUT /api/expenses/{id}` - 更新支出
- `DELETE /api/expenses/{id}` - 删除支出

### 统计
- `GET /api/stats/monthly` - 获取月度统计
- `GET /api/stats/yearly` - 获取年度统计

### 导出
- `GET /api/export/csv` - 导出CSV
- `GET /api/export/pdf` - 导出PDF

## 注意事项

- 后端使用内存数据库，重启后数据会丢失（适用于演示和开发）
- 生产环境建议使用持久化数据库（如PostgreSQL）
- 前端环境变量配置在 `.env` 文件中

## 作者

开发者: Devin AI
联系人: Yang Jeffrey (jeffrey.yang9130@gmail.com)
GitHub: @Jeffrey9130

## 许可证

MIT License
