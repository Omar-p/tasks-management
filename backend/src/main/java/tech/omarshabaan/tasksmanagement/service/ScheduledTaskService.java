package tech.omarshabaan.tasksmanagement.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import tech.omarshabaan.tasksmanagement.service.auth.RefreshTokenService;

@Service
public class ScheduledTaskService {

	private static final Logger logger = LoggerFactory.getLogger(ScheduledTaskService.class);

	private final RefreshTokenService refreshTokenService;

	public ScheduledTaskService(RefreshTokenService refreshTokenService) {
		this.refreshTokenService = refreshTokenService;
	}

	@Scheduled(cron = "0 0 2 * * ?") // Run daily at 2 AM
	public void cleanupExpiredRefreshTokens() {
		logger.info("Starting cleanup of expired refresh tokens");
		try {
			refreshTokenService.deleteExpiredTokens();
			logger.info("Successfully completed cleanup of expired refresh tokens");
		}
		catch (Exception e) {
			logger.error("Error occurred during refresh token cleanup", e);
		}
	}

}