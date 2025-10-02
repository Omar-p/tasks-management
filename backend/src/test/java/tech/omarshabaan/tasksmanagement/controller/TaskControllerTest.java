package tech.omarshabaan.tasksmanagement.controller;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.restdocs.AutoConfigureRestDocs;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.MediaType;
import org.springframework.restdocs.payload.FieldDescriptor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import tech.omarshabaan.tasksmanagement.config.CorsProperties;
import tech.omarshabaan.tasksmanagement.config.RestDocsTestConfiguration;
import tech.omarshabaan.tasksmanagement.config.RsaKeyProperties;
import tech.omarshabaan.tasksmanagement.config.SecurityConfig;
import tech.omarshabaan.tasksmanagement.controller.task.TaskController;
import tech.omarshabaan.tasksmanagement.dto.task.GetTaskResponse;
import tech.omarshabaan.tasksmanagement.dto.task.TaskSummaryResponse;
import tech.omarshabaan.tasksmanagement.entity.Role;
import tech.omarshabaan.tasksmanagement.entity.RoleName;
import tech.omarshabaan.tasksmanagement.entity.TaskPriority;
import tech.omarshabaan.tasksmanagement.entity.TaskStatus;
import tech.omarshabaan.tasksmanagement.entity.UserSecurity;
import tech.omarshabaan.tasksmanagement.exception.GlobalExceptionHandler;
import tech.omarshabaan.tasksmanagement.security.CustomUserDetails;
import tech.omarshabaan.tasksmanagement.security.DelegatedAccessDeniedHandler;
import tech.omarshabaan.tasksmanagement.security.DelegatedAuthenticationEntryPoint;
import tech.omarshabaan.tasksmanagement.security.JwtToUserAuthenticationConverter;
import tech.omarshabaan.tasksmanagement.service.task.TaskService;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Set;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.ArgumentMatchers.isNull;
import static org.mockito.BDDMockito.given;
import static org.mockito.BDDMockito.then;
import static org.mockito.BDDMockito.willDoNothing;
import static org.springframework.restdocs.mockmvc.MockMvcRestDocumentation.document;
import static org.springframework.restdocs.mockmvc.RestDocumentationRequestBuilders.delete;
import static org.springframework.restdocs.mockmvc.RestDocumentationRequestBuilders.get;
import static org.springframework.restdocs.mockmvc.RestDocumentationRequestBuilders.post;
import static org.springframework.restdocs.mockmvc.RestDocumentationRequestBuilders.put;
import static org.springframework.restdocs.operation.preprocess.Preprocessors.preprocessRequest;
import static org.springframework.restdocs.operation.preprocess.Preprocessors.preprocessResponse;
import static org.springframework.restdocs.operation.preprocess.Preprocessors.prettyPrint;
import static org.springframework.restdocs.payload.PayloadDocumentation.fieldWithPath;
import static org.springframework.restdocs.payload.PayloadDocumentation.requestFields;
import static org.springframework.restdocs.payload.PayloadDocumentation.responseFields;
import static org.springframework.restdocs.payload.PayloadDocumentation.subsectionWithPath;
import static org.springframework.restdocs.request.RequestDocumentation.parameterWithName;
import static org.springframework.restdocs.request.RequestDocumentation.pathParameters;
import static org.springframework.restdocs.request.RequestDocumentation.queryParameters;
import static org.springframework.restdocs.snippet.Attributes.key;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.authentication;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;
import static tech.omarshabaan.tasksmanagement.controller.TaskControllerTest.TaskControllerSnippets.createTaskRequestFields;
import static tech.omarshabaan.tasksmanagement.controller.TaskControllerTest.TaskControllerSnippets.taskResponseFields;
import static tech.omarshabaan.tasksmanagement.controller.TaskControllerTest.TaskControllerSnippets.taskSummaryResponseFields;
import static tech.omarshabaan.tasksmanagement.controller.TaskControllerTest.TaskControllerSnippets.updateTaskRequestFields;
import static tech.omarshabaan.tasksmanagement.restdocs.CommonRestDocsDescriptor.*;

@WebMvcTest(TaskController.class)
@AutoConfigureRestDocs
@Import({ SecurityConfig.class, GlobalExceptionHandler.class, DelegatedAuthenticationEntryPoint.class,
		DelegatedAccessDeniedHandler.class, RestDocsTestConfiguration.class })
class TaskControllerTest {

	@Autowired
	private MockMvc mockMvc;

