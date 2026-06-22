package com.ciphershare.models;

import java.util.Date;

public class User {
    private String uid;
    private String name;
    private String email;
    private String role;          // admin, manager, employee
    private String requestedRole; // role requested at registration (for approval flow)
    private String department;
    private Date createdAt;
    private boolean active;
    private String phoneNumber;
    private String bio;
    private String profilePictureUrl;
    private String coverPhotoUrl;

    public User() {}

    public User(String uid, String name, String email, String role, String department) {
        this.uid = uid;
        this.name = name;
        this.email = email;
        this.role = role;
        this.department = department;
        this.active = true;
    }

    public String getUid() { return uid; }
    public void setUid(String uid) { this.uid = uid; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    public String getRole() { return role; }
    public void setRole(String role) { this.role = role; }
    public String getRequestedRole() { return requestedRole; }
    public void setRequestedRole(String requestedRole) { this.requestedRole = requestedRole; }
    public String getDepartment() { return department; }
    public void setDepartment(String department) { this.department = department; }
    public Date getCreatedAt() { return createdAt; }
    public void setCreatedAt(Date createdAt) { this.createdAt = createdAt; }
    public boolean isActive() { return active; }
    public void setActive(boolean active) { this.active = active; }

    public String getPhoneNumber() { return phoneNumber; }
    public void setPhoneNumber(String phoneNumber) { this.phoneNumber = phoneNumber; }
    public String getBio() { return bio; }
    public void setBio(String bio) { this.bio = bio; }
    public String getProfilePictureUrl() { return profilePictureUrl; }
    public void setProfilePictureUrl(String profilePictureUrl) { this.profilePictureUrl = profilePictureUrl; }
    public String getCoverPhotoUrl() { return coverPhotoUrl; }
    public void setCoverPhotoUrl(String coverPhotoUrl) { this.coverPhotoUrl = coverPhotoUrl; }
}
