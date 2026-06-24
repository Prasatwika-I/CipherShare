package com.ciphershare.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import org.springframework.web.filter.CorsFilter;

import java.util.List;

/**
 * Allows React (localhost:5173) to call Spring Boot (localhost:8080)
 * with session cookies (allowCredentials = true).
 */
@Configuration
public class CorsConfig {

    @Bean
    public org.springframework.boot.web.servlet.FilterRegistrationBean<CorsFilter> corsFilter() {
        CorsConfiguration config = new CorsConfiguration();
        // Use patterns to allow any frontend deployment URL (Vercel, Netlify, etc.) while keeping credentials enabled
        config.setAllowedOriginPatterns(List.of("*"));
        config.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "OPTIONS"));
        config.setAllowedHeaders(List.of("*"));
        config.setAllowCredentials(true);
        config.setMaxAge(3600L);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        // Register for all paths so that Spring's internal /error endpoint also gets CORS headers!
        source.registerCorsConfiguration("/**", config);

        org.springframework.boot.web.servlet.FilterRegistrationBean<CorsFilter> bean = 
                new org.springframework.boot.web.servlet.FilterRegistrationBean<>(new CorsFilter(source));
        bean.setOrder(org.springframework.core.Ordered.HIGHEST_PRECEDENCE);
        return bean;
    }
}
