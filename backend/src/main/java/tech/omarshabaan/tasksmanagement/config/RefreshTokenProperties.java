package tech.omarshabaan.tasksmanagement.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "app.security.refresh-token")
public record RefreshTokenProperties(
		long expiration,
		Token token,
		Cookie cookie) {

	public record Token(
			int length,
			String hashAlgorithm) {
	}

	public record Cookie(
			String name,
			boolean secure,
			String sameSite,
			boolean httpOnly,
			int maxAge) {
	}

}