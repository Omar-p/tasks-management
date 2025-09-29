package tech.omarshabaan.tasksmanagement.repository.user;

import org.springframework.data.jpa.repository.JpaRepository;
import tech.omarshabaan.tasksmanagement.entity.User;
import tech.omarshabaan.tasksmanagement.entity.UserSecurity;

import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {

	boolean existsByUsername(String username);

	Optional<User> findByUserSecurity(UserSecurity userSecurity);

}
