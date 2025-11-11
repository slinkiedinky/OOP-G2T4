package aqms.web.dto;

import java.time.*; import jakarta.validation.constraints.*;
/**
 * AppointmentDtos
 *
 * Lightweight DTOs used by appointment endpoints for booking and
 * rescheduling operations.
 */
public class AppointmentDtos {
  public record BookRequest(@NotNull Long slotId, @NotNull Long patientId) {}
  public record RescheduleRequest(@NotNull LocalDateTime startTime, @NotNull LocalDateTime endTime) {}
}
