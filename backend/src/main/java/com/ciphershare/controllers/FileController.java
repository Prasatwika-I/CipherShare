package com.ciphershare.controllers;

import com.ciphershare.config.StorageService;
import com.ciphershare.dao.FileDAO;
import com.ciphershare.dao.LogDAO;
import com.ciphershare.dao.PermissionDAO;
import com.ciphershare.dao.UserDAO;
import com.ciphershare.models.User;
import com.ciphershare.models.ActivityLog;
import com.ciphershare.models.FileMetadata;
import com.ciphershare.models.FilePermission;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpSession;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.util.*;

/**
 * POST /api/file/upload             – upload (multipart) → Firebase Storage + Firestore
 * GET  /api/file/download?fileId=xx – redirect to Firebase Storage URL or stream from disk
 * POST /api/file/share              – share a file with user/role, store permission in Firestore
 * POST /api/file/delete             – soft-delete from Firestore + remove from Firebase Storage
 * GET  /api/file/activity           – recent activity logs for the current user
 */
@RestController
@RequestMapping("/api/file")
public class FileController {

    private static final List<String> ALLOWED_TYPES = Arrays.asList(
        "application/pdf", "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "application/vnd.ms-excel",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "application/vnd.ms-powerpoint",
        "application/vnd.openxmlformats-officedocument.presentationml.presentation",
        "image/jpeg", "image/png", "image/gif",
        "application/zip", "application/x-zip-compressed",
        "text/plain", "text/csv"
    );
    private static final long MAX_SIZE = 50L * 1024 * 1024;

    private final FileDAO       fileDAO = new FileDAO();
    private final LogDAO        logDAO  = new LogDAO();
    private final PermissionDAO permDAO = new PermissionDAO();

    @Autowired
    private StorageService storageService;

    // ── Upload ─────────────────────────────────────────────────
    @PostMapping("/upload")
    public ResponseEntity<?> upload(@RequestParam("file") MultipartFile file,
                                    HttpServletRequest request) {
        HttpSession session = request.getSession(false);
        if (session == null)
            return ResponseEntity.status(401).body(Map.of("error", "Not authenticated"));

        String userId   = (String) session.getAttribute("userId");
        String userName = (String) session.getAttribute("userName");

        if (file == null || file.isEmpty())
            return ResponseEntity.badRequest().body(Map.of("error", "No file provided"));

        String contentType = file.getContentType();
        if (!ALLOWED_TYPES.contains(contentType))
            return ResponseEntity.badRequest().body(Map.of("error", "File type not allowed: " + contentType));

        if (file.getSize() > MAX_SIZE)
            return ResponseEntity.badRequest().body(Map.of("error", "File exceeds 50 MB limit"));

        try {
            String originalName = file.getOriginalFilename() != null ? file.getOriginalFilename() : "file";
            String fileId = UUID.randomUUID().toString();
            String ext    = originalName.contains(".") ? originalName.substring(originalName.lastIndexOf(".")) : "";

            // ── 1. Save to local temp disk (always) ───────────
            String uploadDir = System.getProperty("java.io.tmpdir") + File.separator
                + "ciphershare" + File.separator + userId;
            Files.createDirectories(Paths.get(uploadDir));
            String localPath = uploadDir + File.separator + fileId + ext;
            file.transferTo(new File(localPath));

            // ── 2. Upload to Firebase Storage (if configured) ──
            StorageService.StorageResult storageResult =
                storageService.uploadToFirebase(file, fileId, userId);

            // ── 3. Persist metadata to Firestore ──────────────
            FileMetadata meta = new FileMetadata();
            meta.setFileId(fileId);
            meta.setFileName(originalName);
            meta.setFilePath(localPath);
            meta.setFileSize(file.getSize());
            meta.setFileType(contentType);
            meta.setOwnerId(userId);
            meta.setOwnerName(userName);
            meta.setDownloadUrl(storageResult.downloadUrl);
            meta.setStoragePath(storageResult.storagePath);
            meta.setStatus("active");
            fileDAO.saveFile(meta);

            // ── 4. Log activity ───────────────────────────────
            ActivityLog log = new ActivityLog(userId, userName, "UPLOAD",
                "Uploaded file: " + originalName);
            log.setFileId(fileId);
            log.setFileName(originalName);
            logDAO.log(log);

            // ── 5. Return full metadata to frontend ───────────
            Map<String, Object> result = new HashMap<>();
            result.put("success",     true);
            result.put("fileId",      fileId);
            result.put("fileName",    originalName);
            result.put("fileSize",    file.getSize());
            result.put("fileType",    contentType);
            result.put("downloadUrl", storageResult.downloadUrl);
            result.put("storagePath", storageResult.storagePath);
            result.put("status",      "active");
            result.put("uploadedAt",  new Date());
            return ResponseEntity.ok(result);

        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", "Upload failed: " + e.getMessage()));
        }
    }

