<%@ page contentType="text/html;charset=UTF-8" language="java" %>
<%
    String code = request.getParameter("code");
    if (code == null) code = "403";
    String title = "403".equals(code) ? "Access Denied" : "404".equals(code) ? "Page Not Found" : "Server Error";
    String message = "403".equals(code) ? "You don't have permission to access this resource." :
                     "404".equals(code) ? "The page you're looking for doesn't exist." :
                     "Something went wrong on our end. Please try again.";
    String icon = "403".equals(code) ? "🚫" : "404".equals(code) ? "🔍" : "⚠️";
    String userRole = session != null ? (String) session.getAttribute("userRole") : null;
    String dashboardUrl = request.getContextPath() + ("admin".equals(userRole) ? "/admin/dashboard" :
                          "manager".equals(userRole) ? "/manager/dashboard" : "/user/dashboard");
%>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>CipherShare — <%= title %></title>
    <link rel="stylesheet" href="<%= request.getContextPath() %>/css/styles.css">
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
    <style>
        .error-page { display: flex; align-items: center; justify-content: center; min-height: 100vh; }
        .error-card { text-align: center; padding: 64px 48px; }
        .error-icon { font-size: 5rem; margin-bottom: 24px; display: block; }
        .error-code { font-size: 6rem; font-weight: 900; background: linear-gradient(135deg, #7c3aed, #3b82f6); -webkit-background-clip: text; -webkit-text-fill-color: transparent; line-height: 1; }
        .error-title { font-size: 1.5rem; font-weight: 700; margin: 16px 0 8px; }
        .error-message { color: #94a3b8; margin-bottom: 32px; }
        .error-actions { display: flex; gap: 12px; justify-content: center; flex-wrap: wrap; }
    </style>
</head>
<body>
<div class="error-page">
    <div class="glass-card error-card">
        <span class="error-icon"><%= icon %></span>
        <div class="error-code"><%= code %></div>
        <h1 class="error-title"><%= title %></h1>
        <p class="error-message"><%= message %></p>
        <div class="error-actions">
            <% if (userRole != null) { %>
            <a href="<%= dashboardUrl %>" class="btn btn-primary">🏠 Go to Dashboard</a>
            <% } %>
            <a href="javascript:history.back()" class="btn btn-success">← Go Back</a>
            <% if (userRole == null) { %>
            <a href="<%= request.getContextPath() %>/login.jsp" class="btn btn-primary">🔐 Login</a>
            <% } %>
        </div>
    </div>
</div>
</body>
</html>
