package com.exemplo.dashboardvendas.repository;

import com.exemplo.dashboardvendas.model.FinanceiroCliente;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Repository
public interface FinanceiroClienteRepository extends JpaRepository<FinanceiroCliente, Long> {

    // Common WHERE clause part for JPQL:
    // ... AND EXISTS (SELECT p FROM FinanceiroPagamento p WHERE p.clienteId = c.id)

    @Query("SELECT c FROM FinanceiroCliente c WHERE c.data BETWEEN :dataInicio AND :dataFim " +
           "AND EXISTS (SELECT p FROM FinanceiroPagamento p WHERE p.clienteId = c.id)")
    List<FinanceiroCliente> findByDataVendaBetween(@Param("dataInicio") LocalDate dataInicio, 
                                                   @Param("dataFim") LocalDate dataFim);
    
    @Query("SELECT c FROM FinanceiroCliente c WHERE " +
           "(:filial IS NULL OR c.filial = :filial) AND " +
           "(:vendedor IS NULL OR UPPER(c.vendedor) = :vendedor) AND " +
           "c.data BETWEEN :dataInicio AND :dataFim " +
           "AND EXISTS (SELECT p FROM FinanceiroPagamento p WHERE p.clienteId = c.id)")
    List<FinanceiroCliente> findByFiltros(@Param("filial") String filial,
                                          @Param("vendedor") String vendedor,
                                          @Param("dataInicio") LocalDate dataInicio,
                                          @Param("dataFim") LocalDate dataFim);
    
    // Soma total de vendas por filtros
    @Query("SELECT COALESCE(SUM(c.valorDebito), 0) FROM FinanceiroCliente c WHERE " +
           "(:filial IS NULL OR c.filial = :filial) AND " +
           "(:vendedor IS NULL OR UPPER(c.vendedor) = :vendedor) AND " +
           "c.data BETWEEN :dataInicio AND :dataFim " +
           "AND EXISTS (SELECT p FROM FinanceiroPagamento p WHERE p.clienteId = c.id)")
    BigDecimal somaVendasPorFiltros(@Param("filial") String filial,
                                    @Param("vendedor") String vendedor,
                                    @Param("dataInicio") LocalDate dataInicio,
                                    @Param("dataFim") LocalDate dataFim);
    
    // Ticket médio por filtros
    @Query("SELECT COALESCE(AVG(c.valorDebito), 0) FROM FinanceiroCliente c WHERE " +
           "(:filial IS NULL OR c.filial = :filial) AND " +
           "(:vendedor IS NULL OR UPPER(c.vendedor) = :vendedor) AND " +
           "c.data BETWEEN :dataInicio AND :dataFim " +
           "AND EXISTS (SELECT p FROM FinanceiroPagamento p WHERE p.clienteId = c.id)")
    BigDecimal ticketMedioPorFiltros(@Param("filial") String filial,
                                     @Param("vendedor") String vendedor,
                                     @Param("dataInicio") LocalDate dataInicio,
                                     @Param("dataFim") LocalDate dataFim);
    
    // Número de vendas por filtros
    @Query("SELECT COUNT(c) FROM FinanceiroCliente c WHERE " +
           "(:filial IS NULL OR c.filial = :filial) AND " +
           "(:vendedor IS NULL OR UPPER(c.vendedor) = :vendedor) AND " +
           "c.data BETWEEN :dataInicio AND :dataFim " +
           "AND EXISTS (SELECT p FROM FinanceiroPagamento p WHERE p.clienteId = c.id)")
    Long contarVendasPorFiltros(@Param("filial") String filial,
                                @Param("vendedor") String vendedor,
                                @Param("dataInicio") LocalDate dataInicio,
                                @Param("dataFim") LocalDate dataFim);
    
    // Maior venda por filtros
    @Query("SELECT c FROM FinanceiroCliente c WHERE " +
           "(:filial IS NULL OR c.filial = :filial) AND " +
           "(:vendedor IS NULL OR UPPER(c.vendedor) = :vendedor) AND " +
           "c.data BETWEEN :dataInicio AND :dataFim " +
           "AND EXISTS (SELECT p FROM FinanceiroPagamento p WHERE p.clienteId = c.id) " +
           "ORDER BY c.valorDebito DESC")
    List<FinanceiroCliente> maiorVendaPorFiltros(@Param("filial") String filial,
                                                 @Param("vendedor") String vendedor,
                                                 @Param("dataInicio") LocalDate dataInicio,
                                                 @Param("dataFim") LocalDate dataFim);
    
    // Vendedor que mais vendeu (por valor total)
    @Query("SELECT c.vendedor, SUM(c.valorDebito) as total FROM FinanceiroCliente c WHERE " +
           "(:filial IS NULL OR c.filial = :filial) AND " +
           "c.data BETWEEN :dataInicio AND :dataFim " +
           "AND EXISTS (SELECT p FROM FinanceiroPagamento p WHERE p.clienteId = c.id) " +
           "GROUP BY c.vendedor ORDER BY total DESC")
    List<Object[]> vendedorQueMaisVendeu(@Param("filial") String filial,
                                         @Param("dataInicio") LocalDate dataInicio,
                                         @Param("dataFim") LocalDate dataFim);
    
    // Top vendedores (todos, sem limite) - NATIVE for compatibility with original if needed, but JPQL works too.
    // Using native to ensure exact behavior with date functions if needed, but here simple GROUP BY is enough.
    // However, I need to check the payment existence.
    @Query(value = "SELECT v.vendedor, SUM(v.valor_debito) as total FROM financeiro_clientes v WHERE " +
           "(:filial IS NULL OR v.filial = :filial) AND " +
           "v.data BETWEEN :dataInicio AND :dataFim AND " +
           "EXISTS (SELECT 1 FROM financeiro_pagamentos p WHERE p.cliente_id = v.id) " +
           "GROUP BY v.vendedor HAVING SUM(v.valor_debito) > 0 ORDER BY total DESC", nativeQuery = true)
    List<Object[]> top10Vendedores(@Param("filial") String filial,
                                   @Param("dataInicio") LocalDate dataInicio,
                                   @Param("dataFim") LocalDate dataFim);
    
