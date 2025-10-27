package com.exemplo.dashboardvendas.controller;

import com.exemplo.dashboardvendas.model.Meta;
import com.exemplo.dashboardvendas.service.MetaService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/metas")
@CrossOrigin(origins = "*")
public class MetaController {
    
    @Autowired
    private MetaService metaService;
    
    /**
     * Busca meta para uma filial em um período
     * GET /api/metas/filial?filial=Jaraguá do Sul&dataInicio=2025-10-27&dataFim=2025-10-31
     */
    @GetMapping("/filial")
    public ResponseEntity<Map<String, Object>> obterMetaPorFilial(
            @RequestParam String filial,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dataInicio,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dataFim) {
        
        BigDecimal valorMeta = metaService.obterMetaPorFilialEPeriodo(filial, dataInicio, dataFim);
        
        return ResponseEntity.ok(Map.of(
            "filial", filial,
            "valorMeta", valorMeta,
            "dataInicio", dataInicio,
            "dataFim", dataFim
        ));
    }
    
    /**
     * Busca metas para múltiplas filiais
     * GET /api/metas/filiais?filial=Jaraguá do Sul&filial=Matupá&dataInicio=2025-10-27&dataFim=2025-10-31
     */
    @GetMapping("/filiais")
    public ResponseEntity<Map<String, BigDecimal>> obterMetasPorFiliais(
            @RequestParam List<String> filial,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dataInicio,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dataFim) {
        
        Map<String, BigDecimal> metas = metaService.obterMetasPorFiliaisEPeriodo(filial, dataInicio, dataFim);
        return ResponseEntity.ok(metas);
    }
    
    /**
     * Cria uma nova meta
     * POST /api/metas
     */
    @PostMapping
    public ResponseEntity<Meta> criarMeta(@RequestBody Meta meta) {
        Meta novaMeta = metaService.salvarMeta(meta);
        return ResponseEntity.status(HttpStatus.CREATED).body(novaMeta);
    }
    
    /**
     * Atualiza uma meta existente
     * PUT /api/metas/{id}
     */
    @PutMapping("/{id}")
    public ResponseEntity<Meta> atualizarMeta(@PathVariable Long id, @RequestBody Meta meta) {
        return metaService.buscarPorId(id)
            .map(metaExistente -> {
                meta.setId(id);
                Meta metaAtualizada = metaService.salvarMeta(meta);
                return ResponseEntity.ok(metaAtualizada);
            })
            .orElse(ResponseEntity.notFound().build());
    }
    
    /**
     * Desativa uma meta
     * DELETE /api/metas/{id}
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> desativarMeta(@PathVariable Long id) {
        metaService.desativarMeta(id);
        return ResponseEntity.noContent().build();
    }
    
    /**
     * Lista todas as metas ativas
     * GET /api/metas
     */
    @GetMapping
    public ResponseEntity<List<Meta>> listarMetasAtivas() {
        List<Meta> metas = metaService.listarMetasAtivas();
        return ResponseEntity.ok(metas);
    }
    
    /**
     * Lista metas de uma filial específica
     * GET /api/metas/filial/{filial}/historico
     */
    @GetMapping("/filial/{filial}/historico")
    public ResponseEntity<List<Meta>> listarMetasPorFilial(@PathVariable String filial) {
        List<Meta> metas = metaService.listarMetasPorFilial(filial);
        return ResponseEntity.ok(metas);
    }
}
