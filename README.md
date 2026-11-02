# Maaza International

A membership-based product and rewards management platform designed to manage products, user accounts, referrals, tasks, rewards, and financial transactions.

## 🚀 Overview

Maaza International provides a centralized platform where users can explore products, manage memberships, participate in promotional tasks, earn eligible rewards, invite friends, and manage their account activities.

The system includes administrative features for managing users, products, categories, campaigns, rewards, and transactions.

## ✨ Key Features

- **User Management:** Registration, authentication, and profile management.
- **Membership System:** Membership levels and product purchase eligibility.
- **Product Management:** Product listings, categories, pricing, and purchase rules.
- **Referral System:** Unique referral codes and referral tracking.
- **Task Management:** Daily check-ins, promotional tasks, and rewards.
- **Reward Management:** Campaigns, reward amounts, and eligibility.
- **Wallet Management:** Recharge, withdrawal, and transaction history.
- **Payout Management:** bKash and Nagad payout details.
- **Team Commission:** Configurable referral and team commission rules.
- **Admin Dashboard:** Manage platform activities and monitor transactions.

## 🛠️ Technologies

- Node.js
- Express.js
- TypeScript
- MongoDB
- Mongoose
- Zod
- JWT Authentication

## 📁 Project Structure

```text
src/
├── app/
│   └── modules/
│       ├── user/
│       ├── product/
│       ├── category/
│       ├── task/
│       ├── reward/
│       ├── referral/
│       ├── wallet/
│       └── transaction/
├── config/
├── errors/
├── interfaces/
├── middlewares/
├── routes/
├── utils/
└── server.ts
```

## ⚙️ Installation

**1. Clone the repository**

```bash
git clone <repository-url>
cd maaza-international
```

**2. Install dependencies**

```bash
npm install
```

**3. Configure environment variables**

Create a `.env` file:

```env
NODE_ENV=development
PORT=5000
DATABASE_URL=your_mongodb_connection_string
JWT_ACCESS_SECRET=your_access_secret
JWT_REFRESH_SECRET=your_refresh_secret
```

**4. Start development server**

```bash
npm run dev
```

## 📡 API Documentation

API endpoints are organized by modules, including:

- `/api/v1/auth`
- `/api/v1/users`
- `/api/v1/products`
- `/api/v1/categories`
- `/api/v1/tasks`
- `/api/v1/rewards`
- `/api/v1/wallet`
- `/api/v1/transactions`

Use Postman to test API endpoints and request validation.

## 🔐 Security

- JWT-based authentication.
- Request validation using Zod.
- Password hashing.
- Role-based authorization.
- Unique referral code generation.
- Server-side validation of financial transactions.
- Secure handling of payout information.

## ⚠️ Important Notice

Reward amounts, commissions, and projected income must not be treated as guaranteed returns. All financial operations must be validated and authorized on the backend.

## 📄 License

This project is currently maintained as a private project. All rights reserved.