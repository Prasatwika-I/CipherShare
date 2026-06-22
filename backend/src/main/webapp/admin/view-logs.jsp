<%@ page contentType="text/html;charset=UTF-8" language="java" %>
<%@ page import="java.util.List, com.ciphershare.models.ActivityLog" %>
<%
    String userName = (String) session.getAttribute("userName");
    List<ActivityLog> logs = (List<ActivityLog>) request.getAttribute("logs");
%>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>CipherShare — Activity Logs</title>
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
            <a href="<%= request.getContextPath() %>/admin/manage-files"><span class="nav-icon">📁</span> All Files</a>
            <a href="<%= request.getContextPath() %>/admin/view-logs" class="active"><span class="nav-icon">📋</span> Activity Logs</a>
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
            <h1 class="page-title">Activity Logs</h1>
            <p class="page-subtitle">Complete audit trail of all system actions</p>
        </div>
        <div class="glass-card">
            <div class="card-header">
                <h2 class="card-title">All Actions (<%= logs != null ? logs.size() : 0 %>)</h2>
                <div style="display:flex;gap:8px;">
                    <input type="text" id="logSearch" class="form-control" placeholder="🔍 Filter logs..." style="width:220px;padding:8px 12px;">
                </div>
            </div>
            <% if (logs != null && !logs.isEmpty()) { %>
            <div class="table-container">
                <table id="logsTable">
                    <thead>
                        <tr>
                            <th>Action</th>
                            <th>User</th>
                            <th>File</th>
                            <th>Details</th>
                            <th>Timestamp</th>
                        </tr>
                    </thead>
                    <tbody>
                        <% for (ActivityLog log : logs) { %>
                        <tr>
                            <td><span class="action-badge action-<%= log.getAction() != null ? log.getAction().toLowerCase() : "other" %>"><%= log.getAction() %></span></td>
                            <td><strong><%= log.getUserName() != null ? log.getUserName() : "System" %></strong></td>
                            <td class="text-secondary"><%= log.getFileName() != null ? log.getFileName() : "-" %></td>
                            <td class="text-secondary" style="max-width:280px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;" title="<%= log.getDetails() != null ? log.getDetails() : "" %>"><%= log.getDetails() != null ? log.getDetails() : "-" %></td>
                            <td class="text-secondary text-sm"><%= log.getTimestamp() != null ? log.getTimestamp().toString().substring(0, 19) : "-" %></td>
                        </tr>
                        <% } %>
                    </tbody>
                </table>
            </div>
            <% } else { %>
            <div class="empty-state"><div class="empty-icon">📋</div><p>No activity logs recorded yet.</p></div>
            <% } %>
        </div>
    </main>
</div>
<script>
document.getElementById('logSearch').addEventListener('input', function() {
    const filter = this.value.toLowerCase();
    document.querySelectorAll('#logsTable tbody tr').forEach(row => {
        row.style.display = row.textContent.toLowerCase().includes(filter) ? '' : 'none';
    });
});
</script>
</body>
</html>
