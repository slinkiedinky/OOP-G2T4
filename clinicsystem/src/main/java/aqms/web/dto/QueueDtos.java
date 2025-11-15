package aqms.web.dto;

import aqms.domain.enums.QueuePriority;

/**
 * QueueDtos
 *
 * DTOs used by the queue UI and APIs. Keep these lightweight record types to represent queue
 * tickets and their position/priority in responses.
 */
public class QueueDtos {
  public record TicketResponse(
    String number,
    int position,
    QueuePriority priority) {}
}
