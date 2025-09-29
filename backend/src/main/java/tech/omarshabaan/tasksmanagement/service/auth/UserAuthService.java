package tech.omarshabaan.tasksmanagement.service.auth;

import org.springframework.context.ApplicationEventPublisher;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import tech.omarshabaan.tasksmanagement.dto.auth.UserSignupRequest;
import tech.omarshabaan.tasksmanagement.entity.Role;
import tech.omarshabaan.tasksmanagement.entity.RoleName;
import tech.omarshabaan.tasksmanagement.entity.UserSecurity;
import tech.omarshabaan.tasksmanagement.event.UserSecurityCreatedEvent;
import tech.omarshabaan.tasksmanagement.repository.auth.UserSecurityRepository;
import tech.omarshabaan.tasksmanagement.repository.auth.RoleRepository;
import tech.omarshabaan.tasksmanagement.security.CustomUserDetails;

@Service
@Transactional
public class UserAuthService implements UserDetailsService {

	private final UserSecurityRepository userSecurityRepository;

	private final RoleRepository roleRepository;

	private final ApplicationEventPublisher eventPublisher;

	private final PasswordEncoder passwordEncoder;

	public UserAuthService(UserSecurityRepository userSecurityRepository, RoleRepository roleRepository,
			ApplicationEventPublisher eventPublisher, PasswordEncoder passwordEncoder) {
		this.userSecurityRepository = userSecurityRepository;
		this.roleRepository = roleRepository;
		this.eventPublisher = eventPublisher;
		this.passwordEncoder = passwordEncoder;
	}

	public void saveUserSecurity(UserSignupRequest request) {
		Role userRole = roleRepository.findByName(RoleName.USER)
			.orElseThrow(() -> new RuntimeException("Default USER role not found"));

		UserSecurity userSecurity = userSecurityRepository.save(new UserSecurity.Builder().email(request.email())
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

		return new CustomUserDetails(userSecurity);
	}

}
