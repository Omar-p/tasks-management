package tech.omarshabaan.tasksmanagement;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import tech.omarshabaan.tasksmanagement.repository.auth.RefreshTokenRepository;
import tech.omarshabaan.tasksmanagement.repository.auth.RoleRepository;
import tech.omarshabaan.tasksmanagement.repository.auth.UserSecurityRepository;
import tech.omarshabaan.tasksmanagement.repository.task.TaskRepository;
import tech.omarshabaan.tasksmanagement.repository.user.UserRepository;
import tech.omarshabaan.tasksmanagement.service.auth.RefreshTokenService;

/**
 * Base class for integration tests using TestContainers. Reuses Spring context and
 * PostgreSQL container across all tests for better performance.
 */
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@AutoConfigureMockMvc
@Import(TestcontainersConfiguration.class)
@ActiveProfiles("test")
public abstract class BaseIT {

	@Autowired
	protected MockMvc mockMvc;

	@Autowired
	protected ObjectMapper objectMapper;

	@Autowired
	protected UserRepository userRepository;

	@Autowired
	protected UserSecurityRepository userSecurityRepository;

	@Autowired
	protected RefreshTokenRepository refreshTokenRepository;

	@Autowired
	protected TaskRepository taskRepository;

	@Autowired
	protected RoleRepository roleRepository;

	@Autowired
	protected PasswordEncoder passwordEncoder;

	@Autowired
	protected RefreshTokenService refreshTokenService;

}