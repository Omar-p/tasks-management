package tech.omarshabaan.tasksmanagement.validation;

import jakarta.validation.ConstraintValidator;
import jakarta.validation.ConstraintValidatorContext;
import tech.omarshabaan.tasksmanagement.dto.auth.UserSignupRequest;

import java.util.Objects;

public class PasswordMatchValidator implements ConstraintValidator<PasswordMatch, Object> {

	@Override
	public boolean isValid(Object request, ConstraintValidatorContext context) {
		if (request instanceof UserSignupRequest r) {
			return Objects.equals(r.password(), r.confirmPassword());
		}
		return false;
	}

}
