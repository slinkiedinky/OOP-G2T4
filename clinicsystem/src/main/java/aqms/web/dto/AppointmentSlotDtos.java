package aqms.web.dto;

import aqms.domain.enums.AppointmentStatus;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Future;
import java.time.LocalDateTime;

public class AppointmentSlotDtos {
    
    public record GenerateSlotsRequest(
            @NotNull Long clinicId,
            @NotNull Long doctorId,
            @NotNull @Future LocalDateTime date
    ) {}
    
    public record CreateCustomSlotRequest(
            @NotNull Long clinicId,
            @NotNull Long doctorId,
            @NotNull @Future LocalDateTime startTime,
            @NotNull @Future LocalDateTime endTime
    ) {}
    
    public record UpdateIntervalRequest(
            @NotNull Long clinicId,
            @NotNull @Positive Integer intervalMinutes
    ) {}
    
    public record GetSlotsByDoctorRequest(
            @NotNull Long doctorId,
            @NotNull LocalDateTime startTime,
            @NotNull LocalDateTime endTime
    ) {}
    
    public record SlotResponse(
            Long id,
            Long clinicId,
            String clinicName,
            Long doctorId,
            String doctorName,
            LocalDateTime startTime,
            LocalDateTime endTime,
            AppointmentStatus status,
            Long patientId
    ) {}
}