	@MockitoBean
	private TaskService taskService;

	@MockitoBean
	private UserDetailsService userDetailsService;

	private static final UUID testUserUuid = UUID.randomUUID();

	private static final UUID testUserSecurityUuid = UUID.randomUUID();

	private static final String testEmail = "test@example.com";

	private UsernamePasswordAuthenticationToken createAuthentication() {
		CustomUserDetails userDetails = new CustomUserDetails(testUserUuid, testUserSecurityUuid, testEmail,
				List.of(new SimpleGrantedAuthority("ROLE_USER")), true, false);
		return new UsernamePasswordAuthenticationToken(userDetails, null, userDetails.getAuthorities());
	}

	@Test
	void shouldCreateTask_whenValidRequest() throws Exception {
		// Given
		UUID taskUuid = UUID.randomUUID();
		GetTaskResponse response = new GetTaskResponse(taskUuid, "Test Task", "Test Description", TaskStatus.PENDING,
				TaskPriority.HIGH, Instant.now().plus(7, ChronoUnit.DAYS), Instant.now(), Instant.now());

		given(taskService.createTask(any(), any())).willReturn(response);

		// When & Then
		mockMvc
			.perform(post("/api/tasks").contentType(MediaType.APPLICATION_JSON)
				.with(authentication(createAuthentication()))
				.content("""
						{
						  "title": "Test Task",
						  "description": "Test Description",
						  "priority": "HIGH",
						  "dueDate": "2025-12-31T23:59:59Z"
						}
						"""))
			.andExpect(status().isCreated())
			.andExpect(jsonPath("$.title").value("Test Task"))
			.andExpect(jsonPath("$.status").value("PENDING"))
			.andExpect(jsonPath("$.priority").value("HIGH"))
			.andDo(document("task-controller/create/success", preprocessRequest(prettyPrint()),
					preprocessResponse(prettyPrint()), requestFields(createTaskRequestFields),
					responseFields(taskResponseFields)));

		// Then
		then(taskService).should().createTask(any(), any());
	}

	@Test
	void shouldReturnBadRequest_whenTitleIsBlank() throws Exception {
		// Given - blank title

		// When & Then
		mockMvc
			.perform(post("/api/tasks").contentType(MediaType.APPLICATION_JSON)
				.with(authentication(createAuthentication()))
				.content("""
						{
						  "title": "",
						  "description": "Test Description",
						  "priority": "HIGH",
						  "dueDate": "2025-12-31T23:59:59Z"
						}
						"""))
			.andExpect(status().isBadRequest())
			.andDo(document("task-controller/create/blank-title", preprocessRequest(prettyPrint()),
					preprocessResponse(prettyPrint())));

		// Then
		then(taskService).shouldHaveNoInteractions();
	}

	@Test
	void shouldReturnBadRequest_whenPriorityIsNull() throws Exception {
		// Given - null priority

		// When & Then
		mockMvc
			.perform(post("/api/tasks").contentType(MediaType.APPLICATION_JSON)
				.with(authentication(createAuthentication()))
				.content("""
						{
						  "title": "Test Task",
						  "description": "Test Description",
						  "dueDate": "2025-12-31T23:59:59Z"
						}
						"""))
			.andExpect(status().isBadRequest())
			.andDo(document("task-controller/create/null-priority", preprocessRequest(prettyPrint()),
					preprocessResponse(prettyPrint())));

		// Then
		then(taskService).shouldHaveNoInteractions();
	}

	@Test
	void shouldGetUserTasks_whenTasksExist() throws Exception {
		// Given
		UUID taskUuid1 = UUID.randomUUID();
		UUID taskUuid2 = UUID.randomUUID();
		TaskSummaryResponse task1 = new TaskSummaryResponse(taskUuid1, "Task 1", TaskStatus.PENDING, TaskPriority.HIGH,
				Instant.now().plus(3, ChronoUnit.DAYS));
		TaskSummaryResponse task2 = new TaskSummaryResponse(taskUuid2, "Task 2", TaskStatus.IN_PROGRESS,
				TaskPriority.MEDIUM, Instant.now().plus(5, ChronoUnit.DAYS));

		given(taskService.getUserTasks(any(), isNull(), any()))
			.willReturn(new PageImpl<>(List.of(task1, task2), PageRequest.of(0, 20), 2));

		// When & Then
		mockMvc.perform(get("/api/tasks/me").with(authentication(createAuthentication())))
			.andExpect(status().isOk())
			.andExpect(jsonPath("$.content.size()").value(2))
			.andExpect(jsonPath("$.content[0].title").value("Task 1"))
			.andExpect(jsonPath("$.content[1].title").value("Task 2"))
			.andDo(document("task-controller/get-tasks/success", preprocessRequest(prettyPrint()),
					preprocessResponse(prettyPrint()),
					responseFields(fieldWithPath("content").description("Array of task summaries"))
						.andWithPrefix("content[].", taskSummaryResponseFields)
						.and(PAGINATION_FIELDS)));

		// Then
		then(taskService).should().getUserTasks(any(), isNull(), any());
	}

