package tech.omarshabaan.tasksmanagement.repository.user;

import org.springframework.data.jpa.repository.JpaRepository;
import tech.omarshabaan.tasksmanagement.entity.User;

public interface UserRepository extends JpaRepository<User, Long> {

	boolean existsByUsername(String username);

}
