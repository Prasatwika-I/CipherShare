package com.ciphershare.dao;

import com.ciphershare.models.FilePermission;
import com.google.cloud.firestore.*;
import com.google.firebase.cloud.FirestoreClient;

import java.util.*;
import java.util.concurrent.ExecutionException;

public class PermissionDAO {

    private Firestore getDb() {
        return FirestoreClient.getFirestore();
    }

    public void grantPermission(FilePermission permission) throws ExecutionException, InterruptedException {
        // Check if permission already exists
        QuerySnapshot existing = getDb().collection("permissions")
            .whereEqualTo("fileId", permission.getFileId())
            .whereEqualTo("sharedWithId", permission.getSharedWithId())
            .get().get();
        
        Map<String, Object> data = new HashMap<>();
        data.put("fileId", permission.getFileId());
        data.put("sharedWithId", permission.getSharedWithId());
        data.put("sharedWithType", permission.getSharedWithType());
        data.put("sharedWithName", permission.getSharedWithName());
        data.put("canView", permission.isCanView());
        data.put("canDownload", permission.isCanDownload());
        data.put("sharedBy", permission.getSharedBy());
        data.put("sharedByName", permission.getSharedByName());
        data.put("sharedAt", new Date());

        // Exact requested fields to store sharing information in Firestore
        data.put("userId",      permission.getSharedWithId());          // recipient UID
        data.put("sharedTo",    permission.getSharedWithId());
        data.put("permission",  permission.isCanDownload() ? "Download" : "View");
        data.put("sharedDate",  new Date());


        if (!existing.isEmpty()) {
            // Update existing
            existing.getDocuments().get(0).getReference().set(data).get();
        } else {
            // Create new
            getDb().collection("permissions").add(data).get();
        }
    }

    public List<FilePermission> getPermissionsForFile(String fileId) throws ExecutionException, InterruptedException {
        List<FilePermission> perms = new ArrayList<>();
        QuerySnapshot snapshot = getDb().collection("permissions")
            .whereEqualTo("fileId", fileId).get().get();
        for (DocumentSnapshot doc : snapshot.getDocuments()) {
            perms.add(docToPermission(doc));
        }
        return perms;
    }

    public boolean checkPermission(String fileId, String userId, String userRole) throws ExecutionException, InterruptedException {
        // Check direct user permission (view or download)
        QuerySnapshot userPerm = getDb().collection("permissions")
            .whereEqualTo("fileId", fileId)
            .whereEqualTo("sharedWithId", userId)
            .whereEqualTo("canView", true)
            .get().get();
        if (!userPerm.isEmpty()) return true;

        // Check role-based permission (view or download)
        QuerySnapshot rolePerm = getDb().collection("permissions")
            .whereEqualTo("fileId", fileId)
            .whereEqualTo("sharedWithId", userRole)
            .whereEqualTo("canView", true)
            .get().get();
        return !rolePerm.isEmpty();
    }

    public boolean checkDownloadPermission(String fileId, String userId, String userRole) throws ExecutionException, InterruptedException {
        // Check direct user download permission
        QuerySnapshot userPerm = getDb().collection("permissions")
            .whereEqualTo("fileId", fileId)
            .whereEqualTo("sharedWithId", userId)
            .whereEqualTo("canDownload", true)
            .get().get();
        if (!userPerm.isEmpty()) return true;

        // Check role-based download permission
        QuerySnapshot rolePerm = getDb().collection("permissions")
            .whereEqualTo("fileId", fileId)
            .whereEqualTo("sharedWithId", userRole)
            .whereEqualTo("canDownload", true)
            .get().get();
        return !rolePerm.isEmpty();
    }

    public List<FilePermission> getFilesSharedWithUser(String userId, String userRole) throws ExecutionException, InterruptedException {
        List<FilePermission> perms = new ArrayList<>();
        
        // Files shared directly with user
        QuerySnapshot userPerms = getDb().collection("permissions")
            .whereEqualTo("sharedWithId", userId).get().get();
        for (DocumentSnapshot doc : userPerms.getDocuments()) {
            perms.add(docToPermission(doc));
        }
        
        // Files shared with user's role
        QuerySnapshot rolePerms = getDb().collection("permissions")
            .whereEqualTo("sharedWithId", userRole).get().get();
        for (DocumentSnapshot doc : rolePerms.getDocuments()) {
            // Avoid duplicates
            String fileId = doc.getString("fileId");
            boolean alreadyAdded = perms.stream().anyMatch(p -> p.getFileId().equals(fileId));
            if (!alreadyAdded) {
                perms.add(docToPermission(doc));
            }
        }
        return perms;
    }

    /**
     * Update canDownload flag on an existing permission document.
     */
    public void updatePermission(String permissionId, boolean canDownload) throws ExecutionException, InterruptedException {
        Map<String, Object> updates = new HashMap<>();
        updates.put("canDownload", canDownload);
        updates.put("permission", canDownload ? "Download" : "View");
        getDb().collection("permissions").document(permissionId).update(updates).get();
    }

    /**
     * Revoke (delete) a permission by its Firestore document ID.
     */
    public void revokePermission(String permissionId) throws ExecutionException, InterruptedException {
        getDb().collection("permissions").document(permissionId).delete().get();
    }

    /**
     * Revoke all permissions for a given fileId (used when file is deleted).
     */
    public void revokeAllPermissionsForFile(String fileId) throws ExecutionException, InterruptedException {
        QuerySnapshot snapshot = getDb().collection("permissions")
            .whereEqualTo("fileId", fileId).get().get();
        for (DocumentSnapshot doc : snapshot.getDocuments()) {
            doc.getReference().delete().get();
        }
    }

    private FilePermission docToPermission(DocumentSnapshot doc) {
        FilePermission perm = new FilePermission();
        perm.setPermissionId(doc.getId());
        perm.setFileId(doc.getString("fileId"));
        perm.setSharedWithId(doc.getString("sharedWithId"));
        perm.setSharedWithType(doc.getString("sharedWithType"));
        perm.setSharedWithName(doc.getString("sharedWithName"));
        perm.setCanView(Boolean.TRUE.equals(doc.getBoolean("canView")));
        perm.setCanDownload(Boolean.TRUE.equals(doc.getBoolean("canDownload")));
        perm.setSharedBy(doc.getString("sharedBy"));
        perm.setSharedByName(doc.getString("sharedByName"));
        com.google.cloud.Timestamp ts = doc.getTimestamp("sharedAt");
        if (ts != null) perm.setSharedAt(ts.toDate());
        return perm;
    }
}
