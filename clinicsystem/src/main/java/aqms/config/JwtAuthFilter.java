package aqms.config;

import aqms.service.JwtService;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

@Component
@RequiredArgsConstructor
public class JwtAuthFilter extends OncePerRequestFilter {

  /**
   * Servlet filter that validates JWT tokens and populates the SecurityContext for authenticated
   * requests.
   *
   * Public paths (login, clinic list, index, etc.) are bypassed.
   */
  private final JwtService jwtService;

  @Override
  protected void doFilterInternal(
      HttpServletRequest req, HttpServletResponse res, FilterChain chain)
      throws ServletException, IOException {
    String path = req.getServletPath();

    // Bypass JWT filter for public paths
    boolean isPublicPath =
        path.startsWith("/api/auth/")
            || path.equals("/api/clinics")
            || path.startsWith("/api/debug")
            || path.startsWith("/api/test")
            || path.equals("/")
            || path.equals("/index.html");

    if (isPublicPath) {
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

        var auth =
            new UsernamePasswordAuthenticationToken(
                username,
                null,
                role == null ? List.of() : List.of(new SimpleGrantedAuthority("ROLE_" + role)));
        SecurityContextHolder.getContext().setAuthentication(auth);
      } catch (JwtException e) {
        SecurityContextHolder.clearContext();
      }
    } else {
      SecurityContextHolder.clearContext();
    }

    chain.doFilter(req, res);
  }
}
