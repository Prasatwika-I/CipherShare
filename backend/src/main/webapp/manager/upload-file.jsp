<%@ page contentType="text/html;charset=UTF-8" language="java" %>
<%
    String userName = (String) session.getAttribute("userName");
    String error = request.getParameter("error");
%>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>CipherShare — Upload File</title>
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
            <a href="<%= request.getContextPath() %>/manager/upload-file" class="active"><span class="nav-icon">⬆️</span> Upload File</a>
            <a href="<%= request.getContextPath() %>/manager/share-file"><span class="nav-icon">🔗</span> Share File</a>
            <a href="<%= request.getContextPath() %>/manager/team-files"><span class="nav-icon">👥</span> Team Files</a>
        </nav>
        <div class="sidebar-footer">
            <div class="user-info">
                <div class="user-avatar manager-avatar"><%= userName != null ? userName.charAt(0) : "M" %></div>
                <div><div class="user-name"><%= userName %></div><div class="user-role-text">Manager</div></div>
            </div>
            <a href="<%= request.getContextPath() %>/auth/logout" class="btn btn-danger btn-sm logout-btn">Logout</a>
        </div>
    </aside>
    <main class="main-content">
        <div class="page-header">
            <h1 class="page-title">Upload File</h1>
            <p class="page-subtitle">Share documents securely with your team</p>
        </div>

        <% if ("no_file".equals(error)) { %><div class="alert alert-error">❌ Please select a file to upload.</div><% } %>
        <% if ("invalid_type".equals(error)) { %><div class="alert alert-error">❌ File type not allowed. Supported: PDF, Word, Excel, PowerPoint, Images, ZIP, TXT, CSV.</div><% } %>
        <% if ("too_large".equals(error)) { %><div class="alert alert-error">❌ File exceeds 50MB limit.</div><% } %>
        <% if ("upload_failed".equals(error)) { %><div class="alert alert-error">❌ Upload failed. Please try again.</div><% } %>

        <div class="glass-card" style="max-width:640px;">
            <form action="<%= request.getContextPath() %>/file/upload" method="POST" enctype="multipart/form-data" id="uploadForm">
                <div class="upload-zone" id="uploadZone" onclick="document.getElementById('fileInput').click()">
                    <div class="upload-icon" id="uploadIcon">📂</div>
                    <div class="upload-title" id="uploadTitle">Drop files here or click to browse</div>
                    <div class="upload-subtitle" id="uploadSubtitle">PDF, Word, Excel, PowerPoint, Images, ZIP, TXT, CSV — Max 50MB</div>
                    <input type="file" name="file" id="fileInput" style="display:none;"
                           accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.jpg,.jpeg,.png,.gif,.zip,.txt,.csv">
                </div>

                <div id="filePreview" style="display:none;" class="file-preview-card">
                    <div class="file-preview-icon" id="previewIcon">📄</div>
                    <div class="file-preview-info">
                        <div class="file-preview-name" id="previewName"></div>
                        <div class="file-preview-size" id="previewSize"></div>
                    </div>
                    <button type="button" onclick="clearFile()" class="btn btn-danger btn-sm">✕ Remove</button>
                </div>

                <div class="form-group" style="margin-top:24px;">
                    <div class="upload-info-grid">
                        <div class="info-item">
                            <span class="info-icon">🔒</span>
                            <span>Stored securely on server</span>
                        </div>
                        <div class="info-item">
                            <span class="info-icon">📋</span>
                            <span>Metadata saved to Firestore</span>
                        </div>
                        <div class="info-item">
                            <span class="info-icon">🔗</span>
                            <span>Share with specific users or roles</span>
                        </div>
                    </div>
                </div>

                <button type="submit" class="btn btn-primary btn-full" id="uploadBtn" disabled>
                    <span class="btn-icon">⬆️</span> Upload File
                </button>
            </form>
        </div>
    </main>
</div>
<script>
const fileInput = document.getElementById('fileInput');
const uploadZone = document.getElementById('uploadZone');
const uploadBtn = document.getElementById('uploadBtn');

fileInput.addEventListener('change', () => {
    if (fileInput.files.length > 0) showPreview(fileInput.files[0]);
});

uploadZone.addEventListener('dragover', (e) => { e.preventDefault(); uploadZone.classList.add('dragover'); });
uploadZone.addEventListener('dragleave', () => uploadZone.classList.remove('dragover'));
uploadZone.addEventListener('drop', (e) => {
    e.preventDefault();
    uploadZone.classList.remove('dragover');
    if (e.dataTransfer.files.length > 0) {
        fileInput.files = e.dataTransfer.files;
        showPreview(e.dataTransfer.files[0]);
    }
});

function showPreview(file) {
    document.getElementById('uploadZone').style.display = 'none';
    document.getElementById('filePreview').style.display = 'flex';
    document.getElementById('previewName').textContent = file.name;
    document.getElementById('previewSize').textContent = formatSize(file.size);
    document.getElementById('previewIcon').textContent = getFileIcon(file.type);
    uploadBtn.disabled = false;
}

function clearFile() {
    fileInput.value = '';
    document.getElementById('uploadZone').style.display = 'flex';
    document.getElementById('filePreview').style.display = 'none';
    uploadBtn.disabled = true;
}

function formatSize(bytes) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

function getFileIcon(type) {
    if (type.includes('pdf')) return '📕';
    if (type.includes('word')) return '📘';
    if (type.includes('excel') || type.includes('spreadsheet')) return '📗';
    if (type.includes('powerpoint') || type.includes('presentation')) return '📙';
    if (type.includes('image')) return '🖼️';
    if (type.includes('zip')) return '📦';
    if (type.includes('text')) return '📝';
    return '📄';
}

document.getElementById('uploadForm').addEventListener('submit', () => {
    uploadBtn.innerHTML = '<span class="spinner"></span> Uploading...';
    uploadBtn.disabled = true;
});
</script>
</body>
</html>
