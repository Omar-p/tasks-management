package tech.omarshabaan.tasksmanagement.service.user;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.event.TransactionalEventListener;
import tech.omarshabaan.tasksmanagement.dto.user.UserProfileResponse;
import tech.omarshabaan.tasksmanagement.entity.User;
import tech.omarshabaan.tasksmanagement.entity.UserSecurity;
import tech.omarshabaan.tasksmanagement.event.UserSecurityCreatedEvent;
import tech.omarshabaan.tasksmanagement.repository.user.UserRepository;
import tech.omarshabaan.tasksmanagement.service.task.UserLookupService;

@Service
public class UserService implements UserLookupService {

	private static final Logger logger = LoggerFactory.getLogger(UserService.class);

	private final UserRepository userRepository;

	public UserService(UserRepository userRepository) {
		this.userRepository = userRepository;
	}

	@TransactionalEventListener
	public void handleUserSecurityCreatedEvent(UserSecurityCreatedEvent event) {
		logger.info("Creating User record for UserSecurity with email: {} and username: {}",
			event.userSecurity().getEmail(), event.username());

		var user = new User(event.username(), event.userSecurity());
		User savedUser = userRepository.save(user);

		logger.info("Successfully created User record with UUID: {} for UserSecurity: {}",
			savedUser.getUuid(), event.userSecurity().getUuid());
	}

	@Override
	public User findUserByUserSecurity(UserSecurity userSecurity) {
		logger.debug("Looking up User for UserSecurity with UUID: {} and email: {}",
			userSecurity.getUuid(), userSecurity.getEmail());

		return userRepository.findByUserSecurity(userSecurity)
			.orElseThrow(() -> {
				logger.error("User not found for UserSecurity with UUID: {} and email: {}. " +
					"This suggests the User record was not created when UserSecurity was saved.",
					userSecurity.getUuid(), userSecurity.getEmail());
				return new RuntimeException("User not found for UserSecurity: " + userSecurity.getEmail());
			});
	}

	public UserProfileResponse getUserProfile(UserSecurity userSecurity) {
		logger.info("Getting user profile for UserSecurity with email: {}", userSecurity.getEmail());

		User user = findUserByUserSecurity(userSecurity);

		logger.info("Successfully retrieved user profile for user: {} (UUID: {})",
			user.getUsername(), user.getUuid());

		return new UserProfileResponse(user.getUuid(), user.getUsername(), userSecurity.getEmail());
	}

}
