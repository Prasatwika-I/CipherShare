<%@ page contentType="text/html;charset=UTF-8" language="java" %>
<%@ page import="java.util.List, com.ciphershare.models.FileMetadata" %>
<%
    String userName = (String) session.getAttribute("userName");
    String userDept = (String) session.getAttribute("userDepartment");
    String userRole = (String) session.getAttribute("userRole");
    List<FileMetadata> sharedFiles = (List<FileMetadata>) request.getAttribute("sharedFiles");
%>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>CipherShare — My Dashboard</title>
    <link rel="stylesheet" href="<%= request.getContextPath() %>/css/styles.css">
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
</head>
<body>
<div class="app-layout">
    <aside class="sidebar sidebar-employee">
        <div class="sidebar-logo">🔐 CipherShare</div>
        <div class="sidebar-role-badge badge-employee">Employee</div>
        <nav class="sidebar-nav">
            <a href="<%= request.getContextPath() %>/user/dashboard" class="active"><span class="nav-icon">📊</span> Dashboard</a>
            <a href="<%= request.getContextPath() %>/user/shared-files"><span class="nav-icon">📁</span> Shared Files</a>
            <a href="<%= request.getContextPath() %>/user/profile"><span class="nav-icon">👤</span> My Profile</a>
        </nav>
        <div class="sidebar-footer">
            <div class="user-info">
                <div class="user-avatar employee-avatar"><%= userName != null ? userName.charAt(0) : "U" %></div>
                <div><div class="user-name"><%= userName %></div><div class="user-role-text"><%= userDept %> — <%= userRole %></div></div>
            </div>
            <a href="<%= request.getContextPath() %>/auth/logout" class="btn btn-danger btn-sm logout-btn">Logout</a>
        </div>
    </aside>
    <main class="main-content">
        <div class="page-header">
            <h1 class="page-title">Welcome, <%= userName != null ? userName.split(" ")[0] : "User" %>! 👋</h1>
            <p class="page-subtitle">Here are the files shared with you</p>
        </div>

        <div class="stats-grid">
            <div class="stat-card glass-card">
                <div class="stat-icon">📁</div>
                <div class="stat-number"><%= sharedFiles != null ? sharedFiles.size() : 0 %></div>
                <div class="stat-label">Files Shared with Me</div>
            </div>
            <div class="stat-card glass-card">
                <div class="stat-icon">🏢</div>
                <div class="stat-number"><%= userDept %></div>
                <div class="stat-label">My Department</div>
            </div>
            <div class="stat-card glass-card">
                <div class="stat-icon">🛡️</div>
                <div class="stat-number">RBAC</div>
                <div class="stat-label">Access Control</div>
            </div>
        </div>

        <div class="glass-card">
            <div class="card-header">
                <h2 class="card-title">Shared With Me</h2>
                <a href="<%= request.getContextPath() %>/user/shared-files" class="btn btn-primary btn-sm">View All</a>
            </div>
            <% if (sharedFiles != null && !sharedFiles.isEmpty()) { %>
            <div class="table-container">
                <table>
                    <thead>
                        <tr>
                            <th>File Name</th>
                            <th>Shared By</th>
                            <th>Type</th>
                            <th>Size</th>
                            <th>Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        <% for (FileMetadata file : sharedFiles) { %>
                        <tr>
                            <td>
                                <div style="display:flex;align-items:center;gap:10px;">
                                    <span class="file-icon"><%= getFileIcon(file.getFileType()) %></span>
                                    <strong><%= file.getFileName() %></strong>
                                </div>
                            </td>
                            <td class="text-secondary"><%= file.getOwnerName() != null ? file.getOwnerName() : "-" %></td>
                            <td class="text-secondary text-sm"><%= file.getFileType() != null ? file.getFileType().split("/")[file.getFileType().split("/").length - 1] : "-" %></td>
                            <td class="text-secondary"><%= file.getFileSizeFormatted() %></td>
                            <td>
                                <a href="<%= request.getContextPath() %>/file/download?fileId=<%= file.getFileId() %>" class="btn btn-success btn-sm">⬇ Download</a>
                            </td>
                        </tr>
                        <% } %>
                    </tbody>
                </table>
            </div>
            <% } else { %>
            <div class="empty-state">
                <div class="empty-icon">📂</div>
                <p>No files have been shared with you yet.</p>
                <p class="text-secondary" style="font-size:0.85rem;margin-top:8px;">A manager will share files with you based on your role and department.</p>
            </div>
            <% } %>
        </div>
    </main>
</div>
<%!
    private String getFileIcon(String mimeType) {
        if (mimeType == null) return "📄";
        if (mimeType.contains("pdf")) return "📕";
        if (mimeType.contains("word")) return "📘";
        if (mimeType.contains("excel") || mimeType.contains("spreadsheet")) return "📗";
        if (mimeType.contains("powerpoint") || mimeType.contains("presentation")) return "📙";
        if (mimeType.contains("image")) return "🖼️";
        if (mimeType.contains("zip")) return "📦";
        if (mimeType.contains("text")) return "📝";
        return "📄";
    }
%>
</body>
</html>
