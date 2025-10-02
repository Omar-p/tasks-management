package tech.omarshabaan.tasksmanagement.config;

import org.springframework.boot.test.autoconfigure.restdocs.RestDocsMockMvcConfigurationCustomizer;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Primary;
import org.springframework.http.HttpHeaders;

import static org.springframework.restdocs.operation.preprocess.Preprocessors.*;

@TestConfiguration
public class RestDocsTestConfiguration {

	@Bean
	@Primary
	public RestDocsMockMvcConfigurationCustomizer restDocsMockMvcConfigurationCustomizer() {
		return configurer -> configurer.operationPreprocessors()
			.withResponseDefaults(prettyPrint(), modifyHeaders().remove(HttpHeaders.VARY),
					modifyHeaders().remove(HttpHeaders.EXPIRES), modifyHeaders().remove(HttpHeaders.CACHE_CONTROL),
					modifyHeaders().remove(HttpHeaders.PRAGMA), modifyHeaders().remove(HttpHeaders.CONTENT_LENGTH),
					modifyHeaders().remove("X-Content-Type-Options"), modifyHeaders().remove("X-XSS-Protection"),
					modifyHeaders().remove("X-Frame-Options"))
			.withRequestDefaults(prettyPrint(), modifyHeaders().remove(HttpHeaders.CONTENT_LENGTH),
					modifyHeaders().add(HttpHeaders.AUTHORIZATION, "Bearer token"),
					modifyHeaders().remove(HttpHeaders.HOST));
	}

}
