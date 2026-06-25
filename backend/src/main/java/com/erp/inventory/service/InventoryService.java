package com.erp.inventory.service;

import com.erp.inventory.dto.InventoryAdjustmentRequest;
import com.erp.inventory.exception.BadRequestException;
import com.erp.inventory.model.InventoryLog;
import com.erp.inventory.model.InventoryTransactionType;
import com.erp.inventory.model.Product;
import com.erp.inventory.model.User;
import com.erp.inventory.repository.InventoryLogRepository;
import com.erp.inventory.repository.ProductRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class InventoryService {

    @Autowired
    private InventoryLogRepository inventoryLogRepository;

    @Autowired
    private ProductRepository productRepository;

    public List<InventoryLog> getAllLogs() {
        return inventoryLogRepository.findAllByOrderByTimestampDesc();
    }

    public List<InventoryLog> getLogsByProduct(Long productId) {
        return inventoryLogRepository.findByProductIdOrderByTimestampDesc(productId);
    }

    @Transactional
    public InventoryLog logStockChange(Product product, InventoryTransactionType type, Integer quantity, Long referenceId, String notes) {
        // Adjust product stock
        int newQty = product.getStockQuantity() + quantity;
        if (newQty < 0) {
            throw new BadRequestException("Stock quantity for product '" + product.getName() + "' cannot fall below zero!");
        }
        product.setStockQuantity(newQty);
        productRepository.save(product);

        InventoryLog log = InventoryLog.builder()
                .product(product)
                .transactionType(type)
                .quantity(quantity)
                .referenceId(referenceId)
                .notes(notes)
                .timestamp(LocalDateTime.now())
                .build();

        return inventoryLogRepository.save(log);
    }

    @Transactional
    public InventoryLog adjustStockManually(InventoryAdjustmentRequest request, User user) {
        Product product = productRepository.findById(request.getProductId())
                .orElseThrow(() -> new BadRequestException("Product not found with id: " + request.getProductId()));

        String notes = (request.getNotes() == null || request.getNotes().trim().isEmpty()) 
                ? "Manual adjustment by " + user.getUsername()
                : request.getNotes() + " (Adjusted by " + user.getUsername() + ")";

        return logStockChange(product, InventoryTransactionType.ADJUSTMENT, request.getQuantity(), user.getId(), notes);
    }
}
