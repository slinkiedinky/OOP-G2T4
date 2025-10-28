package aqms.web.controller;

import aqms.service.AppointmentSlotManagementService;
import aqms.web.dto.AppointmentSlotDtos;
import aqms.repository.AppointmentSlotRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.time.LocalDate;
import org.springframework.format.annotation.DateTimeFormat;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/appointment-slots")
@RequiredArgsConstructor
@Slf4j
public class AppointmentSlotManagementController {
    private final AppointmentSlotManagementService slotService;
    private final AppointmentSlotRepository slotRepo;

    @PostMapping("/generate")
    public ResponseEntity<List<AppointmentSlotDtos.SlotResponse>> generateSlotsForDate(@RequestBody AppointmentSlotDtos.GenerateSlotsRequest request) {
        try {
            log.info("=== GENERATE SLOTS REQUEST RECEIVED ===");
            log.info("Request: {}", request);
            log.info("  clinicId: {} (type: {})", request.clinicId(), request.clinicId() != null ? request.clinicId().getClass().getSimpleName() : "null");
            log.info("  date: {} (type: {})", request.date(), request.date() != null ? request.date().getClass().getSimpleName() : "null");
            log.info("  openTime: {} (type: {})", request.openTime(), request.openTime() != null ? request.openTime().getClass().getSimpleName() : "null");
            log.info("  closeTime: {} (type: {})", request.closeTime(), request.closeTime() != null ? request.closeTime().getClass().getSimpleName() : "null");
            log.info("  interval: {} (type: {})", request.interval(), request.interval() != null ? request.interval().getClass().getSimpleName() : "null");
            log.info("  slotDuration: {} (type: {})", request.slotDuration(), request.slotDuration() != null ? request.slotDuration().getClass().getSimpleName() : "null");
            if (request.clinicId() == null || request.date() == null ||
                    request.openTime() == null || request.closeTime() == null ||
                    request.interval() == null || request.slotDuration() == null) {
                log.warn("Generate request missing required fields: {}", request);
                return ResponseEntity.badRequest().build();
            }

            log.info("All validations passed, calling service...");
            log.info("Generating slots: clinic={}, date={}, hours={}-{}, interval={}min, duration={}min",
                    request.clinicId(), request.date(), request.openTime(), request.closeTime(), request.interval(), request.slotDuration());
            var slots = slotService.generateSlotsForDate(
                    request.clinicId(),
                    request.date(),
                    request.openTime(),
                    request.closeTime(),
                    request.interval(),
                    request.slotDuration()
            );

            log.info("Service returned {} slots successfully", slots.size());

            var responses = slots.stream()
                    .map(slot -> new AppointmentSlotDtos.SlotResponse(
                            slot.getId(),
                            slot.getClinic().getId(),
                            slot.getClinic().getName(),
                            null,
                            null,
                            slot.getStartTime(),
                            slot.getEndTime(),
                            slot.getStatus(),
                            null
                    ))
                    .toList();

            log.info("Returning {} slot responses", responses.size());
            return ResponseEntity.ok(responses);
        } catch (org.springframework.web.server.ResponseStatusException rse) {
            log.warn("Generate slots failed: {}", rse.getReason());
            return ResponseEntity.status(rse.getStatusCode()).build();
        } catch (Exception ex) {
            log.error("=== EXCEPTION IN GENERATE SLOTS ===");
            log.error("Request was: {}", request);
            log.error("Error message: {}", ex.getMessage());
            log.error("Full stack trace:", ex);
            return ResponseEntity.status(org.springframework.http.HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
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
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startTime,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endTime) {
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
    
    @GetMapping("/clinic/{clinicId}/slots")
    public ResponseEntity<List<AppointmentSlotDtos.SlotResponse>> getSlotsByClinicAndDate(
            @PathVariable Long clinicId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startTime,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endTime) {
        try {
            log.info("Fetching slots for clinic {} from {} to {}", clinicId, startTime, endTime);
            var slots = slotService.getSlotsByClinicAndDate(clinicId, startTime, endTime);

            var responses = slots.stream()
                    .map(slot -> new AppointmentSlotDtos.SlotResponse(
                            slot.getId(),
                            slot.getClinic().getId(),
                            slot.getClinic().getName(),
                            slot.getDoctor() != null ? slot.getDoctor().getId() : null,
                            slot.getDoctor() != null ? slot.getDoctor().getName() : null,
                            slot.getStartTime(),
                            slot.getEndTime(),
                            slot.getStatus(),
                            slot.getPatient() != null ? slot.getPatient().getId() : null
                    ))
                    .toList();

            log.debug("Slots fetched: {}", responses.size());
            return ResponseEntity.ok(responses);
        } catch (Exception ex) {
            log.error("Failed to fetch slots for clinic {} between {} and {}", clinicId, startTime, endTime, ex);
            return ResponseEntity.ok(java.util.List.of());
        }
    }
    
    @RequestMapping(path = "/{slotId}/assign-doctor", method = {RequestMethod.PUT, RequestMethod.PATCH})
    public ResponseEntity<AppointmentSlotDtos.SlotResponse> assignDoctorToSlot(
            @PathVariable Long slotId,
            @RequestBody AppointmentSlotDtos.AssignDoctorToSlotRequest request) {
        try {
            log.info("=== ASSIGN DOCTOR REQUEST ===");
            log.info("Slot ID: {}", slotId);
            log.info("Doctor ID from request: {}", request != null ? request.doctorId() : null);

            // the service handles not-found and null doctorId
            var slot = slotService.assignDoctorToSlot(slotId, request != null ? request.doctorId() : null);

            var response = new AppointmentSlotDtos.SlotResponse(
                    slot.getId(),
                    slot.getClinic().getId(),
                    slot.getClinic().getName(),
                    slot.getDoctor() != null ? slot.getDoctor().getId() : null,
                    slot.getDoctor() != null ? slot.getDoctor().getName() : null,
                    slot.getStartTime(),
                    slot.getEndTime(),
                    slot.getStatus(),
                    slot.getPatient() != null ? slot.getPatient().getId() : null
            );

            log.info("Returning response for slot {} with doctor {}", response.id(), response.doctorId());
            return ResponseEntity.ok(response);
        } catch (org.springframework.web.server.ResponseStatusException rse) {
            throw rse;
        } catch (Exception ex) {
            log.error("=== ERROR ASSIGNING DOCTOR ===");
            log.error("Slot ID: {}", slotId);
            log.error("Doctor ID: {}", request != null ? request.doctorId() : null);
            log.error("Error: ", ex);
            return ResponseEntity.status(org.springframework.http.HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping("/check-existing")
    public ResponseEntity<List<LocalDate>> checkExistingSlots(
            @RequestParam Long clinicId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        try {
            log.info("Checking for existing slots: clinicId={}, startDate={}, endDate={}", clinicId, startDate, endDate);
            List<LocalDate> datesWithSlots = slotService.findDatesWithSlots(clinicId, startDate, endDate);
            log.info("Found {} dates with existing slots", datesWithSlots.size());
            return ResponseEntity.ok(datesWithSlots);
        } catch (Exception ex) {
            log.error("Error checking for existing slots", ex);
            return ResponseEntity.status(org.springframework.http.HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @DeleteMapping("/delete-by-dates")
    public ResponseEntity<Map<String, Object>> deleteSlotsByDates(
            @RequestParam Long clinicId,
            @RequestBody List<String> dates) {
        try {
            log.info("Deleting slots for clinic {} on {} dates", clinicId, dates.size());
            
            for (String dateStr : dates) {
                LocalDate date = LocalDate.parse(dateStr);
                LocalDateTime startOfDay = date.atStartOfDay();
                LocalDateTime endOfDay = date.atTime(23, 59, 59);
                
                slotRepo.deleteByClinicIdAndStartTimeBetween(clinicId, startOfDay, endOfDay);
            }
            
            return ResponseEntity.ok(Map.of(
                "message", "Deleted slots",
                "dates", dates.size()
            ));
            
        } catch (Exception ex) {
            log.error("Error deleting slots", ex);
            return ResponseEntity.status(500).build();
        }
    }
}
