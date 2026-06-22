package com.ciphershare.dao;

import com.ciphershare.models.ActivityLog;
import com.google.cloud.firestore.*;
import com.google.firebase.cloud.FirestoreClient;

import java.util.*;
import java.util.concurrent.ExecutionException;

public class LogDAO {

    private Firestore getDb() {
        return FirestoreClient.getFirestore();
    }

    public void log(ActivityLog log) {
        try {
            Map<String, Object> data = new HashMap<>();
            data.put("userId", log.getUserId());
            data.put("userName", log.getUserName());
            data.put("action", log.getAction());
            data.put("fileId", log.getFileId());
            data.put("fileName", log.getFileName());
            data.put("timestamp", new Date());
            data.put("details", log.getDetails());
            getDb().collection("activityLogs").add(data);
        } catch (Exception e) {
            System.err.println("[CipherShare] Failed to write activity log: " + e.getMessage());
        }
    }

    public List<ActivityLog> getAllLogs() throws ExecutionException, InterruptedException {
        List<ActivityLog> logs = new ArrayList<>();
        QuerySnapshot snapshot = getDb().collection("activityLogs")
            .orderBy("timestamp", Query.Direction.DESCENDING)
            .limit(200)
            .get().get();
        for (DocumentSnapshot doc : snapshot.getDocuments()) {
            logs.add(docToLog(doc));
        }
        return logs;
    }

    public List<ActivityLog> getLogsByUser(String userId) throws ExecutionException, InterruptedException {
        List<ActivityLog> logs = new ArrayList<>();
        QuerySnapshot snapshot = getDb().collection("activityLogs")
            .whereEqualTo("userId", userId)
            .get().get();
        for (DocumentSnapshot doc : snapshot.getDocuments()) {
            logs.add(docToLog(doc));
        }
        // Sort descending by timestamp in Java to avoid composite index requirements
        logs.sort((a, b) -> {
            Date ta = a.getTimestamp();
            Date tb = b.getTimestamp();
            if (ta == null && tb == null) return 0;
            if (ta == null) return 1;
            if (tb == null) return -1;
            return tb.compareTo(ta);
        });
        if (logs.size() > 50) {
            return logs.subList(0, 50);
        }
        return logs;
    }

    private ActivityLog docToLog(DocumentSnapshot doc) {
        ActivityLog log = new ActivityLog();
        log.setLogId(doc.getId());
        log.setUserId(doc.getString("userId"));
        log.setUserName(doc.getString("userName"));
        log.setAction(doc.getString("action"));
        log.setFileId(doc.getString("fileId"));
        log.setFileName(doc.getString("fileName"));
        log.setDetails(doc.getString("details"));
        com.google.cloud.Timestamp ts = doc.getTimestamp("timestamp");
        if (ts != null) log.setTimestamp(ts.toDate());
        return log;
    }
}
