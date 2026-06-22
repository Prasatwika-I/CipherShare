<%@ page contentType="text/html;charset=UTF-8" language="java" %>
<%
    if (session != null && session.getAttribute("userId") != null) {
        response.sendRedirect(request.getContextPath() + "/user/dashboard");
        return;
    }
    String error = request.getParameter("error");
%>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>CipherShare — Register</title>
    <meta name="description" content="Create your CipherShare account for secure role-based file sharing.">
    <link rel="stylesheet" href="<%= request.getContextPath() %>/css/styles.css">
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
            <h1 class="auth-title">Create Account</h1>
            <p class="auth-subtitle">Join your organization's secure file platform</p>

            <% if ("missing_fields".equals(error)) { %>
            <div class="alert alert-error">❌ Please fill in all required fields.</div>
            <% } else if ("registration_failed".equals(error)) { %>
            <div class="alert alert-error">❌ Registration failed. Please try again.</div>
            <% } %>

            <form id="registerForm">
                <div class="form-group">
                    <label class="form-label" for="regName">Full Name</label>
                    <input type="text" id="regName" class="form-control" placeholder="John Doe" required>
                </div>
                <div class="form-group">
                    <label class="form-label" for="regEmail">Email Address</label>
                    <input type="email" id="regEmail" class="form-control" placeholder="you@organization.com" required>
                </div>
                <div class="form-group">
                    <label class="form-label" for="regDept">Department</label>
                    <select id="regDept" class="form-control">
                        <option value="General">General</option>
                        <option value="Engineering">Engineering</option>
                        <option value="Marketing">Marketing</option>
                        <option value="Finance">Finance</option>
                        <option value="HR">Human Resources</option>
                        <option value="Operations">Operations</option>
                        <option value="Sales">Sales</option>
                        <option value="Legal">Legal</option>
                        <option value="IT">Information Technology</option>
                    </select>
                </div>
                <div class="form-group">
                    <label class="form-label" for="regPassword">Password</label>
                    <input type="password" id="regPassword" class="form-control" placeholder="Min. 6 characters" required minlength="6">
                </div>
                <div class="form-group">
                    <label class="form-label" for="regConfirmPassword">Confirm Password</label>
                    <input type="password" id="regConfirmPassword" class="form-control" placeholder="Repeat your password" required>
                </div>
                <div id="registerError" class="alert alert-error" style="display:none;"></div>
                <button type="submit" class="btn btn-primary btn-full" id="registerBtn">
                    <span class="btn-icon">✨</span> Create Account
                </button>
            </form>

            <div class="divider">or</div>

            <button class="btn google-btn btn-full" id="googleRegisterBtn">
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                    <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
                    <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z" fill="#34A853"/>
                    <path d="M3.964 10.71A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
                    <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.958L3.964 6.29C4.672 4.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
                </svg>
                Sign up with Google
            </button>

            <p class="auth-footer">
                Already have an account? <a href="<%= request.getContextPath() %>/login.jsp">Sign in</a>
            </p>
            <p class="auth-note">
                🔒 New accounts are assigned <strong>Employee</strong> role by default. An admin can upgrade your access.
            </p>
        </div>
    </div>
</div>

<form id="regServerForm" action="<%= request.getContextPath() %>/auth/register" method="POST" style="display:none;">
    <input type="hidden" name="idToken" id="regIdToken">
    <input type="hidden" name="name" id="regNameHidden">
    <input type="hidden" name="department" id="regDeptHidden">
</form>

<script type="module">
    import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js';
    import { getAuth, createUserWithEmailAndPassword, signInWithPopup, GoogleAuthProvider } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js';

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

    async function submitRegister(user, name, dept) {
        const token = await user.getIdToken();
        document.getElementById('regIdToken').value = token;
        document.getElementById('regNameHidden').value = name;
        document.getElementById('regDeptHidden').value = dept;
        document.getElementById('regServerForm').submit();
    }

    document.getElementById('registerForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const errDiv = document.getElementById('registerError');
        const btn = document.getElementById('registerBtn');
        errDiv.style.display = 'none';

        const name = document.getElementById('regName').value.trim();
        const email = document.getElementById('regEmail').value.trim();
        const dept = document.getElementById('regDept').value;
        const pass = document.getElementById('regPassword').value;
        const confirm = document.getElementById('regConfirmPassword').value;

        if (pass !== confirm) {
            errDiv.textContent = '❌ Passwords do not match.';
            errDiv.style.display = 'block';
            return;
        }

        btn.disabled = true;
        btn.innerHTML = '<span class="spinner"></span> Creating account...';

        try {
            const cred = await createUserWithEmailAndPassword(auth, email, pass);
            await submitRegister(cred.user, name, dept);
        } catch (err) {
            let msg = err.message;
            if (err.code === 'auth/email-already-in-use') msg = 'This email is already registered.';
            if (err.code === 'auth/weak-password') msg = 'Password must be at least 6 characters.';
            errDiv.textContent = '❌ ' + msg;
            errDiv.style.display = 'block';
            btn.disabled = false;
            btn.innerHTML = '<span class="btn-icon">✨</span> Create Account';
        }
    });

    document.getElementById('googleRegisterBtn').addEventListener('click', async () => {
        try {
            const cred = await signInWithPopup(auth, googleProvider);
            const name = cred.user.displayName || cred.user.email;
            await submitRegister(cred.user, name, 'General');
        } catch (err) {
            document.getElementById('registerError').textContent = '❌ Google sign-up failed: ' + err.message;
            document.getElementById('registerError').style.display = 'block';
        }
    });
</script>
</body>
</html>
