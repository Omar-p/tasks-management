package tech.omarshabaan.tasksmanagement.security;

import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.Collection;
import java.util.UUID;

/**
 * Security principal that can be built from either database (for authentication) or JWT
 * claims (for authorization).
 */
public class CustomUserDetails implements UserDetails {

	private final UUID userUuid;

	private final UUID userSecurityUuid;

	private final String email;

	private final String password; // Only used during initial authentication, null for
									// JWT-based requests

	private final Collection<? extends GrantedAuthority> authorities;

	private final boolean enabled;

	private final boolean accountNonLocked;

	/**
	 * Constructor for authentication (from database) - includes password for credential
	 * verification.
	 */
	public CustomUserDetails(UUID userUuid, UUID userSecurityUuid, String email, String password,
			Collection<? extends GrantedAuthority> authorities, boolean enabled, boolean accountNonLocked) {
		this.userUuid = userUuid;
		this.userSecurityUuid = userSecurityUuid;
		this.email = email;
		this.password = password;
		this.authorities = authorities;
		this.enabled = enabled;
		this.accountNonLocked = accountNonLocked;
	}

	/**
	 * Constructor for JWT-based authorization (no password needed).
	 */
	public CustomUserDetails(UUID userUuid, UUID userSecurityUuid, String email,
			Collection<? extends GrantedAuthority> authorities, boolean enabled, boolean accountNonLocked) {
		this(userUuid, userSecurityUuid, email, null, authorities, enabled, accountNonLocked);
	}

	@Override
	public Collection<? extends GrantedAuthority> getAuthorities() {
		return authorities;
	}

	@Override
	public String getPassword() {
		return password;
	}

	@Override
	public String getUsername() {
		return email;
	}

	@Override
	public boolean isAccountNonExpired() {
		return true;
	}

	@Override
	public boolean isAccountNonLocked() {
		return accountNonLocked;
	}

	@Override
	public boolean isCredentialsNonExpired() {
		return true;
	}

	@Override
	public boolean isEnabled() {
		return enabled;
	}

	/**
	 * @return the main domain user identifier (User UUID)
	 */
	public UUID getUserUuid() {
		return userUuid;
	}

	/**
	 * @return the UserSecurity UUID for traceability (optional)
	 */
	public UUID getUserSecurityUuid() {
		return userSecurityUuid;
	}

	public String getEmail() {
		return email;
	}

}