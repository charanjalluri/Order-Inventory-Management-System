package com.erp.inventory.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DashboardStatsDTO {
    private BigDecimal totalSales;
    private BigDecimal totalPurchases;
    private long lowStockCount;
    private BigDecimal totalInventoryValue;
    private List<Map<String, Object>> salesTrend;
    private List<Map<String, Object>> categoryDistribution;
    private List<Map<String, Object>> recentOrders;
}
