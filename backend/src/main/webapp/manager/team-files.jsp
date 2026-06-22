<%@ page contentType="text/html;charset=UTF-8" language="java" %>
<%@ page import="java.util.List, com.ciphershare.models.User" %>
<%
    String userName = (String) session.getAttribute("userName");
    String userDept = (String) session.getAttribute("userDepartment");
    List<User> teamMembers = (List<User>) request.getAttribute("teamMembers");
%>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>CipherShare — Team Files</title>
    <link rel="stylesheet" href="<%= request.getContextPath() %>/css/styles.css">
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
</head>
<body>
<div class="app-layout">
    <aside class="sidebar sidebar-manager">
        <div class="sidebar-logo">🔐 CipherShare</div>
        <div class="sidebar-role-badge badge-manager">Manager</div>
        <nav class="sidebar-nav">
            <a href="<%= request.getContextPath() %>/manager/dashboard"><span class="nav-icon">📊</span> Dashboard</a>
            <a href="<%= request.getContextPath() %>/manager/upload-file"><span class="nav-icon">⬆️</span> Upload File</a>
            <a href="<%= request.getContextPath() %>/manager/share-file"><span class="nav-icon">🔗</span> Share File</a>
            <a href="<%= request.getContextPath() %>/manager/team-files" class="active"><span class="nav-icon">👥</span> Team Files</a>
        </nav>
        <div class="sidebar-footer">
            <div class="user-info">
                <div class="user-avatar manager-avatar"><%= userName != null ? userName.charAt(0) : "M" %></div>
                <div><div class="user-name"><%= userName %></div><div class="user-role-text"><%= userDept %> Manager</div></div>
            </div>
            <a href="<%= request.getContextPath() %>/auth/logout" class="btn btn-danger btn-sm logout-btn">Logout</a>
        </div>
    </aside>
    <main class="main-content">
        <div class="page-header">
            <h1 class="page-title">Team Files</h1>
            <p class="page-subtitle"><%= userDept %> department members</p>
        </div>
        <div class="glass-card">
            <div class="card-header">
                <h2 class="card-title"><%= userDept %> Team (<%= teamMembers != null ? teamMembers.size() : 0 %> members)</h2>
                <a href="<%= request.getContextPath() %>/manager/share-file" class="btn btn-primary btn-sm">🔗 Share a File</a>
            </div>
            <% if (teamMembers != null && !teamMembers.isEmpty()) { %>
            <div class="team-grid">
                <% for (User member : teamMembers) { %>
                <div class="team-member-card glass-card">
                    <div class="member-avatar <%= member.getRole() %>-avatar"><%= member.getName() != null && !member.getName().isEmpty() ? member.getName().charAt(0) : "?" %></div>
                    <div class="member-info">
                        <div class="member-name"><%= member.getName() %></div>
                        <div class="member-email text-secondary"><%= member.getEmail() %></div>
                        <span class="badge badge-<%= member.getRole() %>"><%= member.getRole() %></span>
                    </div>
                    <a href="<%= request.getContextPath() %>/manager/share-file" class="btn btn-primary btn-sm" style="margin-top:12px;">Share File</a>
                </div>
                <% } %>
            </div>
            <% } else { %>
            <div class="empty-state">
                <div class="empty-icon">👥</div>
                <p>No other team members in your department yet.</p>
            </div>
            <% } %>
        </div>
    </main>
</div>
</body>
</html>
