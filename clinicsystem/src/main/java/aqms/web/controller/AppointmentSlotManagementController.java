package aqms.web.controller;

import aqms.service.AppointmentSlotManagementService;
import aqms.web.dto.AppointmentSlotDtos;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/appointment-slots")
@RequiredArgsConstructor
public class AppointmentSlotManagementController {
    private final AppointmentSlotManagementService slotService;

    @PostMapping("/generate")
    public ResponseEntity<List<AppointmentSlotDtos.SlotResponse>> generateSlotsForDate(@RequestBody AppointmentSlotDtos.GenerateSlotsRequest request) {
        var slots = slotService.generateSlotsForDate(
                request.clinicId(),
                request.doctorId(),
                request.date()
        );
        
        var responses = slots.stream()
                .map(slot -> new AppointmentSlotDtos.SlotResponse(
                        slot.getId(),
                        slot.getClinic().getId(),
                        slot.getClinic().getName(),
                        slot.getDoctor().getId(),
                        slot.getDoctor().getName(),
                        slot.getStartTime(),
                        slot.getEndTime(),
                        slot.getStatus(),
                        slot.getPatient() != null ? slot.getPatient().getId() : null
                ))
                .toList();
        
        return ResponseEntity.ok(responses);
    }

    @PostMapping("/create-custom")
    public ResponseEntity<AppointmentSlotDtos.SlotResponse> createCustomSlot(@RequestBody AppointmentSlotDtos.CreateCustomSlotRequest request) {
        var slot = slotService.createCustomSlot(
                request.clinicId(),
                request.doctorId(),
                request.startTime(),
                request.endTime()
        );
        
        var response = new AppointmentSlotDtos.SlotResponse(
                slot.getId(),
                slot.getClinic().getId(),
                slot.getClinic().getName(),
                slot.getDoctor().getId(),
                slot.getDoctor().getName(),
                slot.getStartTime(),
                slot.getEndTime(),
                slot.getStatus(),
                slot.getPatient() != null ? slot.getPatient().getId() : null
        );
        
        return ResponseEntity.ok(response);
    }

    @GetMapping("/by-interval")
    public ResponseEntity<List<AppointmentSlotDtos.SlotResponse>> getSlotsByInterval(
            @RequestParam Long clinicId,
            @RequestParam Integer intervalMinutes) {
        var slots = slotService.getSlotsByInterval(clinicId, intervalMinutes);
        
        var responses = slots.stream()
                .map(slot -> new AppointmentSlotDtos.SlotResponse(
                        slot.getId(),
                        slot.getClinic().getId(),
                        slot.getClinic().getName(),
                        slot.getDoctor().getId(),
                        slot.getDoctor().getName(),
                        slot.getStartTime(),
                        slot.getEndTime(),
                        slot.getStatus(),
                        slot.getPatient() != null ? slot.getPatient().getId() : null
                ))
                .toList();
        
        return ResponseEntity.ok(responses);
    }

    @PutMapping("/update-interval")
    public ResponseEntity<Void> updateClinicInterval(@RequestBody AppointmentSlotDtos.UpdateIntervalRequest request) {
        slotService.updateClinicInterval(request.clinicId(), request.intervalMinutes());
        return ResponseEntity.ok().build();
    }

    @GetMapping("/doctor/{doctorId}/available")
    public ResponseEntity<List<AppointmentSlotDtos.SlotResponse>> getAvailableSlotsByDoctor(
            @PathVariable Long doctorId,
            @RequestParam LocalDateTime startTime,
            @RequestParam LocalDateTime endTime) {
        var slots = slotService.getAvailableSlotsByDoctor(doctorId, startTime, endTime);
        
        var responses = slots.stream()
                .map(slot -> new AppointmentSlotDtos.SlotResponse(
                        slot.getId(),
                        slot.getClinic().getId(),
                        slot.getClinic().getName(),
                        slot.getDoctor().getId(),
                        slot.getDoctor().getName(),
                        slot.getStartTime(),
                        slot.getEndTime(),
                        slot.getStatus(),
                        slot.getPatient() != null ? slot.getPatient().getId() : null
                ))
                .toList();
        
        return ResponseEntity.ok(responses);
    }
}
