package com.exemplo.dashboardvendas.controller;

import com.exemplo.dashboardvendas.dto.DashboardResponse;
import com.exemplo.dashboardvendas.service.VendaService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;

@Controller
public class DashboardController {
    private static final Logger logger = LoggerFactory.getLogger(DashboardController.class);
    
    @Autowired
    private VendaService vendaService;
    
    @GetMapping("/")
    public String dashboard(Model model) {
        // Definir período padrão (hoje)
        LocalDate dataFim = LocalDate.now();
        LocalDate dataInicio = dataFim; // Mesmo dia para consistência com frontend
        
        DashboardResponse dadosDashboard = vendaService.getDadosDashboard(null, null, dataInicio, dataFim, false);
        
        model.addAttribute("dados", dadosDashboard);
        model.addAttribute("dataInicio", dataInicio);
        model.addAttribute("dataFim", dataFim);
        
        return "dashboard";
    }
    
    @GetMapping("/api/dashboard")
    @ResponseBody
    public ResponseEntity<DashboardResponse> getDadosDashboard(
            @RequestParam(required = false) String filial,
            @RequestParam(required = false) String vendedor,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dataInicio,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dataFim,
            @RequestParam(required = false, defaultValue = "false") boolean agruparPorMes) {
        
    logger.debug("/api/dashboard called with filial={}, vendedor={}, dataInicio={}, dataFim={}, agruparPorMes={}",
        filial, vendedor, dataInicio, dataFim, agruparPorMes);
    DashboardResponse response = vendaService.getDadosDashboard(filial, vendedor, dataInicio, dataFim, agruparPorMes);
    logger.debug("/api/dashboard response totalVendas={}, ticketMedio={}, dadosGrafico.size={}, top10Vendedores.size={}",
        response.getTotalVendas(), response.getTicketMedio(),
        response.getDadosGrafico() != null ? response.getDadosGrafico().size() : 0,
        response.getTop10Vendedores() != null ? response.getTop10Vendedores().size() : 0
    );
        return ResponseEntity.ok(response);
    }
    
    @GetMapping("/api/filiais")
    @ResponseBody
    public ResponseEntity<Object> getFiliais() {
        return ResponseEntity.ok(vendaService.obterFiliais());
    }
    
    @GetMapping("/api/vendedores")
    @ResponseBody
    public ResponseEntity<Object> getVendedores() {
        return ResponseEntity.ok(vendaService.obterVendedores());
    }
    
    @GetMapping("/api/vendedores/por-unidade")
    @ResponseBody
    public ResponseEntity<Object> getVendedoresPorUnidade(@RequestParam String filial) {
        return ResponseEntity.ok(vendaService.obterVendedoresPorUnidade(filial));
    }
}