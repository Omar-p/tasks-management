package tech.omarshabaan.tasksmanagement.validation;

import jakarta.validation.ConstraintValidator;
import jakarta.validation.ConstraintValidatorContext;
import org.springframework.aot.hint.annotation.Reflective;
import tech.omarshabaan.tasksmanagement.dto.auth.UserSignupRequest;

import java.util.Objects;

@Reflective
public class PasswordMatchValidator implements ConstraintValidator<PasswordMatch, Object> {

	public PasswordMatchValidator() {
	}

	@Override
	public boolean isValid(Object request, ConstraintValidatorContext context) {
		if (request instanceof UserSignupRequest r) {
			return Objects.equals(r.password(), r.confirmPassword());
		}
		return false;
	}

}
