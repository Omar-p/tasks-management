package tech.omarshabaan.tasksmanagement.config;

import org.springframework.stereotype.Component;
import org.springframework.web.servlet.config.annotation.InterceptorRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;
import tech.omarshabaan.tasksmanagement.common.LoggingContextInterceptor;

@Component
class LoggingContextConfiguration implements WebMvcConfigurer {

	@Override
	public void addInterceptors(InterceptorRegistry registry) {
		registry.addInterceptor(new LoggingContextInterceptor());
	}

}
