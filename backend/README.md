# VideoConf Backend

A Node.js backend for the Video Conferencing Application with JWT-based authentication, PostgreSQL database, and role-based access control.

## Features

- 🔐 **JWT Authentication** with access and refresh tokens
- 👥 **Role-based Access Control** (Admin, Supervisor, Auditor, User)
- 🛡️ **Security Features** including rate limiting, password hashing, and security event logging
- 🗄️ **PostgreSQL Database** with comprehensive schema
- ✅ **Input Validation** using express-validator
- 📊 **Security Event Logging** for audit trails
- 🔄 **Token Refresh** mechanism
- 🚀 **Production Ready** with proper error handling and logging

## Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: PostgreSQL
- **Authentication**: JWT (jsonwebtoken)
- **Password Hashing**: bcryptjs
- **Validation**: express-validator
- **Security**: helmet, cors, express-rate-limit
- **Environment**: dotenv

## Prerequisites

- Node.js (v16 or higher)
- PostgreSQL (v12 or higher)
- npm or yarn

## Installation

1. **Clone the repository and navigate to backend directory**

   ```bash
   cd backend
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Set up environment variables**

   ```bash
   cp env.example .env
   ```

   Edit `.env` file with your configuration:

   ```env
   # Server Configuration
   PORT=5000
   NODE_ENV=development

   # Database Configuration
   DB_HOST=localhost
   DB_PORT=5432
   DB_NAME=videoconf_db
   DB_USER=postgres
   DB_PASSWORD=your_password

   # JWT Configuration
   JWT_SECRET=your_super_secret_jwt_key_here_make_it_long_and_random
   JWT_EXPIRES_IN=24h
   JWT_REFRESH_SECRET=your_refresh_token_secret_here
   JWT_REFRESH_EXPIRES_IN=7d

   # CORS
   CORS_ORIGIN=http://localhost:3000
   ```

4. **Create PostgreSQL database**

   ```sql
   CREATE DATABASE videoconf_db;
   ```

5. **Run database migration**

   ```bash
   npm run db:migrate
   ```

6. **Create demo users**

   ```bash
   npm run create-users
   ```

7. **Start the server**

   ```bash
   # Development mode
   npm run dev

   # Production mode
   npm start
   ```

## Database Schema

The application includes the following tables:

- **users**: User accounts with roles and profiles
- **meetings**: Meeting information and scheduling
- **meeting_participants**: Meeting attendance and participant states
- **meeting_chat**: Chat messages during meetings
- **admin_actions**: Administrative actions taken during meetings
- **user_settings**: User preferences and settings
- **contacts**: User contact relationships
- **calendar_events**: Calendar events and scheduling
- **security_events**: Security audit log

## User Roles

### Admin

- Full system access
- User management
- Meeting monitoring and control
- System configuration
- Security management

### Supervisor

- Team management capabilities
- Meeting oversight
- Limited administrative functions

### Auditor

- Read-only access to system data
- Security event monitoring
- Compliance reporting

### User

- Basic meeting participation
- Personal settings management
- Contact management

## API Endpoints

### Authentication

#### POST `/api/auth/login`

Login with email and password.

**Request:**

```json
{
  "email": "admin@example.com",
  "password": "password"
}
```

**Response:**

```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": "uuid",
      "name": "Admin User",
      "email": "admin@example.com",
      "role": "admin",
      "status": "active"
    },
    "accessToken": "jwt_token",
    "refreshToken": "refresh_token"
  }
}
```

#### POST `/api/auth/register`

Register a new user account.

**Request:**

```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "SecurePass123",
  "title": "Software Developer",
  "department": "Engineering",
  "phone": "+1 (555) 123-4567"
}
```

#### POST `/api/auth/refresh`

Refresh access token using refresh token.

**Request:**

```json
{
  "refreshToken": "refresh_token_here"
}
```

#### POST `/api/auth/logout`

Logout user (requires authentication).

#### GET `/api/auth/profile`

Get current user profile (requires authentication).

#### PUT `/api/auth/profile`

Update user profile (requires authentication).

#### POST `/api/auth/change-password`

Change user password (requires authentication).

## Demo Users

The system comes with pre-configured demo users:

### Admin Users

- **Email**: `admin@example.com` / **Password**: `password`
- **Email**: `superadmin@example.com` / **Password**: `password`

### Supervisor Users

- **Email**: `sarah.johnson@example.com` / **Password**: `password`
- **Email**: `mike.chen@example.com` / **Password**: `password`
- **Email**: `emily.davis@example.com` / **Password**: `password`

### Auditor Users

- **Email**: `alex.wilson@example.com` / **Password**: `password`
- **Email**: `lisa.brown@example.com` / **Password**: `password`

### Regular Users

- **Email**: `john.doe@example.com` / **Password**: `password`
- **Email**: `jane.smith@example.com` / **Password**: `password`
- And 10+ more users...

## Security Features

### Password Requirements

- Minimum 6 characters
- Must contain uppercase, lowercase, and number
- Hashed using bcrypt with 12 rounds

### Rate Limiting

- 100 requests per 15 minutes per IP
- Login attempts limited to 5 per 15 minutes per IP

### JWT Security

- Access tokens expire in 24 hours
- Refresh tokens expire in 7 days
- Separate secrets for access and refresh tokens

### Security Event Logging

- Login attempts (successful and failed)
- Password changes
- Permission changes
- Suspicious activity detection

## Development

### Available Scripts

```bash
# Start development server with nodemon
npm run dev

