package tech.omarshabaan.tasksmanagement.controller.user;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import tech.omarshabaan.tasksmanagement.dto.user.UserProfileResponse;
import tech.omarshabaan.tasksmanagement.security.CustomUserDetails;
import tech.omarshabaan.tasksmanagement.service.user.UserService;

@RestController
@RequestMapping("/api/users")
public class UserController {

	private final UserService userService;

	public UserController(UserService userService) {
		this.userService = userService;
	}

	@GetMapping("/me")
	public ResponseEntity<UserProfileResponse> getUserProfile(@AuthenticationPrincipal CustomUserDetails userDetails) {
		UserProfileResponse profile = userService.getUserProfile(userDetails.getUserSecurity());
		return ResponseEntity.ok(profile);
	}
}