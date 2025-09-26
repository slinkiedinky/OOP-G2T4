package aqms.service.notifier;

import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Service;

@Service
@ConditionalOnProperty(prefix = "notification.sms", name = "enabled", havingValue = "true")
public class SmsNotifier implements Notifier {
  @Override
  public void notify(String to, String subject, String message) {
    // TODO integrate Twilio/SMS gateway here
  }
}