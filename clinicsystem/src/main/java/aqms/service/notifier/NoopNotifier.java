// Provide a safe fallback notifier so your NotificationService still has something to call when email/SMS are off:
package aqms.service.notifier;

import org.springframework.boot.autoconfigure.condition.ConditionalOnMissingBean;
import org.springframework.stereotype.Service;

@Service
@ConditionalOnMissingBean(Notifier.class)
public class NoopNotifier implements Notifier {
  @Override public void notify(String to, String subject, String message) {
    // no-op (could log if you want)
  }
}
