package com.erp.inventory.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class InventoryAdjustmentRequest {
    @NotNull
    private Long productId;

    @NotNull
    private Integer quantity; // Can be positive (restock) or negative (shrinkage/loss)

    private String notes;
}
