package tech.omarshabaan.tasksmanagement.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "app.security.jwt")
public record JwtProperties(String issuer, long accessTokenExpiration) {
}
