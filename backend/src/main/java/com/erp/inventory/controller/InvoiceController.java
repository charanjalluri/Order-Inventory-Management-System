package com.erp.inventory.controller;

import com.erp.inventory.model.Invoice;
import com.erp.inventory.service.InvoiceService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/invoices")
public class InvoiceController {

    @Autowired
    private InvoiceService invoiceService;

    @GetMapping
    public ResponseEntity<List<Invoice>> getAllInvoices() {
        return ResponseEntity.ok(invoiceService.getAllInvoices());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Invoice> getInvoiceById(@PathVariable Long id) {
        return ResponseEntity.ok(invoiceService.getInvoiceById(id));
    }

    @GetMapping("/order/{salesOrderId}")
    public ResponseEntity<Invoice> getInvoiceBySalesOrder(@PathVariable Long salesOrderId) {
        return ResponseEntity.ok(invoiceService.getInvoiceBySalesOrder(salesOrderId));
    }

    @PutMapping("/{id}/pay")
    public ResponseEntity<Invoice> payInvoice(@PathVariable Long id) {
        return ResponseEntity.ok(invoiceService.payInvoice(id));
    }

    @PutMapping("/{id}/overdue")
    public ResponseEntity<Invoice> markAsOverdue(@PathVariable Long id) {
        return ResponseEntity.ok(invoiceService.markAsOverdue(id));
    }
}