    // ── Download ───────────────────────────────────────────────
    @GetMapping("/download")
    public ResponseEntity<?> download(@RequestParam String fileId,
                                      @RequestParam(required = false, defaultValue = "download") String mode,
                                      HttpServletRequest request) {
        HttpSession session = request.getSession(false);
        if (session == null)
            return ResponseEntity.status(401).body(Map.of("error", "Not authenticated"));

        String userId   = (String) session.getAttribute("userId");
        String userName = (String) session.getAttribute("userName");
        String userRole = (String) session.getAttribute("userRole");

        try {
            FileMetadata fileMeta = fileDAO.getFileById(fileId);
            if (fileMeta == null || fileMeta.isDeleted())
                return ResponseEntity.status(404).body(Map.of("error", "File not found"));

            boolean isOwner = userId != null && userId.equals(fileMeta.getOwnerId());
            boolean isAdmin = "admin".equals(userRole);
            
            boolean hasPerm = false;
            if (isOwner || isAdmin) {
                hasPerm = true;
            } else {
                if ("view".equalsIgnoreCase(mode)) {
                    hasPerm = permDAO.checkPermission(fileId, userId, userRole)
                           || permDAO.checkDownloadPermission(fileId, userId, userRole);
                } else {
                    hasPerm = permDAO.checkDownloadPermission(fileId, userId, userRole);
                }
            }

            if (!hasPerm)
                return ResponseEntity.status(403).body(Map.of("error", "Access denied"));

            // Log activity
            String action = "view".equalsIgnoreCase(mode) ? "VIEW" : "DOWNLOAD";
            String details = ("view".equalsIgnoreCase(mode) ? "Viewed: " : "Downloaded: ") + fileMeta.getFileName();
            ActivityLog log = new ActivityLog(userId, userName, action, details);
            log.setFileId(fileId);
            log.setFileName(fileMeta.getFileName());
            logDAO.log(log);

            // If Firebase Storage URL available → redirect
            if (fileMeta.getDownloadUrl() != null && !fileMeta.getDownloadUrl().isBlank()) {
                return ResponseEntity.status(302)
                    .header("Location", fileMeta.getDownloadUrl())
                    .build();
            }

            // Fallback: stream from local disk
            File diskFile = new File(fileMeta.getFilePath() != null ? fileMeta.getFilePath() : "");
            if (!diskFile.exists())
                return ResponseEntity.status(404).body(Map.of("error", "File data not found on server"));

            String disposition = "view".equalsIgnoreCase(mode) ? "inline" : "attachment";
            return ResponseEntity.ok()
                .header("Content-Disposition", disposition + "; filename=\"" + fileMeta.getFileName() + "\"")
                .header("Content-Type", fileMeta.getFileType() != null ? fileMeta.getFileType() : "application/octet-stream")
                .header("Cache-Control", "no-store")
                .contentLength(diskFile.length())
                .body(new org.springframework.core.io.FileSystemResource(diskFile));

        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", "Download failed: " + e.getMessage()));
        }
    }

