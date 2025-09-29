package tech.omarshabaan.tasksmanagement.repository.auth;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import tech.omarshabaan.tasksmanagement.entity.Role;
import tech.omarshabaan.tasksmanagement.entity.RoleName;

import java.util.Optional;

@Repository
public interface RoleRepository extends JpaRepository<Role, Long> {

	Optional<Role> findByName(RoleName name);

}