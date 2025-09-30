package tech.omarshabaan.tasksmanagement.controller.task;

import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import tech.omarshabaan.tasksmanagement.dto.task.CreateTaskRequest;
import tech.omarshabaan.tasksmanagement.dto.task.GetTaskResponse;
import tech.omarshabaan.tasksmanagement.dto.task.TaskSummaryResponse;
import tech.omarshabaan.tasksmanagement.dto.task.UpdateTaskRequest;
import tech.omarshabaan.tasksmanagement.entity.TaskStatus;
import tech.omarshabaan.tasksmanagement.security.CustomUserDetails;
import tech.omarshabaan.tasksmanagement.service.task.TaskService;

import java.util.UUID;

@RestController
@RequestMapping("/api/tasks")
public class TaskController {

	private final TaskService taskService;

	public TaskController(TaskService taskService) {
		this.taskService = taskService;
	}

	@PostMapping
	public ResponseEntity<GetTaskResponse> createTask(@Valid @RequestBody CreateTaskRequest request,
			@AuthenticationPrincipal CustomUserDetails userDetails) {
		GetTaskResponse response = taskService.createTask(request, userDetails.getUserSecurity());
		return ResponseEntity.status(HttpStatus.CREATED).body(response);
	}

	@GetMapping("/me")
	public ResponseEntity<Page<TaskSummaryResponse>> getTasks(@AuthenticationPrincipal CustomUserDetails userDetails,
			@RequestParam(required = false) TaskStatus status, @PageableDefault(size = 20) Pageable pageable) {
		Page<TaskSummaryResponse> tasks = taskService.getUserTasks(userDetails.getUserSecurity(), status, pageable);
		return ResponseEntity.ok(tasks);
	}

	@GetMapping("/{taskUuid}")
	public ResponseEntity<GetTaskResponse> getTask(@PathVariable UUID taskUuid,
			@AuthenticationPrincipal CustomUserDetails userDetails) {
		GetTaskResponse response = taskService.getTaskByUuid(taskUuid, userDetails.getUserSecurity());
		return ResponseEntity.ok(response);
	}

	@PutMapping("/{taskUuid}")
	public ResponseEntity<GetTaskResponse> updateTask(@PathVariable UUID taskUuid,
			@RequestBody UpdateTaskRequest request, @AuthenticationPrincipal CustomUserDetails userDetails) {
		GetTaskResponse response = taskService.updateTask(taskUuid, request, userDetails.getUserSecurity());
		return ResponseEntity.ok(response);
	}

	@DeleteMapping("/{taskUuid}")
	public ResponseEntity<Void> deleteTask(@PathVariable UUID taskUuid,
			@AuthenticationPrincipal CustomUserDetails userDetails) {
		taskService.deleteTask(taskUuid, userDetails.getUserSecurity());
		return ResponseEntity.noContent().build();
	}

}
