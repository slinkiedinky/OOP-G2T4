package aqms.config;
import org.springframework.boot.context.properties.ConfigurationProperties;
import lombok.Getter; import lombok.Setter;

@Getter @Setter
@ConfigurationProperties(prefix = "aqms")
public class AppProperties {
  private Queue queue = new Queue();
  private Rules rules = new Rules();
  @Getter @Setter public static class Queue { private double expressFraction = 0.333; private double emergencyFraction = 0.125; }
  @Getter @Setter public static class Rules { private int minAdvanceHoursForChange = 24; }
}