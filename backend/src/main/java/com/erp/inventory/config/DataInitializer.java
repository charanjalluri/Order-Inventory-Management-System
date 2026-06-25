package com.erp.inventory.config;

import com.erp.inventory.model.*;
import com.erp.inventory.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;

@Component
public class DataInitializer implements CommandLineRunner {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private CategoryRepository categoryRepository;

    @Autowired
    private SupplierRepository supplierRepository;

    @Autowired
    private CustomerRepository customerRepository;

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private PurchaseOrderRepository poRepository;

    @Autowired
    private SalesOrderRepository soRepository;

    @Autowired
    private InvoiceRepository invoiceRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) throws Exception {
        if (userRepository.count() > 0) {
            // Already seeded
            return;
        }

        // 1. Seed Users
        User admin = User.builder()
                .username("admin")
                .email("admin@erp.com")
                .password(passwordEncoder.encode("admin123"))
                .role(Role.ADMIN)
                .active(true)
                .build();

        User employee = User.builder()
                .username("employee")
                .email("employee@erp.com")
                .password(passwordEncoder.encode("employee123"))
                .role(Role.EMPLOYEE)
                .active(true)
                .build();

        userRepository.saveAll(Arrays.asList(admin, employee));

        // 2. Seed Categories
        Category electronics = Category.builder().name("Electronics").description("Computers, mobile phones, gadgets").build();
        Category officeSupplies = Category.builder().name("Office Supplies").description("Stationery, papers, writing gear").build();
        Category apparel = Category.builder().name("Apparel").description("Clothing, footwear, fashion accessories").build();
        Category groceries = Category.builder().name("Groceries").description("Daily food items, pantry stock").build();

        categoryRepository.saveAll(Arrays.asList(electronics, officeSupplies, apparel, groceries));

        // 3. Seed Suppliers
        Supplier techDist = Supplier.builder().name("TechDistributors Inc.").contactName("Alex Mercer").email("sales@techdist.com").phone("555-0199").address("42 Silicon Valley Rd").paymentTerms("Net 30").build();
        Supplier globalPaper = Supplier.builder().name("Global Paper Co.").contactName("Sarah Jenkins").email("orders@globalpaper.com").phone("555-0120").address("10 Pine St, Oregon").paymentTerms("Net 60").build();
        Supplier premiumFashion = Supplier.builder().name("Premium Fashion Ltd.").contactName("Marc Jacobs").email("marc@fashionltd.com").phone("555-0188").address("5th Ave, NY").paymentTerms("Cash on Delivery").build();

        supplierRepository.saveAll(Arrays.asList(techDist, globalPaper, premiumFashion));

        // 4. Seed Customers
        Customer john = Customer.builder().name("John Doe").email("john.doe@gmail.com").phone("555-1234").address("123 Maple St").balance(BigDecimal.ZERO).build();
        Customer acme = Customer.builder().name("Acme Corporation").email("purchasing@acme.com").phone("555-9876").address("888 industrial Blvd").balance(BigDecimal.ZERO).build();
        Customer alice = Customer.builder().name("Alice Smith").email("alice@outlook.com").phone("555-4321").address("742 Evergreen Terrace").balance(BigDecimal.ZERO).build();

        customerRepository.saveAll(Arrays.asList(john, acme, alice));

        // 5. Seed Products (Including Low Stock Products)
        Product laptop = Product.builder()
                .sku("TECH-LAP-001")
                .name("Enterprise Core-i7 Laptop")
                .description("14-inch professional laptop, 16GB RAM, 512GB SSD")
                .price(BigDecimal.valueOf(1200.00))
                .costPrice(BigDecimal.valueOf(850.00))
                .stockQuantity(15)
                .minStockLevel(5)
                .category(electronics)
                .supplier(techDist)
                .build();

        Product mouse = Product.builder()
                .sku("TECH-MOU-002")
                .name("Wireless Optical Mouse")
                .description("Ergonomic 2.4GHz wireless pointer mouse")
                .price(BigDecimal.valueOf(25.00))
                .costPrice(BigDecimal.valueOf(12.50))
                .stockQuantity(3) // Low stock (3 <= 10)
                .minStockLevel(10)
                .category(electronics)
                .supplier(techDist)
                .build();

        Product keyboard = Product.builder()
                .sku("TECH-KEY-003")
                .name("Mechanical Keyboard")
                .description("RGB backlit mechanical keyboard with blue switches")
                .price(BigDecimal.valueOf(80.00))
                .costPrice(BigDecimal.valueOf(45.00))
                .stockQuantity(2) // Low stock (2 <= 5)
                .minStockLevel(5)
                .category(electronics)
                .supplier(techDist)
                .build();

        Product notebook = Product.builder()
                .sku("OFF-NOT-001")
                .name("Ruled Notebook A5")
                .description("Hardcover 200 pages ruled writing journal")
                .price(BigDecimal.valueOf(5.99))
                .costPrice(BigDecimal.valueOf(2.50))
                .stockQuantity(120)
                .minStockLevel(20)
                .category(officeSupplies)
                .supplier(globalPaper)
                .build();

        Product pen = Product.builder()
                .sku("OFF-PEN-002")
                .name("Premium Gel Pen Black")
                .description("Pack of 10 smooth-writing fine gel pens")
                .price(BigDecimal.valueOf(12.00))
                .costPrice(BigDecimal.valueOf(5.00))
                .stockQuantity(8) // Low stock (8 <= 15)
                .minStockLevel(15)
                .category(officeSupplies)
                .supplier(globalPaper)
                .build();

        Product tshirt = Product.builder()
                .sku("CLO-TSH-001")
                .name("Classic Cotton T-Shirt")
                .description("100% breathable organic cotton plain crewneck shirt")
                .price(BigDecimal.valueOf(19.99))
                .costPrice(BigDecimal.valueOf(8.00))
                .stockQuantity(50)
                .minStockLevel(10)
                .category(apparel)
                .supplier(premiumFashion)
                .build();

        productRepository.saveAll(Arrays.asList(laptop, mouse, keyboard, notebook, pen, tshirt));

        // 6. Seed Purchase Orders
        PurchaseOrder po1 = PurchaseOrder.builder()
                .poNumber("PO-INITIAL-001")
                .supplier(techDist)
                .status(PurchaseOrderStatus.RECEIVED)
                .orderDate(LocalDateTime.now().minusMonths(2))
                .deliveryDate(LocalDateTime.now().minusMonths(2).plusDays(5))
                .createdBy(admin)
                .totalAmount(BigDecimal.valueOf(4250.00))
                .build();

        PurchaseOrderItem po1Item1 = PurchaseOrderItem.builder()
                .purchaseOrder(po1)
                .product(laptop)
                .quantity(5)
                .unitPrice(BigDecimal.valueOf(850.00))
                .build();
        po1.setItems(List.of(po1Item1));

        PurchaseOrder po2 = PurchaseOrder.builder()
                .poNumber("PO-PENDING-002")
                .supplier(globalPaper)
                .status(PurchaseOrderStatus.ORDERED)
                .orderDate(LocalDateTime.now().minusDays(3))
                .createdBy(employee)
                .totalAmount(BigDecimal.valueOf(250.00))
                .build();

        PurchaseOrderItem po2Item1 = PurchaseOrderItem.builder()
                .purchaseOrder(po2)
                .product(notebook)
                .quantity(100)
                .unitPrice(BigDecimal.valueOf(2.50))
                .build();
        po2.setItems(List.of(po2Item1));

        poRepository.saveAll(Arrays.asList(po1, po2));

        // 7. Seed Sales Orders (Spanning multiple months for chart trend data)
        // Two months ago
        SalesOrder so1 = SalesOrder.builder()
                .soNumber("SO-HIST-001")
                .customer(john)
                .status(SalesOrderStatus.DELIVERED)
                .orderDate(LocalDateTime.now().minusMonths(2))
                .shippingDate(LocalDateTime.now().minusMonths(2).plusDays(1))
                .createdBy(employee)
                .totalAmount(BigDecimal.valueOf(1280.00))
                .build();

        SalesOrderItem so1Item1 = SalesOrderItem.builder().salesOrder(so1).product(laptop).quantity(1).unitPrice(BigDecimal.valueOf(1200.00)).build();
        SalesOrderItem so1Item2 = SalesOrderItem.builder().salesOrder(so1).product(keyboard).quantity(1).unitPrice(BigDecimal.valueOf(80.00)).build();
        so1.setItems(List.of(so1Item1, so1Item2));

        // One month ago
        SalesOrder so2 = SalesOrder.builder()
                .soNumber("SO-HIST-002")
                .customer(acme)
                .status(SalesOrderStatus.SHIPPED)
                .orderDate(LocalDateTime.now().minusMonths(1))
                .shippingDate(LocalDateTime.now().minusMonths(1).plusDays(1))
                .createdBy(admin)
                .totalAmount(BigDecimal.valueOf(2530.00))
                .build();

        SalesOrderItem so2Item1 = SalesOrderItem.builder().salesOrder(so2).product(laptop).quantity(2).unitPrice(BigDecimal.valueOf(1200.00)).build();
        SalesOrderItem so2Item2 = SalesOrderItem.builder().salesOrder(so2).product(mouse).quantity(4).unitPrice(BigDecimal.valueOf(25.00)).build();
        SalesOrderItem so2Item3 = SalesOrderItem.builder().salesOrder(so2).product(pen).quantity(2).unitPrice(BigDecimal.valueOf(15.00)).build();
        so2.setItems(List.of(so2Item1, so2Item2, so2Item3));

        // Current month
        SalesOrder so3 = SalesOrder.builder()
                .soNumber("SO-CURR-003")
                .customer(alice)
                .status(SalesOrderStatus.CONFIRMED)
                .orderDate(LocalDateTime.now().minusDays(5))
                .createdBy(employee)
                .totalAmount(BigDecimal.valueOf(240.00))
                .build();

        SalesOrderItem so3Item1 = SalesOrderItem.builder().salesOrder(so3).product(keyboard).quantity(3).unitPrice(BigDecimal.valueOf(80.00)).build();
        so3.setItems(List.of(so3Item1));

        soRepository.saveAll(Arrays.asList(so1, so2, so3));

        // 8. Seed Invoices for shipped/delivered orders
        Invoice inv1 = Invoice.builder()
                .invoiceNumber("INV-HIST-001")
                .salesOrder(so1)
                .invoiceDate(LocalDateTime.now().minusMonths(2))
                .dueDate(LocalDateTime.now().minusMonths(2).plusDays(15))
                .status(InvoiceStatus.PAID)
                .taxAmount(BigDecimal.valueOf(128.00))
                .totalAmount(BigDecimal.valueOf(1408.00))
                .build();

        Invoice inv2 = Invoice.builder()
                .invoiceNumber("INV-HIST-002")
                .salesOrder(so2)
                .invoiceDate(LocalDateTime.now().minusMonths(1))
                .dueDate(LocalDateTime.now().minusMonths(1).plusDays(15))
                .status(InvoiceStatus.UNPAID)
                .taxAmount(BigDecimal.valueOf(253.00))
                .totalAmount(BigDecimal.valueOf(2783.00))
                .build();

        invoiceRepository.saveAll(Arrays.asList(inv1, inv2));

        // Sync outstanding customer balances based on active unpaid invoices
        acme.setBalance(BigDecimal.valueOf(2783.00));
        customerRepository.save(acme);
    }
}
