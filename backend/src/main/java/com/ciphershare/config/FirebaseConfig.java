package com.ciphershare.config;

import com.google.auth.oauth2.GoogleCredentials;
import com.google.firebase.FirebaseApp;
import com.google.firebase.FirebaseOptions;
import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.io.ClassPathResource;

import java.io.InputStream;

/**
 * Initializes Firebase Admin SDK (Firestore + Storage) on Spring Boot startup.
 * Requires serviceAccountKey.json in src/main/resources/ and
 * firebase.storage.bucket set in application.properties.
 */
@Configuration
public class FirebaseConfig {

    @Value("${firebase.storage.bucket:}")
    private String storageBucket;

    @PostConstruct
    public void initFirebase() {
        try {
            if (FirebaseApp.getApps().isEmpty()) {
                InputStream serviceAccount =
                    new ClassPathResource("serviceAccountKey.json").getInputStream();

                FirebaseOptions.Builder builder = FirebaseOptions.builder()
                    .setCredentials(GoogleCredentials.fromStream(serviceAccount));

                // Set storage bucket if configured
                if (storageBucket != null && !storageBucket.isBlank()) {
                    builder.setStorageBucket(storageBucket);
                }

                FirebaseApp.initializeApp(builder.build());
                System.out.println("[CipherShare] ✅ Firebase Admin SDK initialized."
                    + (storageBucket != null && !storageBucket.isBlank()
                        ? " Storage bucket: " + storageBucket : " (No storage bucket configured)"));
            }
        } catch (Exception e) {
            System.err.println("[CipherShare] ❌ Firebase init failed: " + e.getMessage());
            throw new RuntimeException("Firebase initialization failed", e);
        }
    }
}
