package tech.omarshabaan.tasksmanagement.event;

import tech.omarshabaan.tasksmanagement.entity.UserSecurity;

public record UserSecurityCreatedEvent(UserSecurity userSecurity, String username) {
}
