package tech.omarshabaan.tasksmanagement;

import tech.omarshabaan.tasksmanagement.dto.auth.UserSigninRequest;
import tech.omarshabaan.tasksmanagement.dto.auth.UserSignupRequest;
import tech.omarshabaan.tasksmanagement.dto.task.CreateTaskRequest;
import tech.omarshabaan.tasksmanagement.dto.task.UpdateTaskRequest;
import tech.omarshabaan.tasksmanagement.entity.TaskPriority;
import tech.omarshabaan.tasksmanagement.entity.TaskStatus;

import java.time.Instant;
import java.time.temporal.ChronoUnit;

public abstract class TestObjects {

	// Auth test objects
	public static UserSignupRequest validSignupRequest = new UserSignupRequest("Omar", "omar@omarshabaan.tech",
			"P@ssw0rd1@", "P@ssw0rd1@");

	public static UserSignupRequest violatingPasswordMatchingSignupRequest = new UserSignupRequest("Omar",
			"omar@omarshabaan.tech", "P@ssw0rd1@", "P@ssw0rd2@");

	public static UserSignupRequest testUserSignupRequest = new UserSignupRequest("testuser", "test@example.com",
			"P@ssw0rd123!", "P@ssw0rd123!");

	public static UserSigninRequest testUserSigninRequest = new UserSigninRequest("test@example.com", "P@ssw0rd123!");

	public static UserSigninRequest taskUserSigninRequest = new UserSigninRequest("taskuser@example.com",
			"P@ssw0rd123!");

	// Task test objects
	public static CreateTaskRequest validCreateTaskRequest = new CreateTaskRequest("Test Task",
			"This is a test task description", TaskPriority.HIGH, Instant.now().plus(7, ChronoUnit.DAYS));

	public static UpdateTaskRequest validUpdateTaskRequest = new UpdateTaskRequest("Updated Test Task",
			"This is an updated test task description", TaskStatus.IN_PROGRESS, TaskPriority.URGENT,
			Instant.now().plus(5, ChronoUnit.DAYS));

}
