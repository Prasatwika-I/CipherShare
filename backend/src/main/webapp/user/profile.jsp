<%@ page contentType="text/html;charset=UTF-8" language="java" %>
<%@ page import="com.ciphershare.models.User" %>
<%
    String userName = (String) session.getAttribute("userName");
    String userDept = (String) session.getAttribute("userDepartment");
    String userEmail = (String) session.getAttribute("userEmail");
    String userRole = (String) session.getAttribute("userRole");
    User profileUser = (User) request.getAttribute("profileUser");
    String success = request.getParameter("success");
    String error = request.getParameter("error");
    String displayName = profileUser != null ? profileUser.getName() : userName;
    String displayDept = profileUser != null ? profileUser.getDepartment() : userDept;
%>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>CipherShare — My Profile</title>
    <link rel="stylesheet" href="<%= request.getContextPath() %>/css/styles.css">
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
</head>
<body>
<div class="app-layout">
    <aside class="sidebar sidebar-employee">
        <div class="sidebar-logo">🔐 CipherShare</div>
        <div class="sidebar-role-badge badge-employee">Employee</div>
        <nav class="sidebar-nav">
            <a href="<%= request.getContextPath() %>/user/dashboard"><span class="nav-icon">📊</span> Dashboard</a>
            <a href="<%= request.getContextPath() %>/user/shared-files"><span class="nav-icon">📁</span> Shared Files</a>
            <a href="<%= request.getContextPath() %>/user/profile" class="active"><span class="nav-icon">👤</span> My Profile</a>
        </nav>
        <div class="sidebar-footer">
            <div class="user-info">
                <div class="user-avatar employee-avatar"><%= userName != null ? userName.charAt(0) : "U" %></div>
                <div><div class="user-name"><%= userName %></div><div class="user-role-text"><%= userDept %></div></div>
            </div>
            <a href="<%= request.getContextPath() %>/auth/logout" class="btn btn-danger btn-sm logout-btn">Logout</a>
        </div>
    </aside>
    <main class="main-content">
        <div class="page-header">
            <h1 class="page-title">My Profile</h1>
            <p class="page-subtitle">View and update your account information</p>
        </div>

        <% if ("updated".equals(success)) { %><div class="alert alert-success">✅ Profile updated successfully!</div><% } %>
        <% if ("update_failed".equals(error)) { %><div class="alert alert-error">❌ Failed to update profile. Please try again.</div><% } %>

        <div style="display:grid;grid-template-columns:1fr 1fr;gap:24px;max-width:800px;">
            <!-- Profile Card -->
            <div class="glass-card" style="text-align:center;padding:40px 32px;">
                <div class="profile-avatar"><%= displayName != null && !displayName.isEmpty() ? displayName.charAt(0) : "U" %></div>
                <div class="profile-name"><%= displayName %></div>
                <div class="profile-email text-secondary"><%= userEmail %></div>
                <span class="badge badge-<%= userRole %>" style="margin-top:12px;"><%= userRole %></span>
                <div class="profile-dept" style="margin-top:8px;color:#94a3b8;font-size:0.875rem;">🏢 <%= displayDept %></div>
            </div>

            <!-- Edit Form -->
            <div class="glass-card">
                <h2 class="card-title" style="margin-bottom:24px;">Edit Profile</h2>
                <form action="<%= request.getContextPath() %>/user/update-profile" method="POST">
                    <div class="form-group">
                        <label class="form-label">Full Name</label>
                        <input type="text" name="name" class="form-control" value="<%= displayName != null ? displayName : "" %>" required>
                    </div>
                    <div class="form-group">
                        <label class="form-label">Email <span style="color:#94a3b8;font-size:0.75rem;">(cannot change)</span></label>
                        <input type="email" class="form-control" value="<%= userEmail != null ? userEmail : "" %>" disabled style="opacity:0.6;cursor:not-allowed;">
                    </div>
                    <div class="form-group">
                        <label class="form-label">Department</label>
                        <select name="department" class="form-control">
                            <% String[] departments = {"General","Engineering","Marketing","Finance","HR","Operations","Sales","Legal","IT"};
                               for (String dept : departments) { %>
                            <option value="<%= dept %>" <%= dept.equals(displayDept) ? "selected" : "" %>><%= dept %></option>
                            <% } %>
                        </select>
                    </div>
                    <div class="form-group">
                        <label class="form-label">Role <span style="color:#94a3b8;font-size:0.75rem;">(assigned by admin)</span></label>
                        <input type="text" class="form-control" value="<%= userRole %>" disabled style="opacity:0.6;cursor:not-allowed;text-transform:capitalize;">
                    </div>
                    <button type="submit" class="btn btn-primary btn-full">💾 Save Changes</button>
                </form>
            </div>
        </div>

        <!-- Security Info -->
        <div class="glass-card" style="max-width:800px;margin-top:24px;">
            <h2 class="card-title" style="margin-bottom:16px;">🔐 Security Information</h2>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;">
                <div class="info-item-card">
                    <div class="info-card-icon">🔑</div>
                    <div>
                        <div style="font-weight:600;">Authentication</div>
                        <div class="text-secondary text-sm">Firebase Auth (secure)</div>
                    </div>
                </div>
                <div class="info-item-card">
                    <div class="info-card-icon">🛡️</div>
                    <div>
                        <div style="font-weight:600;">Access Control</div>
                        <div class="text-secondary text-sm">Role-Based (RBAC)</div>
                    </div>
                </div>
                <div class="info-item-card">
                    <div class="info-card-icon">📋</div>
                    <div>
                        <div style="font-weight:600;">Session Timeout</div>
                        <div class="text-secondary text-sm">30 minutes inactivity</div>
                    </div>
                </div>
                <div class="info-item-card">
                    <div class="info-card-icon">📁</div>
                    <div>
                        <div style="font-weight:600;">File Access</div>
                        <div class="text-secondary text-sm">Permission-based only</div>
                    </div>
                </div>
            </div>
        </div>
    </main>
</div>
</body>
</html>
