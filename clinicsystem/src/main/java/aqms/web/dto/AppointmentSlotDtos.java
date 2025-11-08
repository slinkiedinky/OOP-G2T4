package aqms.web.dto;

import aqms.domain.enums.AppointmentStatus;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import java.time.LocalDateTime;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import com.fasterxml.jackson.annotation.JsonFormat;

public class AppointmentSlotDtos {
    
    public record GenerateSlotsRequest(
            @NotNull Long clinicId,
            @NotNull @JsonFormat(pattern = "yyyy-MM-dd") LocalDate date,
            @NotNull @Positive Integer interval,
            @NotNull @Positive Integer slotDuration,
            @NotNull @JsonFormat(pattern = "HH:mm[:ss]") LocalTime openTime,
            @NotNull @JsonFormat(pattern = "HH:mm[:ss]") LocalTime closeTime
    ) {}
    
    public record CreateCustomSlotRequest(
            @NotNull Long clinicId,
            @NotNull Long doctorId,
            @NotNull LocalDateTime startTime,
            @NotNull LocalDateTime endTime
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
    
    public record AssignDoctorToSlotRequest(
            Long doctorId
    ) {}
    
    public record GetSlotsByClinicAndDateRequest(
            @NotNull Long clinicId,
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
            Long patientId,
            String patientName
    ) {}
    
    public record SessionTime(
            @NotNull @JsonFormat(pattern = "HH:mm[:ss]") LocalTime openTime,
            @NotNull @JsonFormat(pattern = "HH:mm[:ss]") LocalTime closeTime
    ) {}
    
    public record GenerateDailySlotsRequest(
            @NotNull Long clinicId,
            @NotNull @JsonFormat(pattern = "yyyy-MM-dd") LocalDate date,
            @NotNull @Positive Integer interval,
            @NotNull @Positive Integer slotDuration,
            @NotNull List<SessionTime> sessions
    ) {}
}