    // Top vendedores de múltiplas filiais (todos, sem limite)
    @Query(value = "SELECT v.vendedor, SUM(v.valor_debito) as total FROM financeiro_clientes v WHERE " +
           "v.filial IN :filiais AND " +
           "v.data BETWEEN :dataInicio AND :dataFim AND " +
           "EXISTS (SELECT 1 FROM financeiro_pagamentos p WHERE p.cliente_id = v.id) " +
           "GROUP BY v.vendedor HAVING SUM(v.valor_debito) > 0 ORDER BY total DESC", nativeQuery = true)
    List<Object[]> topVendedoresMultiplasFiliais(@Param("filiais") List<String> filiais,
                                                  @Param("dataInicio") LocalDate dataInicio,
                                                  @Param("dataFim") LocalDate dataFim);
    
    // Unidade que mais vendeu (por valor total)
    @Query("SELECT c.filial, SUM(c.valorDebito) as total FROM FinanceiroCliente c WHERE " +
           "(:vendedor IS NULL OR UPPER(c.vendedor) = :vendedor) AND " +
           "c.data BETWEEN :dataInicio AND :dataFim " +
           "AND EXISTS (SELECT p FROM FinanceiroPagamento p WHERE p.clienteId = c.id) " +
           "GROUP BY c.filial ORDER BY total DESC")
    List<Object[]> unidadeQueMaisVendeu(@Param("vendedor") String vendedor,
                                        @Param("dataInicio") LocalDate dataInicio,
                                        @Param("dataFim") LocalDate dataFim);
    
    // Buscar todas as filiais distintas (assuming valid sales only? Original didn't filter by sales existenc usually, just distinct)
    // But to be consistent with "Data Source", maybe we should only list filials with sales? 
    // The original `findDistinctFiliais` was just `SELECT DISTINCT v.filial FROM Venda v`.
    @Query("SELECT DISTINCT c.filial FROM FinanceiroCliente c ORDER BY c.filial")
    List<String> findDistinctFiliais();
    
    // Buscar todos os vendedores distintos
    @Query("SELECT DISTINCT UPPER(c.vendedor) FROM FinanceiroCliente c WHERE c.vendedor IS NOT NULL ORDER BY UPPER(c.vendedor)")
    List<String> findDistinctVendedores();
    
    // Buscar vendedores distintos por filial
    @Query("SELECT DISTINCT UPPER(c.vendedor) FROM FinanceiroCliente c WHERE c.filial = :filial AND c.vendedor IS NOT NULL ORDER BY UPPER(c.vendedor)")
    List<String> findDistinctVendedoresByFilial(@Param("filial") String filial);
    
    // Dados para gráfico de vendas por período
    @Query("SELECT c.data as data, SUM(c.valorDebito) as total FROM FinanceiroCliente c WHERE " +
           "(:filial IS NULL OR c.filial = :filial) AND " +
           "(:vendedor IS NULL OR UPPER(c.vendedor) = :vendedor) AND " +
           "c.data BETWEEN :dataInicio AND :dataFim " +
           "AND EXISTS (SELECT p FROM FinanceiroPagamento p WHERE p.clienteId = c.id) " +
           "GROUP BY c.data ORDER BY c.data")
    List<Object[]> dadosGraficoVendasPorPeriodo(@Param("filial") String filial,
                                                @Param("vendedor") String vendedor,
                                                @Param("dataInicio") LocalDate dataInicio,
                                                @Param("dataFim") LocalDate dataFim);
    
    // Dados para gráfico agrupados por mês (para período anual)
    @Query(value = "SELECT DATE_TRUNC('month', v.data) as mes, SUM(v.valor_debito) as total " +
           "FROM financeiro_clientes v WHERE " +
           "(:filial IS NULL OR v.filial = :filial) AND " +
           "(:vendedor IS NULL OR UPPER(v.vendedor) = :vendedor) AND " +
           "v.data BETWEEN :dataInicio AND :dataFim AND " +
           "EXISTS (SELECT 1 FROM financeiro_pagamentos p WHERE p.cliente_id = v.id) " +
           "GROUP BY DATE_TRUNC('month', v.data) " +
           "ORDER BY mes", nativeQuery = true)
    List<Object[]> dadosGraficoVendasPorMes(@Param("filial") String filial,
                                           @Param("vendedor") String vendedor,
                                           @Param("dataInicio") LocalDate dataInicio,
                                           @Param("dataFim") LocalDate dataFim);
    
    // Debug
    @Query(value = "SELECT EXTRACT(YEAR FROM v.data) as ano, " +
           "EXTRACT(MONTH FROM v.data) as mes, " +
           "COUNT(*) as vendas, SUM(v.valor_debito) as total " +
           "FROM financeiro_clientes v WHERE " +
           "v.data BETWEEN :dataInicio AND :dataFim AND " +
           "EXISTS (SELECT 1 FROM financeiro_pagamentos p WHERE p.cliente_id = v.id) " +
           "GROUP BY EXTRACT(YEAR FROM v.data), EXTRACT(MONTH FROM v.data) " +
           "ORDER BY ano, mes", nativeQuery = true)
    List<Object[]> debugMonthSummary(@Param("dataInicio") LocalDate dataInicio,
                                   @Param("dataFim") LocalDate dataFim);
}
