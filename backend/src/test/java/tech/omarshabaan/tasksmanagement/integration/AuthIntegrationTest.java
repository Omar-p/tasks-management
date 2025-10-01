package tech.omarshabaan.tasksmanagement.integration;

import jakarta.servlet.http.Cookie;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.transaction.annotation.Transactional;
import tech.omarshabaan.tasksmanagement.BaseIT;
import tech.omarshabaan.tasksmanagement.TestObjects;
import tech.omarshabaan.tasksmanagement.dto.auth.UserSigninRequest;
import tech.omarshabaan.tasksmanagement.dto.auth.UserSignupRequest;
import tech.omarshabaan.tasksmanagement.entity.RefreshToken;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class AuthIntegrationTest extends BaseIT {

	@BeforeEach
	void setUp() {
		// Clean up before each test
		refreshTokenRepository.deleteAll();
		userRepository.deleteAll();
		userSecurityRepository.deleteAll();
	}

	@Test
	void shouldSignupUser_AndValidateUserAndUserSecurityTablesCount() throws Exception {
		// Given
		long initialUserCount = userRepository.count();
		long initialUserSecurityCount = userSecurityRepository.count();

		// When
		mockMvc
			.perform(post("/api/auth/signup").contentType(MediaType.APPLICATION_JSON)
				.content(objectMapper.writeValueAsString(TestObjects.testUserSignupRequest)))
			.andExpect(status().isCreated());

		// Then - Validate counts in both tables
		long finalUserCount = userRepository.count();
		long finalUserSecurityCount = userSecurityRepository.count();

		assertThat(finalUserCount).isEqualTo(initialUserCount + 1);
		assertThat(finalUserSecurityCount).isEqualTo(initialUserSecurityCount + 1);

		// Verify user exists with correct username
		assertThat(userRepository.existsByUsername("testuser")).isTrue();

		// Verify user security exists with correct email
		assertThat(userSecurityRepository.existsByEmail("test@example.com")).isTrue();
	}

	@Test
	void shouldSignupAndSignin_ThenLogout_AndValidateRefreshTokenIsRevoked() throws Exception {
		// Given - Signup a user first
		mockMvc
			.perform(post("/api/auth/signup").contentType(MediaType.APPLICATION_JSON)
				.content(objectMapper.writeValueAsString(TestObjects.testUserSignupRequest)))
			.andExpect(status().isCreated());

		// When - Sign in to get refresh token
		MvcResult signinResult = mockMvc
			.perform(post("/api/auth/signin").contentType(MediaType.APPLICATION_JSON)
				.content(objectMapper.writeValueAsString(TestObjects.testUserSigninRequest)))
			.andExpect(status().isOk())
			.andReturn();

		// Extract refresh token from cookie
		Cookie refreshTokenCookie = signinResult.getResponse().getCookie("refresh_token");
		assertThat(refreshTokenCookie).isNotNull();
		String refreshTokenValue = refreshTokenCookie.getValue();
		assertThat(refreshTokenValue).isNotBlank();

		// Verify refresh token exists in database and is not revoked
		// Note: The token is hashed in the database, so we use the service method to find
		// it
		RefreshToken refreshToken = refreshTokenService.findByToken(refreshTokenValue).orElseThrow();
		assertThat(refreshToken.isRevoked()).isFalse();

		// When - Logout
		mockMvc.perform(post("/api/auth/logout").cookie(refreshTokenCookie)).andExpect(status().isOk());

		// Then - Validate refresh token is revoked
		RefreshToken revokedToken = refreshTokenService.findByToken(refreshTokenValue).orElseThrow();
		assertThat(revokedToken.isRevoked()).isTrue();
	}

}
