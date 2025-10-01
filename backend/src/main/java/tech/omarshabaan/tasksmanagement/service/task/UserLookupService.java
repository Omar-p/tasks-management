package tech.omarshabaan.tasksmanagement.service.task;

import tech.omarshabaan.tasksmanagement.entity.User;

import java.util.UUID;

public interface UserLookupService {

	User findUserByUuid(UUID userUuid);

}