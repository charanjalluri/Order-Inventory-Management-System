package com.erp.inventory.repository;

import com.erp.inventory.model.SalesOrder;
import com.erp.inventory.model.SalesOrderStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface SalesOrderRepository extends JpaRepository<SalesOrder, Long> {
    List<SalesOrder> findByStatus(SalesOrderStatus status);
    List<SalesOrder> findByCustomerId(Long customerId);
}
