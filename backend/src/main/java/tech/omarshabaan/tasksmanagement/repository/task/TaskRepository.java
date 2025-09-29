package tech.omarshabaan.tasksmanagement.repository.task;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import tech.omarshabaan.tasksmanagement.entity.Task;
import tech.omarshabaan.tasksmanagement.entity.TaskStatus;
import tech.omarshabaan.tasksmanagement.entity.User;

import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;

public interface TaskRepository extends JpaRepository<Task, Long> {

	Page<Task> findByCreatedBy(User user, Pageable pageable);

	Page<Task> findByAssignedTo(User user, Pageable pageable);

	Page<Task> findByCreatedByAndStatus(User user, TaskStatus status, Pageable pageable);

	Page<Task> findByAssignedToAndStatus(User user, TaskStatus status, Pageable pageable);

	Optional<Task> findByUuidAndCreatedBy(UUID uuid, User user);

	Optional<Task> findByUuidAndAssignedTo(UUID uuid, User user);

	@Query("SELECT t FROM Task t WHERE t.createdBy = :user AND t.dueDate BETWEEN :start AND :end")
	Page<Task> findByCreatedByAndDueDateBetween(@Param("user") User user, @Param("start") LocalDateTime start, @Param("end") LocalDateTime end, Pageable pageable);

	@Query("SELECT t FROM Task t WHERE t.assignedTo = :user AND t.dueDate BETWEEN :start AND :end")
	Page<Task> findByAssignedToAndDueDateBetween(@Param("user") User user, @Param("start") LocalDateTime start, @Param("end") LocalDateTime end, Pageable pageable);

	long countByCreatedByAndStatus(User user, TaskStatus status);

	long countByAssignedToAndStatus(User user, TaskStatus status);
}