    // ── Share ──────────────────────────────────────────────────
    @PostMapping("/share")
    public ResponseEntity<?> share(@RequestParam String fileId,
                                   @RequestParam String sharedWithId,
                                   @RequestParam String sharedWithType,
                                   @RequestParam(required = false) String sharedWithName,
                                   @RequestParam(defaultValue = "false") boolean canDownload,
                                   HttpServletRequest request) {
        HttpSession session = request.getSession(false);
        if (session == null)
            return ResponseEntity.status(401).body(Map.of("error", "Not authenticated"));

        String userId   = (String) session.getAttribute("userId");
        String userName = (String) session.getAttribute("userName");

        try {
            // Verify file exists and requester owns it (unless admin)
            String userRole = (String) session.getAttribute("userRole");
            FileMetadata fileMeta = fileDAO.getFileById(fileId);
            if (fileMeta == null || fileMeta.isDeleted())
                return ResponseEntity.status(404).body(Map.of("error", "File not found"));

            if (!"admin".equals(userRole) && !userId.equals(fileMeta.getOwnerId()))
                return ResponseEntity.status(403).body(Map.of("error", "You can only share your own files"));

            String[] targets = sharedWithId.split(",");
            List<String> sharedNames = new ArrayList<>();
            UserDAO userDAO = new UserDAO();

            for (String target : targets) {
                target = target.trim();
                if (target.isEmpty()) continue;

                String name = target;
                if ("user".equals(sharedWithType)) {
                    User u = userDAO.getUserById(target);
                    if (u != null) {
                        name = u.getName();
                    }
                } else if ("role".equals(sharedWithType)) {
                    name = "All " + target.substring(0, 1).toUpperCase() + target.substring(1) + "s";
                }

                // Grant permission in Firestore
                FilePermission perm = new FilePermission();
                perm.setFileId(fileId);
                perm.setSharedWithId(target);
                perm.setSharedWithType(sharedWithType);
                perm.setSharedWithName(name);
                perm.setCanView(true);
                perm.setCanDownload(canDownload);
                perm.setSharedBy(userId);
                perm.setSharedByName(userName);
                permDAO.grantPermission(perm);
                sharedNames.add(name);
            }

            // Update file status to "shared"
            fileDAO.updateStatus(fileId, "shared");

            // Log
            String sharedNamesStr = String.join(", ", sharedNames);
            ActivityLog log = new ActivityLog(userId, userName, "SHARE",
                "Shared \"" + fileMeta.getFileName() + "\" with "
                + sharedWithType + "(s): " + sharedNamesStr
                + " | Permission: " + (canDownload ? "View+Download" : "View only"));
            log.setFileId(fileId);
            log.setFileName(fileMeta.getFileName());
            logDAO.log(log);

            return ResponseEntity.ok(Map.of(
                "success",     true,
                "fileId",      fileId,
                "sharedWith",  sharedNamesStr,
                "canDownload", canDownload
            ));

        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", "Share failed: " + e.getMessage()));
        }
    }

    // ── Delete ─────────────────────────────────────────────────
    @PostMapping("/delete")
    public ResponseEntity<?> delete(@RequestParam String fileId,
                                    HttpServletRequest request) {
        HttpSession session = request.getSession(false);
        if (session == null)
            return ResponseEntity.status(401).body(Map.of("error", "Not authenticated"));

        String userId   = (String) session.getAttribute("userId");
        String userName = (String) session.getAttribute("userName");
        String userRole = (String) session.getAttribute("userRole");

        if (!"admin".equals(userRole) && !"manager".equals(userRole))
            return ResponseEntity.status(403).body(Map.of("error", "Forbidden"));

        try {
            FileMetadata fileMeta = fileDAO.getFileById(fileId);
            if (fileMeta == null)
                return ResponseEntity.status(404).body(Map.of("error", "File not found"));

            if ("manager".equals(userRole) && !userId.equals(fileMeta.getOwnerId()))
                return ResponseEntity.status(403).body(Map.of("error", "You can only delete your own files"));

            // Soft-delete in Firestore
            fileDAO.softDelete(fileId);

            // Revoke ALL permission records for this file
            permDAO.revokeAllPermissionsForFile(fileId);

            // Delete from Firebase Storage (async — don't fail if it errors)
            storageService.deleteFromFirebase(fileMeta.getStoragePath());

            // Delete local disk copy if it exists
            if (fileMeta.getFilePath() != null && !fileMeta.getFilePath().isBlank())
                new File(fileMeta.getFilePath()).delete();

            // Log
            ActivityLog log = new ActivityLog(userId, userName, "DELETE",
                "Deleted file: " + fileMeta.getFileName());
            log.setFileId(fileId);
            log.setFileName(fileMeta.getFileName());
            logDAO.log(log);

            return ResponseEntity.ok(Map.of("success", true, "fileName", fileMeta.getFileName()));

        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", "Delete failed: " + e.getMessage()));
        }
    }

