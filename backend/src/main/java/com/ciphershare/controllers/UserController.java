package com.ciphershare.controllers;

import com.ciphershare.dao.FileDAO;
import com.ciphershare.dao.LogDAO;
import com.ciphershare.dao.PermissionDAO;
import com.ciphershare.dao.UserDAO;
import com.ciphershare.models.ActivityLog;
import com.ciphershare.models.FileMetadata;
import com.ciphershare.models.FilePermission;
import com.ciphershare.models.User;
import com.google.cloud.firestore.DocumentSnapshot;
import com.google.cloud.firestore.Firestore;
import com.google.firebase.cloud.FirestoreClient;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpSession;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.nio.file.Paths;
import java.util.*;
import java.util.concurrent.ExecutionException;
import java.util.stream.Collectors;

/**
 * GET  /api/user/dashboard           – shared files overview + counts
 * GET  /api/user/shared-files        – all files shared with this user
 * GET  /api/user/profile             – current user's Firestore profile
 * POST /api/user/update-profile      – update name + department
 * GET  /api/user/activity            – this user's activity log
 * GET  /api/user/notifications       – notifications for this user
 * POST /api/user/notifications/read  – mark a single notification read
 * POST /api/user/notifications/read-all – mark all notifications read
 * GET  /api/user/downloads           – download history for this user
 * POST /api/user/record-download     – record a download event
 */
@RestController
@RequestMapping("/api/user")
public class UserController {

    private final FileDAO       fileDAO = new FileDAO();
    private final PermissionDAO permDAO = new PermissionDAO();
    private final UserDAO       userDAO = new UserDAO();
    private final LogDAO        logDAO  = new LogDAO();

    @Autowired
    private com.ciphershare.config.StorageService storageService;

    // ── Helper: build enriched shared-file list ────────────────
    private List<Map<String, Object>> getEnrichedSharedFiles(String userId, String userRole) throws Exception {
        List<FilePermission> perms = permDAO.getFilesSharedWithUser(userId, userRole);
        List<Map<String, Object>> result = new ArrayList<>();

        for (FilePermission perm : perms) {
            FileMetadata file = fileDAO.getFileById(perm.getFileId());
            if (file == null || file.isDeleted()) continue;

            Map<String, Object> entry = new HashMap<>();
            // File fields
            entry.put("fileId",       file.getFileId());
            entry.put("fileName",     file.getFileName());
            entry.put("fileType",     file.getFileType());
            entry.put("fileSize",     file.getFileSize());
            entry.put("uploadedAt",   file.getUploadedAt());
            entry.put("downloadUrl",  file.getDownloadUrl() != null ? file.getDownloadUrl() : "");
            entry.put("storagePath",  file.getStoragePath() != null ? file.getStoragePath() : "");
            entry.put("status",       file.getStatus());
            entry.put("ownerName",    file.getOwnerName());
            entry.put("ownerId",      file.getOwnerId());
            // Permission fields
            entry.put("permissionId", perm.getPermissionId());
            entry.put("canView",      perm.isCanView());
            entry.put("canDownload",  perm.isCanDownload());
            entry.put("sharedBy",     perm.getSharedByName());
            entry.put("sharedById",   perm.getSharedBy());
            entry.put("sharedAt",     perm.getSharedAt());
            result.add(entry);
        }
        return result;
    }

    // ── Dashboard ─────────────────────────────────────────────
    @GetMapping("/dashboard")
    public ResponseEntity<?> dashboard(HttpServletRequest request) {
        try {
            HttpSession session = request.getSession(false);
            String userId   = (String) session.getAttribute("userId");
            String userRole = (String) session.getAttribute("userRole");

            List<Map<String, Object>> shared = getEnrichedSharedFiles(userId, userRole);
            long downloadable = shared.stream()
                .filter(f -> Boolean.TRUE.equals(f.get("canDownload"))).count();

            Map<String, Object> data = new HashMap<>();
            data.put("sharedFiles",       shared);
            data.put("totalShared",        shared.size());
            data.put("totalDownloadable",  downloadable);
            data.put("totalViewOnly",      shared.size() - downloadable);
            return ResponseEntity.ok(data);

        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
        }
    }

