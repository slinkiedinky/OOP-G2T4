package aqms.service;

import aqms.repository.ClinicRepository;
import java.time.DayOfWeek;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.util.HashMap;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class ClinicOperatingHoursService {
  /**
   * ClinicOperatingHoursService
   *
   * Service for reading and updating clinic operating hours and providing helper utilities used
   * by controllers and the UI.
   */
  private final ClinicRepository clinicRepo;

  private final DateTimeFormatter timeFormatter = DateTimeFormatter.ofPattern("HH:mm");

  @Transactional(readOnly = true)
  public String getOperatingHours(Long clinicId) {
    var clinic =
        clinicRepo.findById(clinicId).orElseThrow(() -> new RuntimeException("Clinic not found"));
    return clinic.getOperatingHours();
  }

  @Transactional(readOnly = true)
  public Map<String, String> getDetailedOperatingHours(Long clinicId) {
    var clinic =
        clinicRepo.findById(clinicId).orElseThrow(() -> new RuntimeException("Clinic not found"));
    return parseOperatingHours(clinic.getOperatingHours());
  }

  @Transactional
  public void setOperatingHours(Long clinicId, String hours) {
    var clinic =
        clinicRepo.findById(clinicId).orElseThrow(() -> new RuntimeException("Clinic not found"));
    clinic.setOperatingHours(hours);
    clinicRepo.save(clinic);
  }

  @Transactional
  public void setDailyHours(
      Long clinicId, DayOfWeek dayOfWeek, LocalTime openTime, LocalTime closeTime) {
    var clinic =
        clinicRepo.findById(clinicId).orElseThrow(() -> new RuntimeException("Clinic not found"));
    var currentHours = parseOperatingHours(clinic.getOperatingHours());
    currentHours.put(dayOfWeek.name(), formatTimeRange(openTime, closeTime));
    clinic.setOperatingHours(formatOperatingHours(currentHours));
    clinicRepo.save(clinic);
  }

  @Transactional
  public void setClosedDay(Long clinicId, DayOfWeek dayOfWeek) {
    var clinic =
        clinicRepo.findById(clinicId).orElseThrow(() -> new RuntimeException("Clinic not found"));
    var currentHours = parseOperatingHours(clinic.getOperatingHours());
    currentHours.put(dayOfWeek.name(), "CLOSED");
    clinic.setOperatingHours(formatOperatingHours(currentHours));
    clinicRepo.save(clinic);
  }

  @Transactional(readOnly = true)
  public boolean isClinicOpen(Long clinicId, DayOfWeek dayOfWeek, LocalTime time) {
    var clinic =
        clinicRepo.findById(clinicId).orElseThrow(() -> new RuntimeException("Clinic not found"));
    var hours = parseOperatingHours(clinic.getOperatingHours());
    var dayHours = hours.get(dayOfWeek.name());

    if ("CLOSED".equals(dayHours)) {
      return false;
    }

    var timeRange = parseTimeRange(dayHours);
    return time.isAfter(timeRange[0]) && time.isBefore(timeRange[1]);
  }

  private Map<String, String> parseOperatingHours(String hours) {
    var result = new HashMap<String, String>();
    if (hours == null || hours.trim().isEmpty()) {
      return result;
    }

    var lines = hours.split("\n");
    for (var line : lines) {
      var parts = line.split(":");
      if (parts.length == 2) {
        result.put(parts[0].trim(), parts[1].trim());
      }
    }
    return result;
  }

  private String formatOperatingHours(Map<String, String> hours) {
    var sb = new StringBuilder();
    for (var entry : hours.entrySet()) {
      sb.append(entry.getKey()).append(": ").append(entry.getValue()).append("\n");
    }
    return sb.toString().trim();
  }

  private String formatTimeRange(LocalTime openTime, LocalTime closeTime) {
    return openTime.format(timeFormatter) + " - " + closeTime.format(timeFormatter);
  }

  private LocalTime[] parseTimeRange(String timeRange) {
    if (timeRange == null || "CLOSED".equals(timeRange)) {
      return new LocalTime[] {LocalTime.MIN, LocalTime.MIN};
    }

    var parts = timeRange.split(" - ");
    if (parts.length != 2) {
      return new LocalTime[] {LocalTime.MIN, LocalTime.MIN};
    }

    try {
      var openTime = LocalTime.parse(parts[0].trim(), timeFormatter);
      var closeTime = LocalTime.parse(parts[1].trim(), timeFormatter);
      return new LocalTime[] {openTime, closeTime};
    } catch (Exception e) {
      return new LocalTime[] {LocalTime.MIN, LocalTime.MIN};
    }
  }
}
