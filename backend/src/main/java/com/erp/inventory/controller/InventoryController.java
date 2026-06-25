package com.erp.inventory.controller;

import com.erp.inventory.dto.InventoryAdjustmentRequest;
import com.erp.inventory.model.InventoryLog;
import com.erp.inventory.security.CustomUserDetails;
import com.erp.inventory.service.InventoryService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/inventory")
public class InventoryController {

    @Autowired
    private InventoryService inventoryService;

    @GetMapping("/logs")
    public ResponseEntity<List<InventoryLog>> getAllLogs() {
        return ResponseEntity.ok(inventoryService.getAllLogs());
    }

    @GetMapping("/logs/product/{productId}")
    public ResponseEntity<List<InventoryLog>> getLogsByProduct(@PathVariable Long productId) {
        return ResponseEntity.ok(inventoryService.getLogsByProduct(productId));
    }

    @PostMapping("/adjust")
    public ResponseEntity<InventoryLog> adjustStockManually(
            @Valid @RequestBody InventoryAdjustmentRequest request, 
            Authentication auth) {
        CustomUserDetails userDetails = (CustomUserDetails) auth.getPrincipal();
        return ResponseEntity.ok(inventoryService.adjustStockManually(request, userDetails.getUser()));
    }
}
