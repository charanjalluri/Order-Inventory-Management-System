package com.erp.inventory.service;

import com.erp.inventory.dto.OrderItemRequestDTO;
import com.erp.inventory.dto.OrderRequestDTO;
import com.erp.inventory.exception.BadRequestException;
import com.erp.inventory.exception.ResourceNotFoundException;
import com.erp.inventory.model.*;
import com.erp.inventory.repository.ProductRepository;
import com.erp.inventory.repository.PurchaseOrderRepository;
import com.erp.inventory.repository.SupplierRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Random;

@Service
public class PurchaseOrderService {

    @Autowired
    private PurchaseOrderRepository poRepository;

    @Autowired
    private SupplierRepository supplierRepository;

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private InventoryService inventoryService;

    public List<PurchaseOrder> getAllPurchaseOrders() {
        return poRepository.findAll();
    }

    public PurchaseOrder getPurchaseOrderById(Long id) {
        return poRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Purchase Order not found with id: " + id));
    }

    @Transactional
    public PurchaseOrder createPurchaseOrder(OrderRequestDTO dto, User user) {
        Supplier supplier = supplierRepository.findById(dto.getSupplierId())
                .orElseThrow(() -> new ResourceNotFoundException("Supplier not found with id: " + dto.getSupplierId()));

        String poNumber = "PO-" + LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMddHHmmss")) + "-" + (100 + new Random().nextInt(900));

        PurchaseOrder po = PurchaseOrder.builder()
                .poNumber(poNumber)
                .supplier(supplier)
                .status(PurchaseOrderStatus.DRAFT)
                .orderDate(LocalDateTime.now())
                .createdBy(user)
                .totalAmount(BigDecimal.ZERO)
                .items(new ArrayList<>())
                .build();

        BigDecimal total = BigDecimal.ZERO;
        for (OrderItemRequestDTO itemDto : dto.getItems()) {
            Product product = productRepository.findById(itemDto.getProductId())
                    .orElseThrow(() -> new ResourceNotFoundException("Product not found with id: " + itemDto.getProductId()));

            PurchaseOrderItem item = PurchaseOrderItem.builder()
                    .purchaseOrder(po)
                    .product(product)
                    .quantity(itemDto.getQuantity())
                    .unitPrice(itemDto.getUnitPrice())
                    .build();

            po.getItems().add(item);
            total = total.add(itemDto.getUnitPrice().multiply(BigDecimal.valueOf(itemDto.getQuantity())));
        }
        po.setTotalAmount(total);

        return poRepository.save(po);
    }

    @Transactional
    public PurchaseOrder updatePurchaseOrder(Long id, OrderRequestDTO dto) {
        PurchaseOrder po = getPurchaseOrderById(id);
        if (po.getStatus() != PurchaseOrderStatus.DRAFT && po.getStatus() != PurchaseOrderStatus.ORDERED) {
            throw new BadRequestException("Cannot edit Purchase Order in " + po.getStatus() + " status!");
        }

        Supplier supplier = supplierRepository.findById(dto.getSupplierId())
                .orElseThrow(() -> new ResourceNotFoundException("Supplier not found with id: " + dto.getSupplierId()));

        po.setSupplier(supplier);
        po.getItems().clear();

        BigDecimal total = BigDecimal.ZERO;
        for (OrderItemRequestDTO itemDto : dto.getItems()) {
            Product product = productRepository.findById(itemDto.getProductId())
                    .orElseThrow(() -> new ResourceNotFoundException("Product not found with id: " + itemDto.getProductId()));

            PurchaseOrderItem item = PurchaseOrderItem.builder()
                    .purchaseOrder(po)
                    .product(product)
                    .quantity(itemDto.getQuantity())
                    .unitPrice(itemDto.getUnitPrice())
                    .build();

            po.getItems().add(item);
            total = total.add(itemDto.getUnitPrice().multiply(BigDecimal.valueOf(itemDto.getQuantity())));
        }
        po.setTotalAmount(total);

        return poRepository.save(po);
    }

    @Transactional
    public PurchaseOrder updateStatus(Long id, String statusStr, User user) {
        PurchaseOrder po = getPurchaseOrderById(id);
        PurchaseOrderStatus newStatus = PurchaseOrderStatus.valueOf(statusStr.toUpperCase());

        if (po.getStatus() == newStatus) {
            return po;
        }

        // Terminal state protections
        if (po.getStatus() == PurchaseOrderStatus.RECEIVED) {
            throw new BadRequestException("Purchase Order has already been RECEIVED and cannot be modified!");
        }
        if (po.getStatus() == PurchaseOrderStatus.CANCELLED) {
            throw new BadRequestException("Purchase Order is CANCELLED and cannot be modified!");
        }

        if (newStatus == PurchaseOrderStatus.RECEIVED) {
            // Restock products
            for (PurchaseOrderItem item : po.getItems()) {
                inventoryService.logStockChange(
                        item.getProduct(),
                        InventoryTransactionType.PURCHASE,
                        item.getQuantity(),
                        po.getId(),
                        "Received stock from Purchase Order " + po.getPoNumber()
                );
            }
            po.setDeliveryDate(LocalDateTime.now());
        }

        po.setStatus(newStatus);
        return poRepository.save(po);
    }
}