    // ── Shared Files ──────────────────────────────────────────
    @GetMapping("/shared-files")
    public ResponseEntity<?> sharedFiles(HttpServletRequest request) {
        try {
            HttpSession session = request.getSession(false);
            String userId   = (String) session.getAttribute("userId");
            String userRole = (String) session.getAttribute("userRole");
            List<Map<String, Object>> shared = getEnrichedSharedFiles(userId, userRole);
            return ResponseEntity.ok(Map.of("sharedFiles", shared, "total", shared.size()));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
        }
    }

    // ── Profile ───────────────────────────────────────────────
    @GetMapping("/profile")
    public ResponseEntity<?> profile(HttpServletRequest request) {
        try {
            String userId = (String) request.getSession(false).getAttribute("userId");
            User user = userDAO.getUserById(userId);
            return ResponseEntity.ok(Map.of("user", user));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
        }
    }

    // ── Update Profile ────────────────────────────────────────
    @PostMapping("/update-profile")
    public ResponseEntity<?> updateProfile(@RequestParam String name,
                                           @RequestParam(required = false) String department,
                                           @RequestParam(required = false) String phoneNumber,
                                           @RequestParam(required = false) String bio,
                                           @RequestParam(required = false) String profilePictureUrl,
                                           @RequestParam(required = false) String coverPhotoUrl,
                                           HttpServletRequest request) {
        try {
            HttpSession session = request.getSession(false);
            String userId   = (String) session.getAttribute("userId");
            String userName = (String) session.getAttribute("userName");
            String dept = (department != null && !department.isBlank()) ? department : "General";

            userDAO.updateProfile(userId, name, dept, phoneNumber, bio, profilePictureUrl, coverPhotoUrl);
            session.setAttribute("userName",       name);
            session.setAttribute("userDepartment", dept);

            logDAO.log(new ActivityLog(userId, userName, "PROFILE_UPDATE", "Updated profile"));
            return ResponseEntity.ok(Map.of("success", true));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
        }
    }

    // ── Activity ──────────────────────────────────────────────
    @GetMapping("/activity")
    public ResponseEntity<?> activity(HttpServletRequest request) {
        try {
            String userId = (String) request.getSession(false).getAttribute("userId");
            return ResponseEntity.ok(Map.of("logs", logDAO.getLogsByUser(userId)));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
        }
    }

    // ── Notifications ─────────────────────────────────────────
    /**
     * Returns notifications from the Firestore "notifications" collection
     * where userId == current user. Falls back to activity-log derived
     * notifications if the collection doesn't exist.
     */
    @GetMapping("/notifications")
    public ResponseEntity<?> notifications(HttpServletRequest request) {
        try {
            HttpSession session = request.getSession(false);
            String userId = (String) session.getAttribute("userId");

            Firestore db = FirestoreClient.getFirestore();
            List<Map<String, Object>> notifs = new ArrayList<>();

            try {
                // Primary: dedicated notifications collection
                var query = db.collection("notifications")
                        .whereEqualTo("userId", userId)
                        .orderBy("createdAt", com.google.cloud.firestore.Query.Direction.DESCENDING)
                        .limit(50)
                        .get().get();

                for (DocumentSnapshot doc : query.getDocuments()) {
                    Map<String, Object> n = new HashMap<>(doc.getData() != null ? doc.getData() : new HashMap<>());
                    n.put("id", doc.getId());
                    // Normalize createdAt to epoch ms for consistent frontend formatting
                    Object createdAt = n.get("createdAt");
                    if (createdAt instanceof com.google.cloud.Timestamp ts) {
                        n.put("createdAt", ts.toDate().getTime());
                    }
                    notifs.add(n);
                }
            } catch (Exception ex) {
                // Fallback: derive notifications from activity logs filtered for this user
                List<ActivityLog> logs = logDAO.getLogsByUser(userId);
                for (ActivityLog log : logs) {
                    String action = log.getAction() != null ? log.getAction().toUpperCase() : "";
                    String message;
                    String type;
                    if (action.contains("SHARE") || action.contains("FILE_SHARE")) {
                        message = "A file has been shared with you.";
                        type    = "file_shared";
                    } else if (action.contains("PERMISSION") || action.contains("UPDATE")) {
                        message = "Your file permission was updated.";
                        type    = "permission_update";
                    } else if (action.contains("DELETE") || action.contains("REVOKE")) {
                        message = "A file's access was changed.";
                        type    = "file_removed";
                    } else {
                        continue; // skip irrelevant log entries
                    }
                    Map<String, Object> n = new HashMap<>();
                    n.put("id",        log.getLogId() != null ? log.getLogId() : UUID.randomUUID().toString());
                    n.put("userId",    userId);
                    n.put("type",      type);
                    n.put("message",   message);
                    n.put("read",      true);
                    n.put("createdAt", log.getTimestamp() != null ? log.getTimestamp().getTime() : null);
                    notifs.add(n);
                }
            }

            return ResponseEntity.ok(Map.of("notifications", notifs, "total", notifs.size()));

        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
        }
    }

