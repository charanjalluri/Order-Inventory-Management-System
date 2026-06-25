package com.erp.inventory.controller;

import com.erp.inventory.dto.OrderRequestDTO;
import com.erp.inventory.model.PurchaseOrder;
import com.erp.inventory.security.CustomUserDetails;
import com.erp.inventory.service.PurchaseOrderService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/orders/purchase")
public class PurchaseOrderController {

    @Autowired
    private PurchaseOrderService poService;

    @GetMapping
    public ResponseEntity<List<PurchaseOrder>> getAllPurchaseOrders() {
        return ResponseEntity.ok(poService.getAllPurchaseOrders());
    }

    @GetMapping("/{id}")
    public ResponseEntity<PurchaseOrder> getPurchaseOrderById(@PathVariable Long id) {
        return ResponseEntity.ok(poService.getPurchaseOrderById(id));
    }

    @PostMapping
    public ResponseEntity<PurchaseOrder> createPurchaseOrder(@Valid @RequestBody OrderRequestDTO dto, Authentication auth) {
        CustomUserDetails userDetails = (CustomUserDetails) auth.getPrincipal();
        return ResponseEntity.ok(poService.createPurchaseOrder(dto, userDetails.getUser()));
    }

    @PutMapping("/{id}")
    public ResponseEntity<PurchaseOrder> updatePurchaseOrder(@PathVariable Long id, @Valid @RequestBody OrderRequestDTO dto) {
        return ResponseEntity.ok(poService.updatePurchaseOrder(id, dto));
    }

    @PutMapping("/{id}/status")
    public ResponseEntity<PurchaseOrder> updateStatus(
            @PathVariable Long id, 
            @RequestParam("status") String status, 
            Authentication auth) {
        CustomUserDetails userDetails = (CustomUserDetails) auth.getPrincipal();
        return ResponseEntity.ok(poService.updateStatus(id, status, userDetails.getUser()));
    }
}
