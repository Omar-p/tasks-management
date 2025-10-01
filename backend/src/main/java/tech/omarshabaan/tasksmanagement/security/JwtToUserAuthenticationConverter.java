package tech.omarshabaan.tasksmanagement.security;

import org.springframework.core.convert.converter.Converter;
import org.springframework.security.authentication.AbstractAuthenticationToken;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * Converts JWT to an authentication token with CustomUserDetails as the principal. Looks
 * up UserSecurity by UUID to get current enabled/locked status.
 */
@Component
public class JwtToUserAuthenticationConverter implements Converter<Jwt, AbstractAuthenticationToken> {

	@Override
	public AbstractAuthenticationToken convert(Jwt jwt) {
		UUID userUuid = UUID.fromString(jwt.getSubject());

		if (!jwt.hasClaim("user_security_uuid")) {
			throw new IllegalArgumentException("JWT missing required claim: user_security_uuid");
		}
		UUID userSecurityUuid = UUID.fromString(jwt.getClaimAsString("user_security_uuid"));

		String email = jwt.getClaimAsString("email");

		List<String> roles = jwt.getClaimAsStringList("authorities");

		Set<GrantedAuthority> grantedAuthorities = roles.stream()
			.map(SimpleGrantedAuthority::new)
			.collect(Collectors.toSet());

		CustomUserDetails userDetails = new CustomUserDetails(userUuid, userSecurityUuid, email, grantedAuthorities,
				true, true);

		return new UsernamePasswordAuthenticationToken(userDetails, null, grantedAuthorities);
	}

}
