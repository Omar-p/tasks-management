package tech.omarshabaan.tasksmanagement.dto.task;

import tech.omarshabaan.tasksmanagement.entity.TaskPriority;
import tech.omarshabaan.tasksmanagement.entity.TaskStatus;

import java.time.Instant;
import java.util.UUID;

public record TaskSummaryResponse(UUID uuid, String title, TaskStatus status, TaskPriority priority, Instant dueDate) {
}
