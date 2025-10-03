package com.exemplo.dashboardvendas.repository;

import com.exemplo.dashboardvendas.model.Venda;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Repository
public interface VendaRepository extends JpaRepository<Venda, Long> {
    
    // Buscar vendas por período
    @Query("SELECT v FROM Venda v WHERE v.dataVenda BETWEEN :dataInicio AND :dataFim")
    List<Venda> findByDataVendaBetween(@Param("dataInicio") LocalDate dataInicio, 
                                       @Param("dataFim") LocalDate dataFim);
    
    // Buscar vendas por unidade/filial
    @Query("SELECT v FROM Venda v WHERE v.filial = :filial")
    List<Venda> findByFilial(@Param("filial") String filial);
    
    // Buscar vendas por vendedor
    @Query("SELECT v FROM Venda v WHERE v.vendedor = :vendedor")
    List<Venda> findByVendedor(@Param("vendedor") String vendedor);
    
    // Buscar vendas com múltiplos filtros
    @Query("SELECT v FROM Venda v WHERE " +
           "(:filial IS NULL OR v.filial = :filial) AND " +
           "(:vendedor IS NULL OR v.vendedor = :vendedor) AND " +
           "v.dataVenda BETWEEN :dataInicio AND :dataFim")
    List<Venda> findByFiltros(@Param("filial") String filial,
                              @Param("vendedor") String vendedor,
                              @Param("dataInicio") LocalDate dataInicio,
                              @Param("dataFim") LocalDate dataFim);
    
    // Soma total de vendas por filtros
    @Query("SELECT COALESCE(SUM(v.valorVenda), 0) FROM Venda v WHERE " +
           "(:filial IS NULL OR v.filial = :filial) AND " +
           "(:vendedor IS NULL OR v.vendedor = :vendedor) AND " +
           "v.dataVenda BETWEEN :dataInicio AND :dataFim")
    BigDecimal somaVendasPorFiltros(@Param("filial") String filial,
                                    @Param("vendedor") String vendedor,
                                    @Param("dataInicio") LocalDate dataInicio,
                                    @Param("dataFim") LocalDate dataFim);
    
    // Ticket médio por filtros
    @Query("SELECT COALESCE(AVG(v.valorVenda), 0) FROM Venda v WHERE " +
           "(:filial IS NULL OR v.filial = :filial) AND " +
           "(:vendedor IS NULL OR v.vendedor = :vendedor) AND " +
           "v.dataVenda BETWEEN :dataInicio AND :dataFim")
    BigDecimal ticketMedioPorFiltros(@Param("filial") String filial,
                                     @Param("vendedor") String vendedor,
                                     @Param("dataInicio") LocalDate dataInicio,
                                     @Param("dataFim") LocalDate dataFim);
    
    // Maior venda por filtros
    @Query("SELECT v FROM Venda v WHERE " +
           "(:filial IS NULL OR v.filial = :filial) AND " +
           "(:vendedor IS NULL OR v.vendedor = :vendedor) AND " +
           "v.dataVenda BETWEEN :dataInicio AND :dataFim " +
           "ORDER BY v.valorVenda DESC")
    List<Venda> maiorVendaPorFiltros(@Param("filial") String filial,
                                     @Param("vendedor") String vendedor,
                                     @Param("dataInicio") LocalDate dataInicio,
                                     @Param("dataFim") LocalDate dataFim);
    
    // Vendedor que mais vendeu (por valor total)
    @Query("SELECT v.vendedor, SUM(v.valorVenda) as total FROM Venda v WHERE " +
           "(:filial IS NULL OR v.filial = :filial) AND " +
           "v.dataVenda BETWEEN :dataInicio AND :dataFim " +
           "GROUP BY v.vendedor ORDER BY total DESC")
    List<Object[]> vendedorQueMaisVendeu(@Param("filial") String filial,
                                         @Param("dataInicio") LocalDate dataInicio,
                                         @Param("dataFim") LocalDate dataFim);
    
    // Top 10 vendedores
    @Query(value = "SELECT v.vendedor, SUM(v.valor_venda) as total FROM vendas_nacional v WHERE " +
           "(:filial IS NULL OR v.filial = :filial) AND " +
           "v.data_venda BETWEEN :dataInicio AND :dataFim " +
           "GROUP BY v.vendedor ORDER BY total DESC LIMIT 10", nativeQuery = true)
    List<Object[]> top10Vendedores(@Param("filial") String filial,
                                   @Param("dataInicio") LocalDate dataInicio,
                                   @Param("dataFim") LocalDate dataFim);
    
    // Unidade que mais vendeu (por valor total)
    @Query("SELECT v.filial, SUM(v.valorVenda) as total FROM Venda v WHERE " +
           "(:vendedor IS NULL OR v.vendedor = :vendedor) AND " +
           "v.dataVenda BETWEEN :dataInicio AND :dataFim " +
           "GROUP BY v.filial ORDER BY total DESC")
    List<Object[]> unidadeQueMaisVendeu(@Param("vendedor") String vendedor,
                                        @Param("dataInicio") LocalDate dataInicio,
                                        @Param("dataFim") LocalDate dataFim);
    
    // Buscar todas as filiais distintas
    @Query("SELECT DISTINCT v.filial FROM Venda v ORDER BY v.filial")
    List<String> findDistinctFiliais();
    
    // Buscar todos os vendedores distintos
    @Query("SELECT DISTINCT v.vendedor FROM Venda v ORDER BY v.vendedor")
    List<String> findDistinctVendedores();
    
    // Buscar vendedores distintos por filial
    @Query("SELECT DISTINCT v.vendedor FROM Venda v WHERE v.filial = :filial ORDER BY v.vendedor")
    List<String> findDistinctVendedoresByFilial(@Param("filial") String filial);
    
    // Dados para gráfico de vendas por período
    @Query("SELECT v.dataVenda as data, SUM(v.valorVenda) as total FROM Venda v WHERE " +
           "(:filial IS NULL OR v.filial = :filial) AND " +
           "(:vendedor IS NULL OR v.vendedor = :vendedor) AND " +
           "v.dataVenda BETWEEN :dataInicio AND :dataFim " +
           "GROUP BY v.dataVenda ORDER BY v.dataVenda")
    List<Object[]> dadosGraficoVendasPorPeriodo(@Param("filial") String filial,
                                                @Param("vendedor") String vendedor,
                                                @Param("dataInicio") LocalDate dataInicio,
                                                @Param("dataFim") LocalDate dataFim);
    
    // Dados para gráfico agrupados por mês (para período anual)
    @Query(value = "SELECT DATE_TRUNC('month', v.data_venda) as mes, SUM(v.valor_venda) as total " +
           "FROM vendas_nacional v WHERE " +
           "(:filial IS NULL OR v.filial = :filial) AND " +
           "(:vendedor IS NULL OR v.vendedor = :vendedor) AND " +
           "v.data_venda BETWEEN :dataInicio AND :dataFim " +
           "GROUP BY DATE_TRUNC('month', v.data_venda) " +
           "ORDER BY mes", nativeQuery = true)
    List<Object[]> dadosGraficoVendasPorMes(@Param("filial") String filial,
                                           @Param("vendedor") String vendedor,
                                           @Param("dataInicio") LocalDate dataInicio,
                                           @Param("dataFim") LocalDate dataFim);
}