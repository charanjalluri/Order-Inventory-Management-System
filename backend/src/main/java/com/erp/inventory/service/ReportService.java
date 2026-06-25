package com.erp.inventory.service;

import com.erp.inventory.dto.DashboardStatsDTO;
import com.erp.inventory.model.*;
import com.erp.inventory.repository.CategoryRepository;
import com.erp.inventory.repository.ProductRepository;
import com.erp.inventory.repository.PurchaseOrderRepository;
import com.erp.inventory.repository.SalesOrderRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.format.TextStyle;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class ReportService {

    @Autowired
    private SalesOrderRepository salesOrderRepository;

    @Autowired
    private PurchaseOrderRepository purchaseOrderRepository;

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private CategoryRepository categoryRepository;

    public DashboardStatsDTO getDashboardStats() {
        List<SalesOrder> salesOrders = salesOrderRepository.findAll();
        List<PurchaseOrder> purchaseOrders = purchaseOrderRepository.findAll();
        List<Product> products = productRepository.findAll();

        // 1. Total Sales (exclude DRAFT and CANCELLED)
        BigDecimal totalSales = salesOrders.stream()
                .filter(so -> so.getStatus() != SalesOrderStatus.DRAFT && so.getStatus() != SalesOrderStatus.CANCELLED)
                .map(SalesOrder::getTotalAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        // 2. Total Purchases (exclude DRAFT and CANCELLED)
        BigDecimal totalPurchases = purchaseOrders.stream()
                .filter(po -> po.getStatus() != PurchaseOrderStatus.DRAFT && po.getStatus() != PurchaseOrderStatus.CANCELLED)
                .map(PurchaseOrder::getTotalAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        // 3. Low Stock Count
        long lowStockCount = productRepository.countLowStockProducts();

        // 4. Total Inventory Value (Stock Qty * Cost Price)
        BigDecimal totalInventoryValue = products.stream()
                .map(p -> p.getCostPrice().multiply(BigDecimal.valueOf(p.getStockQuantity())))
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        // 5. Sales Trend (Grouped by Month over the last 6 months)
        List<Map<String, Object>> salesTrend = calculateSalesTrend(salesOrders);

        // 6. Category Distribution (Count of products in each category)
        List<Map<String, Object>> categoryDistribution = calculateCategoryDistribution(products);

        // 7. Recent Orders Combined (limit 5 sales + 5 purchase orders sorted by order date desc)
        List<Map<String, Object>> recentOrders = getRecentOrdersList(salesOrders, purchaseOrders);

        return DashboardStatsDTO.builder()
                .totalSales(totalSales)
                .totalPurchases(totalPurchases)
                .lowStockCount(lowStockCount)
                .totalInventoryValue(totalInventoryValue)
                .salesTrend(salesTrend)
                .categoryDistribution(categoryDistribution)
                .recentOrders(recentOrders)
                .build();
    }

    private List<Map<String, Object>> calculateSalesTrend(List<SalesOrder> salesOrders) {
        // Group by Month
        Map<String, BigDecimal> monthlySales = new LinkedHashMap<>();
        
        // Initialize past 6 months
        LocalDateTime now = LocalDateTime.now();
        for (int i = 5; i >= 0; i--) {
            LocalDateTime targetMonth = now.minusMonths(i);
            String monthName = targetMonth.getMonth().getDisplayName(TextStyle.SHORT, Locale.ENGLISH) + " " + targetMonth.getYear();
            monthlySales.put(monthName, BigDecimal.ZERO);
        }

        // Fill with actual sales
        for (SalesOrder so : salesOrders) {
            if (so.getStatus() != SalesOrderStatus.DRAFT && so.getStatus() != SalesOrderStatus.CANCELLED) {
                String monthName = so.getOrderDate().getMonth().getDisplayName(TextStyle.SHORT, Locale.ENGLISH) + " " + so.getOrderDate().getYear();
                if (monthlySales.containsKey(monthName)) {
                    monthlySales.put(monthName, monthlySales.get(monthName).add(so.getTotalAmount()));
                }
            }
        }

        List<Map<String, Object>> trendList = new ArrayList<>();
        monthlySales.forEach((month, amount) -> {
            Map<String, Object> dataPoint = new HashMap<>();
            dataPoint.put("name", month);
            dataPoint.put("Sales", amount);
            trendList.add(dataPoint);
        });

        return trendList;
    }

    private List<Map<String, Object>> calculateCategoryDistribution(List<Product> products) {
        Map<String, Integer> catCounts = new HashMap<>();
        for (Product p : products) {
            String catName = p.getCategory() != null ? p.getCategory().getName() : "Unassigned";
            catCounts.put(catName, catCounts.getOrDefault(catName, 0) + p.getStockQuantity());
        }

        List<Map<String, Object>> distList = new ArrayList<>();
        catCounts.forEach((cat, qty) -> {
            Map<String, Object> dataPoint = new HashMap<>();
            dataPoint.put("name", cat);
            dataPoint.put("value", qty);
            distList.add(dataPoint);
        });

        return distList;
    }

    private List<Map<String, Object>> getRecentOrdersList(List<SalesOrder> sales, List<PurchaseOrder> purchases) {
        List<Map<String, Object>> ordersList = new ArrayList<>();

        for (SalesOrder so : sales) {
            Map<String, Object> map = new HashMap<>();
            map.put("id", so.getId());
            map.put("number", so.getSoNumber());
            map.put("type", "Sales");
            map.put("partner", so.getCustomer().getName());
            map.put("status", so.getStatus().name());
            map.put("amount", so.getTotalAmount());
            map.put("date", so.getOrderDate());
            ordersList.add(map);
        }

        for (PurchaseOrder po : purchases) {
            Map<String, Object> map = new HashMap<>();
            map.put("id", po.getId());
            map.put("number", po.getPoNumber());
            map.put("type", "Purchase");
            map.put("partner", po.getSupplier().getName());
            map.put("status", po.getStatus().name());
            map.put("amount", po.getTotalAmount());
            map.put("date", po.getOrderDate());
            ordersList.add(map);
        }

        // Sort by Date Descending
        return ordersList.stream()
                .sorted((o1, o2) -> ((LocalDateTime) o2.get("date")).compareTo((LocalDateTime) o1.get("date")))
                .limit(8)
                .collect(Collectors.toList());
    }

    public String exportInventoryCSV() {
        List<Product> products = productRepository.findAll();
        StringBuilder csv = new StringBuilder();
        csv.append("SKU,Product Name,Category,Supplier,Price,Cost Price,Stock Quantity,Min Stock Level,Status\n");
        for (Product p : products) {
            String cat = p.getCategory() != null ? p.getCategory().getName() : "N/A";
            String sup = p.getSupplier() != null ? p.getSupplier().getName() : "N/A";
            String status = p.getStockQuantity() <= 0 ? "Out of Stock" : (p.getStockQuantity() <= p.getMinStockLevel() ? "Low Stock" : "In Stock");
            csv.append(String.format("\"%s\",\"%s\",\"%s\",\"%s\",%.2f,%.2f,%d,%d,\"%s\"\n",
                    p.getSku(),
                    p.getName().replace("\"", "\"\""),
                    cat.replace("\"", "\"\""),
                    sup.replace("\"", "\"\""),
                    p.getPrice(),
                    p.getCostPrice(),
                    p.getStockQuantity(),
                    p.getMinStockLevel(),
                    status
            ));
        }
        return csv.toString();
    }
}
