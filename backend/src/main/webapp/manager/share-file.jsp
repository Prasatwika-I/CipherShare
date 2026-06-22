<%@ page contentType="text/html;charset=UTF-8" language="java" %>
<%@ page import="java.util.List, com.ciphershare.models.*" %>
<%
    String userName = (String) session.getAttribute("userName");
    String userId = (String) session.getAttribute("userId");
    List<FileMetadata> filesForShare = (List<FileMetadata>) request.getAttribute("filesForShare");
    List<User> allUsers = (List<User>) request.getAttribute("allUsers");
    String preselectedFileId = request.getParameter("fileId");
    String error = request.getParameter("error");
%>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>CipherShare — Share File</title>
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
            <a href="<%= request.getContextPath() %>/manager/share-file" class="active"><span class="nav-icon">🔗</span> Share File</a>
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
            <h1 class="page-title">Share File</h1>
            <p class="page-subtitle">Grant access to your files securely</p>
        </div>

        <% if ("missing_fields".equals(error)) { %><div class="alert alert-error">❌ Please fill in all required fields.</div><% } %>
        <% if ("share_failed".equals(error)) { %><div class="alert alert-error">❌ Sharing failed. Please try again.</div><% } %>

        <div class="glass-card" style="max-width:640px;">
            <% if (filesForShare == null || filesForShare.isEmpty()) { %>
            <div class="empty-state">
                <div class="empty-icon">📂</div>
                <p>You need to upload files before you can share them.</p>
                <a href="<%= request.getContextPath() %>/manager/upload-file" class="btn btn-primary" style="margin-top:12px;">⬆️ Upload a File</a>
            </div>
            <% } else { %>
            <form action="<%= request.getContextPath() %>/file/share" method="POST" id="shareForm">
                <div class="form-group">
                    <label class="form-label" for="fileId">Select File to Share</label>
                    <select name="fileId" id="fileId" class="form-control" required>
                        <option value="">-- Choose a file --</option>
                        <% for (FileMetadata f : filesForShare) { %>
                        <option value="<%= f.getFileId() %>" <%= f.getFileId().equals(preselectedFileId) ? "selected" : "" %>>
                            <%= f.getFileName() %> (<%= f.getFileSizeFormatted() %>)
                        </option>
                        <% } %>
                    </select>
                </div>

                <div class="form-group">
                    <label class="form-label">Share With</label>
                    <div class="share-type-tabs">
                        <button type="button" class="share-tab active" data-type="user" onclick="setShareType('user')">👤 Specific User</button>
                        <button type="button" class="share-tab" data-type="role" onclick="setShareType('role')">🏷️ By Role</button>
                        <button type="button" class="share-tab" data-type="department" onclick="setShareType('department')">🏢 Department</button>
                    </div>
                </div>

                <input type="hidden" name="sharedWithType" id="sharedWithType" value="user">

                <!-- User selection -->
                <div id="userSection" class="form-group">
                    <label class="form-label">Select User</label>
                    <select id="userSelect" class="form-control">
                        <option value="">-- Select a user --</option>
                        <% if (allUsers != null) {
                            for (User u : allUsers) {
                                if (!u.getUid().equals(userId)) { %>
                        <option value="<%= u.getUid() %>" data-name="<%= u.getName() %>">
                            <%= u.getName() %> (<%= u.getRole() %> — <%= u.getDepartment() %>)
                        </option>
                        <%      }
                            }
                        } %>
                    </select>
                </div>

                <!-- Role selection -->
                <div id="roleSection" class="form-group" style="display:none;">
                    <label class="form-label">Select Role</label>
                    <select id="roleSelect" class="form-control">
                        <option value="employee" data-name="All Employees">All Employees</option>
                        <option value="manager" data-name="All Managers">All Managers</option>
                    </select>
                </div>

                <!-- Department selection -->
                <div id="deptSection" class="form-group" style="display:none;">
                    <label class="form-label">Select Department</label>
                    <select id="deptSelect" class="form-control">
                        <option value="Engineering" data-name="Engineering Dept">Engineering</option>
                        <option value="Marketing" data-name="Marketing Dept">Marketing</option>
                        <option value="Finance" data-name="Finance Dept">Finance</option>
                        <option value="HR" data-name="HR Dept">Human Resources</option>
                        <option value="Operations" data-name="Operations Dept">Operations</option>
                        <option value="Sales" data-name="Sales Dept">Sales</option>
                        <option value="Legal" data-name="Legal Dept">Legal</option>
                        <option value="IT" data-name="IT Dept">Information Technology</option>
                        <option value="General" data-name="General Dept">General</option>
                    </select>
                </div>

                <input type="hidden" name="sharedWithId" id="sharedWithId">
                <input type="hidden" name="sharedWithName" id="sharedWithName">

                <div class="form-group">
                    <div class="permission-toggle">
                        <label class="toggle-label">
                            <input type="checkbox" name="canDownload" id="canDownload" checked>
                            <span class="toggle-slider"></span>
                            Allow Download (not just view)
                        </label>
                    </div>
                </div>

                <button type="submit" class="btn btn-primary btn-full" onclick="return prepareShare()">
                    <span class="btn-icon">🔗</span> Share File
                </button>
            </form>
            <% } %>
        </div>
    </main>
</div>
<script>
function setShareType(type) {
    document.getElementById('sharedWithType').value = type;
    document.querySelectorAll('.share-tab').forEach(t => t.classList.remove('active'));
    document.querySelector('[data-type="' + type + '"]').classList.add('active');
    document.getElementById('userSection').style.display = type === 'user' ? 'block' : 'none';
    document.getElementById('roleSection').style.display = type === 'role' ? 'block' : 'none';
    document.getElementById('deptSection').style.display = type === 'department' ? 'block' : 'none';
}

function prepareShare() {
    const type = document.getElementById('sharedWithType').value;
    let sel, idVal, nameVal;
    if (type === 'user') sel = document.getElementById('userSelect');
    else if (type === 'role') sel = document.getElementById('roleSelect');
    else sel = document.getElementById('deptSelect');
    idVal = sel.value;
    nameVal = sel.options[sel.selectedIndex].getAttribute('data-name') || idVal;
    if (!idVal) { alert('Please select who to share with.'); return false; }
    document.getElementById('sharedWithId').value = idVal;
    document.getElementById('sharedWithName').value = nameVal;
    return true;
}
</script>
</body>
</html>
