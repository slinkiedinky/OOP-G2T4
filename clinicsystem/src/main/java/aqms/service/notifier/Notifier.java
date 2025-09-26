package aqms.service.notifier;

public interface Notifier {
  void notify(String to, String subject, String message);
}