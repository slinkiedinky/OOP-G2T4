package aqms.web.dto;

import java.time.*; import jakarta.validation.constraints.*;
public class AppointmentDtos {
  public record BookRequest(@NotNull Long slotId, @NotNull Long patientId) {}
  public record RescheduleRequest(@NotNull LocalDateTime startTime, @NotNull LocalDateTime endTime) {}
}
