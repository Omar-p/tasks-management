package tech.omarshabaan.tasksmanagement.service.auth;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.oauth2.jwt.JwtClaimsSet;
import org.springframework.security.oauth2.jwt.JwtEncoder;
import org.springframework.security.oauth2.jwt.JwtEncoderParameters;
import org.springframework.stereotype.Service;
import tech.omarshabaan.tasksmanagement.security.CustomUserDetails;
import tech.omarshabaan.tasksmanagement.entity.UserSecurity;

import java.time.Instant;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class JwtService {

	private final JwtEncoder jwtEncoder;

	@Value("${app.security.jwt.access-token-expiration}")
	private long accessTokenExpiration;

	public JwtService(JwtEncoder jwtEncoder) {
		this.jwtEncoder = jwtEncoder;
	}

	public String generateAccessToken(CustomUserDetails userDetails) {
		Instant now = Instant.now();
		Instant expiry = now.plusMillis(accessTokenExpiration);

		List<String> authorities = userDetails.getAuthorities()
			.stream()
			.map(authority -> authority.getAuthority())
			.collect(Collectors.toList());

		JwtClaimsSet claims = JwtClaimsSet.builder()
			.issuer("tasks-management")
			.issuedAt(now)
			.expiresAt(expiry)
			.subject(userDetails.getUserSecurity().getUuid().toString())
			.claim("email", userDetails.getUsername())
			.claim("authorities", authorities)
			.build();

		return jwtEncoder.encode(JwtEncoderParameters.from(claims)).getTokenValue();
	}

	public String generateAccessToken(UserSecurity userSecurity, List<String> authorities) {
		Instant now = Instant.now();
		Instant expiry = now.plusMillis(accessTokenExpiration);

		JwtClaimsSet claims = JwtClaimsSet.builder()
			.issuer("tasks-management")
			.issuedAt(now)
			.expiresAt(expiry)
			.subject(userSecurity.getUuid().toString())
			.claim("email", userSecurity.getEmail())
			.claim("authorities", authorities)
			.build();

		return jwtEncoder.encode(JwtEncoderParameters.from(claims)).getTokenValue();
	}

}