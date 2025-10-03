package com.exemplo.dashboardvendas.service;

import com.exemplo.dashboardvendas.dto.DashboardResponse;
import com.exemplo.dashboardvendas.model.Venda;
import com.exemplo.dashboardvendas.repository.VendaRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class VendaService {
    private static final Logger logger = LoggerFactory.getLogger(VendaService.class);
    
    @Autowired
    private VendaRepository vendaRepository;
    
    public DashboardResponse getDadosDashboard(String filial, String vendedor, 
                                             LocalDate dataInicio, LocalDate dataFim, boolean agruparPorMes) {
        
    // Calcular total de vendas
    BigDecimal totalVendas = vendaRepository.somaVendasPorFiltros(filial, vendedor, dataInicio, dataFim);
        
        // Calcular ticket médio
        BigDecimal ticketMedio = vendaRepository.ticketMedioPorFiltros(filial, vendedor, dataInicio, dataFim);
        
        // Obter dados MAX
        DashboardResponse.MaxResponse maxResponse = obterDadosMax(filial, vendedor, dataInicio, dataFim);
        
        // Obter dados para gráfico (por dia ou por mês)
        List<Map<String, Object>> dadosGrafico = agruparPorMes ? 
            obterDadosGraficoPorMes(filial, vendedor, dataInicio, dataFim) :
            obterDadosGrafico(filial, vendedor, dataInicio, dataFim);
        
        // Obter top 10 vendedores
        List<Map<String, Object>> top10Vendedores = obterTop10Vendedores(filial, dataInicio, dataFim);
        
        // Obter listas para filtros
        List<String> filiais = vendaRepository.findDistinctFiliais();
        List<String> vendedores = vendaRepository.findDistinctVendedores();

    // Debug logs
    logger.debug("getDadosDashboard params filial={}, vendedor={}, dataInicio={}, dataFim={}, agruparPorMes={}",
        filial, vendedor, dataInicio, dataFim, agruparPorMes);
    logger.debug("Totals -> totalVendas={}, ticketMedio={}, dadosGrafico.size={}, top10.size={}",
        totalVendas, ticketMedio, dadosGrafico != null ? dadosGrafico.size() : 0,
        top10Vendedores != null ? top10Vendedores.size() : 0);
        
        return new DashboardResponse(totalVendas, ticketMedio, maxResponse, dadosGrafico, top10Vendedores, filiais, vendedores);
    }
    
    private DashboardResponse.MaxResponse obterDadosMax(String filial, String vendedor, 
                                                       LocalDate dataInicio, LocalDate dataFim) {
        
        // Maior venda
        List<Venda> maioresVendas = vendaRepository.maiorVendaPorFiltros(filial, vendedor, dataInicio, dataFim);
        BigDecimal maiorVenda = BigDecimal.ZERO;
        String clienteMaiorVenda = "";
        String vendedorMaiorVenda = "";
        
        if (!maioresVendas.isEmpty()) {
            Venda vendaMaior = maioresVendas.get(0);
            maiorVenda = vendaMaior.getValorVenda();
            clienteMaiorVenda = vendaMaior.getCliente();
            vendedorMaiorVenda = vendaMaior.getVendedor() != null ? vendaMaior.getVendedor() : "";
        }
        
        // Vendedor que mais vendeu
        List<Object[]> vendedorMax = vendaRepository.vendedorQueMaisVendeu(filial, dataInicio, dataFim);
        String vendedorQueMaisVendeu = "";
        BigDecimal totalVendedorMax = BigDecimal.ZERO;
        
        if (!vendedorMax.isEmpty()) {
            Object[] resultado = vendedorMax.get(0);
            vendedorQueMaisVendeu = (String) resultado[0];
            totalVendedorMax = (BigDecimal) resultado[1];
        }
        
        // Unidade que mais vendeu
        List<Object[]> unidadeMax = vendaRepository.unidadeQueMaisVendeu(vendedor, dataInicio, dataFim);
        String unidadeQueMaisVendeu = "";
        BigDecimal totalUnidadeMax = BigDecimal.ZERO;
        
        if (!unidadeMax.isEmpty()) {
            Object[] resultado = unidadeMax.get(0);
            unidadeQueMaisVendeu = (String) resultado[0];
            totalUnidadeMax = (BigDecimal) resultado[1];
        }
        
        return new DashboardResponse.MaxResponse(maiorVenda, clienteMaiorVenda, vendedorMaiorVenda,
                                               vendedorQueMaisVendeu, totalVendedorMax,
                                               unidadeQueMaisVendeu, totalUnidadeMax);
    }
    
    private List<Map<String, Object>> obterDadosGrafico(String filial, String vendedor, 
                                                       LocalDate dataInicio, LocalDate dataFim) {
        List<Object[]> dadosRaw = vendaRepository.dadosGraficoVendasPorPeriodo(filial, vendedor, dataInicio, dataFim);
        List<Map<String, Object>> dadosGrafico = new ArrayList<>();

        for (Object[] dado : dadosRaw) {
            Map<String, Object> ponto = new HashMap<>();
            Object rawData = dado[0];
            String dataStr = "";
            if (rawData instanceof java.time.LocalDate) {
                dataStr = ((java.time.LocalDate) rawData).toString();
            } else if (rawData instanceof java.sql.Date) {
                dataStr = ((java.sql.Date) rawData).toLocalDate().toString();
            } else if (rawData instanceof java.sql.Timestamp) {
                dataStr = ((java.sql.Timestamp) rawData).toLocalDateTime().toLocalDate().toString();
            } else if (rawData != null) {
                // fallback: take the first token (date part)
                dataStr = rawData.toString().split(" ")[0];
            }
            ponto.put("data", dataStr);
            ponto.put("valor", dado[1]);
            dadosGrafico.add(ponto);
        }

        // debug sample
        if (dadosGrafico.size() > 0) {
            logger.debug("obterDadosGrafico sample[0]: {}", dadosGrafico.get(0));
        }

        return dadosGrafico;
    }
    
    private List<Map<String, Object>> obterDadosGraficoPorMes(String filial, String vendedor, 
                                                             LocalDate dataInicio, LocalDate dataFim) {
        List<Object[]> dadosRaw = vendaRepository.dadosGraficoVendasPorMes(filial, vendedor, dataInicio, dataFim);
        List<Map<String, Object>> dadosGrafico = new ArrayList<>();

        for (Object[] dado : dadosRaw) {
            Map<String, Object> ponto = new HashMap<>();
            Object rawData = dado[0];
            String dataStr = "";
            // native query returns timestamp for DATE_TRUNC; normalize to YYYY-MM-DD of the month start
            if (rawData instanceof java.time.LocalDate) {
                dataStr = ((java.time.LocalDate) rawData).toString();
            } else if (rawData instanceof java.time.LocalDateTime) {
                dataStr = ((java.time.LocalDateTime) rawData).toLocalDate().toString();
            } else if (rawData instanceof java.sql.Date) {
                dataStr = ((java.sql.Date) rawData).toLocalDate().toString();
            } else if (rawData instanceof java.sql.Timestamp) {
                dataStr = ((java.sql.Timestamp) rawData).toLocalDateTime().toLocalDate().toString();
            } else if (rawData != null) {
                dataStr = rawData.toString().split(" ")[0];
            }
            ponto.put("data", dataStr);
            ponto.put("valor", dado[1]);
            dadosGrafico.add(ponto);
        }

        if (dadosGrafico.size() > 0) {
            logger.debug("obterDadosGraficoPorMes sample[0]: {}", dadosGrafico.get(0));
        }

        return dadosGrafico;
    }
    
    private List<Map<String, Object>> obterTop10Vendedores(String filial, LocalDate dataInicio, LocalDate dataFim) {
        List<Object[]> dadosRaw = vendaRepository.top10Vendedores(filial, dataInicio, dataFim);
        List<Map<String, Object>> top10 = new ArrayList<>();
        
        for (Object[] dado : dadosRaw) {
            Map<String, Object> vendedor = new HashMap<>();
            vendedor.put("nome", dado[0].toString());
            vendedor.put("total", dado[1]);
            top10.add(vendedor);
        }
        
        return top10;
    }
    
    public List<String> obterFiliais() {
        return vendaRepository.findDistinctFiliais();
    }
    
    public List<String> obterVendedores() {
        return vendaRepository.findDistinctVendedores();
    }
    
    public List<String> obterVendedoresPorUnidade(String filial) {
        return vendaRepository.findDistinctVendedoresByFilial(filial);
    }
}