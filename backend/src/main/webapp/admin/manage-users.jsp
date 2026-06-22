<%@ page contentType="text/html;charset=UTF-8" language="java" %>
<%@ page import="java.util.List, com.ciphershare.models.User" %>
<%
    String userName = (String) session.getAttribute("userName");
    List<User> users = (List<User>) request.getAttribute("users");
    String success = request.getParameter("success");
    String error = request.getParameter("error");
%>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>CipherShare — Manage Users</title>
    <link rel="stylesheet" href="<%= request.getContextPath() %>/css/styles.css">
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
</head>
<body>
<div class="app-layout">
    <aside class="sidebar sidebar-admin">
        <div class="sidebar-logo">🔐 CipherShare</div>
        <div class="sidebar-role-badge badge-admin">Administrator</div>
        <nav class="sidebar-nav">
            <a href="<%= request.getContextPath() %>/admin/dashboard"><span class="nav-icon">📊</span> Dashboard</a>
            <a href="<%= request.getContextPath() %>/admin/manage-users" class="active"><span class="nav-icon">👥</span> Manage Users</a>
            <a href="<%= request.getContextPath() %>/admin/manage-files"><span class="nav-icon">📁</span> All Files</a>
            <a href="<%= request.getContextPath() %>/admin/view-logs"><span class="nav-icon">📋</span> Activity Logs</a>
        </nav>
        <div class="sidebar-footer">
            <div class="user-info">
                <div class="user-avatar admin-avatar"><%= userName != null ? userName.charAt(0) : "A" %></div>
                <div><div class="user-name"><%= userName %></div><div class="user-role-text">Administrator</div></div>
            </div>
            <a href="<%= request.getContextPath() %>/auth/logout" class="btn btn-danger btn-sm logout-btn">Logout</a>
        </div>
    </aside>
    <main class="main-content">
        <div class="page-header">
            <h1 class="page-title">Manage Users</h1>
            <p class="page-subtitle">Assign roles and manage user access</p>
        </div>
        <% if ("role_updated".equals(success)) { %><div class="alert alert-success">✅ Role updated successfully.</div><% } %>
        <% if ("update_failed".equals(error)) { %><div class="alert alert-error">❌ Failed to update role. Please try again.</div><% } %>
        <div class="glass-card">
            <div class="card-header">
                <h2 class="card-title">All Users (<%= users != null ? users.size() : 0 %>)</h2>
            </div>
            <% if (users != null && !users.isEmpty()) { %>
            <div class="table-container">
                <table>
                    <thead>
                        <tr>
                            <th>User</th>
                            <th>Email</th>
                            <th>Department</th>
                            <th>Current Role</th>
                            <th>Status</th>
                            <th>Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        <% for (User u : users) { %>
                        <tr>
                            <td>
                                <div style="display:flex;align-items:center;gap:10px;">
                                    <div class="user-avatar-sm <%= u.getRole() %>-avatar"><%= u.getName() != null && !u.getName().isEmpty() ? u.getName().charAt(0) : "?" %></div>
                                    <strong><%= u.getName() %></strong>
                                </div>
                            </td>
                            <td class="text-secondary"><%= u.getEmail() %></td>
                            <td class="text-secondary"><%= u.getDepartment() != null ? u.getDepartment() : "-" %></td>
                            <td><span class="badge badge-<%= u.getRole() %>"><%= u.getRole() %></span></td>
                            <td><span class="status-dot <%= u.isActive() ? "active" : "inactive" %>"><%= u.isActive() ? "Active" : "Inactive" %></span></td>
                            <td>
                                <form action="<%= request.getContextPath() %>/admin/update-role" method="POST" style="display:flex;gap:8px;align-items:center;">
                                    <input type="hidden" name="uid" value="<%= u.getUid() %>">
                                    <select name="role" class="form-control" style="padding:6px 10px;font-size:0.8rem;width:auto;">
                                        <option value="employee" <%= "employee".equals(u.getRole()) ? "selected" : "" %>>Employee</option>
                                        <option value="manager" <%= "manager".equals(u.getRole()) ? "selected" : "" %>>Manager</option>
                                        <option value="admin" <%= "admin".equals(u.getRole()) ? "selected" : "" %>>Admin</option>
                                    </select>
                                    <button type="submit" class="btn btn-primary btn-sm">Update</button>
                                </form>
                            </td>
                        </tr>
                        <% } %>
                    </tbody>
                </table>
            </div>
            <% } else { %>
            <div class="empty-state"><div class="empty-icon">👥</div><p>No users registered yet.</p></div>
            <% } %>
        </div>
    </main>
</div>
</body>
</html>
