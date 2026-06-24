package com.ciphershare.config;

import jakarta.servlet.*;
import jakarta.servlet.http.*;
import org.springframework.boot.web.servlet.FilterRegistrationBean;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpStatus;

import java.io.IOException;
import java.io.PrintWriter;
import java.util.Arrays;
import java.util.List;

/**
 * Session-based Auth Filter.
 * Protects /api/admin/**, /api/manager/**, /api/user/**, /api/file/**
 * Returns JSON 401 if not authenticated, JSON 403 if wrong role.
 */
@Configuration
public class SecurityConfig {

    @Bean
    public FilterRegistrationBean<AuthFilter> authFilter() {
        FilterRegistrationBean<AuthFilter> bean = new FilterRegistrationBean<>();
        bean.setFilter(new AuthFilter());
        bean.addUrlPatterns("/api/admin/*", "/api/manager/*", "/api/user/*", "/api/file/*");
        bean.setOrder(2);
        return bean;
    }

    // ── Inner Filter class ────────────────────────────────
    static class AuthFilter implements Filter {

        private static final List<String> ADMIN_PATHS   = List.of("/api/admin/");
        private static final List<String> MANAGER_PATHS = List.of("/api/manager/");

        @Override
        public void doFilter(ServletRequest req, ServletResponse res, FilterChain chain)
                throws IOException, ServletException {
            HttpServletRequest  request  = (HttpServletRequest)  req;
            HttpServletResponse response = (HttpServletResponse) res;

            HttpSession session  = request.getSession(false);
            boolean authenticated = session != null && session.getAttribute("userId") != null;

            if (!authenticated) {
                String token = request.getParameter("token");
                if (token != null && !token.isBlank()) {
                    try {
                        com.google.firebase.auth.FirebaseToken decoded = com.google.firebase.auth.FirebaseAuth.getInstance().verifyIdToken(token);
                        com.ciphershare.models.User user = new com.ciphershare.dao.UserDAO().getUserById(decoded.getUid());
                        if (user != null && user.isActive()) {
                            session = request.getSession(true);
                            session.setAttribute("userId", user.getUid());
                            session.setAttribute("userName", user.getName());
                            session.setAttribute("userEmail", user.getEmail());
                            session.setAttribute("userRole", user.getRole());
                            authenticated = true;
                        }
                    } catch (Exception e) {
                        // ignore token validation errors and fall through
                    }
                }
            }

            if (!authenticated) {
                sendJson(response, 401, "{\"error\":\"Unauthorized - please login\"}");
                return;
            }

            String role = (String) session.getAttribute("userRole");
            String uri  = request.getRequestURI();

            if (ADMIN_PATHS.stream().anyMatch(uri::contains) && !"admin".equals(role)) {
                sendJson(response, 403, "{\"error\":\"Forbidden - admin access only\"}");
                return;
            }
            if (MANAGER_PATHS.stream().anyMatch(uri::contains)
                    && !"manager".equals(role) && !"admin".equals(role)) {
                sendJson(response, 403, "{\"error\":\"Forbidden - manager access required\"}");
                return;
            }

            chain.doFilter(req, res);
        }

        private void sendJson(HttpServletResponse res, int status, String body) throws IOException {
            res.setContentType("application/json;charset=UTF-8");
            res.setStatus(status);
            try (PrintWriter w = res.getWriter()) { w.print(body); }
        }

        @Override public void init(FilterConfig cfg) {}
        @Override public void destroy() {}
    }
}
