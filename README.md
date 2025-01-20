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
  - Group chat functionality
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

#### One-on-One Chat
```
GET /chat/messages/:receiverId
Header: Authorization: Bearer <token>
```

#### Group Chat
```
POST /chat/messages/creategroup
Body: {
    "name": "New Group",
    "participants": [3]
}

GET /chat/groups
Header: Authorization: Bearer <token>

GET /chat/:groupId
Header: Authorization: Bearer <token>

DELETE /chat/:groupId
Header: Authorization: Bearer <token>
```

## Database Schema

The application uses the following Prisma models:

- **User**: Stores user information and relationships
- **VerificationOtp**: Manages OTP verification
- **Chat**: Handles chat rooms and participants
- **Message**: Stores chat messages

### Updated Prisma Schema

```prisma
// This is your Prisma schema file,
// learn more about it in the docs: https://pris.ly/d/prisma-schema

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id               Int               @id @default(autoincrement())
  name             String
  email            String            @unique
  verified         Boolean           @default(false)
  verificationOtps VerificationOtp[]
  chats            Chat[]            @relation("UserChats")  // Implicit many-to-many
  sentMessages     Message[]         @relation("SenderMessages")
  receivedMessages Message[]         @relation("ReceiverMessages")  // Added inverse relation
}

model VerificationOtp {
  id         Int      @id @default(autoincrement())
  otp        String
  expiresAt  DateTime
  used       Boolean  @default(false)
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt
  email      String
  userId     Int
  user       User     @relation(fields: [userId], references: [id])

  @@index([email], name: "email_idx")
  @@unique([otp, userId])
}

model Chat {
  id           Int       @id @default(autoincrement())
  participants User[]    @relation("UserChats") // Implicit many-to-many
  messages     Message[]
  name         String    @default("Groups")
  type         String    // "one-to-one" or "group"
  createdAt    DateTime  @default(now())
  updatedAt    DateTime  @updatedAt
}

model Message {
  id         Int      @id @default(autoincrement())
  content    String
  image      Bytes?
  
  chatId     Int
  chat       Chat     @relation(fields: [chatId], references: [id])
  
  senderId   Int
  sender     User     @relation("SenderMessages", fields: [senderId], references: [id])
  
  receiverId  Int?
  receiver    User?   @relation("ReceiverMessages", fields: [receiverId], references: [id])
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt

  @@index([chatId], name: "chat_idx")
}
```

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

