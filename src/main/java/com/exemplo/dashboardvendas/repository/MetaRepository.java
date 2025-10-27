package com.exemplo.dashboardvendas.repository;

import com.exemplo.dashboardvendas.model.Meta;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface MetaRepository extends JpaRepository<Meta, Long> {
    
    /**
     * Busca metas ativas para uma filial em um período específico
     */
    @Query("SELECT m FROM Meta m WHERE m.filial = :filial " +
           "AND m.ativa = true " +
           "AND m.dataInicio <= :dataFim " +
           "AND m.dataFim >= :dataInicio " +
           "ORDER BY m.dataInicio DESC")
    List<Meta> findMetasAtivasPorFilialEPeriodo(
        @Param("filial") String filial,
        @Param("dataInicio") LocalDate dataInicio,
        @Param("dataFim") LocalDate dataFim
    );
    
    /**
     * Busca a meta mais recente ativa para uma filial
     */
    @Query("SELECT m FROM Meta m WHERE m.filial = :filial " +
           "AND m.ativa = true " +
           "ORDER BY m.dataInicio DESC")
    Optional<Meta> findMetaAtivaRecente(@Param("filial") String filial);
    
    /**
     * Busca metas ativas para múltiplas filiais em um período
     */
    @Query("SELECT m FROM Meta m WHERE m.filial IN :filiais " +
           "AND m.ativa = true " +
           "AND m.dataInicio <= :dataFim " +
           "AND m.dataFim >= :dataInicio")
    List<Meta> findMetasAtivasPorFiliaisEPeriodo(
        @Param("filiais") List<String> filiais,
        @Param("dataInicio") LocalDate dataInicio,
        @Param("dataFim") LocalDate dataFim
    );
    
    /**
     * Busca todas as metas ativas
     */
    List<Meta> findByAtivaTrue();
    
    /**
     * Busca metas por filial (ativas e inativas)
     */
    List<Meta> findByFilialOrderByDataInicioDesc(String filial);
}
