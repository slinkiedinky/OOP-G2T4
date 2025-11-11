package aqms.web.controller;

import aqms.service.DoctorScheduleService;
import aqms.web.dto.DoctorScheduleDtos;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/doctor-schedules")
@RequiredArgsConstructor
/**
 * DoctorScheduleController
 *
 * Manages CRUD and query endpoints for doctor schedules. Returns lightweight DTOs
 * for schedule lists, and supports adding/removing availability.
 */
public class DoctorScheduleController {
    private final DoctorScheduleService scheduleService;

    @GetMapping("/doctor/{doctorId}")
    public ResponseEntity<List<DoctorScheduleDtos.ScheduleResponse>> getDoctorSchedules(@PathVariable Long doctorId) {
        var schedules = scheduleService.getDoctorSchedules(doctorId);
        var responses = schedules.stream()
                .map(schedule -> new DoctorScheduleDtos.ScheduleResponse(
                        schedule.getId(),
                        schedule.getDoctor().getId(),
                        schedule.getDoctor().getName(),
                        schedule.getStartTime(),
                        schedule.getEndTime(),
                        schedule.isAvailable()
                ))
                .toList();
        return ResponseEntity.ok(responses);
    }

    @GetMapping("/doctor/{doctorId}/available")
    public ResponseEntity<List<DoctorScheduleDtos.ScheduleResponse>> getAvailableDoctorSchedules(@PathVariable Long doctorId) {
        var schedules = scheduleService.getAvailableDoctorSchedules(doctorId);
        var responses = schedules.stream()
                .map(schedule -> new DoctorScheduleDtos.ScheduleResponse(
                        schedule.getId(),
                        schedule.getDoctor().getId(),
                        schedule.getDoctor().getName(),
                        schedule.getStartTime(),
                        schedule.getEndTime(),
                        schedule.isAvailable()
                ))
                .toList();
        return ResponseEntity.ok(responses);
    }

    @PostMapping("/add")
    public ResponseEntity<DoctorScheduleDtos.ScheduleResponse> addScheduleSlot(@RequestBody DoctorScheduleDtos.AddScheduleRequest request) {
        var schedule = scheduleService.addScheduleSlot(
                request.doctorId(),
                request.startTime(),
                request.endTime()
        );
        
        var response = new DoctorScheduleDtos.ScheduleResponse(
                schedule.getId(),
                schedule.getDoctor().getId(),
                schedule.getDoctor().getName(),
                schedule.getStartTime(),
                schedule.getEndTime(),
                schedule.isAvailable()
        );
        
        return ResponseEntity.ok(response);
    }

    @PutMapping("/{scheduleId}/availability")
    public ResponseEntity<DoctorScheduleDtos.ScheduleResponse> updateAvailability(
            @PathVariable Long scheduleId,
            @RequestBody DoctorScheduleDtos.UpdateAvailabilityRequest request) {
        var schedule = scheduleService.updateAvailability(scheduleId, request.available());
        
        var response = new DoctorScheduleDtos.ScheduleResponse(
                schedule.getId(),
                schedule.getDoctor().getId(),
                schedule.getDoctor().getName(),
                schedule.getStartTime(),
                schedule.getEndTime(),
                schedule.isAvailable()
        );
        
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/{scheduleId}")
    public ResponseEntity<Void> removeScheduleSlot(@PathVariable Long scheduleId) {
        scheduleService.removeScheduleSlot(scheduleId);
        return ResponseEntity.ok().build();
    }
}
