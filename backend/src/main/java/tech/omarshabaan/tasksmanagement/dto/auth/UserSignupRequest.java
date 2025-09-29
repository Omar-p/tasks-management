package tech.omarshabaan.tasksmanagement.dto.auth;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import tech.omarshabaan.tasksmanagement.validation.AdvancedSignupRequestValidation;
import tech.omarshabaan.tasksmanagement.validation.BasicSignupRequestValidation;
import tech.omarshabaan.tasksmanagement.validation.PasswordMatch;
import tech.omarshabaan.tasksmanagement.validation.PasswordPolicy;
import tech.omarshabaan.tasksmanagement.validation.UniqueEmail;
import tech.omarshabaan.tasksmanagement.validation.UniqueUsername;

@PasswordMatch(groups = BasicSignupRequestValidation.class)
public record UserSignupRequest(
		@NotNull(groups = BasicSignupRequestValidation.class) @Size(min = 3,
				groups = BasicSignupRequestValidation.class) @UniqueUsername(
						groups = AdvancedSignupRequestValidation.class) String username,
		@NotNull(groups = BasicSignupRequestValidation.class) @Email(
				groups = BasicSignupRequestValidation.class) @UniqueEmail(
						groups = AdvancedSignupRequestValidation.class) String email,
		@PasswordPolicy(groups = BasicSignupRequestValidation.class) String password, String confirmPassword) {
}