	@Test
	void shouldGetUserTasks_whenFilteredByStatus() throws Exception {
		// Given
		UUID taskUuid = UUID.randomUUID();
		TaskSummaryResponse task = new TaskSummaryResponse(taskUuid, "Pending Task", TaskStatus.PENDING,
				TaskPriority.HIGH, Instant.now().plus(3, ChronoUnit.DAYS));

		given(taskService.getUserTasks(any(), eq(TaskStatus.PENDING), any()))
			.willReturn(new PageImpl<>(List.of(task), PageRequest.of(0, 20), 1));

		// When & Then
		mockMvc.perform(get("/api/tasks/me").param("status", "PENDING").with(authentication(createAuthentication())))
			.andExpect(status().isOk())
			.andExpect(jsonPath("$.content.size()").value(1))
			.andExpect(jsonPath("$.content[0].status").value("PENDING"))
			.andDo(document("task-controller/get-tasks/filtered-by-status", preprocessRequest(prettyPrint()),
					preprocessResponse(prettyPrint())));

		// Then
		then(taskService).should().getUserTasks(any(), eq(TaskStatus.PENDING), any());
	}

	@Test
	void shouldGetTaskByUuid_whenTaskExists() throws Exception {
		// Given
		UUID taskUuid = UUID.randomUUID();
		GetTaskResponse response = new GetTaskResponse(taskUuid, "Test Task", "Test Description", TaskStatus.PENDING,
				TaskPriority.HIGH, Instant.now().plus(7, ChronoUnit.DAYS), Instant.now(), Instant.now());

		given(taskService.getTaskByUuid(eq(taskUuid), any())).willReturn(response);

		// When & Then
		mockMvc.perform(get("/api/tasks/{taskUuid}", taskUuid).with(authentication(createAuthentication())))
			.andExpect(status().isOk())
			.andExpect(jsonPath("$.uuid").value(taskUuid.toString()))
			.andExpect(jsonPath("$.title").value("Test Task"))
			.andDo(document("task-controller/get-task/success", preprocessRequest(prettyPrint()),
					preprocessResponse(prettyPrint()),
					pathParameters(parameterWithName("taskUuid").description("UUID of the task to retrieve")),
					responseFields(taskResponseFields)));

		// Then
		then(taskService).should().getTaskByUuid(eq(taskUuid), any());
	}

	@Test
	void shouldUpdateTask_whenValidRequest() throws Exception {
		// Given
		UUID taskUuid = UUID.randomUUID();
		GetTaskResponse response = new GetTaskResponse(taskUuid, "Updated Task", "Updated Description",
				TaskStatus.IN_PROGRESS, TaskPriority.URGENT, Instant.now().plus(5, ChronoUnit.DAYS), Instant.now(),
				Instant.now());

		given(taskService.updateTask(eq(taskUuid), any(), any())).willReturn(response);

		// When & Then
		mockMvc
			.perform(put("/api/tasks/{taskUuid}", taskUuid).contentType(MediaType.APPLICATION_JSON)
				.with(authentication(createAuthentication()))
				.content("""
						{
						  "title": "Updated Task",
						  "description": "Updated Description",
						  "status": "IN_PROGRESS",
						  "priority": "URGENT",
						  "dueDate": "2025-12-25T12:00:00Z"
						}
						"""))
			.andExpect(status().isOk())
			.andExpect(jsonPath("$.title").value("Updated Task"))
			.andExpect(jsonPath("$.status").value("IN_PROGRESS"))
			.andExpect(jsonPath("$.priority").value("URGENT"))
			.andDo(document("task-controller/update/success", preprocessRequest(prettyPrint()),
					preprocessResponse(prettyPrint()),
					pathParameters(parameterWithName("taskUuid").description("UUID of the task to update")),
					requestFields(updateTaskRequestFields), responseFields(taskResponseFields)));

		// Then
		then(taskService).should().updateTask(eq(taskUuid), any(), any());
	}

