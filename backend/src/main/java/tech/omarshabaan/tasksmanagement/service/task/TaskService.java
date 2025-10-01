package tech.omarshabaan.tasksmanagement.service.task;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import tech.omarshabaan.tasksmanagement.dto.task.CreateTaskRequest;
import tech.omarshabaan.tasksmanagement.dto.task.GetTaskResponse;
import tech.omarshabaan.tasksmanagement.dto.task.TaskSummaryResponse;
import tech.omarshabaan.tasksmanagement.dto.task.UpdateTaskRequest;
import tech.omarshabaan.tasksmanagement.entity.Task;
import tech.omarshabaan.tasksmanagement.entity.TaskStatus;
import tech.omarshabaan.tasksmanagement.entity.User;
import tech.omarshabaan.tasksmanagement.repository.task.TaskRepository;

import java.util.UUID;

@Service
@Transactional
public class TaskService {

	private final TaskRepository taskRepository;

	private final UserLookupService userLookupService;

	public TaskService(TaskRepository taskRepository, UserLookupService userLookupService) {
		this.taskRepository = taskRepository;
		this.userLookupService = userLookupService;
	}

	public GetTaskResponse createTask(CreateTaskRequest request, UUID userUuid) {
		User user = userLookupService.findUserByUuid(userUuid);

		Task task = new Task(request.title(), request.description(), request.priority(), request.dueDate(), user, user);

		Task savedTask = taskRepository.save(task);
		return mapToGetTaskResponse(savedTask);
	}

	@Transactional(readOnly = true)
	public Page<TaskSummaryResponse> getUserTasks(UUID userUuid, TaskStatus status, Pageable pageable) {
		User user = userLookupService.findUserByUuid(userUuid);

		if (status != null) {
			return taskRepository.findByAssignedToAndStatus(user, status, pageable).map(this::mapToTaskSummaryResponse);
		}
		else {
			return taskRepository.findByAssignedTo(user, pageable).map(this::mapToTaskSummaryResponse);
		}
	}

	@Transactional(readOnly = true)
	public GetTaskResponse getTaskByUuid(UUID taskUuid, UUID userUuid) {
		User user = userLookupService.findUserByUuid(userUuid);

		Task task = taskRepository.findByUuidAndAssignedTo(taskUuid, user)
			.orElseThrow(() -> new RuntimeException("Task not found"));

		return mapToGetTaskResponse(task);
	}

	public GetTaskResponse updateTask(UUID taskUuid, UpdateTaskRequest request, UUID userUuid) {
		User user = userLookupService.findUserByUuid(userUuid);

		Task task = taskRepository.findByUuidAndAssignedTo(taskUuid, user)
			.orElseThrow(() -> new RuntimeException("Task not found"));

		if (request.title() != null) {
			task.setTitle(request.title());
		}
		if (request.description() != null) {
			task.setDescription(request.description());
		}
		if (request.status() != null) {
			task.setStatus(request.status());
		}
		if (request.priority() != null) {
			task.setPriority(request.priority());
		}
		if (request.dueDate() != null) {
			task.setDueDate(request.dueDate());
		}

		Task savedTask = taskRepository.save(task);
		return mapToGetTaskResponse(savedTask);
	}

	public void deleteTask(UUID taskUuid, UUID userUuid) {
		User user = userLookupService.findUserByUuid(userUuid);

		Task task = taskRepository.findByUuidAndAssignedTo(taskUuid, user)
			.orElseThrow(() -> new RuntimeException("Task not found"));

		taskRepository.delete(task);
	}

	private GetTaskResponse mapToGetTaskResponse(Task task) {
		return new GetTaskResponse(task.getUuid(), task.getTitle(), task.getDescription(), task.getStatus(),
				task.getPriority(), task.getDueDate(), task.getCreatedAt(), task.getUpdatedAt());
	}

	private TaskSummaryResponse mapToTaskSummaryResponse(Task task) {
		return new TaskSummaryResponse(task.getUuid(), task.getTitle(), task.getStatus(), task.getPriority(),
				task.getDueDate());
	}

}