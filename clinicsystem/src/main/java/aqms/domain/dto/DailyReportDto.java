package aqms.domain.dto;

import java.time.LocalDate;

/*
 * data transfer object (DTO) for daily report
 * 
 * according to project requirements, 
 * this class defines data structure for "reporting" feature.
 * 
 * simple "POJO" (plain old java object) used to transfer data
 * from the service,
 * through the controller,
 * to the frontend.
 */
public class DailyReportDto {
    
    // no. of patients seen
    private int totalPatientsSeen;

    // avg waiting time
    private double averageWaitingTimeMinutes; // e.g. 20.5

    // no-show rates
    private double noShowRatePercentage; // e.g. 9.7

    // ----
    private LocalDate reportDate;

    // constructor
    public DailyReportDto() {
        // default constructor for JSON serialization
    }

    public DailyReportDto(LocalDate reportDate, int totalPatientsSeen, double averageWaitingTimeMinutes, double noShowRatePercentage) {
        this.reportDate = reportDate;
        this.totalPatientsSeen = totalPatientsSeen;
        this.averageWaitingTimeMinutes = averageWaitingTimeMinutes;
        this.noShowRatePercentage = noShowRatePercentage;
    }

    // getters and setters
    // required for spring framework for conversion to JSON

    public LocalDate getReportDate() {
        return reportDate;
    }

    public void setReportDate(LocalDate reportDate) {
        this.reportDate = reportDate;
    }

    public double getAverageWaitingTimeMinutes() {
        return averageWaitingTimeMinutes;
    }

    public void setAverageWaitingTimeMinutes(double averageWaitingTimeMinutes) {
        this.averageWaitingTimeMinutes = averageWaitingTimeMinutes;
    }

    public double getNoShowRatePercentage() {
        return noShowRatePercentage;
    }

    public void setNoShowRatePercentage(double noShowRatePercentage) {
        this.noShowRatePercentage = noShowRatePercentage;
    }


    public int getTotalPatientsSeen() {
        return totalPatientsSeen;
    }

    public void setTotalPatientsSeen(int totalPatientsSeen) {
        this.totalPatientsSeen = totalPatientsSeen;
    }
}
