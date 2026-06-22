package com.ciphershare.models;

import java.util.Date;

public class ActivityLog {
    private String logId;
    private String userId;
    private String userName;
    private String action; // LOGIN, LOGOUT, UPLOAD, DOWNLOAD, SHARE, DELETE, REGISTER
    private String fileId;
    private String fileName;
    private Date timestamp;
    private String details;

    public ActivityLog() {}

    public ActivityLog(String userId, String userName, String action, String details) {
        this.userId = userId;
        this.userName = userName;
        this.action = action;
        this.details = details;
        this.timestamp = new Date();
    }

    public String getLogId() { return logId; }
    public void setLogId(String logId) { this.logId = logId; }
    public String getUserId() { return userId; }
    public void setUserId(String userId) { this.userId = userId; }
    public String getUserName() { return userName; }
    public void setUserName(String userName) { this.userName = userName; }
    public String getAction() { return action; }
    public void setAction(String action) { this.action = action; }
    public String getFileId() { return fileId; }
    public void setFileId(String fileId) { this.fileId = fileId; }
    public String getFileName() { return fileName; }
    public void setFileName(String fileName) { this.fileName = fileName; }
    public Date getTimestamp() { return timestamp; }
    public void setTimestamp(Date timestamp) { this.timestamp = timestamp; }
    public String getDetails() { return details; }
    public void setDetails(String details) { this.details = details; }
}