# Start production server
npm start

# Run database migration
npm run db:migrate

# Create demo users
npm run create-users

# Reset database (drops all tables)
npm run db:reset
```

### Project Structure

```
backend/
├── src/
│   ├── config/
│   │   └── database.js          # Database configuration
│   ├── controllers/
│   │   └── authController.js    # Authentication logic
│   ├── database/
│   │   └── migrate.js           # Database migration
│   ├── middleware/
│   │   └── auth.js              # Authentication middleware
│   ├── routes/
│   │   └── auth.js              # Authentication routes
│   ├── scripts/
│   │   └── createUsers.js       # User creation script
│   └── server.js                # Main server file
├── package.json
├── env.example
└── README.md
```

## Environment Variables

| Variable                 | Description              | Default                 |
| ------------------------ | ------------------------ | ----------------------- |
| `PORT`                   | Server port              | `5000`                  |
| `NODE_ENV`               | Environment              | `development`           |
| `DB_HOST`                | Database host            | `localhost`             |
| `DB_PORT`                | Database port            | `5432`                  |
| `DB_NAME`                | Database name            | `videoconf_db`          |
| `DB_USER`                | Database user            | `postgres`              |
| `DB_PASSWORD`            | Database password        | Required                |
| `JWT_SECRET`             | JWT signing secret       | Required                |
| `JWT_EXPIRES_IN`         | JWT expiration           | `24h`                   |
| `JWT_REFRESH_SECRET`     | Refresh token secret     | Required                |
| `JWT_REFRESH_EXPIRES_IN` | Refresh token expiration | `7d`                    |
| `BCRYPT_ROUNDS`          | Password hashing rounds  | `12`                    |
| `CORS_ORIGIN`            | Allowed CORS origin      | `http://localhost:3000` |

## Error Handling

The API returns consistent error responses:

```json
{
  "success": false,
  "message": "Error description",
  "errors": [] // Validation errors if applicable
}
```

Common HTTP status codes:

- `200` - Success
- `201` - Created
- `400` - Bad Request (validation errors)
- `401` - Unauthorized (authentication required)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `409` - Conflict (resource already exists)
- `429` - Too Many Requests (rate limited)
- `500` - Internal Server Error

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

MIT License - see LICENSE file for details.
