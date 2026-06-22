package com.ciphershare.config;

import com.google.cloud.storage.*;
import com.google.firebase.cloud.StorageClient;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.UUID;
import java.util.concurrent.TimeUnit;

/**
 * Uploads files to Firebase Storage and returns a public download URL.
 *
 * If firebase.storage.bucket is not configured, falls back to local-only storage
 * (the Spring Boot disk path) and returns an empty downloadUrl — the /api/file/download
 * endpoint will still serve the file from disk.
 */
@Service
public class StorageService {

    @Value("${firebase.storage.bucket:}")
    private String storageBucket;

    /**
     * Upload a multipart file to Firebase Storage.
     *
     * @return StorageResult containing storagePath (gs:// key) and public downloadUrl
     */
    public StorageResult uploadToFirebase(MultipartFile file, String fileId, String userId)
            throws IOException {

        if (storageBucket == null || storageBucket.isBlank()) {
            // Storage not configured — return empty result, caller will use disk path
            System.out.println("[StorageService] No Firebase Storage bucket configured. Skipping cloud upload.");
            return new StorageResult("", "");
        }

        try {
            Bucket bucket = StorageClient.getInstance().bucket(storageBucket);

            String originalName = file.getOriginalFilename() != null ? file.getOriginalFilename() : "file";
            String ext = originalName.contains(".") ? originalName.substring(originalName.lastIndexOf(".")) : "";
            String storagePath = "files/" + userId + "/" + fileId + ext;

            // Upload bytes
            Blob blob = bucket.create(storagePath, file.getInputStream(), file.getContentType());

            // Make publicly readable and get a permanent URL
            blob.createAcl(Acl.of(Acl.User.ofAllUsers(), Acl.Role.READER));

            String encodedPath = URLEncoder.encode(storagePath, StandardCharsets.UTF_8);
            String downloadUrl = "https://firebasestorage.googleapis.com/v0/b/"
                + storageBucket + "/o/"
                + encodedPath + "?alt=media";

            System.out.println("[StorageService] ✅ Uploaded to Firebase Storage: " + storagePath);
            return new StorageResult(storagePath, downloadUrl);

        } catch (Exception e) {
            System.err.println("[StorageService] ⚠️  Firebase Storage upload failed: " + e.getMessage()
                + " — file will be stored locally only.");
            return new StorageResult("", "");
        }
    }

    /**
     * Delete a file from Firebase Storage by its storage path.
     */
    public void deleteFromFirebase(String storagePath) {
        if (storagePath == null || storagePath.isBlank() || storageBucket == null || storageBucket.isBlank()) return;
        try {
            Bucket bucket = StorageClient.getInstance().bucket(storageBucket);
            Blob blob = bucket.get(storagePath);
            if (blob != null) {
                blob.delete();
                System.out.println("[StorageService] 🗑️ Deleted from Firebase Storage: " + storagePath);
            }
        } catch (Exception e) {
            System.err.println("[StorageService] ⚠️  Firebase Storage delete failed: " + e.getMessage());
        }
    }

    // ── Inner result record ────────────────────────────────────
    public static class StorageResult {
        public final String storagePath;
        public final String downloadUrl;

        public StorageResult(String storagePath, String downloadUrl) {
            this.storagePath = storagePath;
            this.downloadUrl = downloadUrl;
        }

        public boolean hasUrl() {
            return downloadUrl != null && !downloadUrl.isBlank();
        }
    }
}
