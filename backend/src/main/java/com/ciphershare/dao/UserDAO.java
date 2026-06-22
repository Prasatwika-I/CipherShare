package com.ciphershare.dao;

import com.ciphershare.models.User;
import com.google.cloud.firestore.*;
import com.google.firebase.cloud.FirestoreClient;

import java.util.*;
import java.util.concurrent.ExecutionException;

public class UserDAO {

    private Firestore getDb() {
        return FirestoreClient.getFirestore();
    }

    public void createUser(User user) throws ExecutionException, InterruptedException {
        Map<String, Object> data = new HashMap<>();
        data.put("uid",           user.getUid());
        data.put("name",          user.getName());
        data.put("email",         user.getEmail());
        data.put("role",          user.getRole() != null ? user.getRole() : "employee");
        data.put("requestedRole", user.getRequestedRole() != null ? user.getRequestedRole() : "employee");
        data.put("department",    user.getDepartment() != null ? user.getDepartment() : "General");
        data.put("createdAt",     new Date());
        data.put("isActive",      user.isActive());
        data.put("phoneNumber",   "");
        data.put("bio",           "");
        data.put("profilePictureUrl", "");
        data.put("coverPhotoUrl",     "");
        getDb().collection("users").document(user.getUid()).set(data).get();
    }

    public User getUserById(String uid) throws ExecutionException, InterruptedException {
        DocumentSnapshot doc = getDb().collection("users").document(uid).get().get();
        if (doc.exists()) {
            return docToUser(doc);
        }
        return null;
    }

    public List<User> getAllUsers() throws ExecutionException, InterruptedException {
        List<User> users = new ArrayList<>();
        QuerySnapshot snapshot = getDb().collection("users").orderBy("name").get().get();
        for (DocumentSnapshot doc : snapshot.getDocuments()) {
            users.add(docToUser(doc));
        }
        return users;
    }

    public List<User> getUsersByRole(String role) throws ExecutionException, InterruptedException {
        List<User> users = new ArrayList<>();
        QuerySnapshot snapshot = getDb().collection("users")
            .whereEqualTo("role", role).get().get();
        for (DocumentSnapshot doc : snapshot.getDocuments()) {
            users.add(docToUser(doc));
        }
        return users;
    }

    public List<User> getUsersByDepartment(String department) throws ExecutionException, InterruptedException {
        List<User> users = new ArrayList<>();
        QuerySnapshot snapshot = getDb().collection("users")
            .whereEqualTo("department", department).get().get();
        for (DocumentSnapshot doc : snapshot.getDocuments()) {
            users.add(docToUser(doc));
        }
        return users;
    }

    public void updateRole(String uid, String role) throws ExecutionException, InterruptedException {
        getDb().collection("users").document(uid).update("role", role).get();
    }

    public void updateProfile(String uid, String name, String department, String phoneNumber, String bio, String profilePictureUrl, String coverPhotoUrl) throws ExecutionException, InterruptedException {
        Map<String, Object> updates = new HashMap<>();
        updates.put("name", name);
        updates.put("department", department);
        updates.put("phoneNumber", phoneNumber != null ? phoneNumber : "");
        updates.put("bio", bio != null ? bio : "");
        updates.put("profilePictureUrl", profilePictureUrl != null ? profilePictureUrl : "");
        updates.put("coverPhotoUrl", coverPhotoUrl != null ? coverPhotoUrl : "");
        getDb().collection("users").document(uid).update(updates).get();
    }

    public void deactivateUser(String uid) throws ExecutionException, InterruptedException {
        getDb().collection("users").document(uid).update("isActive", false).get();
    }

    /** Admin approves a pending manager registration — activates account and sets final role. */
    public void approveUser(String uid, String approvedRole) throws ExecutionException, InterruptedException {
        Map<String, Object> updates = new HashMap<>();
        updates.put("isActive", true);
        updates.put("role",     approvedRole);
        getDb().collection("users").document(uid).update(updates).get();
    }

    /** Returns all users whose isActive=false (pending admin approval). */
    public List<User> getPendingUsers() throws ExecutionException, InterruptedException {
        List<User> users = new ArrayList<>();
        QuerySnapshot snapshot = getDb().collection("users")
            .whereEqualTo("isActive", false).get().get();
        for (DocumentSnapshot doc : snapshot.getDocuments()) {
            users.add(docToUser(doc));
        }
        return users;
    }

    /** Returns all active (approved) users — for share dropdowns. */
    public List<User> getAllActiveUsers() throws ExecutionException, InterruptedException {
        List<User> users = new ArrayList<>();
        QuerySnapshot snapshot = getDb().collection("users")
            .whereEqualTo("isActive", true)
            .get().get();
        for (DocumentSnapshot doc : snapshot.getDocuments()) {
            users.add(docToUser(doc));
        }
        // Sort in memory to avoid requiring a composite Firestore index
        users.sort((u1, u2) -> {
            String n1 = u1.getName() != null ? u1.getName().toLowerCase() : "";
            String n2 = u2.getName() != null ? u2.getName().toLowerCase() : "";
            return n1.compareTo(n2);
        });
        return users;
    }

    private User docToUser(DocumentSnapshot doc) {
        User user = new User();
        user.setUid(doc.getId());
        user.setName(doc.getString("name"));
        user.setEmail(doc.getString("email"));
        user.setRole(doc.getString("role"));
        user.setRequestedRole(doc.getString("requestedRole"));
        user.setDepartment(doc.getString("department"));
        user.setActive(Boolean.TRUE.equals(doc.getBoolean("isActive")));
        user.setPhoneNumber(doc.getString("phoneNumber"));
        user.setBio(doc.getString("bio"));
        user.setProfilePictureUrl(doc.getString("profilePictureUrl"));
        user.setCoverPhotoUrl(doc.getString("coverPhotoUrl"));
        user.setCreatedAt(doc.getDate("createdAt"));
        return user;
    }
}
