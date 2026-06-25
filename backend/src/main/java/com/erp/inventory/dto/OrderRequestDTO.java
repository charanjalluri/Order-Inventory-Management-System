package com.erp.inventory.dto;

import jakarta.validation.constraints.NotEmpty;
import lombok.Data;
import java.util.List;

@Data
public class OrderRequestDTO {
    private Long supplierId; // For Purchase Orders
    private Long customerId; // For Sales Orders
    private String status;    // For status transitions
    
    @NotEmpty
    private List<OrderItemRequestDTO> items;
}
