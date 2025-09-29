package tech.omarshabaan.tasksmanagement.validation;

import jakarta.validation.GroupSequence;

@GroupSequence({ BasicSignupRequestValidation.class, AdvancedSignupRequestValidation.class })
public interface CompleteSignupRequestValidation {

}
