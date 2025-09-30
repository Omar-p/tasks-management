package tech.omarshabaan.tasksmanagement.controller.auth;

import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
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

	private final AuthService authService;

	public AuthController(AuthService authService) {
		this.authService = authService;
	}

	@PostMapping("/signup")
	public ResponseEntity<Map<String, String>> signup(
			@Validated(CompleteSignupRequestValidation.class) @RequestBody UserSignupRequest request) {
		authService.registerUser(request);
		return ResponseEntity.status(HttpStatus.CREATED).build();
	}

	@PostMapping("/signin")
	public ResponseEntity<UserSigninResponse> signin(
			@Validated(CompleteSignupRequestValidation.class) @RequestBody UserSigninRequest request,
			HttpServletResponse response) {
		UserSigninResponse signinResponse = authService.authenticateUser(request, response);
		return ResponseEntity.ok(signinResponse);
	}

	@PostMapping("/refresh")
	public ResponseEntity<UserSigninResponse> refresh(
			@CookieValue(name = "${app.security.refresh-token.cookie.name}", required = false) String refreshTokenValue,
			HttpServletResponse response) {
		System.out.println("Refresh token value: " + refreshTokenValue); // Debugging line

		if (refreshTokenValue == null) {
			return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
		}

		UserSigninResponse refreshResponse = authService.refreshAccessToken(refreshTokenValue, response);
		return ResponseEntity.ok(refreshResponse);
	}

	@PostMapping("/logout")
	public ResponseEntity<Map<String, String>> logout(
			@CookieValue(name = "${app.security.refresh-token.cookie.name}") String refreshTokenValue,
			HttpServletResponse response) {
		authService.logoutUser(refreshTokenValue, response);
		return ResponseEntity.ok(Map.of("message", "Logged out successfully"));
	}

}
