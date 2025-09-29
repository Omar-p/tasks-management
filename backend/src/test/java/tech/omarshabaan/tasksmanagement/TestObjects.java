package tech.omarshabaan.tasksmanagement;

import tech.omarshabaan.tasksmanagement.dto.auth.UserSignupRequest;

public abstract class TestObjects {

	public static UserSignupRequest validSignupRequest = new UserSignupRequest("Omar", "omar@omarshabaan.tech",
			"P@ssw0rd1@", "P@ssw0rd1@");

	public static UserSignupRequest violatingPasswordMatchingSignupRequest = new UserSignupRequest("Omar",
			"omar@omarshabaan.tech", "P@ssw0rd1@", "P@ssw0rd2@");

}
