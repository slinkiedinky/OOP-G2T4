package aqms;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import aqms.config.AppProperties;

@SpringBootApplication
@EnableConfigurationProperties(AppProperties.class)
public class Application {
  public static void main(String[] args) {
    SpringApplication.run(Application.class, args); // <-- use Application.class here
  }
}
