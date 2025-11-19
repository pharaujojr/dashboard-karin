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
public interface BoneRepository extends JpaRepository<Venda, Long> {
    
    // Filiais específicas para análise de bonés
    String FILIAIS_BONE = "('Sorriso', 'Lucas do Rio Verde', 'Sinop')";
    String FILTRO_BONE = "v.bone = 'SIM'";
    
    // Soma total de vendas de bonés
    @Query("SELECT COALESCE(SUM(v.valorVenda), 0) FROM Venda v WHERE " +
           "v.filial IN ('Sorriso', 'Lucas do Rio Verde', 'Sinop') AND " +
           "v.bone = 'SIM' AND " +
           "(:vendedor IS NULL OR UPPER(v.vendedor) = :vendedor) AND " +
           "v.dataVenda BETWEEN :dataInicio AND :dataFim")
    BigDecimal somaVendasBone(@Param("vendedor") String vendedor,
                              @Param("dataInicio") LocalDate dataInicio,
                              @Param("dataFim") LocalDate dataFim);
    
    // Ticket médio de bonés
    @Query("SELECT COALESCE(AVG(v.valorVenda), 0) FROM Venda v WHERE " +
           "v.filial IN ('Sorriso', 'Lucas do Rio Verde', 'Sinop') AND " +
           "v.bone = 'SIM' AND " +
           "(:vendedor IS NULL OR UPPER(v.vendedor) = :vendedor) AND " +
           "v.dataVenda BETWEEN :dataInicio AND :dataFim")
    BigDecimal ticketMedioBone(@Param("vendedor") String vendedor,
                               @Param("dataInicio") LocalDate dataInicio,
                               @Param("dataFim") LocalDate dataFim);
    
    // Número de vendas de bonés
    @Query("SELECT COUNT(v) FROM Venda v WHERE " +
           "v.filial IN ('Sorriso', 'Lucas do Rio Verde', 'Sinop') AND " +
           "v.bone = 'SIM' AND " +
           "(:vendedor IS NULL OR UPPER(v.vendedor) = :vendedor) AND " +
           "v.dataVenda BETWEEN :dataInicio AND :dataFim")
    Long contarVendasBone(@Param("vendedor") String vendedor,
                          @Param("dataInicio") LocalDate dataInicio,
                          @Param("dataFim") LocalDate dataFim);
    
    // Maior venda de bonés
    @Query("SELECT v FROM Venda v WHERE " +
           "v.filial IN ('Sorriso', 'Lucas do Rio Verde', 'Sinop') AND " +
           "v.bone = 'SIM' AND " +
           "(:vendedor IS NULL OR UPPER(v.vendedor) = :vendedor) AND " +
           "v.dataVenda BETWEEN :dataInicio AND :dataFim " +
           "ORDER BY v.valorVenda DESC")
    List<Venda> maiorVendaBone(@Param("vendedor") String vendedor,
                               @Param("dataInicio") LocalDate dataInicio,
                               @Param("dataFim") LocalDate dataFim);
    
    // Top vendedores de bonés
    @Query(value = "SELECT v.vendedor, SUM(v.valor_venda) as total FROM vendas_nacional v WHERE " +
           "v.filial IN ('Sorriso', 'Lucas do Rio Verde', 'Sinop') AND " +
           "v.bone = 'SIM' AND " +
           "v.data_venda BETWEEN :dataInicio AND :dataFim " +
           "GROUP BY v.vendedor ORDER BY total DESC", nativeQuery = true)
    List<Object[]> topVendedoresBone(@Param("dataInicio") LocalDate dataInicio,
                                     @Param("dataFim") LocalDate dataFim);
    
    // Unidade que mais vendeu bonés
    @Query("SELECT v.filial, SUM(v.valorVenda) as total FROM Venda v WHERE " +
           "v.filial IN ('Sorriso', 'Lucas do Rio Verde', 'Sinop') AND " +
           "v.bone = 'SIM' AND " +
           "(:vendedor IS NULL OR UPPER(v.vendedor) = :vendedor) AND " +
           "v.dataVenda BETWEEN :dataInicio AND :dataFim " +
           "GROUP BY v.filial ORDER BY total DESC")
    List<Object[]> unidadeQueMaisVendeuBone(@Param("vendedor") String vendedor,
                                            @Param("dataInicio") LocalDate dataInicio,
                                            @Param("dataFim") LocalDate dataFim);
    
    // Dados para gráfico de vendas de bonés por período
    @Query("SELECT v.dataVenda as data, SUM(v.valorVenda) as total FROM Venda v WHERE " +
           "v.filial IN ('Sorriso', 'Lucas do Rio Verde', 'Sinop') AND " +
           "v.bone = 'SIM' AND " +
           "(:vendedor IS NULL OR UPPER(v.vendedor) = :vendedor) AND " +
           "v.dataVenda BETWEEN :dataInicio AND :dataFim " +
           "GROUP BY v.dataVenda ORDER BY v.dataVenda")
    List<Object[]> dadosGraficoVendasBonePorPeriodo(@Param("vendedor") String vendedor,
                                                    @Param("dataInicio") LocalDate dataInicio,
                                                    @Param("dataFim") LocalDate dataFim);
    
    // Dados para gráfico agrupados por mês
    @Query(value = "SELECT DATE_TRUNC('month', v.data_venda) as mes, SUM(v.valor_venda) as total " +
           "FROM vendas_nacional v WHERE " +
           "v.filial IN ('Sorriso', 'Lucas do Rio Verde', 'Sinop') AND " +
           "v.bone = 'SIM' AND " +
           "(:vendedor IS NULL OR UPPER(v.vendedor) = :vendedor) AND " +
           "v.data_venda BETWEEN :dataInicio AND :dataFim " +
           "GROUP BY DATE_TRUNC('month', v.data_venda) " +
           "ORDER BY mes", nativeQuery = true)
    List<Object[]> dadosGraficoVendasBonePorMes(@Param("vendedor") String vendedor,
                                                @Param("dataInicio") LocalDate dataInicio,
                                                @Param("dataFim") LocalDate dataFim);
    
    // Buscar todos os vendedores de bonés distintos
    @Query("SELECT DISTINCT UPPER(v.vendedor) FROM Venda v WHERE " +
           "v.filial IN ('Sorriso', 'Lucas do Rio Verde', 'Sinop') AND " +
           "v.bone = 'SIM' AND " +
           "v.vendedor IS NOT NULL " +
           "ORDER BY UPPER(v.vendedor)")
    List<String> findDistinctVendedoresBone();
}
