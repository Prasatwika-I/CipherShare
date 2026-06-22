<%@ page contentType="text/html;charset=UTF-8" language="java" %>
<%@ page import="java.util.List, com.ciphershare.models.FileMetadata" %>
<%
    String userName = (String) session.getAttribute("userName");
    String userDept = (String) session.getAttribute("userDepartment");
    List<FileMetadata> myFiles = (List<FileMetadata>) request.getAttribute("myFiles");
    Integer totalMyFiles = (Integer) request.getAttribute("totalMyFiles");
    String success = request.getParameter("success");
%>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>CipherShare — Manager Dashboard</title>
    <link rel="stylesheet" href="<%= request.getContextPath() %>/css/styles.css">
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
</head>
<body>
<div class="app-layout">
    <aside class="sidebar sidebar-manager">
        <div class="sidebar-logo">🔐 CipherShare</div>
        <div class="sidebar-role-badge badge-manager">Manager</div>
        <nav class="sidebar-nav">
            <a href="<%= request.getContextPath() %>/manager/dashboard" class="active"><span class="nav-icon">📊</span> Dashboard</a>
            <a href="<%= request.getContextPath() %>/manager/upload-file"><span class="nav-icon">⬆️</span> Upload File</a>
            <a href="<%= request.getContextPath() %>/manager/share-file"><span class="nav-icon">🔗</span> Share File</a>
            <a href="<%= request.getContextPath() %>/manager/team-files"><span class="nav-icon">👥</span> Team Files</a>
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
            <h1 class="page-title">Manager Dashboard</h1>
            <p class="page-subtitle">Manage and share your department's files</p>
        </div>
        <% if ("uploaded".equals(success)) { %><div class="alert alert-success">✅ File uploaded successfully!</div><% } %>
        <% if ("shared".equals(success)) { %><div class="alert alert-success">🔗 File shared successfully!</div><% } %>
        <% if ("deleted".equals(success)) { %><div class="alert alert-success">🗑️ File deleted.</div><% } %>

        <div class="stats-grid">
            <div class="stat-card glass-card">
                <div class="stat-icon">📁</div>
                <div class="stat-number"><%= totalMyFiles != null ? totalMyFiles : 0 %></div>
                <div class="stat-label">My Uploaded Files</div>
            </div>
            <div class="stat-card glass-card">
                <div class="stat-icon">🏢</div>
                <div class="stat-number"><%= userDept %></div>
                <div class="stat-label">Department</div>
            </div>
            <div class="stat-card glass-card">
                <div class="stat-icon">⬆️</div>
                <div class="stat-number">50 MB</div>
                <div class="stat-label">Max File Size</div>
            </div>
        </div>

        <!-- Quick Actions -->
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:24px;">
            <a href="<%= request.getContextPath() %>/manager/upload-file" class="glass-card quick-action-card">
                <div class="qa-icon">⬆️</div>
                <div class="qa-title">Upload File</div>
                <div class="qa-desc">Upload a new document or file</div>
            </a>
            <a href="<%= request.getContextPath() %>/manager/share-file" class="glass-card quick-action-card">
                <div class="qa-icon">🔗</div>
                <div class="qa-title">Share File</div>
                <div class="qa-desc">Share files with your team</div>
            </a>
        </div>

        <!-- My Files Table -->
        <div class="glass-card">
            <div class="card-header">
                <h2 class="card-title">My Files</h2>
                <a href="<%= request.getContextPath() %>/manager/upload-file" class="btn btn-primary btn-sm">⬆️ Upload New</a>
            </div>
            <% if (myFiles != null && !myFiles.isEmpty()) { %>
            <div class="table-container">
                <table>
                    <thead>
                        <tr>
                            <th>File Name</th>
                            <th>Type</th>
                            <th>Size</th>
                            <th>Uploaded</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        <% for (FileMetadata file : myFiles) { %>
                        <tr>
                            <td>
                                <div style="display:flex;align-items:center;gap:10px;">
                                    <span class="file-icon"><%= getFileIcon(file.getFileType()) %></span>
                                    <strong><%= file.getFileName() %></strong>
                                </div>
                            </td>
                            <td class="text-secondary text-sm"><%= file.getFileType() != null ? file.getFileType().split("/")[1] : "-" %></td>
                            <td class="text-secondary"><%= file.getFileSizeFormatted() %></td>
                            <td class="text-secondary text-sm"><%= file.getUploadDate() != null ? file.getUploadDate().toString().substring(0, 10) : "-" %></td>
                            <td>
                                <div style="display:flex;gap:8px;flex-wrap:wrap;">
                                    <a href="<%= request.getContextPath() %>/file/download?fileId=<%= file.getFileId() %>" class="btn btn-success btn-sm">⬇</a>
                                    <a href="<%= request.getContextPath() %>/manager/share-file?fileId=<%= file.getFileId() %>" class="btn btn-primary btn-sm">🔗</a>
                                    <form action="<%= request.getContextPath() %>/file/delete" method="POST" onsubmit="return confirm('Delete this file?')">
                                        <input type="hidden" name="fileId" value="<%= file.getFileId() %>">
                                        <button type="submit" class="btn btn-danger btn-sm">🗑</button>
                                    </form>
                                </div>
                            </td>
                        </tr>
                        <% } %>
                    </tbody>
                </table>
            </div>
            <% } else { %>
            <div class="empty-state">
                <div class="empty-icon">📂</div>
                <p>You haven't uploaded any files yet.</p>
                <a href="<%= request.getContextPath() %>/manager/upload-file" class="btn btn-primary" style="margin-top:12px;">⬆️ Upload First File</a>
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
