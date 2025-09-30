package tech.omarshabaan.tasksmanagement.service.user;

import org.springframework.stereotype.Service;
import org.springframework.context.event.EventListener;
import tech.omarshabaan.tasksmanagement.dto.user.UserProfileResponse;
import tech.omarshabaan.tasksmanagement.entity.User;
import tech.omarshabaan.tasksmanagement.entity.UserSecurity;
import tech.omarshabaan.tasksmanagement.event.UserSecurityCreatedEvent;
import tech.omarshabaan.tasksmanagement.repository.user.UserRepository;
import tech.omarshabaan.tasksmanagement.service.task.UserLookupService;

@Service
public class UserService implements UserLookupService {

	private final UserRepository userRepository;

	public UserService(UserRepository userRepository) {
		this.userRepository = userRepository;
	}

	@EventListener
	public void handleUserSecurityCreatedEvent(UserSecurityCreatedEvent event) {
		var user = new User(event.username(), event.userSecurity());
		userRepository.save(user);
	}

	@Override
	public User findUserByUserSecurity(UserSecurity userSecurity) {
		return userRepository.findByUserSecurity(userSecurity)
			.orElseThrow(() -> new RuntimeException("User not found for UserSecurity: " + userSecurity.getEmail()));
	}

	public UserProfileResponse getUserProfile(UserSecurity userSecurity) {
		User user = findUserByUserSecurity(userSecurity);
		return new UserProfileResponse(user.getUuid(), user.getUsername(), userSecurity.getEmail());
	}

}
