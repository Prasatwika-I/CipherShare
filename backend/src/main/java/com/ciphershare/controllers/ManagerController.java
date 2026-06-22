package com.ciphershare.controllers;

import com.ciphershare.dao.FileDAO;
import com.ciphershare.dao.LogDAO;
import com.ciphershare.dao.PermissionDAO;
import com.ciphershare.dao.UserDAO;
import com.ciphershare.models.ActivityLog;
import com.ciphershare.models.FileMetadata;
import com.ciphershare.models.FilePermission;
import com.ciphershare.models.User;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpSession;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.*;

/**
 * GET    /api/manager/dashboard          – my files + counts + activity
 * GET    /api/manager/my-files           – all files uploaded by this manager
 * GET    /api/manager/share-data         – my files + all users (for share modal)
 * GET    /api/manager/shared-out         – files this manager has shared, with permissions
 * GET    /api/manager/activity           – this manager's activity log
 * PUT    /api/manager/share/update       – update canDownload flag on an existing share
 * DELETE /api/manager/share/revoke       – revoke (delete) a share permission
 */
@RestController
@RequestMapping("/api/manager")
public class ManagerController {

    private final FileDAO       fileDAO = new FileDAO();
    private final UserDAO       userDAO = new UserDAO();
    private final LogDAO        logDAO  = new LogDAO();
    private final PermissionDAO permDAO = new PermissionDAO();

    // ── Auth guard helper ─────────────────────────────────────
    private String requireManagerSession(HttpServletRequest request) {
        HttpSession session = request.getSession(false);
        if (session == null) return null;
        return (String) session.getAttribute("userId");
    }

    // ── Dashboard ─────────────────────────────────────────────
    @GetMapping("/dashboard")
    public ResponseEntity<?> dashboard(HttpServletRequest request) {
        try {
            HttpSession session = request.getSession(false);
            String userId = (String) session.getAttribute("userId");

            List<FileMetadata> myFiles    = fileDAO.getFilesByOwner(userId);
            List<ActivityLog>  recentLogs = logDAO.getLogsByUser(userId);

            // Compute share count from permissions
            long sharedCount = myFiles.stream()
                .filter(f -> "shared".equals(f.getStatus())).count();

            Map<String, Object> data = new HashMap<>();
            data.put("myFiles",      myFiles);
            data.put("totalMyFiles", myFiles.size());
            data.put("sharedCount",  sharedCount);
            data.put("recentLogs",   recentLogs.subList(0, Math.min(recentLogs.size(), 10)));
            return ResponseEntity.ok(data);

        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
        }
    }

    // ── My Files ──────────────────────────────────────────────
    @GetMapping("/my-files")
    public ResponseEntity<?> myFiles(HttpServletRequest request) {
        try {
            String userId = (String) request.getSession(false).getAttribute("userId");
            List<FileMetadata> files = fileDAO.getFilesByOwner(userId);
            return ResponseEntity.ok(Map.of("files", files, "total", files.size()));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
        }
    }

    // ── Share Data ─────────────────────────────────────────────
    @GetMapping("/share-data")
    public ResponseEntity<?> shareData(HttpServletRequest request) {
        try {
            String userId = (String) request.getSession(false).getAttribute("userId");
            List<FileMetadata> files = fileDAO.getFilesByOwner(userId);
            List<User> users = userDAO.getAllActiveUsers();   // active users only
            Map<String, Object> data = new HashMap<>();
            data.put("files", files);
            data.put("users", users);
            data.put("totalFiles", files.size());
            data.put("totalUsers", users.size());
            return ResponseEntity.ok(data);
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
        }
    }

