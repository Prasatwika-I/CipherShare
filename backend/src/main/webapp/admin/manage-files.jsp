<%@ page contentType="text/html;charset=UTF-8" language="java" %>
<%@ page import="java.util.List, com.ciphershare.models.FileMetadata" %>
<%
    String userName = (String) session.getAttribute("userName");
    List<FileMetadata> files = (List<FileMetadata>) request.getAttribute("files");
    String success = request.getParameter("success");
%>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>CipherShare — Manage Files</title>
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
            <a href="<%= request.getContextPath() %>/admin/manage-users"><span class="nav-icon">👥</span> Manage Users</a>
            <a href="<%= request.getContextPath() %>/admin/manage-files" class="active"><span class="nav-icon">📁</span> All Files</a>
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
            <h1 class="page-title">All Files</h1>
            <p class="page-subtitle">View and manage all uploaded files</p>
        </div>
        <% if ("deleted".equals(success)) { %><div class="alert alert-success">🗑️ File deleted successfully.</div><% } %>
        <div class="glass-card">
            <div class="card-header">
                <h2 class="card-title">Files (<%= files != null ? files.size() : 0 %>)</h2>
                <input type="text" id="fileSearch" class="form-control" placeholder="🔍 Search files..." style="width:220px;padding:8px 12px;">
            </div>
            <% if (files != null && !files.isEmpty()) { %>
            <div class="table-container">
                <table id="filesTable">
                    <thead>
                        <tr>
                            <th>File Name</th>
                            <th>Owner</th>
                            <th>Type</th>
                            <th>Size</th>
                            <th>Upload Date</th>
                            <th>Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        <% for (FileMetadata file : files) { %>
                        <tr>
                            <td>
                                <div style="display:flex;align-items:center;gap:10px;">
                                    <span class="file-icon"><%= getFileIcon(file.getFileType()) %></span>
                                    <strong><%= file.getFileName() %></strong>
                                </div>
                            </td>
                            <td class="text-secondary"><%= file.getOwnerName() != null ? file.getOwnerName() : "-" %></td>
                            <td class="text-secondary text-sm"><%= file.getFileType() != null ? file.getFileType() : "-" %></td>
                            <td class="text-secondary"><%= file.getFileSizeFormatted() %></td>
                            <td class="text-secondary text-sm"><%= file.getUploadDate() != null ? file.getUploadDate().toString().substring(0, 10) : "-" %></td>
                            <td>
                                <div style="display:flex;gap:8px;">
                                    <a href="<%= request.getContextPath() %>/file/download?fileId=<%= file.getFileId() %>" class="btn btn-success btn-sm">⬇ Download</a>
                                    <form action="<%= request.getContextPath() %>/file/delete" method="POST" onsubmit="return confirm('Delete this file permanently?')">
                                        <input type="hidden" name="fileId" value="<%= file.getFileId() %>">
                                        <button type="submit" class="btn btn-danger btn-sm">🗑 Delete</button>
                                    </form>
                                </div>
                            </td>
                        </tr>
                        <% } %>
                    </tbody>
                </table>
            </div>
            <% } else { %>
            <div class="empty-state"><div class="empty-icon">📁</div><p>No files uploaded yet.</p></div>
            <% } %>
        </div>
    </main>
</div>
<script>
document.getElementById('fileSearch').addEventListener('input', function() {
    const filter = this.value.toLowerCase();
    document.querySelectorAll('#filesTable tbody tr').forEach(row => {
        row.style.display = row.textContent.toLowerCase().includes(filter) ? '' : 'none';
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
