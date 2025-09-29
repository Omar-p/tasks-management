package tech.omarshabaan.tasksmanagement.validation;

import jakarta.validation.Constraint;
import jakarta.validation.Payload;

import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

@Target({ ElementType.METHOD, ElementType.FIELD })
@Retention(RetentionPolicy.RUNTIME)
@Constraint(validatedBy = PasswordPolicyValidator.class)
public @interface PasswordPolicy {

	String message() default "Password must contain at least 8 characters, 1 upper case, 1 lower case, 1 digit and 1 special character";

	Class<?>[] groups() default {};

	Class<? extends Payload>[] payload() default {};

}
