package com.ciphershare.models;

import java.util.Date;

public class FilePermission {
    private String permissionId;
    private String fileId;
    private String sharedWithId;   // userId, role name, or department
    private String sharedWithType; // "user", "role", "department"
    private String sharedWithName; // display name
    private boolean canView;
    private boolean canDownload;
    private String sharedBy;
    private String sharedByName;
    private Date sharedAt;

    public FilePermission() {}

    public String getPermissionId() { return permissionId; }
    public void setPermissionId(String permissionId) { this.permissionId = permissionId; }
    public String getFileId() { return fileId; }
    public void setFileId(String fileId) { this.fileId = fileId; }
    public String getSharedWithId() { return sharedWithId; }
    public void setSharedWithId(String sharedWithId) { this.sharedWithId = sharedWithId; }
    public String getSharedWithType() { return sharedWithType; }
    public void setSharedWithType(String sharedWithType) { this.sharedWithType = sharedWithType; }
    public String getSharedWithName() { return sharedWithName; }
    public void setSharedWithName(String sharedWithName) { this.sharedWithName = sharedWithName; }
    public boolean isCanView() { return canView; }
    public void setCanView(boolean canView) { this.canView = canView; }
    public boolean isCanDownload() { return canDownload; }
    public void setCanDownload(boolean canDownload) { this.canDownload = canDownload; }
    public String getSharedBy() { return sharedBy; }
    public void setSharedBy(String sharedBy) { this.sharedBy = sharedBy; }
    public String getSharedByName() { return sharedByName; }
    public void setSharedByName(String sharedByName) { this.sharedByName = sharedByName; }
    public Date getSharedAt() { return sharedAt; }
    public void setSharedAt(Date sharedAt) { this.sharedAt = sharedAt; }
}
