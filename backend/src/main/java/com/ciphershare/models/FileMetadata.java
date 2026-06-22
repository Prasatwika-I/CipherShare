package com.ciphershare.models;

import java.util.Date;

public class FileMetadata {
    private String fileId;
    private String fileName;
    private String filePath;       // local temp path (legacy / fallback)
    private String downloadUrl;    // Firebase Storage signed URL
    private String storagePath;    // gs:// path in Firebase Storage
    private long   fileSize;       // bytes
    private String fileType;       // MIME type
    private String ownerId;
    private String ownerName;
    private Date   uploadedAt;     // renamed from uploadDate for consistency
    private boolean deleted;
    private String status;         // "active" | "shared" | "deleted"

    public FileMetadata() {}

    // ── Getters & Setters ─────────────────────────────────────
    public String getFileId()        { return fileId; }
    public void   setFileId(String v)        { this.fileId = v; }

    public String getFileName()      { return fileName; }
    public void   setFileName(String v)      { this.fileName = v; }

    public String getFilePath()      { return filePath; }
    public void   setFilePath(String v)      { this.filePath = v; }

    public String getDownloadUrl()   { return downloadUrl; }
    public void   setDownloadUrl(String v)   { this.downloadUrl = v; }

    public String getStoragePath()   { return storagePath; }
    public void   setStoragePath(String v)   { this.storagePath = v; }

    public long   getFileSize()      { return fileSize; }
    public void   setFileSize(long v)        { this.fileSize = v; }

    public String getFileType()      { return fileType; }
    public void   setFileType(String v)      { this.fileType = v; }

    public String getOwnerId()       { return ownerId; }
    public void   setOwnerId(String v)       { this.ownerId = v; }

    public String getOwnerName()     { return ownerName; }
    public void   setOwnerName(String v)     { this.ownerName = v; }

    public Date   getUploadedAt()    { return uploadedAt; }
    public void   setUploadedAt(Date v)      { this.uploadedAt = v; }

    // Legacy alias so existing code calling getUploadDate() still works
    public Date   getUploadDate()    { return uploadedAt; }
    public void   setUploadDate(Date v)      { this.uploadedAt = v; }

    public boolean isDeleted()       { return deleted; }
    public void    setDeleted(boolean v)     { this.deleted = v; }

    public String getStatus()        { return status != null ? status : "active"; }
    public void   setStatus(String v)        { this.status = v; }

    public String getFileSizeFormatted() {
        if (fileSize < 1024)          return fileSize + " B";
        else if (fileSize < 1048576)  return String.format("%.1f KB", fileSize / 1024.0);
        else                          return String.format("%.1f MB", fileSize / (1024.0 * 1024));
    }
}
