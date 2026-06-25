# 📦 ApexERP: Order & Inventory Management System

[![Java Version](https://img.shields.io/badge/Java-17%2B-orange?style=for-the-badge&logo=openjdk)](https://openjdk.org/)
[![Spring Boot](https://img.shields.io/badge/Spring_Boot-3.3.1-brightgreen?style=for-the-badge&logo=springboot)](https://spring.io/projects/spring-boot)
[![React](https://img.shields.io/badge/React-18%2B-blue?style=for-the-badge&logo=react)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-8.1.0-purple?style=for-the-badge&logo=vite)](https://vite.dev/)
[![Database](https://img.shields.io/badge/Database-MySQL%20%7C%20H2-blue?style=for-the-badge&logo=mysql)](https://www.mysql.com/)

A modern, full-stack, enterprise-grade **ERP Order & Inventory Management System** built with **React**, **Spring Boot**, and a hybrid database design (**MySQL** / **H2**). This system features role-based access control (Admin & Employee), live dashboard analytics, procurement and sales tracking pipelines, automated billing, stock movement ledgers, and exportable audit logs. It is designed to follow clean code standards and represents a complete final-year engineering project.

---

## ✨ Features

- 🔑 **Stateless JWT Security**: Protected routes and role-based actions (`ADMIN` vs. `EMPLOYEE`) using custom authorization filters.
- 📊 **Interactive Analytics Dashboard**: Beautiful visualizations using `Recharts` for sales trends, inventory distributions, warning alert status, and key KPI summaries.
- 🛍️ **Purchase & Sales Pipelines**: Master-detail pipelines with line-item totals, product selections, cost default entries, and transition workflows (Draft ➔ Ordered ➔ Received / Draft ➔ Confirmed ➔ Shipped ➔ Delivered).
- ⚙️ **Auto-Stock Deductions**: Verification of stock levels transactionally. Restocking (receiving POs) increments inventory; dispatching (shipping SOs) decrements inventory.
- 📄 **Billing & Invoices**: Automatic commercial invoice generation upon dispatch with 10% tax, invoice tracking, payment updates, and a **printable layout** formatted for physical print.
- 🛠️ **Stock Audit Ledger**: Direct manual adjustments interface with custom notes/reason entries, preserving a historical timeline of all stock changes in the database.
- 📑 **CSV Reports**: Real-time generation of CSV spreadsheets containing current stock catalog data.
- 🌓 **Theme Switcher**: Fluid dark/light theme switching using CSS HSL variables and premium glassmorphic layout elements.

---

## 🛠️ Technology Stack

| Component | Framework / Library | Description |
| :--- | :--- | :--- |
| **Backend** | Spring Boot 3.3.1 | Core REST services and security filters |
| **Security** | Spring Security 6 & JJWT | Authentication, BCrypt hashing, and role checks |
| **Persistence** | Spring Data JPA (Hibernate) | Database mapping layer |
| **Frontend** | React 18 & Vite | Single-page application UI client |
| **Router** | React Router Dom v6 | Client-side routing and protected guards |
| **Charts** | Recharts | Analytics dashboards graphs |
| **Icons** | Lucide React | Modern, clean vector graphics |
| **Database** | H2 (Memory) / MySQL | Dual-profile database schema targets |

---

## 📂 Project Structure

```
Order-Inventory-Management-System/
├── backend/                  # Spring Boot Maven Project
│   ├── pom.xml               # Backend dependencies
│   └── src/main/
│       ├── java/com/erp/inventory/
│       │   ├── config/       # Database seeder
│       │   ├── controller/   # REST Controllers
│       │   ├── dto/          # Data Transfer Objects
│       │   ├── exception/    # Error Handlers
│       │   ├── model/        # JPA Entities
│       │   ├── repository/   # Repository Interfaces
│       │   ├── security/     # Spring Security configurations
│       │   └── service/      # Business logic classes
│       └── resources/
│           ├── application.properties        # H2 config (Default)
│           └── application-mysql.properties  # MySQL config
│
└── frontend/                 # React Single Page App
    ├── package.json          # Frontend packages
    ├── vite.config.js        # Vite configurations
    └── src/
        ├── components/       # Layouts (Sidebar, Navbar)
        ├── context/          # Auth Context (JWT Session scope)
        ├── pages/            # Page Components (Dashboard, Orders, Invoices, Users)
        ├── services/         # Axios API Client pointing to port 8081
        ├── App.jsx           # Routers
        └── index.css         # Styling system
```

---

## 🚀 Getting Started

### 📋 Prerequisites
Ensure you have the following installed locally:
- **Java JDK 17** (or higher)
- **Node.js** (v18 or higher) & `npm`
- **Apache Maven** (v3.9 or higher)

---

### Step 1: Run the Backend Server

1. Open your terminal and navigate to the backend folder:
   ```bash
   cd backend
   ```
2. Start the server using the **in-memory H2 database** (Default Profile). This starts Tomcat on port `8081`, creates database tables, and populates the database with rich seeder logs instantly:
   ```bash
   mvn spring-boot:run
   ```
3. *(Optional MySQL Mode)*: If you want to use local MySQL, update the connection parameters in `backend/src/main/resources/application-mysql.properties` and run the backend with the `mysql` profile:
   ```bash
   mvn spring-boot:run -Dspring-boot.run.profiles=mysql
   ```

---

### Step 2: Run the Frontend Client

1. Open a new terminal and navigate to the frontend folder:
   ```bash
   cd frontend
   ```
2. Install npm package dependencies:
   ```bash
   npm install
   ```
3. Start the Vite React client:
   ```bash
   npm run dev
   ```
4. Open your browser and navigate to **`http://localhost:5173/`**.

---

## 🔑 Demo Access Credentials

The database is seeded with two users with different roles:

| Username | Password | Role | Description |
| :--- | :--- | :--- | :--- |
| **`admin`** | `admin123` | **`ADMIN`** | Full CRUD capabilities, creation forms, settings, and User Account CRUD access. |
| **`employee`** | `employee123` | **`EMPLOYEE`** | Operational workflows, order placements, stock adjustments, and reports. restricted from account management. |

---

## 🔒 Security & CORS Specifications

- **CORS Config**: Permitted requests originate from React clients at `http://localhost:5173`.
- **JWT Filter**: Intercepts inbound paths (except `/api/auth/**` and `/h2-console/**`), extracts `Bearer` tokens, verifies validity, and loads authorities into the context.
- **REST Validation**: Controller handlers implement `@Valid` checking for required payloads, and bad parameters throw standardized HTTP 400 Bad Request error formats.
