package aqms.service.notifier;

import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;

/**
 * Placeholder SMS notifier. Only active with 'sms' profile. Subject is ignored for SMS; kept for
 * interface compatibility.
 */
@Component
@Profile("sms")
public class SmsNotifier implements Notifier {

  @Override
  public void send(String to, String subject, String body) {
    // TODO: integrate an SMS provider (e.g., Twilio).
    // For now, do nothing to keep compilation happy.
  }
}
