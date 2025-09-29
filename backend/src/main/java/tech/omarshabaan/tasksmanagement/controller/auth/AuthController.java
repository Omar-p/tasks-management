package tech.omarshabaan.tasksmanagement.controller.auth;

import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.CookieValue;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import tech.omarshabaan.tasksmanagement.dto.auth.UserSigninRequest;
import tech.omarshabaan.tasksmanagement.dto.auth.UserSigninResponse;
import tech.omarshabaan.tasksmanagement.dto.auth.UserSignupRequest;
import tech.omarshabaan.tasksmanagement.service.auth.AuthService;
import tech.omarshabaan.tasksmanagement.validation.BasicSignupRequestValidation;
import tech.omarshabaan.tasksmanagement.validation.CompleteSignupRequestValidation;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@Validated
public class AuthController {

	private static final Logger logger = LoggerFactory.getLogger(AuthController.class);

	private final AuthService authService;

	public AuthController(AuthService authService) {
		this.authService = authService;
	}

	@PostMapping("/signup")
	public ResponseEntity<Map<String, String>> signup(
			@Validated(CompleteSignupRequestValidation.class) @RequestBody UserSignupRequest request) {
		logger.info("User registration attempt for email: {}", request.email());
		authService.registerUser(request);
		logger.info("User registered successfully for email: {}", request.email());

		return ResponseEntity.status(HttpStatus.CREATED).build();
	}

	@PostMapping("/signin")
	public ResponseEntity<UserSigninResponse> signin(
			@Validated(CompleteSignupRequestValidation.class) @RequestBody UserSigninRequest request,
			HttpServletResponse response) {
		logger.info("User signin attempt for email: {}", request.email());
		UserSigninResponse signinResponse = authService.authenticateUser(request, response);
		logger.info("User signed in successfully for email: {}", request.email());
		return ResponseEntity.ok(signinResponse);
	}

	@PostMapping("/refresh")
	public ResponseEntity<UserSigninResponse> refresh(
			@CookieValue(name = "${app.security.refresh-token.cookie.name}", required = false) String refreshTokenValue,
			HttpServletResponse response) {

		if (refreshTokenValue == null) {
			logger.warn("Refresh token attempt without token");
			return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
		}

		logger.info("Token refresh attempt");
		UserSigninResponse refreshResponse = authService.refreshAccessToken(refreshTokenValue, response);
		logger.info("Token refreshed successfully");
		return ResponseEntity.ok(refreshResponse);
	}

	@PostMapping("/logout")
	public ResponseEntity<Map<String, String>> logout(
			@CookieValue(name = "${app.security.refresh-token.cookie.name}") String refreshTokenValue,
			HttpServletResponse response) {
		logger.info("User logout attempt");
		authService.logoutUser(refreshTokenValue, response);
		logger.info("User logged out successfully");

		return ResponseEntity.ok(Map.of("message", "Logged out successfully"));
	}

}
