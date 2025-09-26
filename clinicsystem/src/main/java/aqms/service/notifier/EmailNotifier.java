package aqms.service.notifier;

import lombok.RequiredArgsConstructor;
import org.springframework.boot.autoconfigure.condition.ConditionalOnBean;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@ConditionalOnProperty(prefix = "notification.email", name = "enabled", havingValue = "true")
@ConditionalOnBean(JavaMailSender.class)   // <- only create if a sender bean exists
public class EmailNotifier implements Notifier {
  private final JavaMailSender mailSender;

  @Override
  public void notify(String to, String subject, String message) {
    var mail = new SimpleMailMessage();
    mail.setTo(to);
    mail.setSubject(subject);
    mail.setText(message);
    mailSender.send(mail);
  }
}
