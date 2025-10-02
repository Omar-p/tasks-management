package tech.omarshabaan.tasksmanagement.controller;

import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletResponse;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.restdocs.AutoConfigureRestDocs;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.restdocs.payload.FieldDescriptor;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import tech.omarshabaan.tasksmanagement.TestObjects;
import tech.omarshabaan.tasksmanagement.config.CorsProperties;
import tech.omarshabaan.tasksmanagement.config.RestDocsTestConfiguration;
import tech.omarshabaan.tasksmanagement.config.RsaKeyProperties;
import tech.omarshabaan.tasksmanagement.config.SecurityConfig;
import tech.omarshabaan.tasksmanagement.controller.auth.AuthController;
import tech.omarshabaan.tasksmanagement.dto.auth.UserSigninResponse;
import tech.omarshabaan.tasksmanagement.exception.GlobalExceptionHandler;
import tech.omarshabaan.tasksmanagement.repository.auth.UserSecurityRepository;
import tech.omarshabaan.tasksmanagement.repository.user.UserRepository;
import tech.omarshabaan.tasksmanagement.security.DelegatedAccessDeniedHandler;
import tech.omarshabaan.tasksmanagement.security.DelegatedAuthenticationEntryPoint;
import tech.omarshabaan.tasksmanagement.service.auth.AuthService;

import java.util.Map;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.BDDMockito.given;
import static org.mockito.BDDMockito.then;
import static org.mockito.BDDMockito.willDoNothing;
import static org.springframework.restdocs.mockmvc.MockMvcRestDocumentation.document;
import static org.springframework.restdocs.mockmvc.RestDocumentationRequestBuilders.post;
import static org.springframework.restdocs.operation.preprocess.Preprocessors.preprocessRequest;
import static org.springframework.restdocs.operation.preprocess.Preprocessors.preprocessResponse;
import static org.springframework.restdocs.operation.preprocess.Preprocessors.prettyPrint;
import static org.springframework.restdocs.payload.PayloadDocumentation.fieldWithPath;
import static org.springframework.restdocs.payload.PayloadDocumentation.requestFields;
import static org.springframework.restdocs.payload.PayloadDocumentation.responseFields;
import static org.springframework.restdocs.snippet.Attributes.key;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.cookie;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;
import static tech.omarshabaan.tasksmanagement.controller.AuthControllerTest.AuthControllerSnippets.signinRequestFields;
import static tech.omarshabaan.tasksmanagement.controller.AuthControllerTest.AuthControllerSnippets.signinResponseFields;
import static tech.omarshabaan.tasksmanagement.controller.AuthControllerTest.AuthControllerSnippets.signupRequestFields;

@WebMvcTest(AuthController.class)
@AutoConfigureRestDocs
@Import({ SecurityConfig.class, GlobalExceptionHandler.class, DelegatedAuthenticationEntryPoint.class,
		DelegatedAccessDeniedHandler.class, RestDocsTestConfiguration.class })
class AuthControllerTest {

	@Autowired
	private MockMvc mockMvc;

	@MockitoBean
	private AuthService authService;

	@MockitoBean
	private UserRepository userRepository;

	@MockitoBean
	private UserSecurityRepository userSecurityRepository;

	@MockitoBean
	private UserDetailsService userDetailsService;

	@Test
	void shouldSignupUser_whenValidRequest() throws Exception {
		// Given
		given(userRepository.existsByUsername(TestObjects.testUserSignupRequest.username())).willReturn(false);
		given(userSecurityRepository.existsByEmail(TestObjects.testUserSignupRequest.email())).willReturn(false);
		willDoNothing().given(authService).registerUser(any());

		// When & Then
		mockMvc.perform(post("/api/auth/signup").contentType(MediaType.APPLICATION_JSON).content("""
				{
				  "username": "testuser",
				  "email": "test@example.com",
				  "password": "P@ssw0rd123!",
				  "confirmPassword": "P@ssw0rd123!"
				}
				"""))
			.andExpect(status().isCreated())
			.andDo(document("auth-controller/signup/success", preprocessRequest(prettyPrint()),
					preprocessResponse(prettyPrint()), requestFields(signupRequestFields)));

		// Then
		then(authService).should().registerUser(any());
	}

	@Test
	void shouldReturnBadRequest_whenPasswordsDoNotMatch() throws Exception {
		// Given - passwords do not match

		// When & Then
		mockMvc.perform(post("/api/auth/signup").contentType(MediaType.APPLICATION_JSON).content("""
				{
				  "username": "testuser",
				  "email": "test@example.com",
				  "password": "P@ssw0rd123!",
				  "confirmPassword": "DifferentP@ssw0rd!"
				}
				"""))
			.andExpect(status().isBadRequest())
			.andDo(document("auth-controller/signup/password-mismatch", preprocessRequest(prettyPrint()),
					preprocessResponse(prettyPrint())));

		// Then
		then(authService).shouldHaveNoInteractions();
	}

	@Test
	void shouldReturnBadRequest_whenUsernameIsBlank() throws Exception {
		// Given - blank username

		// When & Then
		mockMvc.perform(post("/api/auth/signup").contentType(MediaType.APPLICATION_JSON).content("""
				{
				  "username": "",
				  "email": "test@example.com",
				  "password": "P@ssw0rd123!",
				  "confirmPassword": "P@ssw0rd123!"
				}
				"""))
			.andExpect(status().isBadRequest())
			.andDo(document("auth-controller/signup/blank-username", preprocessRequest(prettyPrint()),
					preprocessResponse(prettyPrint())));

		// Then
		then(authService).shouldHaveNoInteractions();
	}

