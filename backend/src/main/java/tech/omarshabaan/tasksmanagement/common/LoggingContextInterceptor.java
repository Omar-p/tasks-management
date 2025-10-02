package tech.omarshabaan.tasksmanagement.common;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.slf4j.MDC;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.servlet.HandlerInterceptor;
import tech.omarshabaan.tasksmanagement.security.CustomUserDetails;

import java.util.UUID;

public class LoggingContextInterceptor implements HandlerInterceptor {

	private final Logger logger = LoggerFactory.getLogger(LoggingContextInterceptor.class);

	@Override
	public boolean preHandle(final HttpServletRequest request, final HttpServletResponse response,
			final Object handler) {
		Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
		String userId = getUserIdFromPrincipal(authentication.getPrincipal());
		MDC.put("userId", userId);
		MDC.put("traceId", UUID.randomUUID().toString());
		return true;
	}

	private String getUserIdFromPrincipal(Object principal) {
		if (principal instanceof String) {
			// anonymous users will have a String principal with value "anonymousUser"
			return principal.toString();
		}
		if (principal instanceof CustomUserDetails) {
			try {
				CustomUserDetails user = (CustomUserDetails) principal;
				if (user.getUserUuid() != null) {
					return user.getUserUuid().toString();
				}
				else {
					logger.warn("could not extract userId from Principal");
					return "unknown";
				}
			}
			catch (Exception e) {
				logger.warn("could not extract userId from Principal", e);
			}
		}
		return "unknown";
	}

	@Override
	public void afterCompletion(final HttpServletRequest request, final HttpServletResponse response,
			final Object handler, final Exception ex) {
		MDC.clear();
	}

}
