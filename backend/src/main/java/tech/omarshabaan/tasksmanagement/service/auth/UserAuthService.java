package tech.omarshabaan.tasksmanagement.service.auth;

import org.springframework.context.ApplicationEventPublisher;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import tech.omarshabaan.tasksmanagement.dto.auth.UserSignupRequest;
import tech.omarshabaan.tasksmanagement.entity.Role;
import tech.omarshabaan.tasksmanagement.entity.RoleName;
import tech.omarshabaan.tasksmanagement.entity.User;
import tech.omarshabaan.tasksmanagement.entity.UserSecurity;
import tech.omarshabaan.tasksmanagement.event.UserSecurityCreatedEvent;
import tech.omarshabaan.tasksmanagement.repository.auth.UserSecurityRepository;
import tech.omarshabaan.tasksmanagement.repository.auth.RoleRepository;
import tech.omarshabaan.tasksmanagement.repository.user.UserRepository;
import tech.omarshabaan.tasksmanagement.security.CustomUserDetails;

import java.util.Collection;
import java.util.stream.Collectors;

@Service
@Transactional
public class UserAuthService implements UserDetailsService {

	private final UserSecurityRepository userSecurityRepository;

	private final RoleRepository roleRepository;

	private final UserRepository userRepository;

	private final ApplicationEventPublisher eventPublisher;

	private final PasswordEncoder passwordEncoder;

	public UserAuthService(UserSecurityRepository userSecurityRepository, RoleRepository roleRepository,
			UserRepository userRepository, ApplicationEventPublisher eventPublisher, PasswordEncoder passwordEncoder) {
		this.userSecurityRepository = userSecurityRepository;
		this.roleRepository = roleRepository;
		this.userRepository = userRepository;
		this.eventPublisher = eventPublisher;
		this.passwordEncoder = passwordEncoder;
	}

	public void saveUserSecurity(UserSignupRequest request) {
		Role userRole = roleRepository.findByName(RoleName.USER)
			.orElseThrow(() -> new RuntimeException("Default USER role not found"));

		UserSecurity userSecurity = userSecurityRepository.save(UserSecurity.builder()
			.email(request.email())
			.password(passwordEncoder.encode(request.password()))
			.enabled(true)
			.locked(false)
			.addRole(userRole)
			.build());

		eventPublisher.publishEvent(new UserSecurityCreatedEvent(userSecurity, request.username()));
	}

	@Override
	@Transactional(readOnly = true)
	public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
		UserSecurity userSecurity = userSecurityRepository.findByEmail(username)
			.orElseThrow(() -> new UsernameNotFoundException("User not found with email: " + username));

		// Find the associated User domain entity
		User user = userRepository.findByUserSecurity(userSecurity)
			.orElseThrow(() -> new UsernameNotFoundException("User domain entity not found for email: " + username));

		// Build authorities from UserSecurity roles
		Collection<GrantedAuthority> authorities = userSecurity.getRoles()
			.stream()
			.flatMap(role -> role.getAuthorities().stream())
			.map(authority -> new SimpleGrantedAuthority(authority.getName().name()))
			.collect(Collectors.toSet());

		userSecurity.getRoles()
			.stream()
			.map(role -> new SimpleGrantedAuthority("ROLE_" + role.getName().name()))
			.forEach(authorities::add);

		// Build CustomUserDetails with User UUID as the main identifier
		// Include password for authentication (credential verification)
		return new CustomUserDetails(user.getUuid(), userSecurity.getUuid(), userSecurity.getEmail(),
				userSecurity.getPassword(), authorities, userSecurity.isEnabled(), !userSecurity.isLocked());
	}

	@Transactional(readOnly = true)
	public UserSecurity findUserSecurityByEmail(String email) {
		return userSecurityRepository.findByEmail(email)
			.orElseThrow(() -> new RuntimeException("UserSecurity not found with email: " + email));
	}

	@Transactional(readOnly = true)
	public User findUserByUserSecurity(UserSecurity userSecurity) {
		return userRepository.findByUserSecurity(userSecurity)
			.orElseThrow(() -> new RuntimeException("User not found for UserSecurity: " + userSecurity.getEmail()));
	}

}
