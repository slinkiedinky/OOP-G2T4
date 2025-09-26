package aqms.service;
import java.time.*; import java.time.temporal.ChronoUnit;
import org.springframework.beans.factory.annotation.Value; import org.springframework.security.oauth2.jwt.*;
import org.springframework.stereotype.Service; import lombok.RequiredArgsConstructor;

@Service @RequiredArgsConstructor
public class JwtService {
  private final JwtEncoder encoder;
  @Value("${security.jwt.expires-minutes:120}") long exp;
  public String createToken(String user, String role){
    var now = Instant.now();
    var claims = JwtClaimsSet.builder().subject(user).issuedAt(now).expiresAt(now.plus(exp, ChronoUnit.MINUTES)).claim("role", role).build();
    return encoder.encode(JwtEncoderParameters.from(claims)).getTokenValue();
  }
}