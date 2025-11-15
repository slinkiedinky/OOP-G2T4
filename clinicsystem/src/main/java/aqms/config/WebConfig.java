package aqms.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

/**
 * WebMvcConfigurer - CORS is handled by SecurityConfig's CorsConfigurationSource to ensure it runs
 * in the security filter chain, not before it.
 *
 * Having CORS in both WebMvcConfigurer and SecurityConfig causes conflicts where OPTIONS
 * preflight requests are handled before authentication.
 */
@Configuration
public class WebConfig implements WebMvcConfigurer {
  // CORS configuration removed - handled by SecurityConfig.corsConfigurationSource()
  // to ensure it runs after Spring Security filters can authenticate requests
}
