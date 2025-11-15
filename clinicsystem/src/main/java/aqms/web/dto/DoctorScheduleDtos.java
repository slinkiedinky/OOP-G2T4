package aqms.web.dto;

import jakarta.validation.constraints.Future;
import jakarta.validation.constraints.NotNull;
import java.time.LocalDateTime;

/**
 * DoctorScheduleDtos
 *
 * Data transfer objects for doctor schedule endpoints. Includes requests for adding/updating
 * schedule blocks and a response view used by controller APIs.
 */
public class DoctorScheduleDtos {

  public record AddScheduleRequest(
      @NotNull Long doctorId,
      @NotNull @Future LocalDateTime startTime,
      @NotNull @Future LocalDateTime endTime) {}

  public record UpdateAvailabilityRequest(@NotNull Boolean available) {}

  public record ScheduleResponse(
      Long id,
      Long doctorId,
      String doctorName,
      LocalDateTime startTime,
      LocalDateTime endTime,
      Boolean available) {}
}
