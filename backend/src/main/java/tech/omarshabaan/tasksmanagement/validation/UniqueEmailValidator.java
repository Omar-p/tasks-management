package tech.omarshabaan.tasksmanagement.validation;

import jakarta.validation.ConstraintValidator;
import jakarta.validation.ConstraintValidatorContext;
import tech.omarshabaan.tasksmanagement.repository.auth.UserSecurityRepository;

public class UniqueEmailValidator implements ConstraintValidator<UniqueEmail, String> {

	private final UserSecurityRepository repository;

	public UniqueEmailValidator(UserSecurityRepository repository) {
		this.repository = repository;
	}

	@Override
	public boolean isValid(String email, ConstraintValidatorContext context) {
		return email != null && !repository.existsByEmail(email);
	}

}
