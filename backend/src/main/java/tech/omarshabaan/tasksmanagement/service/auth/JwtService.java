package tech.omarshabaan.tasksmanagement.service.auth;

import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.oauth2.jwt.JwtClaimsSet;
import org.springframework.security.oauth2.jwt.JwtEncoder;
import org.springframework.security.oauth2.jwt.JwtEncoderParameters;
import org.springframework.stereotype.Service;
import tech.omarshabaan.tasksmanagement.config.JwtProperties;
import tech.omarshabaan.tasksmanagement.security.CustomUserDetails;

import java.time.Instant;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * Service for generating JWT access tokens with claims built from authentication
 * principals.
 */
@Service
public class JwtService {

	private final JwtEncoder jwtEncoder;

	private final JwtProperties jwtProperties;

	public JwtService(JwtEncoder jwtEncoder, JwtProperties jwtProperties) {
		this.jwtEncoder = jwtEncoder;
		this.jwtProperties = jwtProperties;
	}

	/**
	 * Generate access token from CustomUserDetails (typically after successful
	 * authentication). JWT subject is User UUID (main domain identifier).
	 * user_security_uuid claim is used for UserSecurity lookups (not email, as email can
	 * change).
	 * @param userDetails the authenticated user details
	 * @return JWT access token
	 */
	public String generateAccessToken(CustomUserDetails userDetails) {
		Instant now = Instant.now();
		Instant expiry = now.plusMillis(jwtProperties.accessTokenExpiration());

		List<String> authorities = userDetails.getAuthorities()
			.stream()
			.map(GrantedAuthority::getAuthority)
			.collect(Collectors.toList());

		JwtClaimsSet claims = JwtClaimsSet.builder()
			.issuer(jwtProperties.issuer())
			.issuedAt(now)
			.expiresAt(expiry)
			.subject(userDetails.getUserUuid().toString())
			.claim("user_security_uuid", userDetails.getUserSecurityUuid().toString())
			.claim("email", userDetails.getEmail())
			.claim("authorities", authorities)
			.build();

		return jwtEncoder.encode(JwtEncoderParameters.from(claims)).getTokenValue();
	}

	/**
	 * Generate access token from raw claims (typically during token refresh). JWT subject
	 * is User UUID (main domain identifier). user_security_uuid claim is used for
	 * UserSecurity lookups (not email, as email can change).
	 * @param userUuid the domain User UUID (subject)
	 * @param userSecurityUuid the UserSecurity UUID (for lookup)
	 * @param email the user's email
	 * @param authorities the list of authorities/roles
	 * @return JWT access token
	 */
	public String generateAccessToken(UUID userUuid, UUID userSecurityUuid, String email, List<String> authorities) {
		Instant now = Instant.now();
		Instant expiry = now.plusMillis(jwtProperties.accessTokenExpiration());

		JwtClaimsSet claims = JwtClaimsSet.builder()
			.issuer(jwtProperties.issuer())
			.issuedAt(now)
			.expiresAt(expiry)
			.subject(userUuid.toString())
			.claim("user_security_uuid", userSecurityUuid.toString())
			.claim("email", email)
			.claim("authorities", authorities)
			.build();

		return jwtEncoder.encode(JwtEncoderParameters.from(claims)).getTokenValue();
	}

}
