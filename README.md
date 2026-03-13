# TrendZip — Production-Grade Full-Stack E-Commerce Platform

![React](https://img.shields.io/badge/Frontend-React-blue)
![Supabase](https://img.shields.io/badge/Backend-Supabase-green)
![PostgreSQL](https://img.shields.io/badge/Database-PostgreSQL-blue)
![Razorpay](https://img.shields.io/badge/Payments-Razorpay-purple)
![Tailwind](https://img.shields.io/badge/UI-TailwindCSS-38B2AC)

TrendZip is a **production-grade full-stack fashion e-commerce platform** built from scratch using **React, Supabase, and Razorpay**.

The platform implements the **complete commerce lifecycle**:

```
Product Discovery → Cart → Checkout → Payment → Order Management → Admin Control Panel
```

The project emphasizes **secure backend architecture, database-driven business logic, and scalable system design**.

---

# Why This Project

Modern e-commerce systems require more than just UI features. They must ensure:

- Secure payment handling
- Reliable order creation
- Fraud-resistant coupon systems
- Strict data isolation between users
- Admin visibility over orders and analytics

TrendZip was built to explore how **production e-commerce platforms solve these problems** using a **database-centric backend architecture** powered by PostgreSQL.

Critical business logic such as **coupon validation, order integrity, and role-based access control** is enforced at the **database layer**, not the frontend.

---

# Key Engineering Highlights

• Full-stack architecture using **React + Supabase (PostgreSQL)**  
• **Server-side coupon validation** implemented with PostgreSQL RPCs  
• **Row-Level Security (RLS)** enforcing user data isolation  
• **Secure Razorpay payment integration**  
• **Order-before-payment architecture** preventing payment/order mismatch  
• **Admin analytics powered by SQL aggregation views**  
• **Animated, responsive UI** built with Tailwind and Framer Motion  

---

# Tech Stack

## Frontend

- React 18
- Vite
- React Router
- Tailwind CSS
- Framer Motion
- Zustand (state management)

## Backend

- Supabase
- PostgreSQL
- Supabase Auth
- Supabase Storage
- Supabase Edge Functions
- PostgreSQL RPC functions

## Payments

- Razorpay (UPI, Cards, Net Banking)

## Deployment

- Vercel (Frontend)
- Supabase Cloud (Backend)

---

# System Architecture

```
Client (React SPA)
        │
        ▼
Supabase JS Client
        │
        ▼
Supabase Platform
 ├── PostgreSQL Database
 ├── Row Level Security (RLS)
 ├── RPC Functions
 └── Edge Functions
        │
        ▼
Razorpay Payment Gateway
```

---

# Core Features

## Customer Features

### Product Discovery

- Product catalog with search and filters
- Product variants (size, color)
- Responsive product pages
- Animated UI interactions

---

### Shopping Cart

- Persistent cart using Zustand
- Quantity adjustments
- Real-time order summary
- Optimistic UI updates

---

### Checkout Flow

TrendZip implements a **4-step checkout architecture**:

```
Address → Delivery → Payment → Review
```

Features include:

- Saved addresses
- Delivery method selection
- Razorpay payments
- Cash on Delivery
- Coupon application

---

### Orders & Account

Users can:

- View order history
- Inspect order details
- Manage profile information
- Save multiple addresses

---

# Admin Panel

The admin dashboard enables full platform management.

Features include:

• Product and variant CRUD  
• Order lifecycle management  
• Coupon creation and eligibility rules  
• User analytics dashboard  

Admin analytics are powered by a **PostgreSQL aggregated view** to ensure efficient queries across large datasets.

---

# Security Architecture

TrendZip enforces multiple backend security layers.

---

## Row Level Security (RLS)

All user-facing tables enforce strict access policies:

```
user_id = auth.uid()
```

This ensures users can only access **their own data**, preventing horizontal privilege escalation.

---

## Server-Side Coupon Validation

Coupons are validated using a **PostgreSQL SECURITY DEFINER RPC**.

Benefits:

- Prevents discount manipulation from the frontend
- Ensures eligibility checks run on the server
- Protects against coupon abuse

Database constraints ensure **a coupon cannot be redeemed multiple times by the same user**.

---

## Order-Before-Payment Architecture

A common production problem occurs when payment is captured but the order fails to save.

TrendZip prevents this by **creating the order in the database before opening the Razorpay modal**.

Flow:

```
1. Create order (status: pending)
2. Open Razorpay payment modal
3. On payment success → mark order as paid
4. On failure/dismiss → cancel order
```

This guarantees **payment/order consistency**.

---

# Project Structure

```
src
│
├── components
│   ├── Navbar
│   ├── Footer
│   ├── ProductCard
│   └── AdminLayout
│
├── pages
│   ├── Home
│   ├── Catalog
│   ├── Product
│   ├── Cart
│   ├── Checkout
│   ├── Orders
│   └── Account
│
├── pages/admin
│   ├── Dashboard
│   ├── Orders
│   ├── Products
│   ├── Users
│   └── Coupons
│
├── store
│   ├── cartStore
│   └── authStore
│
└── lib
    └── supabaseClient
```

---

# Environment Variables

Create a `.env` file:

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_anon_key
VITE_RAZORPAY_KEY_ID=your_key
```

---

# Running Locally

```bash
git clone https://github.com/yourusername/trendzip.git

cd trendzip

npm install

npm run dev
```

---

# Engineering Concepts Demonstrated

This project demonstrates several real-world system design concepts:

• Full-stack architecture using **React + Supabase**  
• **Database-driven business logic** using PostgreSQL  
• **Secure payment integration workflows**  
• **Role-based access control (RBAC)**  
• **Row Level Security in production systems**  
• **Analytics using SQL aggregation views**  
• **Scalable state management using Zustand**

