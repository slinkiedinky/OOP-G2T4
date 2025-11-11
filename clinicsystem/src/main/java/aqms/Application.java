package aqms;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.scheduling.annotation.EnableScheduling;
import aqms.config.AppProperties;

@SpringBootApplication
@EnableScheduling
@EnableConfigurationProperties(AppProperties.class)
/**
 * Main application entry point for the AQMS backend.
 *
 * Bootstraps the Spring Boot application and enables scheduled tasks and
 * configuration properties binding.
 */
public class Application {
  public static void main(String[] args) {
    SpringApplication.run(Application.class, args); // <-- use Application.class here
  }
}
