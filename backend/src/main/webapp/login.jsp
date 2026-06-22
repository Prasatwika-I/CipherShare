<%@ page contentType="text/html;charset=UTF-8" language="java" %>
<%
    // Redirect logged-in users to their dashboard
    if (session != null && session.getAttribute("userId") != null) {
        String role = (String) session.getAttribute("userRole");
        if ("admin".equals(role)) response.sendRedirect(request.getContextPath() + "/admin/dashboard");
        else if ("manager".equals(role)) response.sendRedirect(request.getContextPath() + "/manager/dashboard");
        else response.sendRedirect(request.getContextPath() + "/user/dashboard");
        return;
    }
    String error = request.getParameter("error");
    String success = request.getParameter("success");
%>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>CipherShare — Login</title>
    <meta name="description" content="Secure role-based file sharing platform for organizations. Login to access your files.">
    <link rel="stylesheet" href="<%= request.getContextPath() %>/css/styles.css">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
</head>
<body>
<div class="auth-bg">
    <div class="auth-bg-orb orb-1"></div>
    <div class="auth-bg-orb orb-2"></div>
    <div class="auth-container">
        <div class="auth-card">
            <div class="auth-logo">
                <span class="logo-icon">🔐</span>
                <span class="logo-text">CipherShare</span>
            </div>
            <h1 class="auth-title">Welcome back</h1>
            <p class="auth-subtitle">Sign in to your secure workspace</p>

            <% if ("auth_failed".equals(error)) { %>
            <div class="alert alert-error">❌ Invalid credentials. Please try again.</div>
            <% } else if ("missing_token".equals(error)) { %>
            <div class="alert alert-error">❌ Authentication error. Please try again.</div>
            <% } else if ("already_registered".equals(error)) { %>
            <div class="alert alert-error">⚠️ Account already exists. Please login.</div>
            <% } else if ("registered".equals(success)) { %>
            <div class="alert alert-success">✅ Account created! Please login.</div>
            <% } else if ("logged_out".equals(success)) { %>
            <div class="alert alert-success">👋 You have been logged out securely.</div>
            <% } %>

            <form id="loginForm">
                <div class="form-group">
                    <label class="form-label" for="loginEmail">Email Address</label>
                    <input type="email" id="loginEmail" class="form-control" placeholder="you@organization.com" required>
                </div>
                <div class="form-group">
                    <label class="form-label" for="loginPassword">Password</label>
                    <input type="password" id="loginPassword" class="form-control" placeholder="Enter your password" required>
                </div>
                <div id="loginError" class="alert alert-error" style="display:none;"></div>
                <button type="submit" class="btn btn-primary btn-full" id="loginBtn">
                    <span class="btn-icon">🚀</span> Sign In
                </button>
            </form>

            <div class="divider">or continue with</div>

            <button class="btn google-btn btn-full" id="googleLoginBtn">
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
                    <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z" fill="#34A853"/>
                    <path d="M3.964 10.71A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
                    <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.958L3.964 6.29C4.672 4.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
                </svg>
                Sign in with Google
            </button>

            <p class="auth-footer">
                Don't have an account? <a href="<%= request.getContextPath() %>/register.jsp">Create one</a>
            </p>
        </div>
    </div>
</div>

<!-- Hidden form to POST idToken to server -->
<form id="authForm" action="<%= request.getContextPath() %>/auth/login" method="POST" style="display:none;">
    <input type="hidden" name="idToken" id="idTokenInput">
</form>

<script type="module">
    import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js';
    import { getAuth, signInWithEmailAndPassword, signInWithPopup, GoogleAuthProvider } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js';

    const firebaseConfig = {
        apiKey: "AIzaSyCKNtHFqFJRUaNMaBrt6RGP3z7BfjAXCw8",
        authDomain: "ciphershare-91dee.firebaseapp.com",
        projectId: "ciphershare-91dee",
        storageBucket: "ciphershare-91dee.firebasestorage.app",
        messagingSenderId: "895286306243",
        appId: "1:895286306243:web:7c7469a41191821e99c976"
    };

    const app = initializeApp(firebaseConfig);
    const auth = getAuth(app);
    const googleProvider = new GoogleAuthProvider();

    async function submitToken(user) {
        const token = await user.getIdToken();
        document.getElementById('idTokenInput').value = token;
        document.getElementById('authForm').submit();
    }

    // Email/Password login
    document.getElementById('loginForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const btn = document.getElementById('loginBtn');
        const errDiv = document.getElementById('loginError');
        btn.disabled = true;
        btn.innerHTML = '<span class="spinner"></span> Signing in...';
        errDiv.style.display = 'none';
        try {
            const email = document.getElementById('loginEmail').value;
            const password = document.getElementById('loginPassword').value;
            const cred = await signInWithEmailAndPassword(auth, email, password);
            await submitToken(cred.user);
        } catch (err) {
            errDiv.textContent = '❌ ' + (err.code === 'auth/invalid-credential' ? 'Invalid email or password.' : err.message);
            errDiv.style.display = 'block';
            btn.disabled = false;
            btn.innerHTML = '<span class="btn-icon">🚀</span> Sign In';
        }
    });

    // Google Sign-In
    document.getElementById('googleLoginBtn').addEventListener('click', async () => {
        try {
            const cred = await signInWithPopup(auth, googleProvider);
            await submitToken(cred.user);
        } catch (err) {
            document.getElementById('loginError').textContent = '❌ Google sign-in failed: ' + err.message;
            document.getElementById('loginError').style.display = 'block';
        }
    });
</script>
</body>
</html>
