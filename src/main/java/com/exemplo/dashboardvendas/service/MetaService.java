package com.exemplo.dashboardvendas.service;

import com.exemplo.dashboardvendas.model.Meta;
import com.exemplo.dashboardvendas.repository.MetaRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Service
public class MetaService {
    
    @Autowired
    private MetaRepository metaRepository;
    
    // Valor padrão de meta caso não exista no banco
    private static final BigDecimal META_PADRAO = new BigDecimal("1000000.00");
    
    /**
     * Busca a meta para uma filial em um período específico
     * Se não encontrar, retorna a meta padrão
     */
    public BigDecimal obterMetaPorFilialEPeriodo(String filial, LocalDate dataInicio, LocalDate dataFim) {
        List<Meta> metas = metaRepository.findMetasAtivasPorFilialEPeriodo(filial, dataInicio, dataFim);
        
        if (!metas.isEmpty()) {
            return metas.get(0).getValorMeta();
        }
        
        return META_PADRAO;
    }
    
    /**
     * Busca metas para múltiplas filiais em um período
     * Retorna um Map com filial -> valor da meta
     */
    public Map<String, BigDecimal> obterMetasPorFiliaisEPeriodo(List<String> filiais, LocalDate dataInicio, LocalDate dataFim) {
        Map<String, BigDecimal> metasMap = new HashMap<>();
        
        List<Meta> metas = metaRepository.findMetasAtivasPorFiliaisEPeriodo(filiais, dataInicio, dataFim);
        
        // Mapear metas encontradas
        for (Meta meta : metas) {
            metasMap.put(meta.getFilial(), meta.getValorMeta());
        }
        
        // Adicionar meta padrão para filiais sem meta cadastrada
        for (String filial : filiais) {
            if (!metasMap.containsKey(filial)) {
                metasMap.put(filial, META_PADRAO);
            }
        }
        
        return metasMap;
    }
    
    /**
     * Salva ou atualiza uma meta
     */
    @Transactional
    public Meta salvarMeta(Meta meta) {
        return metaRepository.save(meta);
    }
    
    /**
     * Cria uma nova meta
     */
    @Transactional
    public Meta criarMeta(String filial, BigDecimal valorMeta, LocalDate dataInicio, LocalDate dataFim, String descricao) {
        Meta meta = new Meta(filial, valorMeta, dataInicio, dataFim);
        meta.setDescricao(descricao);
        return metaRepository.save(meta);
    }
    
    /**
     * Desativa uma meta
     */
    @Transactional
    public void desativarMeta(Long id) {
        Optional<Meta> metaOpt = metaRepository.findById(id);
        if (metaOpt.isPresent()) {
            Meta meta = metaOpt.get();
            meta.setAtiva(false);
            metaRepository.save(meta);
        }
    }
    
    /**
     * Lista todas as metas ativas
     */
    public List<Meta> listarMetasAtivas() {
        return metaRepository.findByAtivaTrue();
    }
    
    /**
     * Lista metas de uma filial específica
     */
    public List<Meta> listarMetasPorFilial(String filial) {
        return metaRepository.findByFilialOrderByDataInicioDesc(filial);
    }
    
    /**
     * Busca meta por ID
     */
    public Optional<Meta> buscarPorId(Long id) {
        return metaRepository.findById(id);
    }
}
