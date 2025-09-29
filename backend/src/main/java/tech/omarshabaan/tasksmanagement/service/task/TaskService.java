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
import tech.omarshabaan.tasksmanagement.entity.UserSecurity;
import tech.omarshabaan.tasksmanagement.repository.task.TaskRepository;
import tech.omarshabaan.tasksmanagement.repository.user.UserRepository;

import java.util.UUID;

@Service
@Transactional
public class TaskService {

	private final TaskRepository taskRepository;
	private final UserRepository userRepository;

	public TaskService(TaskRepository taskRepository, UserRepository userRepository) {
		this.taskRepository = taskRepository;
		this.userRepository = userRepository;
	}

	public GetTaskResponse createTask(CreateTaskRequest request, UserSecurity userSecurity) {
		User user = userRepository.findByUserSecurity(userSecurity)
			.orElseThrow(() -> new RuntimeException("User not found"));

		Task task = new Task(
			request.title(),
			request.description(),
			request.priority(),
			request.dueDate(),
			user,
			user
		);

		Task savedTask = taskRepository.save(task);
		return mapToGetTaskResponse(savedTask);
	}

	@Transactional(readOnly = true)
	public Page<TaskSummaryResponse> getUserTasks(UserSecurity userSecurity, Pageable pageable) {
		User user = userRepository.findByUserSecurity(userSecurity)
			.orElseThrow(() -> new RuntimeException("User not found"));

		return taskRepository.findByAssignedTo(user, pageable)
			.map(this::mapToTaskSummaryResponse);
	}

	@Transactional(readOnly = true)
	public Page<TaskSummaryResponse> getUserTasksByStatus(UserSecurity userSecurity, TaskStatus status, Pageable pageable) {
		User user = userRepository.findByUserSecurity(userSecurity)
			.orElseThrow(() -> new RuntimeException("User not found"));

		return taskRepository.findByAssignedToAndStatus(user, status, pageable)
			.map(this::mapToTaskSummaryResponse);
	}

	@Transactional(readOnly = true)
	public GetTaskResponse getTaskByUuid(UUID taskUuid, UserSecurity userSecurity) {
		User user = userRepository.findByUserSecurity(userSecurity)
			.orElseThrow(() -> new RuntimeException("User not found"));

		Task task = taskRepository.findByUuidAndAssignedTo(taskUuid, user)
			.orElseThrow(() -> new RuntimeException("Task not found"));

		return mapToGetTaskResponse(task);
	}

	public GetTaskResponse updateTask(UUID taskUuid, UpdateTaskRequest request, UserSecurity userSecurity) {
		User user = userRepository.findByUserSecurity(userSecurity)
			.orElseThrow(() -> new RuntimeException("User not found"));

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

	public void deleteTask(UUID taskUuid, UserSecurity userSecurity) {
		User user = userRepository.findByUserSecurity(userSecurity)
			.orElseThrow(() -> new RuntimeException("User not found"));

		Task task = taskRepository.findByUuidAndAssignedTo(taskUuid, user)
			.orElseThrow(() -> new RuntimeException("Task not found"));

		taskRepository.delete(task);
	}

	private GetTaskResponse mapToGetTaskResponse(Task task) {
		return new GetTaskResponse(
			task.getUuid(),
			task.getTitle(),
			task.getDescription(),
			task.getStatus(),
			task.getPriority(),
			task.getDueDate(),
			task.getCreatedAt(),
			task.getUpdatedAt()
		);
	}

	private TaskSummaryResponse mapToTaskSummaryResponse(Task task) {
		return new TaskSummaryResponse(
			task.getUuid(),
			task.getTitle(),
			task.getStatus(),
			task.getPriority(),
			task.getDueDate()
		);
	}
}