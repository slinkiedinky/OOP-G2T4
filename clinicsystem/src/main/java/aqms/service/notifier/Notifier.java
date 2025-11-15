package aqms.service.notifier;

public interface Notifier {
  /**
   * Send a notification to a recipient.
   *
   * @param to recipient address/phone
   * @param subject subject/title (ignored by SMS)
   * @param body message content
   */
  void send(String to, String subject, String body);
}
