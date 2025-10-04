package aqms.service.notifier;

import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;

/**
 * Dev/CI-safe notifier that does nothing.
 * Switch to the real mailer later or run with a "mail" profile.
 */
@Component
@Profile("!mail") // active unless you explicitly enable the 'mail' profile
public class EmailNotifier implements Notifier {
  @Override
  public void send(String to, String subject, String body) {
    // no-op
  }
}
