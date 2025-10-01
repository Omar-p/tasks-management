package tech.omarshabaan.tasksmanagement.exception;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.HttpStatusCode;
import org.springframework.http.ProblemDetail;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.AuthenticationException;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.context.request.WebRequest;
import org.springframework.web.servlet.mvc.method.annotation.ResponseEntityExceptionHandler;

import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

@RestControllerAdvice
public class GlobalExceptionHandler extends ResponseEntityExceptionHandler {

	private static final Logger logger = LoggerFactory.getLogger(GlobalExceptionHandler.class);

	@Override
	protected ResponseEntity<Object> handleMethodArgumentNotValid(MethodArgumentNotValidException ex,
			HttpHeaders headers, HttpStatusCode status, WebRequest request) {
		logger.warn("Validation error: {}", ex.getMessage());

		var errors = ex.getBindingResult().getAllErrors().stream().map(err -> {
			if (err instanceof FieldError)
				return Map.of(((FieldError) err).getField(), err.getDefaultMessage());
			return Map.of(err.getObjectName(), err.getDefaultMessage());
		}).map(Map::entrySet).flatMap(Set::stream).collect(Collectors.toMap(Map.Entry::getKey, Map.Entry::getValue));

		var problemDetail = ProblemDetail.forStatusAndDetail(HttpStatus.BAD_REQUEST, "Validation failed");
		problemDetail.setTitle("Validation Error");
		problemDetail.setProperty("errors", errors);

		return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(problemDetail);
	}

	@ExceptionHandler(AuthenticationException.class)
	@ResponseStatus(HttpStatus.UNAUTHORIZED)
	ProblemDetail handleAuthenticationException(AuthenticationException ex) {
		logger.warn("Spring Security authentication failed: {}", ex.getMessage());

		var problemDetail = ProblemDetail.forStatusAndDetail(HttpStatus.UNAUTHORIZED, "Invalid credentials");
		problemDetail.setTitle("Authentication Failed");
		return problemDetail;
	}

	@ExceptionHandler(InvalidRefreshTokenException.class)
	@ResponseStatus(HttpStatus.UNAUTHORIZED)
	ProblemDetail handleInvalidRefreshTokenException(InvalidRefreshTokenException ex) {
		logger.warn("Invalid refresh token access attempt: {}", ex.getMessage());

		var problemDetail = ProblemDetail.forStatusAndDetail(HttpStatus.UNAUTHORIZED, ex.getMessage());
		problemDetail.setTitle("Invalid Refresh Token");
		return problemDetail;
	}

	@ExceptionHandler(AccessDeniedException.class)
	@ResponseStatus(HttpStatus.FORBIDDEN)
	ProblemDetail handleAccessDeniedException(AccessDeniedException ex) {
		logger.warn("Access denied: {}", ex.getMessage());

		var problemDetail = ProblemDetail.forStatusAndDetail(HttpStatus.FORBIDDEN,
				"You do not have permission to access this resource");
		problemDetail.setTitle("Access Denied");
		return problemDetail;
	}

	@ExceptionHandler(Exception.class)
	@ResponseStatus(HttpStatus.INTERNAL_SERVER_ERROR)
	ProblemDetail handleGenericException(Exception ex) {
		logger.error("Unexpected error occurred", ex);

		var problemDetail = ProblemDetail.forStatusAndDetail(HttpStatus.INTERNAL_SERVER_ERROR,
				"An unexpected error occurred");
		problemDetail.setTitle("Internal Server Error");
		return problemDetail;
	}

}
