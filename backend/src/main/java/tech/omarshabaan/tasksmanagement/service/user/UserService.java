package tech.omarshabaan.tasksmanagement.service.user;

import org.springframework.stereotype.Service;
import org.springframework.transaction.event.TransactionalEventListener;
import tech.omarshabaan.tasksmanagement.entity.User;
import tech.omarshabaan.tasksmanagement.event.UserSecurityCreatedEvent;
import tech.omarshabaan.tasksmanagement.repository.user.UserRepository;

@Service
public class UserService {

	private final UserRepository userRepository;

	public UserService(UserRepository userRepository) {
		this.userRepository = userRepository;
	}

	@TransactionalEventListener
	public void handleUserSecurityCreatedEvent(UserSecurityCreatedEvent event) {
		var user = new User(event.username(), event.userSecurity());
		userRepository.save(user);
	}

}