	@Test
	void shouldReturnBadRequest_whenEmailIsInvalid() throws Exception {
		// Given - invalid email format

		// When & Then
		mockMvc.perform(post("/api/auth/signup").contentType(MediaType.APPLICATION_JSON).content("""
				{
				  "username": "testuser",
				  "email": "invalid-email",
				  "password": "P@ssw0rd123!",
				  "confirmPassword": "P@ssw0rd123!"
				}
				"""))
			.andExpect(status().isBadRequest())
			.andDo(document("auth-controller/signup/invalid-email", preprocessRequest(prettyPrint()),
					preprocessResponse(prettyPrint())));

		// Then
		then(authService).shouldHaveNoInteractions();
	}

	@Test
	void shouldSigninUser_whenValidCredentials() throws Exception {
		// Given
		String accessToken = "eyJhbGciOiJSUzI1NiJ9.test.token";
		UserSigninResponse response = new UserSigninResponse(accessToken);

		given(authService.authenticateUser(eq(TestObjects.testUserSigninRequest), any(HttpServletResponse.class)))
			.willReturn(response);

		// When & Then
		mockMvc.perform(post("/api/auth/signin").contentType(MediaType.APPLICATION_JSON).content("""
				{
				  "email": "test@example.com",
				  "password": "P@ssw0rd123!"
				}
				"""))
			.andExpect(status().isOk())
			.andExpect(jsonPath("$.accessToken").value(accessToken))
			.andDo(document("auth-controller/signin/success", preprocessRequest(prettyPrint()),
					preprocessResponse(prettyPrint()), requestFields(signinRequestFields),
					responseFields(signinResponseFields)));

		// Then
		then(authService).should().authenticateUser(any(), any(HttpServletResponse.class));
	}

	@Test
	void shouldRefreshToken_whenValidRefreshToken() throws Exception {
		// Given
		String accessToken = "eyJhbGciOiJSUzI1NiJ9.refreshed.token";
		String refreshTokenValue = "valid-refresh-token";
		UserSigninResponse response = new UserSigninResponse(accessToken);

		given(authService.refreshAccessToken(eq(refreshTokenValue), any(HttpServletResponse.class)))
			.willReturn(response);

		// When & Then
		mockMvc.perform(post("/api/auth/refresh").cookie(new Cookie("refresh_token", refreshTokenValue)))
			.andExpect(status().isOk())
			.andExpect(jsonPath("$.accessToken").value(accessToken))
			.andDo(document("auth-controller/refresh/success", preprocessRequest(prettyPrint()),
					preprocessResponse(prettyPrint()), responseFields(signinResponseFields)));

		// Then
		then(authService).should().refreshAccessToken(eq(refreshTokenValue), any(HttpServletResponse.class));
	}

	@Test
	void shouldReturnUnauthorized_whenRefreshTokenIsMissing() throws Exception {
		// Given - no refresh token cookie

		// When & Then
		mockMvc.perform(post("/api/auth/refresh"))
			.andExpect(status().isUnauthorized())
			.andDo(document("auth-controller/refresh/missing-token", preprocessRequest(prettyPrint()),
					preprocessResponse(prettyPrint())));

		// Then
		then(authService).shouldHaveNoInteractions();
	}

	@Test
	void shouldLogoutUser_whenValidRefreshToken() throws Exception {
		// Given
		String refreshTokenValue = "valid-refresh-token";
		willDoNothing().given(authService).logoutUser(eq(refreshTokenValue), any(HttpServletResponse.class));

		// When & Then
		mockMvc.perform(post("/api/auth/logout").cookie(new Cookie("refresh_token", refreshTokenValue)))
			.andExpect(status().isOk())
			.andExpect(jsonPath("$.message").value("Logged out successfully"))
			.andDo(document("auth-controller/logout/success", preprocessRequest(prettyPrint()),
					preprocessResponse(prettyPrint()), responseFields(AuthControllerSnippets.logoutResponseFields)));

		// Then
		then(authService).should().logoutUser(eq(refreshTokenValue), any(HttpServletResponse.class));
	}

	/**
	 * REST Docs field descriptors for Auth endpoints
	 */
	static class AuthControllerSnippets {

		static final FieldDescriptor[] signupRequestFields = new FieldDescriptor[] {
				fieldWithPath("username").description("Username for the new account")
					.attributes(key("constraints").value("Must not be blank and must be unique")),
				fieldWithPath("email").description("Email address for the new account")
					.attributes(key("constraints").value("Must be a valid email format and must be unique")),
				fieldWithPath("password").description("Password for the account")
					.attributes(key("constraints").value(
							"Must meet password complexity requirements (min 8 chars, uppercase, lowercase, number, special char)")),
				fieldWithPath("confirmPassword").description("Password confirmation")
					.attributes(key("constraints").value("Must match the password field")) };

		static final FieldDescriptor[] signinRequestFields = new FieldDescriptor[] {
				fieldWithPath("email").description("User's email address")
					.attributes(key("constraints").value("Must be a valid registered email")),
				fieldWithPath("password").description("User's password")
					.attributes(key("constraints").value("Must match the registered password")) };

		static final FieldDescriptor[] signinResponseFields = new FieldDescriptor[] {
				fieldWithPath("accessToken").description("JWT access token for authentication")
					.attributes(key("usage").value("Include this token in Authorization header as 'Bearer {token}'")) };

		static final FieldDescriptor[] logoutResponseFields = new FieldDescriptor[] {
				fieldWithPath("message").description("Success message confirming logout") };

	}

}
