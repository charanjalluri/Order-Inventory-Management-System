package com.erp.inventory.controller;

import com.erp.inventory.dto.DashboardStatsDTO;
import com.erp.inventory.service.ReportService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/reports")
public class ReportController {

    @Autowired
    private ReportService reportService;

    @GetMapping("/dashboard")
    public ResponseEntity<DashboardStatsDTO> getDashboardStats() {
        return ResponseEntity.ok(reportService.getDashboardStats());
    }

    @GetMapping("/export/inventory")
    public ResponseEntity<String> exportInventory() {
        String csv = reportService.exportInventoryCSV();
        
        HttpHeaders headers = new HttpHeaders();
        headers.setContentDisposition(ContentDisposition.builder("attachment").filename("inventory_report.csv").build());
        headers.setContentType(MediaType.parseMediaType("text/csv"));
        
        return new ResponseEntity<>(csv, headers, HttpStatus.OK);
    }
}
