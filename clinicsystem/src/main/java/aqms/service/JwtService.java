package aqms.service;

import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;
import java.security.Key;
import java.time.Instant;
import java.util.Date;

@Service
public class JwtService {
  private final Key key;
  private final long expirySeconds;

  public JwtService(
      @Value("${security.jwt.secret}") String secret,
      @Value("${security.jwt.expiry-seconds:86400}") long expirySeconds) {
    this.key = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
    this.expirySeconds = expirySeconds;
  }

  public String issueToken(String username, String role) {
    Instant now = Instant.now();
    return Jwts.builder()
        .setSubject(username)
        .claim("role", role)
        .setIssuedAt(Date.from(now))
        .setExpiration(Date.from(now.plusSeconds(expirySeconds)))
        .signWith(key, SignatureAlgorithm.HS256)
        .compact();
  }

  public Claims parse(String token) throws JwtException {
    return Jwts.parserBuilder()
        .setSigningKey(key)
        .build()
        .parseClaimsJws(token)
        .getBody();
  }
}
