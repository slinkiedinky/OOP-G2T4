package aqms.service.notifier;

import org.springframework.context.annotation.Primary;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;

/**
 * Dev/CI-safe notifier that does nothing. Active by default unless another profile (mail/sms) is
 * selected.
 */
@Component
@Primary
@Profile("!mail & !sms")
public class NoopNotifier implements Notifier {

  @Override
  public void send(String to, String subject, String body) {
    // no-op
  }
}
