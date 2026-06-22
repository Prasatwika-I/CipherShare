<%@ page contentType="text/html;charset=UTF-8" language="java" %>
<%@ taglib uri="jakarta.tags.core" prefix="c" %>
<%@ page import="java.util.List, com.ciphershare.models.*" %>
<%
    String userName = (String) session.getAttribute("userName");
    Integer totalUsers = (Integer) request.getAttribute("totalUsers");
    Integer totalFiles = (Integer) request.getAttribute("totalFiles");
    List<ActivityLog> recentLogs = (List<ActivityLog>) request.getAttribute("recentLogs");
    String success = request.getParameter("success");
%>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>CipherShare — Admin Dashboard</title>
    <link rel="stylesheet" href="<%= request.getContextPath() %>/css/styles.css">
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
</head>
<body>
<div class="app-layout">
    <!-- Sidebar -->
    <aside class="sidebar sidebar-admin">
        <div class="sidebar-logo">🔐 CipherShare</div>
        <div class="sidebar-role-badge badge-admin">Administrator</div>
        <nav class="sidebar-nav">
            <a href="<%= request.getContextPath() %>/admin/dashboard" class="active">
                <span class="nav-icon">📊</span> Dashboard
            </a>
            <a href="<%= request.getContextPath() %>/admin/manage-users">
                <span class="nav-icon">👥</span> Manage Users
            </a>
            <a href="<%= request.getContextPath() %>/admin/manage-files">
                <span class="nav-icon">📁</span> All Files
            </a>
            <a href="<%= request.getContextPath() %>/admin/view-logs">
                <span class="nav-icon">📋</span> Activity Logs
            </a>
        </nav>
        <div class="sidebar-footer">
            <div class="user-info">
                <div class="user-avatar admin-avatar"><%= userName != null ? userName.charAt(0) : "A" %></div>
                <div>
                    <div class="user-name"><%= userName %></div>
                    <div class="user-role-text">Administrator</div>
                </div>
            </div>
            <a href="<%= request.getContextPath() %>/auth/logout" class="btn btn-danger btn-sm logout-btn">Logout</a>
        </div>
    </aside>

    <!-- Main Content -->
    <main class="main-content">
        <div class="page-header">
            <h1 class="page-title">Admin Dashboard</h1>
            <p class="page-subtitle">System overview and management</p>
        </div>

        <% if ("role_updated".equals(success)) { %>
        <div class="alert alert-success">✅ User role updated successfully.</div>
        <% } %>

        <!-- Stats Grid -->
        <div class="stats-grid">
            <div class="stat-card glass-card">
                <div class="stat-icon">👥</div>
                <div class="stat-number"><%= totalUsers != null ? totalUsers : 0 %></div>
                <div class="stat-label">Total Users</div>
                <a href="<%= request.getContextPath() %>/admin/manage-users" class="stat-link">Manage →</a>
            </div>
            <div class="stat-card glass-card">
                <div class="stat-icon">📁</div>
                <div class="stat-number"><%= totalFiles != null ? totalFiles : 0 %></div>
                <div class="stat-label">Total Files</div>
                <a href="<%= request.getContextPath() %>/admin/manage-files" class="stat-link">View →</a>
            </div>
            <div class="stat-card glass-card">
                <div class="stat-icon">🔐</div>
                <div class="stat-number">RBAC</div>
                <div class="stat-label">Security Mode</div>
            </div>
            <div class="stat-card glass-card">
                <div class="stat-icon">📋</div>
                <div class="stat-number"><%= recentLogs != null ? recentLogs.size() : 0 %>+</div>
                <div class="stat-label">Recent Actions</div>
                <a href="<%= request.getContextPath() %>/admin/view-logs" class="stat-link">View Logs →</a>
            </div>
        </div>

        <!-- Recent Activity -->
        <div class="glass-card">
            <div class="card-header">
                <h2 class="card-title">Recent Activity</h2>
                <a href="<%= request.getContextPath() %>/admin/view-logs" class="btn btn-primary btn-sm">View All Logs</a>
            </div>
            <% if (recentLogs != null && !recentLogs.isEmpty()) { %>
            <div class="table-container">
                <table>
                    <thead>
                        <tr>
                            <th>Action</th>
                            <th>User</th>
                            <th>Details</th>
                            <th>Time</th>
                        </tr>
                    </thead>
                    <tbody>
                        <% for (ActivityLog log : recentLogs) { %>
                        <tr>
                            <td><span class="action-badge action-<%= log.getAction().toLowerCase() %>"><%= log.getAction() %></span></td>
                            <td><strong><%= log.getUserName() != null ? log.getUserName() : "Unknown" %></strong></td>
                            <td class="text-secondary"><%= log.getDetails() != null ? log.getDetails() : "-" %></td>
                            <td class="text-secondary text-sm"><%= log.getTimestamp() != null ? log.getTimestamp().toString().substring(0, 16) : "-" %></td>
                        </tr>
                        <% } %>
                    </tbody>
                </table>
            </div>
            <% } else { %>
            <div class="empty-state">
                <div class="empty-icon">📋</div>
                <p>No activity logs yet.</p>
            </div>
            <% } %>
        </div>
    </main>
</div>
</body>
</html>
