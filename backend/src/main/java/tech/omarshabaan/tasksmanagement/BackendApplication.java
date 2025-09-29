package tech.omarshabaan.tasksmanagement;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.scheduling.annotation.EnableScheduling;
import tech.omarshabaan.tasksmanagement.config.RefreshTokenProperties;
import tech.omarshabaan.tasksmanagement.config.RsaKeyProperties;

@SpringBootApplication
@EnableScheduling
@EnableConfigurationProperties({ RsaKeyProperties.class, RefreshTokenProperties.class })
public class BackendApplication {

	public static void main(String[] args) {
		SpringApplication.run(BackendApplication.class, args);
	}

}