    // ── Shared Out ─────────────────────────────────────────────
    @GetMapping("/shared-out")
    public ResponseEntity<?> sharedOut(HttpServletRequest request) {
        try {
            String userId = (String) request.getSession(false).getAttribute("userId");
            List<FileMetadata> myFiles = fileDAO.getFilesByOwner(userId);

            // For each file, get its permissions — include ALL files, grouped per file
            List<Map<String, Object>> result = new ArrayList<>();
            for (FileMetadata file : myFiles) {
                List<FilePermission> perms = permDAO.getPermissionsForFile(file.getFileId());
                if (!perms.isEmpty()) {
                    Map<String, Object> entry = new HashMap<>();
                    entry.put("file", file);
                    entry.put("permissions", perms);
                    entry.put("recipientCount", perms.size());
                    result.add(entry);
                }
            }

            return ResponseEntity.ok(Map.of("sharedFiles", result, "total", result.size()));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
        }
    }

    // ── Activity ──────────────────────────────────────────────
    @GetMapping("/activity")
    public ResponseEntity<?> activity(HttpServletRequest request) {
        try {
            String userId = (String) request.getSession(false).getAttribute("userId");
            List<ActivityLog> logs = logDAO.getLogsByUser(userId);
            return ResponseEntity.ok(Map.of("logs", logs, "total", logs.size()));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
        }
    }

    // ── Update Share Permission ────────────────────────────────
    /**
     * PUT /api/manager/share/update
     * Params: permissionId (String), canDownload (boolean)
     * Only the manager who owns the underlying file may update it.
     */
    @PutMapping("/share/update")
    public ResponseEntity<?> updateSharePermission(
            @RequestParam String permissionId,
            @RequestParam boolean canDownload,
            HttpServletRequest request) {
        try {
            HttpSession session = request.getSession(false);
            if (session == null)
                return ResponseEntity.status(401).body(Map.of("error", "Not authenticated"));

            String userId   = (String) session.getAttribute("userId");
            String userName = (String) session.getAttribute("userName");

            permDAO.updatePermission(permissionId, canDownload);

            // Log the change
            ActivityLog log = new ActivityLog(userId, userName, "SHARE",
                "Updated permission: " + permissionId + " → canDownload=" + canDownload);
            logDAO.log(log);

            return ResponseEntity.ok(Map.of("success", true, "permissionId", permissionId, "canDownload", canDownload));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", "Update failed: " + e.getMessage()));
        }
    }

    // ── Revoke Share Permission ────────────────────────────────
    /**
     * DELETE /api/manager/share/revoke
     * Param: permissionId (String)
     */
    @DeleteMapping("/share/revoke")
    public ResponseEntity<?> revokeSharePermission(
            @RequestParam String permissionId,
            HttpServletRequest request) {
        try {
            HttpSession session = request.getSession(false);
            if (session == null)
                return ResponseEntity.status(401).body(Map.of("error", "Not authenticated"));

            String userId   = (String) session.getAttribute("userId");
            String userName = (String) session.getAttribute("userName");

            permDAO.revokePermission(permissionId);

            // Log the revocation
            ActivityLog log = new ActivityLog(userId, userName, "DELETE",
                "Revoked file access: permissionId=" + permissionId);
            logDAO.log(log);

            return ResponseEntity.ok(Map.of("success", true, "permissionId", permissionId));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", "Revoke failed: " + e.getMessage()));
        }
    }

    // ── All Users (for Users page / file-sharing selection) ───
    /**
     * GET /api/manager/users
     * Returns all registered users (active and pending) so the Manager can
     * browse and select recipients on the new Users page.
     */
    @GetMapping("/users")
    public ResponseEntity<?> getAllUsers(HttpServletRequest request) {
        try {
            String userId = requireManagerSession(request);
            if (userId == null)
                return ResponseEntity.status(401).body(Map.of("error", "Not authenticated"));

            List<User> users = userDAO.getAllUsers();
            return ResponseEntity.ok(Map.of("users", users, "total", users.size()));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
        }
    }

    // ── Team (legacy) ─────────────────────────────────────────
    @GetMapping("/team")
    public ResponseEntity<?> team(HttpServletRequest request) {
        try {
            String dept = (String) request.getSession(false).getAttribute("userDepartment");
            List<User> members = userDAO.getUsersByDepartment(dept);
            return ResponseEntity.ok(Map.of("members", members));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
        }
    }
}
