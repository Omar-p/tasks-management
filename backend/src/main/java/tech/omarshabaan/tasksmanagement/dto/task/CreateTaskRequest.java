package tech.omarshabaan.tasksmanagement.dto.task;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import tech.omarshabaan.tasksmanagement.entity.TaskPriority;

import java.time.Instant;

public record CreateTaskRequest(//
		@NotBlank(message = "Title is required") String title, //

		String description, //

		@NotNull(message = "Priority is required") //
		TaskPriority priority,

		Instant dueDate) {
}
