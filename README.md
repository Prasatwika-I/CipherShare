# CipherShare

**Live Production Link:** [https://cipher-share-system.vercel.app/](https://cipher-share-system.vercel.app/)

CipherShare is a secure, role-based enterprise file-sharing application designed to provide organizations with a centralized platform for managing and sharing sensitive documents. It ensures that data is only accessible to authorized personnel through strict Role-Based Access Control (RBAC) and includes advanced anti-theft measures like a Secure Document Viewer that blocks screenshots, printing, and clipboard copying.

## 🚀 Features

- **Advanced Secure Viewer**: Documents can be viewed inline with automated protection against screenshots, downloading, and clipboard copying. The viewer hides documents if the browser loses focus.
- **Role-Based Access Control (RBAC)**: Distinct access levels for Admins, Managers, and Employees (Users).
- **Secure File Management**: Upload, download, and securely share files within the organization.
- **Admin Command Center**: A comprehensive dashboard for managing users, approving manager accounts, monitoring system health, and viewing activity logs.
- **Activity Logging**: Full audit trails for file access, role changes, and system events (including screenshot attempts).
- **Firebase Integration**: Utilizes Firebase Authentication for secure JWT sign-ins and Firestore for fast, scalable database needs.

## 🛠️ Technology Stack

**Frontend:**
- React (Vite) hosted on **Vercel**
- React Router DOM
- Context API for state management
- Vanilla CSS with a modern Glassmorphism UI

**Backend:**
- Java & Spring Boot hosted on **Render**
- Maven Wrapper (`mvnw`)
- Firebase Admin SDK for JWT Verification
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
- Cross-origin file streaming is secured using dynamic JWT query parameters to bypass strict browser third-party cookie blocking.
- Frontend routes are protected using a custom `<ProtectedRoute>` component that verifies roles.
