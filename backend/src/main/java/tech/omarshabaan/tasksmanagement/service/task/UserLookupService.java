package tech.omarshabaan.tasksmanagement.service.task;

import tech.omarshabaan.tasksmanagement.entity.User;
import tech.omarshabaan.tasksmanagement.entity.UserSecurity;

public interface UserLookupService {

	User findUserByUserSecurity(UserSecurity userSecurity);

}