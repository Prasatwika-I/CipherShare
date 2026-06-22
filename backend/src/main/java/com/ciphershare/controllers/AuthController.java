package com.ciphershare.controllers;

import com.ciphershare.dao.LogDAO;
import com.ciphershare.dao.UserDAO;
import com.ciphershare.models.ActivityLog;
import com.ciphershare.models.User;
import com.google.firebase.auth.FirebaseAuth;
import com.google.firebase.auth.FirebaseToken;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpSession;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

/**
 * POST /api/auth/login    – verify Firebase idToken, create session
 * POST /api/auth/register – register new user in Firestore
 * GET  /api/auth/logout   – invalidate session
 * GET  /api/auth/me       – return current session user
 */
@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final UserDAO userDAO = new UserDAO();
    private final LogDAO  logDAO  = new LogDAO();

    // ── Login ──────────────────────────────────────────────
    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestParam String idToken,
                                   HttpServletRequest request) {
        if (idToken == null || idToken.isBlank())
            return ResponseEntity.badRequest().body(Map.of("error", "Missing idToken"));

        try {
            FirebaseToken decoded = FirebaseAuth.getInstance().verifyIdToken(idToken);
            String uid   = decoded.getUid();
            String email = decoded.getEmail();
            String name  = decoded.getName() != null ? decoded.getName() : email;

            User user = userDAO.getUserById(uid);
            if (user == null) {
                // First login via Google (not registered via form) — create as employee, active
                user = new User(uid, name, email, "employee", "General");
                user.setRequestedRole("employee");
                user.setActive(true);
                userDAO.createUser(user);
            }

            // Block login if account is pending admin approval
            if (!user.isActive()) {
                return ResponseEntity.status(403).body(Map.of(
                    "error", "pending_approval",
                    "message", "Your account is pending admin approval. Please wait for an administrator to activate your account."
                ));
            }

            HttpSession session = request.getSession(true);
            session.setAttribute("userId",         uid);
            session.setAttribute("userEmail",      email);
            session.setAttribute("userName",       user.getName());
            session.setAttribute("userRole",       user.getRole());
            session.setAttribute("userDepartment", user.getDepartment());
            session.setMaxInactiveInterval(1800);

            logDAO.log(new ActivityLog(uid, user.getName(), "LOGIN",
                "Logged in from " + request.getRemoteAddr()));

            Map<String, Object> resp = new HashMap<>();
            resp.put("success",           true);
            resp.put("uid",               uid);
            resp.put("name",              user.getName());
            resp.put("email",             email);
            resp.put("role",              user.getRole());
            resp.put("department",        user.getDepartment());
            resp.put("phoneNumber",       user.getPhoneNumber());
            resp.put("bio",               user.getBio());
            resp.put("profilePictureUrl", user.getProfilePictureUrl());
            resp.put("coverPhotoUrl",     user.getCoverPhotoUrl());
            return ResponseEntity.ok(resp);

        } catch (Exception e) {
            return ResponseEntity.status(401)
                .body(Map.of("error", "Authentication failed: " + e.getMessage()));
        }
    }

    // ── Register ───────────────────────────────────────────
    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestParam String idToken,
                                      @RequestParam String name,
                                      @RequestParam(required = false, defaultValue = "employee") String role) {
        if (idToken == null || idToken.isBlank() || name == null || name.isBlank())
            return ResponseEntity.badRequest().body(Map.of("error", "Missing required fields"));

        // Only allow employee or manager registration via self-service
        if (!"employee".equals(role) && !"manager".equals(role)) {
            role = "employee";
        }

        try {
            FirebaseToken decoded = FirebaseAuth.getInstance().verifyIdToken(idToken);
            String uid   = decoded.getUid();
            String email = decoded.getEmail();

            if (userDAO.getUserById(uid) != null)
                return ResponseEntity.status(409).body(Map.of("error", "User already registered"));

            // Manager registrations require admin approval (isActive = false)
            // Employee registrations are active immediately
            boolean isActive = "employee".equals(role);
            String  dbRole   = isActive ? "employee" : "employee"; // always start as employee; approval promotes to manager

            User user = new User(uid, name.trim(), email, dbRole, "General");
            user.setRequestedRole(role);  // store what they asked for
            user.setActive(isActive);
            userDAO.createUser(user);

            logDAO.log(new ActivityLog(uid, name, "REGISTER",
                "Registered as " + role + " (" + (isActive ? "active" : "pending approval") + ")"));

            if (isActive) {
                return ResponseEntity.status(201).body(Map.of(
                    "success", true,
                    "message", "Account created successfully. You can now log in."
                ));
            } else {
                return ResponseEntity.status(201).body(Map.of(
                    "success", true,
                    "pending", true,
                    "message", "Your Manager account request has been submitted. An admin will review and approve it before you can log in."
                ));
            }

        } catch (Exception e) {
            return ResponseEntity.status(500)
                .body(Map.of("error", "Registration failed: " + e.getMessage()));
        }
    }

    // ── Logout ─────────────────────────────────────────────
    @GetMapping("/logout")
    public ResponseEntity<?> logout(HttpServletRequest request) {
        HttpSession session = request.getSession(false);
        if (session != null) {
            String uid   = (String) session.getAttribute("userId");
            String uName = (String) session.getAttribute("userName");
            if (uid != null) logDAO.log(new ActivityLog(uid, uName, "LOGOUT", "Logged out"));
            session.invalidate();
        }
        return ResponseEntity.ok(Map.of("success", true, "message", "Logged out"));
    }

    // ── Me ─────────────────────────────────────────────────
    @GetMapping("/me")
    public ResponseEntity<?> me(HttpServletRequest request) {
        HttpSession session = request.getSession(false);
        if (session == null || session.getAttribute("userId") == null)
            return ResponseEntity.status(401).body(Map.of("error", "Not authenticated"));

        String uid = (String) session.getAttribute("userId");
        try {
            User user = userDAO.getUserById(uid);
            if (user == null) {
                return ResponseEntity.status(404).body(Map.of("error", "User not found"));
            }
            Map<String, Object> resp = new HashMap<>();
            resp.put("uid",               user.getUid());
            resp.put("name",              user.getName());
            resp.put("email",             user.getEmail());
            resp.put("role",              user.getRole());
            resp.put("department",        user.getDepartment());
            resp.put("phoneNumber",       user.getPhoneNumber());
            resp.put("bio",               user.getBio());
            resp.put("profilePictureUrl", user.getProfilePictureUrl());
            resp.put("coverPhotoUrl",     user.getCoverPhotoUrl());
            return ResponseEntity.ok(resp);
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
        }
    }
}