    // ── Activity Feed ──────────────────────────────────────────
    @GetMapping("/activity")
    public ResponseEntity<?> activity(HttpServletRequest request) {
        HttpSession session = request.getSession(false);
        if (session == null)
            return ResponseEntity.status(401).body(Map.of("error", "Not authenticated"));
        String userId = (String) session.getAttribute("userId");
        try {
            return ResponseEntity.ok(Map.of("logs", logDAO.getLogsByUser(userId)));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
        }
    }

    // ── File Metadata (permission checked) ─────────────────────
    @GetMapping("/metadata")
    public ResponseEntity<?> getMetadata(@RequestParam String fileId, HttpServletRequest request) {
        HttpSession session = request.getSession(false);
        if (session == null)
            return ResponseEntity.status(401).body(Map.of("error", "Not authenticated"));

        String userId   = (String) session.getAttribute("userId");
        String userRole = (String) session.getAttribute("userRole");

        try {
            FileMetadata fileMeta = fileDAO.getFileById(fileId);
            if (fileMeta == null || fileMeta.isDeleted())
                return ResponseEntity.status(404).body(Map.of("error", "File not found"));

            boolean isOwner = userId != null && userId.equals(fileMeta.getOwnerId());
            boolean isAdmin = "admin".equals(userRole);
            boolean hasPerm = false;

            if (isOwner || isAdmin) {
                hasPerm = true;
            } else {
                hasPerm = permDAO.checkPermission(fileId, userId, userRole)
                       || permDAO.checkDownloadPermission(fileId, userId, userRole);
            }

            if (!hasPerm)
                return ResponseEntity.status(403).body(Map.of("error", "Access denied"));

            // Get permission details to see if they can download
            boolean canDownload = isOwner || isAdmin || permDAO.checkDownloadPermission(fileId, userId, userRole);

            Map<String, Object> result = new HashMap<>();
            result.put("fileId", fileMeta.getFileId());
            result.put("fileName", fileMeta.getFileName());
            result.put("fileType", fileMeta.getFileType());
            result.put("fileSize", fileMeta.getFileSize());
            result.put("ownerName", fileMeta.getOwnerName());
            result.put("uploadedAt", fileMeta.getUploadedAt());
            result.put("canDownload", canDownload);

            return ResponseEntity.ok(result);
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
        }
    }

    // ── Log Protection Event ──────────────────────────────────
    @PostMapping("/log-event")
    public ResponseEntity<?> logEvent(@RequestParam String fileId,
                                      @RequestParam String eventType,
                                      HttpServletRequest request) {
        HttpSession session = request.getSession(false);
        if (session == null)
            return ResponseEntity.status(401).body(Map.of("error", "Not authenticated"));

        String userId   = (String) session.getAttribute("userId");
        String userName = (String) session.getAttribute("userName");

        try {
            FileMetadata fileMeta = fileDAO.getFileById(fileId);
            String fileName = fileMeta != null ? fileMeta.getFileName() : "Unknown";

            String action = eventType.toUpperCase();
            String details = "";
            if ("SCREENSHOT".equals(action)) {
                details = "Screenshot attempt detected on file: " + fileName;
            } else if ("TAB_BLUR".equals(action)) {
                details = "Tab switch/blur event detected while viewing: " + fileName;
            } else if ("VIEW".equals(action)) {
                details = "Viewed protected file: " + fileName;
            } else {
                details = action + " event on file: " + fileName;
            }

            ActivityLog log = new ActivityLog(userId, userName, action, details);
            log.setFileId(fileId);
            log.setFileName(fileName);
            logDAO.log(log);

            return ResponseEntity.ok(Map.of("success", true));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
        }
    }
}
