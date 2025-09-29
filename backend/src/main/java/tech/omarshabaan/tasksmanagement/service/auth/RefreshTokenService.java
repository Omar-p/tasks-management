package tech.omarshabaan.tasksmanagement.service.auth;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import tech.omarshabaan.tasksmanagement.config.RefreshTokenProperties;
import tech.omarshabaan.tasksmanagement.entity.RefreshToken;
import tech.omarshabaan.tasksmanagement.entity.UserSecurity;
import tech.omarshabaan.tasksmanagement.exception.InvalidRefreshTokenException;
import tech.omarshabaan.tasksmanagement.repository.auth.RefreshTokenRepository;

import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.Instant;
import java.util.Base64;
import java.util.Optional;

@Service
@Transactional
public class RefreshTokenService {

	private final RefreshTokenRepository refreshTokenRepository;

	private final RefreshTokenProperties properties;

	public RefreshTokenService(RefreshTokenRepository refreshTokenRepository, RefreshTokenProperties properties) {
		this.refreshTokenRepository = refreshTokenRepository;
		this.properties = properties;
	}

	public RefreshToken createRefreshToken(UserSecurity user) {
		refreshTokenRepository.revokeAllByUser(user);

		String rawToken = generateSecureToken();
		String hashedToken = hashToken(rawToken);

		RefreshToken refreshToken = new RefreshToken();
		refreshToken.setUser(user);
		refreshToken.setToken(hashedToken);
		refreshToken.setExpiryDate(Instant.now().plusMillis(properties.expiration()));
		refreshToken.setRevoked(false);

		RefreshToken savedToken = refreshTokenRepository.save(refreshToken);
		savedToken.setToken(rawToken);
		return savedToken;
	}

	@Transactional(readOnly = true)
	public Optional<RefreshToken> findByToken(String token) {
		String hashedToken = hashToken(token);
		return refreshTokenRepository.findByToken(hashedToken);
	}

	public RefreshToken verifyExpiration(RefreshToken token) {
		if (token.isExpired() || token.isRevoked()) {
			refreshTokenRepository.delete(token);
			throw new InvalidRefreshTokenException("Refresh token is expired or revoked. Please login again.");
		}
		return token;
	}

	public void revokeToken(RefreshToken token) {
		token.setRevoked(true);
		refreshTokenRepository.save(token);
	}

	public void deleteExpiredTokens() {
		refreshTokenRepository.deleteExpiredTokens(Instant.now());
	}

	private String generateSecureToken() {
		byte[] randomBytes = new byte[properties.token().length()];
		new SecureRandom().nextBytes(randomBytes);
		return Base64.getUrlEncoder().withoutPadding().encodeToString(randomBytes);
	}

	private String hashToken(String token) {
		try {
			MessageDigest digest = MessageDigest.getInstance(properties.token().hashAlgorithm());
			byte[] hash = digest.digest(token.getBytes());
			return Base64.getEncoder().encodeToString(hash);
		}
		catch (NoSuchAlgorithmException e) {
			throw new RuntimeException(properties.token().hashAlgorithm() + " algorithm not available", e);
		}
	}

}