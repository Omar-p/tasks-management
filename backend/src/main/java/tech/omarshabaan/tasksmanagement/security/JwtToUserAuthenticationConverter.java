package tech.omarshabaan.tasksmanagement.security;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.core.convert.converter.Converter;
import org.springframework.security.authentication.AbstractAuthenticationToken;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Component;
import tech.omarshabaan.tasksmanagement.entity.UserSecurity;
import tech.omarshabaan.tasksmanagement.repository.auth.UserSecurityRepository;

import java.util.UUID;

@Component
public class JwtToUserAuthenticationConverter implements Converter<Jwt, AbstractAuthenticationToken> {

	private static final Logger logger = LoggerFactory.getLogger(JwtToUserAuthenticationConverter.class);

	private final UserSecurityRepository userSecurityRepository;

	public JwtToUserAuthenticationConverter(UserSecurityRepository userSecurityRepository) {
		this.userSecurityRepository = userSecurityRepository;
	}

	@Override
	public AbstractAuthenticationToken convert(Jwt jwt) {
		logger.debug("Converting JWT to authentication token. Subject: {}, Email claim: {}",
			jwt.getSubject(), jwt.getClaimAsString("email"));

		UUID userUuid = UUID.fromString(jwt.getSubject());

		UserSecurity userSecurity = userSecurityRepository.findByUuid(userUuid)
			.orElseThrow(() -> {
				logger.error("UserSecurity not found for UUID: {} from JWT subject", userUuid);
				return new RuntimeException("UserSecurity not found for UUID: " + userUuid);
			});

		logger.debug("Found UserSecurity with email: {} for UUID: {}", userSecurity.getEmail(), userUuid);

		CustomUserDetails userDetails = new CustomUserDetails(userSecurity);

		logger.debug("Successfully created authentication token for user: {}", userSecurity.getEmail());

		return new UsernamePasswordAuthenticationToken(userDetails, null, userDetails.getAuthorities());
	}
}