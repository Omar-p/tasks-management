package tech.omarshabaan.tasksmanagement.integration;

import com.fasterxml.jackson.core.type.TypeReference;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.transaction.annotation.Transactional;
import tech.omarshabaan.tasksmanagement.BaseIT;
import tech.omarshabaan.tasksmanagement.TestObjects;
import tech.omarshabaan.tasksmanagement.dto.auth.UserSigninResponse;
import tech.omarshabaan.tasksmanagement.dto.task.GetTaskResponse;
import tech.omarshabaan.tasksmanagement.entity.Role;
import tech.omarshabaan.tasksmanagement.entity.RoleName;
import tech.omarshabaan.tasksmanagement.entity.TaskPriority;
import tech.omarshabaan.tasksmanagement.entity.TaskStatus;
import tech.omarshabaan.tasksmanagement.entity.User;
import tech.omarshabaan.tasksmanagement.entity.UserSecurity;

import java.util.Map;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Integration tests for Task CRUD operations. Tests creation, retrieval, update, and
 * deletion of tasks with pre-inserted user.
 */
@Transactional
class TaskIntegrationTest extends BaseIT {

	private String accessToken;

	private User testUser;

	@BeforeEach
	void setUp() throws Exception {
		// Clean up
		taskRepository.deleteAll();
		refreshTokenRepository.deleteAll();
		userRepository.deleteAll();
		userSecurityRepository.deleteAll();

		// Create and save user with user security
		Role userRole = roleRepository.findByName(RoleName.USER)
			.orElseThrow(() -> new RuntimeException("USER role not found"));

		UserSecurity userSecurity = new UserSecurity.Builder().email("taskuser@example.com")
			.password(passwordEncoder.encode("P@ssw0rd123!"))
			.locked(false)
			.enabled(true)
			.addRole(userRole)
			.build();

		userSecurity = userSecurityRepository.save(userSecurity);

		testUser = new User("taskuser", userSecurity);
		testUser = userRepository.save(testUser);

		// Sign in to get access token
		MvcResult signinResult = mockMvc
			.perform(post("/api/auth/signin").contentType(MediaType.APPLICATION_JSON)
				.content(objectMapper.writeValueAsString(TestObjects.taskUserSigninRequest)))
			.andExpect(status().isOk())
			.andReturn();

		String responseBody = signinResult.getResponse().getContentAsString();
		UserSigninResponse signinResponse = objectMapper.readValue(responseBody, UserSigninResponse.class);
		accessToken = signinResponse.accessToken();
	}

	@Test
	void shouldCreateTask_ThenGetTasks_ThenUpdateTask_ThenDeleteTask() throws Exception {
		// When - Create task
		MvcResult createResult = mockMvc
			.perform(post("/api/tasks").contentType(MediaType.APPLICATION_JSON)
				.header("Authorization", "Bearer " + accessToken)
				.content(objectMapper.writeValueAsString(TestObjects.validCreateTaskRequest)))
			.andExpect(status().isCreated())
			.andReturn();

		String createResponseBody = createResult.getResponse().getContentAsString();
		GetTaskResponse createdTask = objectMapper.readValue(createResponseBody, GetTaskResponse.class);

		// Then - Verify task was created
		assertThat(createdTask).isNotNull();
		assertThat(createdTask.title()).isEqualTo("Test Task");
		assertThat(createdTask.description()).isEqualTo("This is a test task description");
		assertThat(createdTask.priority()).isEqualTo(TaskPriority.HIGH);
		assertThat(createdTask.status()).isEqualTo(TaskStatus.PENDING);
		UUID taskUuid = createdTask.uuid();
		assertThat(taskUuid).isNotNull();

		// When - Get all tasks
		MvcResult getTasksResult = mockMvc
			.perform(get("/api/tasks/me").header("Authorization", "Bearer " + accessToken))
			.andExpect(status().isOk())
			.andReturn();

		String getTasksResponseBody = getTasksResult.getResponse().getContentAsString();
		Map<String, Object> tasksPage = objectMapper.readValue(getTasksResponseBody, new TypeReference<>() {
		});

		// Then - Verify task is in the list
		assertThat(tasksPage).containsKey("content");
		@SuppressWarnings("unchecked")
		var tasks = (java.util.List<Map<String, Object>>) tasksPage.get("content");
		assertThat(tasks).hasSize(1);
		assertThat(tasks.get(0).get("title")).isEqualTo("Test Task");

		// When - Update task
		MvcResult updateResult = mockMvc
			.perform(put("/api/tasks/" + taskUuid).contentType(MediaType.APPLICATION_JSON)
				.header("Authorization", "Bearer " + accessToken)
				.content(objectMapper.writeValueAsString(TestObjects.validUpdateTaskRequest)))
			.andExpect(status().isOk())
			.andReturn();

		String updateResponseBody = updateResult.getResponse().getContentAsString();
		GetTaskResponse updatedTask = objectMapper.readValue(updateResponseBody, GetTaskResponse.class);

		// Then - Verify task was updated
		assertThat(updatedTask.uuid()).isEqualTo(taskUuid);
		assertThat(updatedTask.title()).isEqualTo("Updated Test Task");
		assertThat(updatedTask.description()).isEqualTo("This is an updated test task description");
		assertThat(updatedTask.status()).isEqualTo(TaskStatus.IN_PROGRESS);
		assertThat(updatedTask.priority()).isEqualTo(TaskPriority.URGENT);

		// Verify in database
		assertThat(taskRepository.count()).isEqualTo(1);

		// When - Delete task
		mockMvc.perform(delete("/api/tasks/" + taskUuid).header("Authorization", "Bearer " + accessToken))
			.andExpect(status().isNoContent());

		// Then - Verify task was deleted
		assertThat(taskRepository.count()).isEqualTo(0);
	}

}
