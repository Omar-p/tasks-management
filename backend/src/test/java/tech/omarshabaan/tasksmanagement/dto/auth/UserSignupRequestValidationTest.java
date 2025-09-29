package tech.omarshabaan.tasksmanagement.dto.auth;

import jakarta.validation.Validator;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.BDDMockito;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.autoconfigure.validation.ValidationAutoConfiguration;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.validation.beanvalidation.LocalValidatorFactoryBean;
import tech.omarshabaan.tasksmanagement.TestObjects;
import tech.omarshabaan.tasksmanagement.repository.auth.UserSecurityRepository;
import tech.omarshabaan.tasksmanagement.repository.user.UserRepository;
import tech.omarshabaan.tasksmanagement.validation.CompleteSignupRequestValidation;

import static org.assertj.core.api.BDDAssertions.then;
import static org.mockito.BDDMockito.anyString;
import static org.mockito.BDDMockito.eq;
import static org.mockito.BDDMockito.given;
import static org.mockito.BDDMockito.never;
import static org.mockito.BDDMockito.times;
import static org.mockito.BDDMockito.verify;
import static org.mockito.Mockito.verify;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.NONE, classes = { ValidationAutoConfiguration.class })
class UserSignupRequestValidationTest {

	private Validator validator;

	@MockitoBean
	UserRepository userRepository;

	@MockitoBean
	UserSecurityRepository userSecurityRepository;

	@Autowired
	LocalValidatorFactoryBean localValidatorFactoryBean;

	@BeforeEach
	void setUp() {
		validator = localValidatorFactoryBean.getValidator();
	}

	@Test
	void givenValidUserSignupRequest_whenValidated_thenNoViolations() {
		// Given
		UserSignupRequest request = TestObjects.validSignupRequest;
		given(userRepository.existsByUsername(request.username())).willReturn(false);
		given(userSecurityRepository.existsByEmail(request.email())).willReturn(false);

		// When
		var violations = validator.validate(request, CompleteSignupRequestValidation.class);

		// Then
		then(violations).isEmpty();

		verify(userRepository, times(1)).existsByUsername(eq(request.username()));
		verify(userSecurityRepository, times(1)).existsByEmail(eq(request.email()));
	}

	@Test
	void givenUserSignupRequestWithNonMatchingPasswords_whenValidated_thenViolation_andNoAdvancedValidationChecks() {
		// Given
		UserSignupRequest request = TestObjects.violatingPasswordMatchingSignupRequest;

		// When
		var violations = validator.validate(request, CompleteSignupRequestValidation.class);

		// Then
		then(violations).hasSize(1);
		then(violations.iterator().next().getMessage()).isEqualTo("Passwords do not match!");

		// Advanced validation checks should not be performed
		verify(userRepository, never()).existsByUsername(anyString());
		verify(userSecurityRepository, never()).existsByEmail(anyString());
	}

}
