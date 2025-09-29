package tech.omarshabaan.tasksmanagement.validation;

import jakarta.validation.ConstraintValidator;
import jakarta.validation.ConstraintValidatorContext;
import tech.omarshabaan.tasksmanagement.repository.user.UserRepository;

public class UniqueUsernameValidator implements ConstraintValidator<UniqueUsername, String> {

	private final UserRepository repository;

	public UniqueUsernameValidator(UserRepository repository) {
		this.repository = repository;
	}

	@Override
	public boolean isValid(String username, ConstraintValidatorContext context) {
		return username != null && !repository.existsByUsername(username);
	}

}
