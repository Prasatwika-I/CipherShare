# CipherShare

CipherShare is a secure, role-based enterprise file-sharing application designed to provide organizations with a centralized platform for managing and sharing sensitive documents. It ensures that data is only accessible to authorized personnel through strict Role-Based Access Control (RBAC).

## 🚀 Features

- **Role-Based Access Control (RBAC)**: Distinct access levels for Admins, Managers, and Employees (Users).
- **Secure File Management**: Upload, download, and securely share files within the organization.
- **Admin Command Center**: A comprehensive dashboard for managing users, monitoring system health, and viewing activity logs.
- **Activity Logging**: Full audit trails for file access, role changes, and system events.
- **Firebase Integration**: Utilizes Firebase Authentication for secure sign-ins and Firestore for fast, scalable database needs.

## 🛠️ Technology Stack

**Frontend:**
- React (Vite)
- React Router DOM
- Context API for state management
- Vanilla CSS with a modern Glassmorphism UI

**Backend:**
- Java & Spring Boot
- Maven Wrapper (`mvnw`)
- Firebase Admin SDK
- Embedded Tomcat

## ⚙️ Getting Started

### Prerequisites

- Node.js (v18+)
- Java 17+
- A `serviceAccountKey.json` from your Firebase Console.

### Running the Application Locally

The application is split into two parts: the Spring Boot backend and the React frontend.

#### 1. Start the Backend

1. Navigate to the `backend` directory.
2. Ensure you have your `serviceAccountKey.json` placed in `backend/src/main/resources/`.
3. Run the application using the Maven Wrapper:

```bash
cd backend
.\mvnw spring-boot:run
```
*(The backend runs on `http://localhost:8080` or `http://localhost:8081`)*

#### 2. Start the Frontend

1. Navigate to the `frontend` directory.
2. Install the required Node dependencies.
3. Start the Vite development server:

```bash
cd frontend
npm install
npm run dev
```
*(The frontend runs on `http://localhost:5173`)*

## 👥 User Roles

- **Admin (👑)**: Full system access. Can approve/reject manager requests, view all activity logs, manage roles, and oversee all files.
- **Manager (🎯)**: Can upload files, share files with users, manage their team files, and view their specific activity. (Requires admin approval upon registration).
- **Employee/User (👤)**: Can view and download files that have been specifically shared with them.

## 🔒 Security

- All API routes are secured via Spring Boot and Firebase Auth token validation.
- Frontend routes are protected using a custom `<ProtectedRoute>` component that verifies roles.
