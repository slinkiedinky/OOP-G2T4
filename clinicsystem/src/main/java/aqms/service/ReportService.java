// This code was modified from an AI-generated code using Gemini 2.5 Pro.

package aqms.service;

import java.time.LocalDate;
import java.util.List;
import java.time.LocalDateTime;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import aqms.domain.dto.DailyReportDto;
import aqms.domain.enums.AppointmentStatus;
import aqms.domain.model.AppointmentSlot;
import aqms.repository.AppointmentRepository;
import aqms.repository.AppointmentSlotRepository;


/*
 * service class for handling business logic related to reports
 * 
 * this service is responsible for
 * - fetching data from the database via repositories
 * - performing da relevant calculations
 * - returning da result to the ReportController
 */
@Service
public class ReportService {
    private final AppointmentSlotRepository appointmentSlotRepository;

    // industry-standard constructor injection
    // spring will auto provide the AppointmentRepository
    @Autowired
    public ReportService(AppointmentSlotRepository appointmentSlotRepository) {
        this.appointmentSlotRepository = appointmentSlotRepository;
    }

    // generates a daily report for the given date
    // @param date - the date to generate the report for
    // @return - a DailyReportDto containing the calculated data
    public DailyReportDto generateDailyReport(LocalDate date, Long clinicId) {
        // step one: define time range for da entire day
        LocalDateTime startOfDay = date.atTime(0, 0, 0); // e.g. 2025-10-27T00:00:00
        LocalDateTime endOfDay = date.atTime(23, 59, 59); // e.g. 2025-10-27T23:59:59


        // step two: fetch all appointments for that day from the database
        // for this to be done,
        // a new method in the AppointmentSlotRepository interface needs to be done
        List<AppointmentSlot> appointments = appointmentSlotRepository.findByClinicIdAndStartTimeBetween(clinicId, startOfDay, endOfDay);

        // step three: edge case: no appointments returns an empty report
        if (appointments.isEmpty()) {
            return new DailyReportDto(date, 0, 0.0, 0.0);
        }

        
        // step four: initialise variables for calculation
        double totalWaitingTimeMinutes = 0.0;
        int patientsWithWaitingTime = 0; // initialise counter for valid waiting time calculations
        int noShowCount = 0;
        int totalPatientsSeen = 0;

        // step five: loop through all appointments to calculate statistics
        // using a for-each loop
        for (AppointmentSlot app : appointments) {
            // check by counting the completed patients (i.e. patients seen)
            if (app.getStatus() == AppointmentStatus.COMPLETED) {
                totalPatientsSeen++;

                // check by calculating waiting time for this patient
                // calculating the waiting time, need to do a subtraction
                // assume that the appointment entity has 'checkInTime' and 'consultationStartTime'
                // if (app.getStartTime() != null) {
                //     // calculate duration between check-in and seeing da doctor
                //     Duration waitingTime = Duration.between(app.getCheckInTime(), app.getConsultationStartTime());

                //     // add da patient's waiting time (in minutes) to total
                //     totalWaitingTimeMinutes += waitingTime.toMinutes();
                //     patientsWithWaitingTime++;
                // } 
            // check by counting the patients who did not show up
            } else if (app.getStatus() == AppointmentStatus.NO_SHOW) {
                noShowCount += 1;
            }

            // for this report, other statuses are ignored
        }

        // step six: finalize calculations

        // calculation: average waiting time
        double averageWaitingTimeMinutes = 0.0;
        if (patientsWithWaitingTime > 0) {
            averageWaitingTimeMinutes = totalWaitingTimeMinutes / patientsWithWaitingTime;
        }

        // calculation: no-show rate (no_shows / total_bookings)
        int totalBookings = appointments.size();
        double noShowRatePercentage = 0.0;
        if (totalBookings > 0) {
            noShowRatePercentage = ((double) noShowCount / totalBookings) * 100;
        }

        System.out.println("CP1" + noShowCount + " " + noShowRatePercentage);

        // step seven: create the final DTO and return it
        return new DailyReportDto(
            date,
            totalPatientsSeen,
            averageWaitingTimeMinutes,
            noShowRatePercentage
        );
    }
}
