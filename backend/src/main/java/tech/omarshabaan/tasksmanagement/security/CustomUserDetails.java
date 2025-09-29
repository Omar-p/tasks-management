package tech.omarshabaan.tasksmanagement.security;

import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import tech.omarshabaan.tasksmanagement.entity.Authority;
import tech.omarshabaan.tasksmanagement.entity.Role;
import tech.omarshabaan.tasksmanagement.entity.UserSecurity;

import java.util.Collection;
import java.util.Set;
import java.util.stream.Collectors;

public class CustomUserDetails implements UserDetails {

	private final UserSecurity userSecurity;

	public CustomUserDetails(UserSecurity userSecurity) {
		this.userSecurity = userSecurity;
	}

	@Override
	public Collection<? extends GrantedAuthority> getAuthorities() {
		Set<GrantedAuthority> authorities = userSecurity.getRoles()
			.stream()
			.flatMap(role -> role.getAuthorities().stream())
			.map(authority -> new SimpleGrantedAuthority(authority.getName().name()))
			.collect(Collectors.toSet());

		Set<GrantedAuthority> roleAuthorities = userSecurity.getRoles()
			.stream()
			.map(role -> new SimpleGrantedAuthority("ROLE_" + role.getName().name()))
			.collect(Collectors.toSet());

		authorities.addAll(roleAuthorities);
		return authorities;
	}

	@Override
	public String getPassword() {
		return userSecurity.getPassword();
	}

	@Override
	public String getUsername() {
		return userSecurity.getEmail();
	}

	@Override
	public boolean isAccountNonExpired() {
		return true;
	}

	@Override
	public boolean isAccountNonLocked() {
		return !userSecurity.isLocked();
	}

	@Override
	public boolean isCredentialsNonExpired() {
		return true;
	}

	@Override
	public boolean isEnabled() {
		return userSecurity.isEnabled();
	}

	public UserSecurity getUserSecurity() {
		return userSecurity;
	}

	public Long getUserId() {
		return userSecurity.getId();
	}

}