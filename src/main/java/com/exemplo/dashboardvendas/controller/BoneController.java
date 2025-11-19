package com.exemplo.dashboardvendas.controller;

import com.exemplo.dashboardvendas.dto.DashboardResponse;
import com.exemplo.dashboardvendas.service.BoneService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@Controller
@RequestMapping("/bone")
public class BoneController {
    private static final Logger logger = LoggerFactory.getLogger(BoneController.class);
    
    @Autowired
    private BoneService boneService;
    
    @GetMapping
    public String dashboard(Model model) {
        // Período da competição: 19/11/2025 até 31/12/2025
        LocalDate dataInicio = LocalDate.of(2025, 11, 19);
        LocalDate dataFim = LocalDate.of(2025, 12, 31);
        
        DashboardResponse dadosDashboard = boneService.getDadosDashboard(dataInicio, dataFim, "personalizado");
        
        model.addAttribute("dados", dadosDashboard);
        model.addAttribute("dataInicio", dataInicio);
        model.addAttribute("dataFim", dataFim);
        
        return "bone";
    }
    
    @GetMapping("/api/dados")
    @ResponseBody
    public ResponseEntity<DashboardResponse> getDadosDashboard(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dataInicio,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dataFim,
            @RequestParam(required = false, defaultValue = "hoje") String periodo) {
        
        logger.info("Recebendo requisição de dados do dashboard de bonés - dataInicio: {}, dataFim: {}, periodo: {}", 
                    dataInicio, dataFim, periodo);
        
        if (dataInicio == null || dataFim == null) {
            // Período padrão da competição: 19/11/2025 até 31/12/2025
            dataInicio = LocalDate.of(2025, 11, 19);
            dataFim = LocalDate.of(2025, 12, 31);
        }
        
        DashboardResponse dados = boneService.getDadosDashboard(dataInicio, dataFim, periodo);
        
        logger.info("Dados retornados - Total: {}, Período: {} a {}", 
                    dados.getTotalVendas(), dataInicio, dataFim);
        
        return ResponseEntity.ok(dados);
    }
    
    @GetMapping("/api/vendedores")
    @ResponseBody
    public ResponseEntity<List<String>> getVendedores() {
        List<String> vendedores = boneService.getVendedores();
        return ResponseEntity.ok(vendedores);
    }
}
