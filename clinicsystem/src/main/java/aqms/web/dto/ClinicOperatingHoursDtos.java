package aqms.web.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.time.DayOfWeek;
import java.time.LocalTime;
import java.util.Map;

/**
 * ClinicOperatingHoursDtos
 *
 * DTOs for clinic operating hours endpoints. Used to set and query opening hours and to provide
 * a structured response for UI consumption.
 */
public class ClinicOperatingHoursDtos {

  public record SetOperatingHoursRequest(
    @NotNull Long clinicId,
    @NotBlank String hours) {}

  public record SetDailyHoursRequest(
      @NotNull Long clinicId,
      @NotNull DayOfWeek dayOfWeek,
      @NotNull LocalTime openTime,
      @NotNull LocalTime closeTime) {}

  public record SetClosedDayRequest(
    @NotNull Long clinicId,
    @NotNull DayOfWeek dayOfWeek) {}

  public record CheckOperatingHoursRequest(
      @NotNull Long clinicId,
      @NotNull DayOfWeek dayOfWeek,
      @NotNull LocalTime time) {}

  public record OperatingHoursResponse(
      Long clinicId,
      String clinicName,
      String operatingHours,
      Map<String, String> detailedHours) {}

  public record IsOpenResponse(
      Long clinicId,
      String clinicName,
      DayOfWeek dayOfWeek,
      LocalTime time,
      Boolean isOpen) {}
}
