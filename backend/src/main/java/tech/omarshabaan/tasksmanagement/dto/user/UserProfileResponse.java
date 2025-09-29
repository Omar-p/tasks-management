package tech.omarshabaan.tasksmanagement.dto.user;

import java.util.UUID;

public record UserProfileResponse(
	UUID uuid,
	String username,
	String email
) {}