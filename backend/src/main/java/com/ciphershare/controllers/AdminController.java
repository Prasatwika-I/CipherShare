package com.ciphershare.controllers;

import com.ciphershare.dao.FileDAO;
import com.ciphershare.dao.LogDAO;
import com.ciphershare.dao.UserDAO;
import com.ciphershare.models.ActivityLog;
import com.ciphershare.models.FileMetadata;
import com.ciphershare.models.User;
import com.google.firebase.auth.FirebaseAuth;
import com.google.firebase.auth.UserRecord;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpSession;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * GET  /api/admin/dashboard    – stats overview
 * GET  /api/admin/users        – all users list
 * POST /api/admin/update-role  – change a user's role
 * GET  /api/admin/files        – all files
 * GET  /api/admin/logs         – full activity logs
 */
@RestController
@RequestMapping("/api/admin")
public class AdminController {

    private final UserDAO userDAO = new UserDAO();
    private final FileDAO fileDAO = new FileDAO();
    private final LogDAO  logDAO  = new LogDAO();

    @GetMapping("/dashboard")
    public ResponseEntity<?> dashboard() {
        try {
            List<User>         users = userDAO.getAllUsers();
            List<FileMetadata> files = fileDAO.getAllFiles();
            var logs  = logDAO.getAllLogs();

            Map<String, Object> data = new HashMap<>();
            data.put("totalUsers", users.size());
            data.put("totalFiles", files.size());
            data.put("recentLogs", logs.subList(0, Math.min(10, logs.size())));
            return ResponseEntity.ok(data);
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/users")
    public ResponseEntity<?> users() {
        try {
            return ResponseEntity.ok(Map.of("users", userDAO.getAllUsers()));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/update-role")
    public ResponseEntity<?> updateRole(@RequestParam String uid,
                                        @RequestParam String role,
                                        HttpServletRequest request) {
        try {
            userDAO.updateRole(uid, role);
            HttpSession session  = request.getSession(false);
            String adminId   = (String) session.getAttribute("userId");
            String adminName = (String) session.getAttribute("userName");
            logDAO.log(new ActivityLog(adminId, adminName, "ROLE_UPDATE",
                "Changed role of " + uid + " to " + role));
            return ResponseEntity.ok(Map.of("success", true));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/files")
    public ResponseEntity<?> files() {
        try {
            return ResponseEntity.ok(Map.of("files", fileDAO.getAllFiles()));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/logs")
    public ResponseEntity<?> logs() {
        try {
            return ResponseEntity.ok(Map.of("logs", logDAO.getAllLogs()));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * GET /api/admin/pending-users
     * Returns all user accounts that are awaiting admin approval (isActive = false).
     */
    @GetMapping("/pending-users")
    public ResponseEntity<?> pendingUsers() {
        try {
            return ResponseEntity.ok(Map.of("users", userDAO.getPendingUsers()));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * POST /api/admin/approve-user?uid=xxx&role=manager
     * Activates a pending account and sets the approved role.
     */
    @PostMapping("/approve-user")
    public ResponseEntity<?> approveUser(@RequestParam String uid,
                                         @RequestParam(required = false, defaultValue = "manager") String role,
                                         HttpServletRequest request) {
        try {
            // Guard: only allow promoting to employee or manager via this endpoint
            if (!"employee".equals(role) && !"manager".equals(role)) role = "manager";
            userDAO.approveUser(uid, role);

            HttpSession session  = request.getSession(false);
            String adminId   = session != null ? (String) session.getAttribute("userId")   : "system";
            String adminName = session != null ? (String) session.getAttribute("userName")  : "System";
            logDAO.log(new ActivityLog(adminId, adminName, "APPROVE_USER",
                "Approved user " + uid + " as " + role));

            return ResponseEntity.ok(Map.of("success", true));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * POST /api/admin/deactivate-user?uid=xxx
     * Deactivates (rejects/bans) a user account.
     */
    @PostMapping("/deactivate-user")
    public ResponseEntity<?> deactivateUser(@RequestParam String uid,
                                             HttpServletRequest request) {
        try {
            userDAO.deactivateUser(uid);
            HttpSession session  = request.getSession(false);
            String adminId   = session != null ? (String) session.getAttribute("userId")   : "system";
            String adminName = session != null ? (String) session.getAttribute("userName")  : "System";
            logDAO.log(new ActivityLog(adminId, adminName, "DEACTIVATE_USER", "Deactivated user " + uid));
            return ResponseEntity.ok(Map.of("success", true));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * POST /api/admin/invite-user
     * Creates a new user via Firebase Auth and saves them to Firestore.
     */
    @PostMapping("/invite-user")
    public ResponseEntity<?> inviteUser(@RequestParam String name,
                                        @RequestParam String email,
                                        @RequestParam String role,
                                        @RequestParam(required = false, defaultValue = "General") String department,
                                        HttpServletRequest request) {
        try {
            if (!"employee".equals(role) && !"manager".equals(role) && !"admin".equals(role)) {
                return ResponseEntity.badRequest().body(Map.of("error", "Invalid role"));
            }

            UserRecord.CreateRequest req = new UserRecord.CreateRequest()
                    .setEmail(email)
                    .setPassword("CipherShare123!") // Default password
                    .setDisplayName(name);
            UserRecord userRecord = FirebaseAuth.getInstance().createUser(req);

            User newUser = new User(userRecord.getUid(), name, email, role, department);
            newUser.setRequestedRole(role);
            userDAO.createUser(newUser);

            HttpSession session  = request.getSession(false);
            String adminId   = session != null ? (String) session.getAttribute("userId")   : "system";
            String adminName = session != null ? (String) session.getAttribute("userName")  : "System";
            logDAO.log(new ActivityLog(adminId, adminName, "INVITE_USER",
                "Invited new user " + name + " (" + email + ") as " + role));

            return ResponseEntity.ok(Map.of("success", true));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
        }
    }
}
