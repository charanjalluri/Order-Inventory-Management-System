package com.erp.inventory.controller;

import com.erp.inventory.dto.OrderRequestDTO;
import com.erp.inventory.model.SalesOrder;
import com.erp.inventory.security.CustomUserDetails;
import com.erp.inventory.service.SalesOrderService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/orders/sales")
public class SalesOrderController {

    @Autowired
    private SalesOrderService salesOrderService;

    @GetMapping
    public ResponseEntity<List<SalesOrder>> getAllSalesOrders() {
        return ResponseEntity.ok(salesOrderService.getAllSalesOrders());
    }

    @GetMapping("/{id}")
    public ResponseEntity<SalesOrder> getSalesOrderById(@PathVariable Long id) {
        return ResponseEntity.ok(salesOrderService.getSalesOrderById(id));
    }

    @PostMapping
    public ResponseEntity<SalesOrder> createSalesOrder(@Valid @RequestBody OrderRequestDTO dto, Authentication auth) {
        CustomUserDetails userDetails = (CustomUserDetails) auth.getPrincipal();
        return ResponseEntity.ok(salesOrderService.createSalesOrder(dto, userDetails.getUser()));
    }

    @PutMapping("/{id}")
    public ResponseEntity<SalesOrder> updateSalesOrder(@PathVariable Long id, @Valid @RequestBody OrderRequestDTO dto) {
        return ResponseEntity.ok(salesOrderService.updateSalesOrder(id, dto));
    }

    @PutMapping("/{id}/status")
    public ResponseEntity<SalesOrder> updateStatus(
            @PathVariable Long id, 
            @RequestParam("status") String status, 
            Authentication auth) {
        CustomUserDetails userDetails = (CustomUserDetails) auth.getPrincipal();
        return ResponseEntity.ok(salesOrderService.updateStatus(id, status, userDetails.getUser()));
    }
}