	@Test
	void shouldDeleteTask_whenTaskExists() throws Exception {
		// Given
		UUID taskUuid = UUID.randomUUID();
		willDoNothing().given(taskService).deleteTask(eq(taskUuid), any());

		// When & Then
		mockMvc.perform(delete("/api/tasks/{taskUuid}", taskUuid).with(authentication(createAuthentication())))
			.andExpect(status().isNoContent())
			.andDo(document("task-controller/delete/success", preprocessRequest(prettyPrint()),
					preprocessResponse(prettyPrint()),
					pathParameters(parameterWithName("taskUuid").description("UUID of the task to delete"))));

		// Then
		then(taskService).should().deleteTask(eq(taskUuid), any());
	}

	@Test
	void shouldReturnUnauthorized_whenNotAuthenticated() throws Exception {
		// Given - no authentication

		// When & Then
		mockMvc.perform(post("/api/tasks").contentType(MediaType.APPLICATION_JSON).content("""
				{
				  "title": "Test Task",
				  "description": "Test Description",
				  "priority": "HIGH",
				  "dueDate": "2025-12-31T23:59:59Z"
				}
				"""))
			.andExpect(status().isUnauthorized())
			.andDo(document("task-controller/create/unauthorized", preprocessRequest(prettyPrint()),
					preprocessResponse(prettyPrint())));

		// Then
		then(taskService).shouldHaveNoInteractions();
	}

	/**
	 * REST Docs field descriptors for Task endpoints
	 */
	static class TaskControllerSnippets {

		static final FieldDescriptor[] createTaskRequestFields = new FieldDescriptor[] {
				fieldWithPath("title").description("Title of the task")
					.attributes(key("constraints").value("Must not be blank")),
				fieldWithPath("description").description("Detailed description of the task")
					.attributes(key("constraints").value("Optional field"))
					.optional(),
				fieldWithPath("priority").description("Priority level of the task")
					.attributes(key("constraints").value("Must be one of: LOW, MEDIUM, HIGH, URGENT")),
				fieldWithPath("dueDate").description("Due date and time for the task in UTC")
					.attributes(key("constraints").value("Must be an ISO 8601 instant (e.g. 2025-12-31T23:59:59Z)"))
					.optional() };

		static final FieldDescriptor[] updateTaskRequestFields = new FieldDescriptor[] {
				fieldWithPath("title").description("Updated title of the task")
					.attributes(key("constraints").value("Optional, must not be blank if provided"))
					.optional(),
				fieldWithPath("description").description("Updated description of the task")
					.attributes(key("constraints").value("Optional field"))
					.optional(),
				fieldWithPath("status").description("Updated status of the task")
					.attributes(key("constraints")
						.value("Optional, must be one of: PENDING, IN_PROGRESS, COMPLETED, CANCELLED"))
					.optional(),
				fieldWithPath("priority").description("Updated priority of the task")
					.attributes(key("constraints").value("Optional, must be one of: LOW, MEDIUM, HIGH, URGENT"))
					.optional(),
				fieldWithPath("dueDate").description("Updated due date and time in UTC")
					.attributes(key("constraints").value("Optional, must be an ISO 8601 instant"))
					.optional() };

		static final FieldDescriptor[] taskResponseFields = new FieldDescriptor[] {
				fieldWithPath("uuid").description("Unique identifier for the task"),
				fieldWithPath("title").description("Title of the task"),
				fieldWithPath("description").description("Description of the task"),
				fieldWithPath("status")
					.description("Current status of the task (PENDING, IN_PROGRESS, COMPLETED, CANCELLED)"),
				fieldWithPath("priority").description("Priority level (LOW, MEDIUM, HIGH, URGENT)"),
				fieldWithPath("dueDate").description("Due date and time in UTC").type("Instant").optional(),
				fieldWithPath("createdAt").description("Timestamp when the task was created"),
				fieldWithPath("updatedAt").description("Timestamp when the task was last updated") };

		static final FieldDescriptor[] taskSummaryResponseFields = new FieldDescriptor[] {
				fieldWithPath("uuid").description("Unique identifier for the task"),
				fieldWithPath("title").description("Title of the task"),
				fieldWithPath("status").description("Current status of the task"),
				fieldWithPath("priority").description("Priority level of the task"),
				fieldWithPath("dueDate").description("Due date and time in UTC").optional() };

	}

}
