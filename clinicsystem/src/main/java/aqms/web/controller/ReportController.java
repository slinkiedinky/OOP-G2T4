// This code was modified from an AI-generated code using Gemini 2.5 Pro.

package aqms.web.controller;

import java.time.LocalDate;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.*;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;


import aqms.service.ReportService;
import aqms.domain.dto.DailyReportDto;

import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;

// controller that handles HTTP requests pertaining to report generation.

// the class is the entry point for the reporting feature,
// handling the request and
// delegating logic to the ReportService.
@RequestMapping("api/reports")
@RestController
@CrossOrigin(origins = "*") // allows requests from frontend apps
@PreAuthorize("hasRole('STAFF') or hasRole('ADMIN')")
public class ReportController {
    
    private final ReportService reportService;

    // according to industry standard
    // constructor injection for ReportService
    // @param reportService: the service that will perform report generation logic.
    @Autowired
    public ReportController(ReportService reportService) {
        this.reportService = reportService;
    }

    // daily report generation for a specific date,
    // with date passed as a URL parameter
    // for example, GET /api/reports/daily?date=2025-10-24

    // @param date - the date for which to generate the report
    // @return - a ResponseEntity containing the DailyReportDto with report data.
    @GetMapping("/daily")
    public ResponseEntity<DailyReportDto> getDailyReport(
        @RequestParam("date")
        @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
        LocalDate date,
        @RequestParam("clinicId") Long clinicId
        ) {
            // delegate all logic to service layer
            System.out.println("C801B Game Master" + clinicId);
            DailyReportDto report = reportService.generateDailyReport(date, clinicId);

            // return report data
            // with 200 OK
            return ResponseEntity.ok(report);
        }
}