    // ── Mark Notification Read ────────────────────────────────
    @PostMapping("/notifications/read")
    public ResponseEntity<?> markNotificationRead(@RequestParam String notifId,
                                                  HttpServletRequest request) {
        try {
            Firestore db = FirestoreClient.getFirestore();
            db.collection("notifications").document(notifId)
              .update("read", true).get();
            return ResponseEntity.ok(Map.of("success", true));
        } catch (Exception e) {
            // Silently succeed even if document not found (legacy fallback)
            return ResponseEntity.ok(Map.of("success", true));
        }
    }

    // ── Mark All Notifications Read ───────────────────────────
    @PostMapping("/notifications/read-all")
    public ResponseEntity<?> markAllNotificationsRead(HttpServletRequest request) {
        try {
            HttpSession session = request.getSession(false);
            String userId = (String) session.getAttribute("userId");

            Firestore db = FirestoreClient.getFirestore();
            var unread = db.collection("notifications")
                    .whereEqualTo("userId", userId)
                    .whereEqualTo("read", false)
                    .get().get();

            var batch = db.batch();
            unread.getDocuments().forEach(doc ->
                batch.update(doc.getReference(), "read", true)
            );
            if (!unread.isEmpty()) batch.commit().get();

            return ResponseEntity.ok(Map.of("success", true, "updated", unread.size()));
        } catch (Exception e) {
            return ResponseEntity.ok(Map.of("success", true));
        }
    }

    // ── Download History ──────────────────────────────────────
    /**
     * Returns download events from activityLogs where userId == current user
     * and action == DOWNLOAD, enriched with file metadata.
     */
    @GetMapping("/downloads")
    public ResponseEntity<?> downloads(HttpServletRequest request) {
        try {
            HttpSession session = request.getSession(false);
            String userId = (String) session.getAttribute("userId");

            // Fetch all logs for this user
            List<ActivityLog> logs = logDAO.getLogsByUser(userId);

            // Filter to DOWNLOAD actions only
            List<Map<String, Object>> downloadHistory = new ArrayList<>();
            for (ActivityLog log : logs) {
                String action = log.getAction() != null ? log.getAction().toUpperCase() : "";
                if (!action.contains("DOWNLOAD")) continue;

                Map<String, Object> entry = new HashMap<>();
                entry.put("logId",        log.getLogId());
                entry.put("downloadedAt", log.getTimestamp() != null ? log.getTimestamp().getTime() : null);
                entry.put("timestamp",    log.getTimestamp() != null ? log.getTimestamp().getTime() : null);

                // Try to parse fileId from details
                String details  = log.getDetails() != null ? log.getDetails() : "";
                String fileId   = null;
                String fileName = details;

                // Details format might be "Downloaded: <filename>" or "fileId:<id>"
                if (details.startsWith("fileId:")) {
                    fileId = details.replace("fileId:", "").trim();
                } else if (details.startsWith("Downloaded: ")) {
                    fileName = details.replace("Downloaded: ", "").trim();
                }

                // Enrich with file metadata if we have a fileId
                if (fileId != null && !fileId.isBlank()) {
                    try {
                        FileMetadata file = fileDAO.getFileById(fileId);
                        if (file != null) {
                            entry.put("fileId",      file.getFileId());
                            entry.put("fileName",    file.getFileName());
                            entry.put("fileType",    file.getFileType());
                            entry.put("fileSize",    file.getFileSize());
                            entry.put("downloadUrl", file.getDownloadUrl() != null ? file.getDownloadUrl() : "");
                            entry.put("ownerName",   file.getOwnerName());
                            entry.put("sharedBy",    file.getOwnerName());
                        } else {
                            entry.put("fileName", fileName);
                        }
                    } catch (Exception ignored) {
                        entry.put("fileName", fileName);
                    }
                } else {
                    entry.put("fileName", fileName);
                }

                downloadHistory.add(entry);
            }

            // Sort by downloadedAt descending
            downloadHistory.sort((a, b) -> {
                Long ta = a.get("downloadedAt") instanceof Long ? (Long) a.get("downloadedAt") : 0L;
                Long tb = b.get("downloadedAt") instanceof Long ? (Long) b.get("downloadedAt") : 0L;
                return tb.compareTo(ta);
            });

            return ResponseEntity.ok(Map.of("downloads", downloadHistory, "total", downloadHistory.size()));

        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
        }
    }

