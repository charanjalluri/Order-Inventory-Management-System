package com.erp.inventory.service;

import com.erp.inventory.exception.BadRequestException;
import com.erp.inventory.exception.ResourceNotFoundException;
import com.erp.inventory.model.*;
import com.erp.inventory.repository.CustomerRepository;
import com.erp.inventory.repository.InvoiceRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Random;

@Service
public class InvoiceService {

    @Autowired
    private InvoiceRepository invoiceRepository;

    @Autowired
    private CustomerRepository customerRepository;

    public List<Invoice> getAllInvoices() {
        return invoiceRepository.findAll();
    }

    public Invoice getInvoiceById(Long id) {
        return invoiceRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Invoice not found with id: " + id));
    }

    public Invoice getInvoiceBySalesOrder(Long salesOrderId) {
        return invoiceRepository.findBySalesOrderId(salesOrderId)
                .orElseThrow(() -> new ResourceNotFoundException("Invoice not found for Sales Order id: " + salesOrderId));
    }

    @Transactional
    public Invoice createInvoiceForSalesOrder(SalesOrder salesOrder) {
        // Check if invoice already exists
        if (invoiceRepository.findBySalesOrderId(salesOrder.getId()).isPresent()) {
            throw new BadRequestException("Invoice already exists for Sales Order " + salesOrder.getSoNumber());
        }

        String invoiceNumber = "INV-" + LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMddHHmmss")) + "-" + (100 + new Random().nextInt(900));
        
        // Calculate tax: 10%
        BigDecimal taxRate = BigDecimal.valueOf(0.10);
        BigDecimal subtotal = salesOrder.getTotalAmount();
        BigDecimal taxAmount = subtotal.multiply(taxRate);
        BigDecimal totalAmount = subtotal.add(taxAmount);

        Invoice invoice = Invoice.builder()
                .invoiceNumber(invoiceNumber)
                .salesOrder(salesOrder)
                .invoiceDate(LocalDateTime.now())
                .dueDate(LocalDateTime.now().plusDays(15)) // 15 days payment term
                .status(InvoiceStatus.UNPAID)
                .taxAmount(taxAmount)
                .totalAmount(totalAmount)
                .build();

        // Increment customer outstanding balance
        Customer customer = salesOrder.getCustomer();
        customer.setBalance(customer.getBalance().add(totalAmount));
        customerRepository.save(customer);

        return invoiceRepository.save(invoice);
    }

    @Transactional
    public Invoice payInvoice(Long id) {
        Invoice invoice = getInvoiceById(id);
        if (invoice.getStatus() == InvoiceStatus.PAID) {
            throw new BadRequestException("Invoice is already paid!");
        }

        invoice.setStatus(InvoiceStatus.PAID);

        // Deduct from customer outstanding balance
        Customer customer = invoice.getSalesOrder().getCustomer();
        customer.setBalance(customer.getBalance().subtract(invoice.getTotalAmount()));
        customerRepository.save(customer);

        return invoiceRepository.save(invoice);
    }

    @Transactional
    public Invoice markAsOverdue(Long id) {
        Invoice invoice = getInvoiceById(id);
        if (invoice.getStatus() != InvoiceStatus.UNPAID) {
            throw new BadRequestException("Only UNPAID invoices can be marked as OVERDUE!");
        }
        invoice.setStatus(InvoiceStatus.OVERDUE);
        return invoiceRepository.save(invoice);
    }
}
