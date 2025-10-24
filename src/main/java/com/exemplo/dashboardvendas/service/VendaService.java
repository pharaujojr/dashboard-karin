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
                                             LocalDate dataInicio, LocalDate dataFim, boolean agruparPorMes, String tipoPeriodo) {
        
    // Calcular total de vendas
    BigDecimal totalVendas = vendaRepository.somaVendasPorFiltros(filial, vendedor, dataInicio, dataFim);
        
        // Calcular ticket médio
        BigDecimal ticketMedio = vendaRepository.ticketMedioPorFiltros(filial, vendedor, dataInicio, dataFim);
        
        // Contar número de vendas
        Long numeroVendas = vendaRepository.contarVendasPorFiltros(filial, vendedor, dataInicio, dataFim);
        
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
    logger.debug("getDadosDashboard params filial={}, vendedor={}, dataInicio={}, dataFim={}, agruparPorMes={}, tipoPeriodo={}",
        filial, vendedor, dataInicio, dataFim, agruparPorMes, tipoPeriodo);
    logger.debug("Totals -> totalVendas={}, numeroVendas={}, ticketMedio={}, dadosGrafico.size={}, top10.size={}",
        totalVendas, numeroVendas, ticketMedio, dadosGrafico != null ? dadosGrafico.size() : 0,
        top10Vendedores != null ? top10Vendedores.size() : 0);
        
        // Calcular comparação com período anterior (apenas se não for período personalizado)
        DashboardResponse.ComparisonData comparison = null;
        if (tipoPeriodo != null && !tipoPeriodo.equals("personalizado")) {
            comparison = calcularComparacao(filial, vendedor, dataInicio, dataFim, 
                                          totalVendas, numeroVendas, ticketMedio, tipoPeriodo);
        }
        
        DashboardResponse response = new DashboardResponse(totalVendas, numeroVendas, ticketMedio, maxResponse, 
                                                          dadosGrafico, top10Vendedores, filiais, vendedores);
        response.setComparison(comparison);
        
        return response;
    }
    
    private DashboardResponse.ComparisonData calcularComparacao(String filial, String vendedor,
                                                                LocalDate dataInicio, LocalDate dataFim,
                                                                BigDecimal totalAtual, Long numeroAtual, BigDecimal ticketAtual,
                                                                String tipoPeriodo) {
        LocalDate dataInicioAnterior;
        LocalDate dataFimAnterior;
        
        // Calcular período anterior baseado no tipo de período
        switch (tipoPeriodo) {
            case "mes":
                // Para "este mês", comparar com o mesmo período do mês anterior
                // Se dataFim for o último dia do mês, ajustar para o dia atual do mês anterior
                LocalDate hoje = LocalDate.now();
                dataInicioAnterior = dataInicio.minusMonths(1);
                
                // Se estamos comparando o mês atual e dataFim é o último dia do mês,
                // ajustar para o dia de hoje do mês anterior
                if (dataFim.getMonth() == hoje.getMonth() && 
                    dataFim.getYear() == hoje.getYear() &&
                    dataFim.getDayOfMonth() == dataFim.lengthOfMonth()) {
                    // Estamos no mês atual, então comparar até o dia correspondente do mês anterior
                    dataFimAnterior = dataInicio.minusMonths(1).withDayOfMonth(hoje.getDayOfMonth());
                } else {
                    // Mês completo ou outro caso
                    dataFimAnterior = dataFim.minusMonths(1);
                }
                break;
                
            case "ano":
                // Para "este ano", comparar com o mesmo período do ano anterior
                LocalDate hojeAno = LocalDate.now();
                dataInicioAnterior = dataInicio.minusYears(1);
                
                // Se estamos comparando o ano atual e dataFim é o último dia do ano,
                // ajustar para o dia de hoje do ano anterior
                if (dataFim.getYear() == hojeAno.getYear() &&
                    dataFim.getDayOfYear() == dataFim.lengthOfYear()) {
                    // Estamos no ano atual, então comparar até o dia correspondente do ano anterior
                    dataFimAnterior = hojeAno.minusYears(1);
                } else {
                    // Ano completo ou outro caso
                    dataFimAnterior = dataFim.minusYears(1);
                }
                break;
                
            case "trimestre":
                // Para "trimestre", comparar com o trimestre anterior
                dataInicioAnterior = dataInicio.minusMonths(3);
                dataFimAnterior = dataFim.minusMonths(3);
                break;
                
            case "semana":
                // Para "esta semana", comparar com o mesmo período da semana anterior
                LocalDate hojeSemana = LocalDate.now();
                dataInicioAnterior = dataInicio.minusWeeks(1);
                
                // Se dataFim é domingo (fim da semana) e estamos na semana atual,
                // ajustar para o dia de hoje da semana anterior
                if (dataFim.getDayOfWeek() == java.time.DayOfWeek.SUNDAY &&
                    !hojeSemana.isAfter(dataFim) && !hojeSemana.isBefore(dataInicio)) {
                    // Estamos na semana atual, então comparar até o dia correspondente da semana anterior
                    dataFimAnterior = hojeSemana.minusWeeks(1);
                } else {
                    // Semana completa ou outro caso
                    dataFimAnterior = dataFim.minusWeeks(1);
                }
                break;
                
            default:
                // Para "dia", "ontem", etc: subtrair o número de dias do período
                long diasPeriodo = java.time.temporal.ChronoUnit.DAYS.between(dataInicio, dataFim) + 1;
                dataInicioAnterior = dataInicio.minusDays(diasPeriodo);
                dataFimAnterior = dataFim.minusDays(diasPeriodo);
                break;
        }
        
        // Buscar dados do período anterior
        BigDecimal totalAnterior = vendaRepository.somaVendasPorFiltros(filial, vendedor, dataInicioAnterior, dataFimAnterior);
        Long numeroAnterior = vendaRepository.contarVendasPorFiltros(filial, vendedor, dataInicioAnterior, dataFimAnterior);
        BigDecimal ticketAnterior = vendaRepository.ticketMedioPorFiltros(filial, vendedor, dataInicioAnterior, dataFimAnterior);
        
        // Calcular variações percentuais
        Double variacaoTotal = calcularVariacaoPercentual(totalAnterior, totalAtual);
        Double variacaoNumero = calcularVariacaoPercentual(
            numeroAnterior != null ? BigDecimal.valueOf(numeroAnterior) : BigDecimal.ZERO,
            numeroAtual != null ? BigDecimal.valueOf(numeroAtual) : BigDecimal.ZERO
        );
        Double variacaoTicket = calcularVariacaoPercentual(ticketAnterior, ticketAtual);
        
        logger.debug("Comparação: período atual {}->{} vs anterior {}->{}. Variações: total={}%, numero={}%, ticket={}%",
            dataInicio, dataFim, dataInicioAnterior, dataFimAnterior, variacaoTotal, variacaoNumero, variacaoTicket);
        
        return new DashboardResponse.ComparisonData(variacaoTotal, variacaoNumero, variacaoTicket);
    }
    
    private Double calcularVariacaoPercentual(BigDecimal anterior, BigDecimal atual) {
        if (anterior == null || atual == null) {
            return null;
        }
        
        if (anterior.compareTo(BigDecimal.ZERO) == 0) {
            // Se anterior era zero e atual é maior, considerar como +100%
            if (atual.compareTo(BigDecimal.ZERO) > 0) {
                return 100.0;
            }
            return 0.0;
        }
        
        BigDecimal diferenca = atual.subtract(anterior);
        BigDecimal variacao = diferenca.divide(anterior, 4, java.math.RoundingMode.HALF_UP)
                                       .multiply(BigDecimal.valueOf(100));
        return variacao.doubleValue();
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
        
        // Log environment info
        logger.debug("=== ENVIRONMENT DEBUG ===");
        logger.debug("System timezone: {}", java.util.TimeZone.getDefault().getID());
        logger.debug("JVM timezone: {}", java.time.ZoneId.systemDefault());
        logger.debug("Data range: {} to {}", dataInicio, dataFim);
        logger.debug("========================");
        
        List<Object[]> dadosRaw = vendaRepository.dadosGraficoVendasPorMes(filial, vendedor, dataInicio, dataFim);
        List<Map<String, Object>> dadosGrafico = new ArrayList<>();

        logger.debug("obterDadosGraficoPorMes - Raw data from DB: {} entries", dadosRaw.size());
        
        // Also log a sample of actual sales data to compare between environments
        try {
            List<Object[]> sampleSales = vendaRepository.dadosGraficoVendasPorPeriodo(filial, vendedor, dataInicio, dataFim);
            logger.debug("Sample daily sales data (first 5): ");
            for (int i = 0; i < Math.min(5, sampleSales.size()); i++) {
                Object[] sale = sampleSales.get(i);
                logger.debug("  Daily sale {}: date={}, valor={}", i, sale[0], sale[1]);
            }
        } catch (Exception e) {
            logger.warn("Could not fetch sample daily sales: {}", e.getMessage());
        }
        
        // Debug: show what months actually have data
        try {
            List<Object[]> monthSummary = vendaRepository.debugMonthSummary(dataInicio, dataFim);
            logger.debug("=== MONTH SUMMARY (Year/Month/Count/Total) ===");
            for (Object[] month : monthSummary) {
                logger.debug("  {}/{}: {} sales, total={}", month[0], month[1], month[2], month[3]);
            }
            logger.debug("==========================================");
        } catch (Exception e) {
            logger.warn("Could not fetch month summary: {}", e.getMessage());
        }
        
        for (int i = 0; i < dadosRaw.size(); i++) {
            Object[] dado = dadosRaw.get(i);
            Map<String, Object> ponto = new HashMap<>();
            Object rawData = dado[0];
            
            logger.debug("Raw entry {}: rawData={} (type={}), valor={}", 
                i, rawData, rawData != null ? rawData.getClass().getSimpleName() : "null", dado[1]);
            
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
            } else if (rawData instanceof java.time.OffsetDateTime) {
                dataStr = ((java.time.OffsetDateTime) rawData).toLocalDate().toString();
            } else if (rawData instanceof java.time.ZonedDateTime) {
                dataStr = ((java.time.ZonedDateTime) rawData).toLocalDate().toString();
            } else if (rawData instanceof java.time.Instant) {
                dataStr = ((java.time.Instant) rawData).atZone(java.time.ZoneId.systemDefault()).toLocalDate().toString();
            } else if (rawData != null) {
                // More robust string parsing for any date-like string
                String rawStr = rawData.toString();
                if (rawStr.contains("T")) {
                    // Handle ISO format like "2025-09-01T00:00:00Z"
                    dataStr = rawStr.split("T")[0];
                } else {
                    dataStr = rawStr.split(" ")[0];
                }
            }
            
            logger.debug("Processed entry {}: dataStr={}, valor={}", i, dataStr, dado[1]);
            
            ponto.put("data", dataStr);
            ponto.put("valor", dado[1]);
            dadosGrafico.add(ponto);
        }

        logger.debug("obterDadosGraficoPorMes final result: {}", dadosGrafico);

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