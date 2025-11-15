package aqms.web.dto;

import jakarta.validation.constraints.*;
import java.time.*;

/**
 * AppointmentDtos
 *
 * Lightweight DTOs used by appointment endpoints for booking and rescheduling operations.
 */
public class AppointmentDtos {
  public record BookRequest(@NotNull Long slotId, @NotNull Long patientId) {}

  public record RescheduleRequest(
      @NotNull LocalDateTime startTime, @NotNull LocalDateTime endTime) {}
}
