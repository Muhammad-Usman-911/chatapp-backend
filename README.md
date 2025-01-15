# NestJS Chat Application Backend

A robust backend service built with NestJS featuring authentication, real-time chat, email OTP verification, and JWT authentication.

## Features

- **Authentication System**
  - Login/Signup with email
  - Email OTP verification
  - OTP resend functionality
  - Secure logout
  - JWT-based authentication

- **Real-time Chat**
  - One-on-one messaging
  - WebSocket implementation
  - Message history
  - User presence

- **Security**
  - JWT Authentication Guards
  - Custom Middleware
  - Request validation pipes
  - Protected routes

## Technology Stack

- **Framework**: NestJS
- **Database**: PostgreSQL (hosted on Supabase)
- **ORM**: Prisma
- **Authentication**: JWT
- **Real-time Communication**: WebSockets
- **Email Service**: NestJS Mailer
- **API Documentation**: Swagger/OpenAPI

## Project Structure

```
src/
├── auth/
│   ├── decorators/
│   ├── dtos/
│   ├── guards/
│   ├── auth.controller.ts
│   ├── auth.model.ts
│   ├── auth.module.ts
│   └── auth.service.ts
├── chat/
│   ├── decorators/
│   ├── dto/
│   ├── chat.controller.ts
│   ├── chat.gateway.ts
│   ├── chat.gateway.spec.ts
│   ├── chat.module.ts
│   └── chat.service.ts
├── common/
│   └── middlewares/
│   |   └── auth.middleware.ts
│   └── coommon.module.ts/
├── config/
├── mailer/
└── prisma/
    └── schema.prisma
```

## API Endpoints

### Authentication

```
POST /auth/login
Body: {
    "email": "example@email.com",
    "name": "User Name"
}

POST /auth/verify-otp
Body: {
    "email": "example@email.com",
    "otp": "123456"
}

POST /auth/resend-otp
Body: {
    "email": "example@email.com"
}

POST /auth/logout
Header: Authorization: Bearer <token>

GET /auth/
Header: Authorization: Bearer <token>

GET /auth/user-data
Header: Authorization: Bearer <token>
```

### Chat

```
GET /chat/messages/:receiverId
Header: Authorization: Bearer <token>
```

## Database Schema

The application uses the following Prisma models:

- **User**: Stores user information and relationships
- **VerificationOtp**: Manages OTP verification
- **Chat**: Handles chat rooms and participants
- **Message**: Stores chat messages

## Environment Variables

Create a `.env` file in the root directory:

```env
DATABASE_URL="postgresql://user:password@host:port/database"
JWT_SECRET="your-jwt-secret"
MAIL_HOST="smtp.example.com"
MAIL_USER="your-email"
MAIL_PASSWORD="your-password"
MAIL_FROM="noreply@example.com"
```

## Installation

```bash
# Install dependencies
npm install

# Generate Prisma client
npx prisma generate

# Run database migrations
npx prisma migrate dev

# Start development server
npm run start:dev
```

## Running Tests

```bash
# Unit tests
npm run test

# E2E tests
npm run test:e2e

# Test coverage
npm run test:cov
```

## WebSocket Events

The chat gateway handles the following events:

- `joinRoom`: Join a chat room
- `leaveRoom`: Leave a chat room
- `sendMessage`: Send a message
- `receiveMessage`: Receive a message

## Security Implementations

1. **Authentication Guard**
   - Protects routes requiring authentication
   - Validates JWT tokens
   - Handles token expiration

2. **Middleware**
   - Request validation
   - Logging
   - Error handling

3. **Validation Pipes**
   - Input validation
   - Data transformation
   - Type checking

## Error Handling

The application implements a global error handling strategy with appropriate HTTP status codes and error messages.

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE.md](LICENSE.md) file for details.
