package aqms.web.controller;

import aqms.service.ClinicOperatingHoursService;
import aqms.web.dto.ClinicOperatingHoursDtos;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.DayOfWeek;
import java.time.LocalTime;
import java.util.Map;

@RestController
@RequestMapping("/api/clinic-operating-hours")
@RequiredArgsConstructor
/**
 * ClinicOperatingHoursController
 *
 * Exposes endpoints to view and modify clinic operating hours and related
 * helper endpoints used by the UI to determine if a clinic is open.
 */
public class ClinicOperatingHoursController {
    private final ClinicOperatingHoursService hoursService;

    @GetMapping("/{clinicId}")
    public ResponseEntity<ClinicOperatingHoursDtos.OperatingHoursResponse> getOperatingHours(@PathVariable Long clinicId) {
        var hours = hoursService.getOperatingHours(clinicId);
        var detailedHours = hoursService.getDetailedOperatingHours(clinicId);
        
        var response = new ClinicOperatingHoursDtos.OperatingHoursResponse(
                clinicId,
                "Clinic " + clinicId, // You might want to get actual clinic name
                hours,
                detailedHours
        );
        
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{clinicId}/detailed")
    public ResponseEntity<Map<String, String>> getDetailedOperatingHours(@PathVariable Long clinicId) {
        var detailedHours = hoursService.getDetailedOperatingHours(clinicId);
        return ResponseEntity.ok(detailedHours);
    }

    @PutMapping("/set-hours")
    public ResponseEntity<Void> setOperatingHours(@RequestBody ClinicOperatingHoursDtos.SetOperatingHoursRequest request) {
        hoursService.setOperatingHours(request.clinicId(), request.hours());
        return ResponseEntity.ok().build();
    }

    @PutMapping("/set-daily-hours")
    public ResponseEntity<Void> setDailyHours(@RequestBody ClinicOperatingHoursDtos.SetDailyHoursRequest request) {
        hoursService.setDailyHours(
                request.clinicId(),
                request.dayOfWeek(),
                request.openTime(),
                request.closeTime()
        );
        return ResponseEntity.ok().build();
    }

    @PutMapping("/set-closed-day")
    public ResponseEntity<Void> setClosedDay(@RequestBody ClinicOperatingHoursDtos.SetClosedDayRequest request) {
        hoursService.setClosedDay(request.clinicId(), request.dayOfWeek());
        return ResponseEntity.ok().build();
    }

    @GetMapping("/{clinicId}/is-open")
    public ResponseEntity<ClinicOperatingHoursDtos.IsOpenResponse> isClinicOpen(
            @PathVariable Long clinicId,
            @RequestParam DayOfWeek dayOfWeek,
            @RequestParam LocalTime time) {
        var isOpen = hoursService.isClinicOpen(clinicId, dayOfWeek, time);
        
        var response = new ClinicOperatingHoursDtos.IsOpenResponse(
                clinicId,
                "Clinic " + clinicId, // You might want to get actual clinic name
                dayOfWeek,
                time,
                isOpen
        );
        
        return ResponseEntity.ok(response);
    }
}







