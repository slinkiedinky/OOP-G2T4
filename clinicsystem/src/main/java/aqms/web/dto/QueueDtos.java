package aqms.web.dto;

import aqms.domain.enums.QueuePriority;
public class QueueDtos {
  public record TicketResponse(String number, int position, QueuePriority priority) {}
}
