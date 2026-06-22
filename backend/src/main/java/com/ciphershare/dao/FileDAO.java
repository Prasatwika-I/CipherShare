package com.ciphershare.dao;

import com.ciphershare.models.FileMetadata;
import com.google.cloud.firestore.*;
import com.google.firebase.cloud.FirestoreClient;

import java.util.*;
import java.util.concurrent.ExecutionException;

public class FileDAO {

    private Firestore getDb() {
        return FirestoreClient.getFirestore();
    }

    // ── Save / Create ─────────────────────────────────────────
    public void saveFile(FileMetadata file) throws ExecutionException, InterruptedException {
        Date now = new Date();
        Map<String, Object> data = new HashMap<>();
        data.put("fileId",       file.getFileId());
        data.put("fileName",     file.getFileName());
        data.put("filePath",     file.getFilePath() != null ? file.getFilePath() : "");
        data.put("downloadUrl",  file.getDownloadUrl() != null ? file.getDownloadUrl() : "");
        data.put("storagePath",  file.getStoragePath() != null ? file.getStoragePath() : "");
        data.put("fileSize",     file.getFileSize());
        data.put("fileType",     file.getFileType());
        data.put("ownerId",      file.getOwnerId());
        data.put("ownerName",    file.getOwnerName());
        // Save BOTH field names so existing queries and indexes are not broken
        data.put("uploadDate",   now);   // ← original field name (keeps old Firestore indexes working)
        data.put("uploadedAt",   now);   // ← new field name used by Java model
        data.put("status",       "active");
        data.put("isDeleted",    false);
        getDb().collection("files").document(file.getFileId()).set(data).get();
    }

    // ── Read one ──────────────────────────────────────────────
    public FileMetadata getFileById(String fileId) throws ExecutionException, InterruptedException {
        DocumentSnapshot doc = getDb().collection("files").document(fileId).get().get();
        return doc.exists() ? docToFile(doc) : null;
    }

    // ── Read all (admin) ──────────────────────────────────────
    // Orders by "uploadDate" — the field that exists in ALL documents (old + new)
    public List<FileMetadata> getAllFiles() throws ExecutionException, InterruptedException {
        List<FileMetadata> files = new ArrayList<>();
        QuerySnapshot snapshot = getDb().collection("files")
            .whereEqualTo("isDeleted", false)
            .get().get();
        for (DocumentSnapshot doc : snapshot.getDocuments()) {
            files.add(docToFile(doc));
        }
        // Sort in memory to avoid requiring a composite Firestore index
        files.sort((a, b) -> {
            Date da = a.getUploadedAt();
            Date db = b.getUploadedAt();
            if (da == null && db == null) return 0;
            if (da == null) return 1;
            if (db == null) return -1;
            return db.compareTo(da); // descending
        });
        return files;
    }

    // ── Read by owner ─────────────────────────────────────────
    // Orders by "uploadDate" — the field that exists in ALL documents (old + new)
    public List<FileMetadata> getFilesByOwner(String ownerId) throws ExecutionException, InterruptedException {
        List<FileMetadata> files = new ArrayList<>();

        // Step 1: filter by owner + not deleted (no orderBy to avoid composite index requirement)
        QuerySnapshot snapshot = getDb().collection("files")
            .whereEqualTo("ownerId",   ownerId)
            .whereEqualTo("isDeleted", false)
            .get().get();

        // Step 2: map + sort in Java (avoids Firestore composite index issues)
        for (DocumentSnapshot doc : snapshot.getDocuments()) {
            files.add(docToFile(doc));
        }
        files.sort((a, b) -> {
            Date da = a.getUploadedAt();
            Date db2 = b.getUploadedAt();
            if (da == null && db2 == null) return 0;
            if (da == null) return 1;
            if (db2 == null) return -1;
            return db2.compareTo(da); // descending
        });

        return files;
    }

    // ── Soft delete ───────────────────────────────────────────
    public void softDelete(String fileId) throws ExecutionException, InterruptedException {
        Map<String, Object> updates = new HashMap<>();
        updates.put("isDeleted", true);
        updates.put("status",    "deleted");
        getDb().collection("files").document(fileId).update(updates).get();
    }

    // ── Update status ─────────────────────────────────────────
    public void updateStatus(String fileId, String status) throws ExecutionException, InterruptedException {
        getDb().collection("files").document(fileId).update("status", status).get();
    }

    // ── Update download URL (after Firebase Storage upload) ───
    public void updateDownloadUrl(String fileId, String downloadUrl, String storagePath)
            throws ExecutionException, InterruptedException {
        Map<String, Object> updates = new HashMap<>();
        updates.put("downloadUrl", downloadUrl);
        updates.put("storagePath", storagePath);
        getDb().collection("files").document(fileId).update(updates).get();
    }

    // ── Mapper ────────────────────────────────────────────────
    private FileMetadata docToFile(DocumentSnapshot doc) {
        FileMetadata file = new FileMetadata();
        file.setFileId(doc.getId());
        file.setFileName(doc.getString("fileName"));
        file.setFilePath(doc.getString("filePath"));
        file.setDownloadUrl(doc.getString("downloadUrl"));
        file.setStoragePath(doc.getString("storagePath"));
        Long size = doc.getLong("fileSize");
        file.setFileSize(size != null ? size : 0L);
        file.setFileType(doc.getString("fileType"));
        file.setOwnerId(doc.getString("ownerId"));
        file.setOwnerName(doc.getString("ownerName"));
        file.setStatus(doc.getString("status") != null ? doc.getString("status") : "active");
        Boolean del = doc.getBoolean("isDeleted");
        file.setDeleted(Boolean.TRUE.equals(del));

        // Read "uploadDate" first (field present in ALL documents including old ones),
        // fall back to "uploadedAt" for any newer-format documents
        com.google.cloud.Timestamp ts = doc.getTimestamp("uploadDate");
        if (ts == null) ts = doc.getTimestamp("uploadedAt");
        if (ts != null) file.setUploadedAt(ts.toDate());

        return file;
    }
}
