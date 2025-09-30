package tech.omarshabaan.tasksmanagement.dto.auth;

import tech.omarshabaan.tasksmanagement.entity.RefreshToken;

public record RefreshTokenResponse(RefreshToken entity, String rawToken) {

}