    // ── Record Download ───────────────────────────────────────
    /**
     * Records a download event in activityLogs and optionally in
     * the Firestore notifications collection for the file owner.
     */
    @PostMapping("/record-download")
    public ResponseEntity<?> recordDownload(@RequestParam String fileId,
                                            HttpServletRequest request) {
        try {
            HttpSession session = request.getSession(false);
            String userId   = (String) session.getAttribute("userId");
            String userName = (String) session.getAttribute("userName");

            // Fetch file metadata to get the filename for the log
            String details = "fileId:" + fileId;
            try {
                FileMetadata file = fileDAO.getFileById(fileId);
                if (file != null) {
                    details = "Downloaded: " + file.getFileName() + " (fileId:" + fileId + ")";
                }
            } catch (Exception ignored) { /* use default details */ }

            ActivityLog log = new ActivityLog(userId, userName, "DOWNLOAD", details);
            logDAO.log(log);

            return ResponseEntity.ok(Map.of("success", true));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
        }
    }

    // ── Upload Avatar ─────────────────────────────────────────
    @PostMapping("/upload-avatar")
    public ResponseEntity<?> uploadAvatar(@RequestParam("file") MultipartFile file,
                                          HttpServletRequest request) {
        try {
            HttpSession session = request.getSession(false);
            if (session == null)
                return ResponseEntity.status(401).body(Map.of("error", "Not authenticated"));

            String userId = (String) session.getAttribute("userId");
            if (file == null || file.isEmpty())
                return ResponseEntity.badRequest().body(Map.of("error", "No file provided"));

            String contentType = file.getContentType();
            if (contentType == null || (!contentType.equals("image/jpeg") && !contentType.equals("image/png") && !contentType.equals("image/jpg"))) {
                return ResponseEntity.badRequest().body(Map.of("error", "Only JPG, JPEG, and PNG images are supported"));
            }

            // Upload using StorageService
            String fileId = UUID.randomUUID().toString();
            com.ciphershare.config.StorageService.StorageResult res = storageService.uploadToFirebase(file, "avatar_" + fileId, userId);
            
            String url = res.downloadUrl;
            if (url == null || url.isBlank()) {
                // Local fallback
                String uploadDir = System.getProperty("java.io.tmpdir") + File.separator + "ciphershare" + File.separator + "profiles" + File.separator + userId;
                java.nio.file.Files.createDirectories(Paths.get(uploadDir));
                String ext = file.getOriginalFilename().contains(".") ? file.getOriginalFilename().substring(file.getOriginalFilename().lastIndexOf(".")) : ".png";
                String localPath = uploadDir + File.separator + "avatar" + ext;
                file.transferTo(new File(localPath));
                url = "/api/user/avatar?userId=" + userId + "&t=" + System.currentTimeMillis();
            }

            return ResponseEntity.ok(Map.of("success", true, "url", url));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
        }
    }

