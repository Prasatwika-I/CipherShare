<%@ page contentType="text/html;charset=UTF-8" language="java" %>
<%@ page import="java.util.List, com.ciphershare.models.FileMetadata" %>
<%
    String userName = (String) session.getAttribute("userName");
    String userDept = (String) session.getAttribute("userDepartment");
    List<FileMetadata> sharedFiles = (List<FileMetadata>) request.getAttribute("sharedFiles");
%>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>CipherShare — Shared Files</title>
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
            <a href="<%= request.getContextPath() %>/user/shared-files" class="active"><span class="nav-icon">📁</span> Shared Files</a>
            <a href="<%= request.getContextPath() %>/user/profile"><span class="nav-icon">👤</span> My Profile</a>
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
            <h1 class="page-title">Shared Files</h1>
            <p class="page-subtitle">Files accessible to you based on your role and permissions</p>
        </div>
        <div class="glass-card">
            <div class="card-header">
                <h2 class="card-title">All Shared Files (<%= sharedFiles != null ? sharedFiles.size() : 0 %>)</h2>
                <input type="text" id="fileSearch" class="form-control" placeholder="🔍 Search..." style="width:200px;padding:8px 12px;">
            </div>
            <% if (sharedFiles != null && !sharedFiles.isEmpty()) { %>
            <div class="file-cards-grid" id="fileGrid">
                <% for (FileMetadata file : sharedFiles) { %>
                <div class="file-card glass-card" data-name="<%= file.getFileName().toLowerCase() %>">
                    <div class="file-card-icon"><%= getFileIcon(file.getFileType()) %></div>
                    <div class="file-card-name"><%= file.getFileName() %></div>
                    <div class="file-card-meta">
                        <span>By <%= file.getOwnerName() != null ? file.getOwnerName() : "Unknown" %></span>
                        <span><%= file.getFileSizeFormatted() %></span>
                    </div>
                    <a href="<%= request.getContextPath() %>/file/download?fileId=<%= file.getFileId() %>"
                       class="btn btn-success btn-full" style="margin-top:12px;">⬇ Download</a>
                </div>
                <% } %>
            </div>
            <% } else { %>
            <div class="empty-state">
                <div class="empty-icon">📭</div>
                <p>No files shared with you yet.</p>
                <p class="text-secondary" style="font-size:0.85rem;margin-top:8px;">Your manager will share files with you based on your role in <%= userDept %>.</p>
            </div>
            <% } %>
        </div>
    </main>
</div>
<script>
document.getElementById('fileSearch').addEventListener('input', function() {
    const filter = this.value.toLowerCase();
    document.querySelectorAll('.file-card').forEach(card => {
        card.style.display = card.getAttribute('data-name').includes(filter) ? '' : 'none';
    });
});
</script>
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
