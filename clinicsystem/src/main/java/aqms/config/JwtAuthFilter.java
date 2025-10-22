package aqms.config;

import aqms.service.JwtService;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;

@Component
@RequiredArgsConstructor
public class JwtAuthFilter extends OncePerRequestFilter {

  private final JwtService jwtService;

  @Override
  protected void doFilterInternal(HttpServletRequest req, HttpServletResponse res, FilterChain chain)
      throws ServletException, IOException {
      String path = req.getServletPath();
      if (path.startsWith("/api/auth/") || path.startsWith("/api/clinics") || path.startsWith("/api/debug") || 
          path.startsWith("/api/test") || path.equals("/") || path.equals("/index.html")) {
        // path.startsWith("/h2-console") // Commented out for Supabase
        chain.doFilter(req, res);
        return;
    }

    String header = req.getHeader("Authorization");
    if (header != null && header.startsWith("Bearer ")) {
      String token = header.substring(7);
      try {
        Claims claims = jwtService.parse(token);
        String username = claims.getSubject();
        String role = claims.get("role", String.class);

        var auth = new UsernamePasswordAuthenticationToken(
            username, null,
            role == null ? List.of() : List.of(new SimpleGrantedAuthority("ROLE_" + role))
        );
        SecurityContextHolder.getContext().setAuthentication(auth);
      } catch (JwtException e) {
        SecurityContextHolder.clearContext();
      }
    }
    chain.doFilter(req, res);
  }
}