    // ── Upload Cover Photo ────────────────────────────────────
    @PostMapping("/upload-cover")
    public ResponseEntity<?> uploadCover(@RequestParam("file") MultipartFile file,
                                         HttpServletRequest request) {
        try {
            HttpSession session = request.getSession(false);
            if (session == null)
                return ResponseEntity.status(401).body(Map.of("error", "Not authenticated"));

            String userId = (String) session.getAttribute("userId");
            if (file == null || file.isEmpty())
                return ResponseEntity.badRequest().body(Map.of("error", "No file provided"));

            String contentType = file.getContentType();
            if (contentType == null || (!contentType.equals("image/jpeg") && !contentType.equals("image/png") && !contentType.equals("image/jpg"))) {
                return ResponseEntity.badRequest().body(Map.of("error", "Only JPG, JPEG, and PNG images are supported"));
            }

            // Upload using StorageService
            String fileId = UUID.randomUUID().toString();
            com.ciphershare.config.StorageService.StorageResult res = storageService.uploadToFirebase(file, "cover_" + fileId, userId);
            
            String url = res.downloadUrl;
            if (url == null || url.isBlank()) {
                // Local fallback
                String uploadDir = System.getProperty("java.io.tmpdir") + File.separator + "ciphershare" + File.separator + "profiles" + File.separator + userId;
                java.nio.file.Files.createDirectories(Paths.get(uploadDir));
                String ext = file.getOriginalFilename().contains(".") ? file.getOriginalFilename().substring(file.getOriginalFilename().lastIndexOf(".")) : ".png";
                String localPath = uploadDir + File.separator + "cover" + ext;
                file.transferTo(new File(localPath));
                url = "/api/user/cover?userId=" + userId + "&t=" + System.currentTimeMillis();
            }

            return ResponseEntity.ok(Map.of("success", true, "url", url));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
        }
    }

    // ── Stream Avatar Fallback ────────────────────────────────
    @GetMapping("/avatar")
    public ResponseEntity<?> getAvatar(@RequestParam String userId) {
        try {
            String uploadDir = System.getProperty("java.io.tmpdir") + File.separator + "ciphershare" + File.separator + "profiles" + File.separator + userId;
            File dir = new File(uploadDir);
            if (dir.exists()) {
                File[] files = dir.listFiles((d, name) -> name.startsWith("avatar"));
                if (files != null && files.length > 0) {
                    File avatarFile = files[0];
                    String contentType = java.nio.file.Files.probeContentType(avatarFile.toPath());
                    return ResponseEntity.ok()
                        .header("Content-Type", contentType != null ? contentType : "image/png")
                        .body(new org.springframework.core.io.FileSystemResource(avatarFile));
                }
            }
            return ResponseEntity.status(404).body("Avatar not found");
        } catch (Exception e) {
            return ResponseEntity.status(500).body(e.getMessage());
        }
    }

    // ── Stream Cover Fallback ─────────────────────────────────
    @GetMapping("/cover")
    public ResponseEntity<?> getCover(@RequestParam String userId) {
        try {
            String uploadDir = System.getProperty("java.io.tmpdir") + File.separator + "ciphershare" + File.separator + "profiles" + File.separator + userId;
            File dir = new File(uploadDir);
            if (dir.exists()) {
                File[] files = dir.listFiles((d, name) -> name.startsWith("cover"));
                if (files != null && files.length > 0) {
                    File coverFile = files[0];
                    String contentType = java.nio.file.Files.probeContentType(coverFile.toPath());
                    return ResponseEntity.ok()
                        .header("Content-Type", contentType != null ? contentType : "image/png")
                        .body(new org.springframework.core.io.FileSystemResource(coverFile));
                }
            }
            return ResponseEntity.status(404).body("Cover not found");
        } catch (Exception e) {
            return ResponseEntity.status(500).body(e.getMessage());
        }
    }
}
