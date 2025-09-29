package tech.omarshabaan.tasksmanagement.dto.task;

import tech.omarshabaan.tasksmanagement.entity.TaskPriority;
import tech.omarshabaan.tasksmanagement.entity.TaskStatus;

import java.time.Instant;
import java.time.LocalDateTime;
import java.util.UUID;

public record GetTaskResponse(UUID uuid, String title, String description, TaskStatus status, TaskPriority priority,
		LocalDateTime dueDate, Instant createdAt, Instant updatedAt) {
}
