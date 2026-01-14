package com.exemplo.dashboardvendas.repository;

import com.exemplo.dashboardvendas.model.FinanceiroPagamento;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface FinanceiroPagamentoRepository extends JpaRepository<FinanceiroPagamento, Long> {
}
