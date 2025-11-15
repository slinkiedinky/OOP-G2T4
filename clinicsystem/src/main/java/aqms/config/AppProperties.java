package aqms.config;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;

@Getter
@Setter
@ConfigurationProperties(prefix = "aqms")
/**
 * Application configuration properties mapped from configuration files.
 *
 * Contains nested classes for queue sizing and business rules that are bound to the prefix
 * `aqms` in application.yml/properties.
 */
public class AppProperties {
  private Queue queue = new Queue();
  private Rules rules = new Rules();

  @Getter
  @Setter
  public static class Queue {
    private double expressFraction = 0.333;
    private double emergencyFraction = 0.125;
  }

  @Getter
  @Setter
  public static class Rules {
    private int minAdvanceHoursForChange = 24;
  }
}
