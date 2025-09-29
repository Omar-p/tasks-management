package tech.omarshabaan.tasksmanagement.dto.task;

import tech.omarshabaan.tasksmanagement.entity.TaskPriority;
import tech.omarshabaan.tasksmanagement.entity.TaskStatus;

import java.time.LocalDateTime;

public record UpdateTaskRequest(
	String title,
	String description,
	TaskStatus status,
	TaskPriority priority,
	LocalDateTime dueDate
) {}