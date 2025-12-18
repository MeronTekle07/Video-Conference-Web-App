# Quick Setup Guide

## 🚀 Backend Setup (5 minutes)

### Prerequisites

- Node.js (v16+)
- PostgreSQL (v12+)

### 1. Install Dependencies

```bash
cd backend
npm install
```

### 2. Run Setup Script

```bash
npm run setup
```

This creates your `.env` file from the template.

### 3. Configure Environment

Edit `.env` file with your database credentials:

```env
DB_PASSWORD=your_postgres_password
JWT_SECRET=your_super_secret_jwt_key_here_make_it_long_and_random
JWT_REFRESH_SECRET=your_refresh_token_secret_here
```

### 4. Create Database

In PostgreSQL:

```sql
CREATE DATABASE videoconf_db;
```

### 5. Run Migrations & Create Users

```bash
npm run db:migrate
npm run create-users
```

### 6. Start Server

```bash
npm run dev
```

Server will be running at: `http://localhost:5000`

## 🔐 Demo Users Created

| Role       | Email                       | Password   |
| ---------- | --------------------------- | ---------- |
| Admin      | `admin@example.com`         | `password` |
| Supervisor | `sarah.johnson@example.com` | `password` |
| Auditor    | `alex.wilson@example.com`   | `password` |
| User       | `john.doe@example.com`      | `password` |

## 🧪 Test the API

### Login Test

```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "password"
  }'
```

### Health Check

```bash
curl http://localhost:5000/health
```

## 📁 Project Structure

```
backend/
├── src/
│   ├── config/database.js      # DB connection
│   ├── controllers/authController.js
│   ├── database/migrate.js     # DB schema
│   ├── middleware/auth.js      # JWT auth
│   ├── routes/auth.js          # Auth routes
│   ├── scripts/createUsers.js  # Demo users
│   └── server.js               # Main server
├── package.json
├── .env                        # Environment vars
└── README.md                   # Full documentation
```

## 🔧 Available Scripts

- `npm run dev` - Start development server
- `npm run db:migrate` - Create database tables
- `npm run create-users` - Create demo users
- `npm run db:reset` - Reset database (drops all tables)
- `npm run setup` - Initial setup

## 🛠️ Troubleshooting

### Database Connection Issues

- Ensure PostgreSQL is running
- Check `.env` file has correct DB credentials
- Verify database `videoconf_db` exists

### Port Already in Use

- Change `PORT` in `.env` file
- Or kill process using port 5000

### JWT Errors

- Ensure `JWT_SECRET` and `JWT_REFRESH_SECRET` are set in `.env`
- Make secrets long and random

## 📚 Next Steps

1. Connect frontend to this backend
2. Implement meeting management APIs
3. Add WebRTC signaling
4. Set up production deployment

See `README.md` for full documentation and API reference.
