package tech.omarshabaan.tasksmanagement;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.data.web.config.EnableSpringDataWebSupport;
import org.springframework.scheduling.annotation.EnableScheduling;
import tech.omarshabaan.tasksmanagement.config.CorsProperties;
import tech.omarshabaan.tasksmanagement.config.JwtProperties;
import tech.omarshabaan.tasksmanagement.config.RefreshTokenProperties;
import tech.omarshabaan.tasksmanagement.config.RsaKeyProperties;

import static org.springframework.data.web.config.EnableSpringDataWebSupport.PageSerializationMode.VIA_DTO;

@SpringBootApplication
@EnableScheduling
@EnableConfigurationProperties({ RsaKeyProperties.class, RefreshTokenProperties.class, CorsProperties.class,
		JwtProperties.class })
@EnableSpringDataWebSupport(pageSerializationMode = VIA_DTO)
public class BackendApplication {

	public static void main(String[] args) {
		SpringApplication.run(BackendApplication.class, args);
	}

}
