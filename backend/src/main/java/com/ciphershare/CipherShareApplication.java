package com.ciphershare;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class CipherShareApplication {
    public static void main(String[] args) {
        SpringApplication.run(CipherShareApplication.class, args);
        System.out.println("✅ CipherShare API running at http://localhost:8080");
    }
}
