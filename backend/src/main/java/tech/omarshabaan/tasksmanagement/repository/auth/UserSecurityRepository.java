package tech.omarshabaan.tasksmanagement.repository.auth;

import org.springframework.data.jpa.repository.JpaRepository;
import tech.omarshabaan.tasksmanagement.entity.UserSecurity;

import java.util.Optional;

public interface UserSecurityRepository extends JpaRepository<UserSecurity, Long> {

	boolean existsByEmail(String email);

	Optional<UserSecurity> findByEmail(String email);

}
