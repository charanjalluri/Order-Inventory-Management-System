package com.erp.inventory.service;

import com.erp.inventory.dto.OrderItemRequestDTO;
import com.erp.inventory.dto.OrderRequestDTO;
import com.erp.inventory.exception.BadRequestException;
import com.erp.inventory.exception.ResourceNotFoundException;
import com.erp.inventory.model.*;
import com.erp.inventory.repository.CustomerRepository;
import com.erp.inventory.repository.ProductRepository;
import com.erp.inventory.repository.SalesOrderRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Lazy;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Random;

@Service
public class SalesOrderService {

    @Autowired
    private SalesOrderRepository salesOrderRepository;

    @Autowired
    private CustomerRepository customerRepository;

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private InventoryService inventoryService;

    @Autowired
    @Lazy
    private InvoiceService invoiceService;

    public List<SalesOrder> getAllSalesOrders() {
        return salesOrderRepository.findAll();
    }

    public SalesOrder getSalesOrderById(Long id) {
        return salesOrderRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Sales Order not found with id: " + id));
    }

    @Transactional
    public SalesOrder createSalesOrder(OrderRequestDTO dto, User user) {
        Customer customer = customerRepository.findById(dto.getCustomerId())
                .orElseThrow(() -> new ResourceNotFoundException("Customer not found with id: " + dto.getCustomerId()));

        String soNumber = "SO-" + LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMddHHmmss")) + "-" + (100 + new Random().nextInt(900));

        SalesOrder so = SalesOrder.builder()
                .soNumber(soNumber)
                .customer(customer)
                .status(SalesOrderStatus.DRAFT)
                .orderDate(LocalDateTime.now())
                .createdBy(user)
                .totalAmount(BigDecimal.ZERO)
                .items(new ArrayList<>())
                .build();

        BigDecimal total = BigDecimal.ZERO;
        for (OrderItemRequestDTO itemDto : dto.getItems()) {
            Product product = productRepository.findById(itemDto.getProductId())
                    .orElseThrow(() -> new ResourceNotFoundException("Product not found with id: " + itemDto.getProductId()));

            SalesOrderItem item = SalesOrderItem.builder()
                    .salesOrder(so)
                    .product(product)
                    .quantity(itemDto.getQuantity())
                    .unitPrice(itemDto.getUnitPrice())
                    .build();

            so.getItems().add(item);
            total = total.add(itemDto.getUnitPrice().multiply(BigDecimal.valueOf(itemDto.getQuantity())));
        }
        so.setTotalAmount(total);

        return salesOrderRepository.save(so);
    }

    @Transactional
    public SalesOrder updateSalesOrder(Long id, OrderRequestDTO dto) {
        SalesOrder so = getSalesOrderById(id);
        if (so.getStatus() != SalesOrderStatus.DRAFT && so.getStatus() != SalesOrderStatus.CONFIRMED) {
            throw new BadRequestException("Cannot edit Sales Order in " + so.getStatus() + " status!");
        }

        Customer customer = customerRepository.findById(dto.getCustomerId())
                .orElseThrow(() -> new ResourceNotFoundException("Customer not found with id: " + dto.getCustomerId()));

        so.setCustomer(customer);
        so.getItems().clear();

        BigDecimal total = BigDecimal.ZERO;
        for (OrderItemRequestDTO itemDto : dto.getItems()) {
            Product product = productRepository.findById(itemDto.getProductId())
                    .orElseThrow(() -> new ResourceNotFoundException("Product not found with id: " + itemDto.getProductId()));

            SalesOrderItem item = SalesOrderItem.builder()
                    .salesOrder(so)
                    .product(product)
                    .quantity(itemDto.getQuantity())
                    .unitPrice(itemDto.getUnitPrice())
                    .build();

            so.getItems().add(item);
            total = total.add(itemDto.getUnitPrice().multiply(BigDecimal.valueOf(itemDto.getQuantity())));
        }
        so.setTotalAmount(total);

        return salesOrderRepository.save(so);
    }

    @Transactional
    public SalesOrder updateStatus(Long id, String statusStr, User user) {
        SalesOrder so = getSalesOrderById(id);
        SalesOrderStatus newStatus = SalesOrderStatus.valueOf(statusStr.toUpperCase());

        if (so.getStatus() == newStatus) {
            return so;
        }

        // Terminal state protections
        if (so.getStatus() == SalesOrderStatus.SHIPPED || so.getStatus() == SalesOrderStatus.DELIVERED) {
            if (newStatus == SalesOrderStatus.CANCELLED || newStatus == SalesOrderStatus.DRAFT) {
                throw new BadRequestException("Cannot cancel or revert a Sales Order after it has been shipped!");
            }
        }
        if (so.getStatus() == SalesOrderStatus.CANCELLED) {
            throw new BadRequestException("Sales Order is CANCELLED and cannot be modified!");
        }

        if (newStatus == SalesOrderStatus.SHIPPED) {
            // Check stock availability
            for (SalesOrderItem item : so.getItems()) {
                if (item.getProduct().getStockQuantity() < item.getQuantity()) {
                    throw new BadRequestException("Insufficient stock for product '" + item.getProduct().getName() + 
                            "'. Available: " + item.getProduct().getStockQuantity() + ", Ordered: " + item.getQuantity());
                }
            }

            // Deduct stock and log
            for (SalesOrderItem item : so.getItems()) {
                inventoryService.logStockChange(
                        item.getProduct(),
                        InventoryTransactionType.SALE,
                        -item.getQuantity(),
                        so.getId(),
                        "Shipped stock for Sales Order " + so.getSoNumber()
                );
            }
            so.setShippingDate(LocalDateTime.now());

            // Auto-generate invoice
            invoiceService.createInvoiceForSalesOrder(so);
        }

        so.setStatus(newStatus);
        return salesOrderRepository.save(so);
    }
}
