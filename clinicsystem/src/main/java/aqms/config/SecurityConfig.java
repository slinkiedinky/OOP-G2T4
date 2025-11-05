package aqms.config;

import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.security.servlet.PathRequest;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.Arrays;
import java.util.List;

@Configuration
@EnableMethodSecurity
@RequiredArgsConstructor
public class SecurityConfig {

  private final JwtAuthFilter jwtAuthFilter;
  private final RestSecurityHandlers restHandlers;

  @Value("${web.cors.allowed-origins:http://localhost:3000}")
  private String allowedOrigins;

  @Bean
  PasswordEncoder passwordEncoder() {
    return new BCryptPasswordEncoder();
  }

  @Bean
  CorsConfigurationSource corsConfigurationSource() {
    CorsConfiguration configuration = new CorsConfiguration();
    
    // Parse allowed origins from comma-separated string
    List<String> origins = Arrays.asList(allowedOrigins.split(","));
    configuration.setAllowedOrigins(origins.stream().map(String::trim).toList());
    configuration.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"));
    configuration.setAllowedHeaders(Arrays.asList("*"));
    configuration.setAllowCredentials(true);
    configuration.setExposedHeaders(Arrays.asList("*"));
    configuration.setMaxAge(3600L); // 1 hour
    
    UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
    source.registerCorsConfiguration("/**", configuration);
    return source;
  }

  @Bean
  SecurityFilterChain filter(HttpSecurity http) throws Exception {
    http
      .csrf(csrf -> csrf.disable())
      .cors(cors -> cors.configurationSource(corsConfigurationSource()))
      .sessionManagement(s -> s.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
      .exceptionHandling(e -> e
          .authenticationEntryPoint(restHandlers)
          .accessDeniedHandler(restHandlers)
      )
      .authorizeHttpRequests(a -> a
        // Allow OPTIONS requests for CORS preflight
        .requestMatchers(req -> req.getMethod().equals("OPTIONS")).permitAll()
        // common static resources (css/js/images) and index
        .requestMatchers(PathRequest.toStaticResources().atCommonLocations()).permitAll()
        .requestMatchers("/", "/index.html", "/api/auth/**", "/api/seed/**", "/actuator/health", "/swagger-ui/**", "/v3/api-docs/**", "/error").permitAll()
        // Allow /api/clinics (list) without auth - MUST be before /api/clinics/** pattern
        .requestMatchers("/api/clinics").permitAll()
        // ADMIN endpoints
        .requestMatchers("/api/admin/**").hasRole("ADMIN")
        .requestMatchers("/api/clinic-management/**").hasRole("ADMIN")
        // All /api/clinics/** paths require authentication (method-level @PreAuthorize will handle ADMIN check)
        // This MUST come after the exact /api/clinics match above
        .requestMatchers("/api/clinics/**").permitAll()
        .requestMatchers("/api/doctors/**").hasRole("ADMIN")
        .requestMatchers("/api/doctor-schedules/**").hasRole("ADMIN")
        .requestMatchers("/api/appointment-slots/**").hasRole("ADMIN")
        .requestMatchers("/api/clinic-operating-hours/**").hasRole("ADMIN")
        .requestMatchers("/api/password/**").hasRole("ADMIN")
        // Role-based endpoints
        .requestMatchers("/api/staff/**").hasRole("STAFF")
        .requestMatchers("/api/patient/**").hasRole("PATIENT")
        .anyRequest().authenticated()
      )
      .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class);

    http.headers(h -> h.frameOptions(f -> f.sameOrigin())); // H2 console if ever used
    return http.build();
  }
}
