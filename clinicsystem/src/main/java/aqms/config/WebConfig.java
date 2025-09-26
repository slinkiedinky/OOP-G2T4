package aqms.config;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.*;

@Configuration
public class WebConfig implements WebMvcConfigurer {
  @Value("${web.cors.allowed-origins:http://localhost:3000}") private String[] allowed;
  @Override public void addCorsMappings(CorsRegistry r) {
    r.addMapping("/**").allowedOrigins(allowed).allowedMethods("*").allowedHeaders("*");
  }
}