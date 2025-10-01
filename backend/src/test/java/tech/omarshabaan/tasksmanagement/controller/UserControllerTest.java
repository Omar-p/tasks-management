package tech.omarshabaan.tasksmanagement.controller;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.restdocs.AutoConfigureRestDocs;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.restdocs.payload.FieldDescriptor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import tech.omarshabaan.tasksmanagement.config.SecurityConfig;
import tech.omarshabaan.tasksmanagement.controller.user.UserController;
import tech.omarshabaan.tasksmanagement.dto.user.UserProfileResponse;
import tech.omarshabaan.tasksmanagement.exception.GlobalExceptionHandler;
import tech.omarshabaan.tasksmanagement.repository.auth.UserSecurityRepository;
import tech.omarshabaan.tasksmanagement.security.CustomUserDetails;
import tech.omarshabaan.tasksmanagement.security.DelegatedAccessDeniedHandler;
import tech.omarshabaan.tasksmanagement.security.DelegatedAuthenticationEntryPoint;
import tech.omarshabaan.tasksmanagement.security.JwtToUserAuthenticationConverter;
import tech.omarshabaan.tasksmanagement.service.user.UserService;

import java.util.List;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.BDDMockito.given;
import static org.mockito.BDDMockito.then;
import static org.springframework.restdocs.mockmvc.MockMvcRestDocumentation.document;
import static org.springframework.restdocs.mockmvc.RestDocumentationRequestBuilders.get;
import static org.springframework.restdocs.operation.preprocess.Preprocessors.preprocessRequest;
import static org.springframework.restdocs.operation.preprocess.Preprocessors.preprocessResponse;
import static org.springframework.restdocs.operation.preprocess.Preprocessors.prettyPrint;
import static org.springframework.restdocs.payload.PayloadDocumentation.fieldWithPath;
import static org.springframework.restdocs.payload.PayloadDocumentation.responseFields;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.authentication;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;
import static tech.omarshabaan.tasksmanagement.controller.UserControllerTest.UserControllerSnippets.userProfileResponseFields;

/**
 * WebMvcTest for UserController with comprehensive REST documentation. Uses BDD style
 * testing with BDDMockito and BDDAssertions.
 */
@WebMvcTest(UserController.class)
@AutoConfigureRestDocs
@Import({ SecurityConfig.class, GlobalExceptionHandler.class, DelegatedAuthenticationEntryPoint.class,
		DelegatedAccessDeniedHandler.class, JwtToUserAuthenticationConverter.class })
class UserControllerTest {

	@Autowired
	private MockMvc mockMvc;

	@MockitoBean
	private UserService userService;

	@MockitoBean
	private UserSecurityRepository userSecurityRepository;

	@MockitoBean
	private UserDetailsService userDetailsService;

	@Test
	void shouldGetUserProfile_whenAuthenticated() throws Exception {
		// Given
		UUID userUuid = UUID.randomUUID();
		UUID userSecurityUuid = UUID.randomUUID();
		String email = "test@example.com";
		UserProfileResponse response = new UserProfileResponse(userUuid, "testuser", email);

		given(userService.getUserProfile(any(UUID.class), any(String.class))).willReturn(response);

		CustomUserDetails userDetails = new CustomUserDetails(userUuid, userSecurityUuid, email,
				List.of(new SimpleGrantedAuthority("ROLE_USER")), true, false);
		UsernamePasswordAuthenticationToken authentication = new UsernamePasswordAuthenticationToken(userDetails, null,
				userDetails.getAuthorities());

		// When & Then
		mockMvc.perform(get("/api/users/me").with(authentication(authentication)))
			.andExpect(status().isOk())
			.andExpect(jsonPath("$.uuid").value(userUuid.toString()))
			.andExpect(jsonPath("$.username").value("testuser"))
			.andExpect(jsonPath("$.email").value(email))
			.andDo(document("user-controller/get-profile/success", preprocessRequest(prettyPrint()),
					preprocessResponse(prettyPrint()), responseFields(userProfileResponseFields)));

		// Then
		then(userService).should().getUserProfile(any(UUID.class), any(String.class));
	}

	@Test
	void shouldReturnUnauthorized_whenNotAuthenticated() throws Exception {
		// Given - no authentication

		// When & Then
		mockMvc.perform(get("/api/users/me"))
			.andExpect(status().isUnauthorized())
			.andDo(document("user-controller/get-profile/unauthorized", preprocessRequest(prettyPrint()),
					preprocessResponse(prettyPrint())));

		// Then
		then(userService).shouldHaveNoInteractions();
	}

	/**
	 * REST Docs field descriptors for User endpoints
	 */
	static class UserControllerSnippets {

		static final FieldDescriptor[] userProfileResponseFields = new FieldDescriptor[] {
				fieldWithPath("uuid").description("Unique identifier for the user"),
				fieldWithPath("username").description("Username of the user"),
				fieldWithPath("email").description("Email address of the user") };

	}

}
