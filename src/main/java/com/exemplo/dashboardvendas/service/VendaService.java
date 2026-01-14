package com.exemplo.dashboardvendas.service;

import com.exemplo.dashboardvendas.dto.DashboardResponse;
import com.exemplo.dashboardvendas.model.FinanceiroCliente;
import com.exemplo.dashboardvendas.repository.FinanceiroClienteRepository;
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
    private FinanceiroClienteRepository financeiroClienteRepository;
    
    @Autowired
    private MetaService metaService;
    
    public DashboardResponse getDadosDashboard(java.util.List<String> filiais, String vendedor, 
                                             LocalDate dataInicio, LocalDate dataFim, boolean agruparPorMes, String tipoPeriodo) {
        
        // Calcular total de vendas - somar todas as filiais
        BigDecimal totalVendas = BigDecimal.ZERO;
        Long numeroVendas = 0L;
        BigDecimal somaTickets = BigDecimal.ZERO;
        
        if (filiais != null && !filiais.isEmpty()) {
            for (String f : filiais) {
                BigDecimal vendaFilial = financeiroClienteRepository.somaVendasPorFiltros(f, vendedor, dataInicio, dataFim);
                Long numeroFilial = financeiroClienteRepository.contarVendasPorFiltros(f, vendedor, dataInicio, dataFim);
                
                if (vendaFilial != null) totalVendas = totalVendas.add(vendaFilial);
                if (numeroFilial != null) numeroVendas += numeroFilial;
            }
            
            // Calcular ticket médio geral
            if (numeroVendas > 0) {
                somaTickets = totalVendas.divide(new BigDecimal(numeroVendas), 2, java.math.RoundingMode.HALF_UP);
            }
        } else {
            // Se não há filiais selecionadas, buscar todas
            totalVendas = financeiroClienteRepository.somaVendasPorFiltros(null, vendedor, dataInicio, dataFim);
            numeroVendas = financeiroClienteRepository.contarVendasPorFiltros(null, vendedor, dataInicio, dataFim);
            somaTickets = financeiroClienteRepository.ticketMedioPorFiltros(null, vendedor, dataInicio, dataFim);
        }
        
        BigDecimal ticketMedio = somaTickets;
        
        // Obter dados MAX - buscar entre todas as filiais selecionadas
        DashboardResponse.MaxResponse maxResponse = obterDadosMaxMultiplasFiliais(filiais, vendedor, dataInicio, dataFim);
        
        // Obter dados para gráfico (agregando todas as filiais)
        List<Map<String, Object>> dadosGrafico = agruparPorMes ? 
            obterDadosGraficoPorMesMultiplasFiliais(filiais, vendedor, dataInicio, dataFim) :
            obterDadosGraficoMultiplasFiliais(filiais, vendedor, dataInicio, dataFim);
        
        // Obter top 10 vendedores (agregando todas as filiais)
        List<Map<String, Object>> top10Vendedores = obterTop10VendedoresMultiplasFiliais(filiais, dataInicio, dataFim, tipoPeriodo);
        
        // Obter listas para filtros
        List<String> todasFiliais = financeiroClienteRepository.findDistinctFiliais();
        List<String> vendedores = financeiroClienteRepository.findDistinctVendedores();
        
        // Buscar metas do banco de dados para as filiais selecionadas
        Map<String, BigDecimal> metas = new HashMap<>();
        if (filiais != null && !filiais.isEmpty()) {
            metas = metaService.obterMetasPorFiliaisEPeriodo(filiais, dataInicio, dataFim);
            logger.debug("Metas obtidas do banco de dados: {}", metas);
        }

        // Debug logs
        logger.debug("getDadosDashboard params filiais={}, vendedor={}, dataInicio={}, dataFim={}, agruparPorMes={}, tipoPeriodo={}",
            filiais, vendedor, dataInicio, dataFim, agruparPorMes, tipoPeriodo);
        logger.debug("Totals -> totalVendas={}, numeroVendas={}, ticketMedio={}, dadosGrafico.size={}, top10.size={}",
            totalVendas, numeroVendas, ticketMedio, dadosGrafico != null ? dadosGrafico.size() : 0,
            top10Vendedores != null ? top10Vendedores.size() : 0);
        
        // Calcular comparação com período anterior (apenas se não for período personalizado)
        DashboardResponse.ComparisonData comparison = null;
        if (tipoPeriodo != null && !tipoPeriodo.equals("personalizado")) {
            comparison = calcularComparacaoMultiplasFiliais(filiais, vendedor, dataInicio, dataFim, 
                                          totalVendas, numeroVendas, ticketMedio, tipoPeriodo);
        }
        
        DashboardResponse response = new DashboardResponse(totalVendas, numeroVendas, ticketMedio, maxResponse, 
                                                          dadosGrafico, top10Vendedores, todasFiliais, vendedores);
        response.setComparison(comparison);
        response.setMetas(metas);
        
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
        BigDecimal totalAnterior = financeiroClienteRepository.somaVendasPorFiltros(filial, vendedor, dataInicioAnterior, dataFimAnterior);
        Long numeroAnterior = financeiroClienteRepository.contarVendasPorFiltros(filial, vendedor, dataInicioAnterior, dataFimAnterior);
        BigDecimal ticketAnterior = financeiroClienteRepository.ticketMedioPorFiltros(filial, vendedor, dataInicioAnterior, dataFimAnterior);
        
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
    
    
    private DashboardResponse.MaxResponse obterDadosMaxMultiplasFiliais(List<String> filiais, String vendedor, 
                                                       LocalDate dataInicio, LocalDate dataFim) {
        
        BigDecimal maiorVenda = BigDecimal.ZERO;
        String clienteMaiorVenda = "";
        String vendedorMaiorVenda = "";
        
        // Se não há filiais específicas, buscar em todas
        if (filiais == null || filiais.isEmpty()) {
            List<FinanceiroCliente> maioresVendas = financeiroClienteRepository.maiorVendaPorFiltros(null, vendedor, dataInicio, dataFim);
            if (!maioresVendas.isEmpty()) {
                FinanceiroCliente vendaMaior = maioresVendas.get(0);
                if (vendaMaior.getValorDebito() != null) {
                    maiorVenda = vendaMaior.getValorDebito();
                    clienteMaiorVenda = vendaMaior.getNome();
                    vendedorMaiorVenda = vendaMaior.getVendedor() != null ? vendaMaior.getVendedor() : "";
                }
            }
        } else {
            // Buscar a maior venda entre todas as filiais selecionadas
            for (String filial : filiais) {
                List<FinanceiroCliente> maioresVendas = financeiroClienteRepository.maiorVendaPorFiltros(filial, vendedor, dataInicio, dataFim);
                if (!maioresVendas.isEmpty()) {
                    FinanceiroCliente vendaMaior = maioresVendas.get(0);
                    if (vendaMaior.getValorDebito() != null && vendaMaior.getValorDebito().compareTo(maiorVenda) > 0) {
                        maiorVenda = vendaMaior.getValorDebito();
                        clienteMaiorVenda = vendaMaior.getNome();
                        vendedorMaiorVenda = vendaMaior.getVendedor() != null ? vendaMaior.getVendedor() : "";
                    }
                }
            }
        }
        
        // Vendedor que mais vendeu (considerando todas as filiais)
        String filialParaVendedor = (filiais != null && !filiais.isEmpty()) ? filiais.get(0) : null;
        List<Object[]> vendedorMax = financeiroClienteRepository.vendedorQueMaisVendeu(filialParaVendedor, dataInicio, dataFim);
        String vendedorQueMaisVendeu = "";
        BigDecimal totalVendedorMax = BigDecimal.ZERO;
        
        if (!vendedorMax.isEmpty()) {
            Object[] resultado = vendedorMax.get(0);
            vendedorQueMaisVendeu = (String) resultado[0];
            totalVendedorMax = (BigDecimal) resultado[1];
        }
        
        // Unidade que mais vendeu
        List<Object[]> unidadeMax = financeiroClienteRepository.unidadeQueMaisVendeu(vendedor, dataInicio, dataFim);
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
    
    // Método para calcular comparação para múltiplas filiais (agregado)
    private DashboardResponse.ComparisonData calcularComparacaoMultiplasFiliais(
            List<String> filiais, String vendedor, LocalDate dataInicio, LocalDate dataFim,
            BigDecimal totalAtual, Long numeroAtual, BigDecimal ticketAtual, String tipoPeriodo) {
        
        LocalDate dataInicioAnterior;
        LocalDate dataFimAnterior;
        
        // Lógica de cálculo de período anterior
        LocalDate[] periodoAnterior = calcularPeriodoAnterior(dataInicio, dataFim, tipoPeriodo);
        dataInicioAnterior = periodoAnterior[0];
        dataFimAnterior = periodoAnterior[1];
        
        BigDecimal totalAnterior = BigDecimal.ZERO;
        Long numeroAnterior = 0L;
        BigDecimal ticketAnterior = BigDecimal.ZERO;
        
        // Calcular dados anteriores agregados
        if (filiais != null && !filiais.isEmpty()) {
            for (String f : filiais) {
                BigDecimal totalFilial = financeiroClienteRepository.somaVendasPorFiltros(f, vendedor, dataInicioAnterior, dataFimAnterior);
                Long numeroFilial = financeiroClienteRepository.contarVendasPorFiltros(f, vendedor, dataInicioAnterior, dataFimAnterior);
                
                if (totalFilial != null) totalAnterior = totalAnterior.add(totalFilial);
                if (numeroFilial != null) numeroAnterior += numeroFilial;
            }
            
            // Ticket médio anterior
            if (numeroAnterior > 0) {
                ticketAnterior = totalAnterior.divide(new BigDecimal(numeroAnterior), 2, java.math.RoundingMode.HALF_UP);
            }
        } else {
            totalAnterior = financeiroClienteRepository.somaVendasPorFiltros(null, vendedor, dataInicioAnterior, dataFimAnterior);
            numeroAnterior = financeiroClienteRepository.contarVendasPorFiltros(null, vendedor, dataInicioAnterior, dataFimAnterior);
            ticketAnterior = financeiroClienteRepository.ticketMedioPorFiltros(null, vendedor, dataInicioAnterior, dataFimAnterior);
        }
        
        Double variacaoTotal = calcularVariacaoPercentual(totalAnterior, totalAtual);
        Double variacaoNumero = calcularVariacaoPercentual(
            numeroAnterior != null ? BigDecimal.valueOf(numeroAnterior) : BigDecimal.ZERO,
            numeroAtual != null ? BigDecimal.valueOf(numeroAtual) : BigDecimal.ZERO
        );
        Double variacaoTicket = calcularVariacaoPercentual(ticketAnterior, ticketAtual);
        
        return new DashboardResponse.ComparisonData(variacaoTotal, variacaoNumero, variacaoTicket);
    }
    
    private LocalDate[] calcularPeriodoAnterior(LocalDate dataInicio, LocalDate dataFim, String tipoPeriodo) {
        LocalDate dataInicioAnterior;
        LocalDate dataFimAnterior;
        
        // Se tipoPeriodo for null ou vazio, usar "dia" como padrão
        if (tipoPeriodo == null || tipoPeriodo.isEmpty()) {
            tipoPeriodo = "dia";
        }
        
        switch (tipoPeriodo) {
            case "mes":
                LocalDate hoje = LocalDate.now();
                dataInicioAnterior = dataInicio.minusMonths(1);
                
                if (dataFim.getMonth() == hoje.getMonth() && 
                    dataFim.getYear() == hoje.getYear() &&
                    dataFim.getDayOfMonth() == dataFim.lengthOfMonth()) {
                    LocalDate mesAnterior = dataInicio.minusMonths(1);
                    int diaParaUsar = Math.min(hoje.getDayOfMonth(), mesAnterior.lengthOfMonth());
                    dataFimAnterior = mesAnterior.withDayOfMonth(diaParaUsar);
                } else {
                    dataFimAnterior = dataFim.minusMonths(1);
                }
                break;
                
            case "ano":
                LocalDate hojeAno = LocalDate.now();
                dataInicioAnterior = dataInicio.minusYears(1);
                
                if (dataFim.getYear() == hojeAno.getYear() &&
                    dataFim.getDayOfYear() == dataFim.lengthOfYear()) {
                    dataFimAnterior = hojeAno.minusYears(1);
                } else {
                    dataFimAnterior = dataFim.minusYears(1);
                }
                break;
                
            case "trimestre":
                dataInicioAnterior = dataInicio.minusMonths(3);
                dataFimAnterior = dataFim.minusMonths(3);
                break;
                
            case "semana":
                LocalDate hojeSemana = LocalDate.now();
                dataInicioAnterior = dataInicio.minusWeeks(1);
                
                if (dataFim.getDayOfWeek() == java.time.DayOfWeek.SUNDAY &&
                    !hojeSemana.isAfter(dataFim) && !hojeSemana.isBefore(dataInicio)) {
                    dataFimAnterior = hojeSemana.minusWeeks(1);
                } else {
                    dataFimAnterior = dataFim.minusWeeks(1);
                }
                break;
                
            default:
                long diasPeriodo = java.time.temporal.ChronoUnit.DAYS.between(dataInicio, dataFim) + 1;
                dataInicioAnterior = dataInicio.minusDays(diasPeriodo);
                dataFimAnterior = dataFim.minusDays(diasPeriodo);
                break;
        }
        
        return new LocalDate[]{dataInicioAnterior, dataFimAnterior};
    }

    // Método para obter top 10 vendedores agregando múltiplas filiais
    private List<Map<String, Object>> obterTop10VendedoresMultiplasFiliais(
            List<String> filiais, LocalDate dataInicio, LocalDate dataFim, String tipoPeriodo) {
        
        List<Object[]> dadosRaw;
        
        if (filiais != null && !filiais.isEmpty()) {
            dadosRaw = financeiroClienteRepository.topVendedoresMultiplasFiliais(filiais, dataInicio, dataFim);
        } else {
            dadosRaw = financeiroClienteRepository.top10Vendedores(null, dataInicio, dataFim);
        }
        
        List<Map<String, Object>> top10 = new ArrayList<>();
        LocalDate[] periodoAnterior = calcularPeriodoAnterior(dataInicio, dataFim, tipoPeriodo);
        
        for (Object[] dado : dadosRaw) {
            Map<String, Object> vendedor = new HashMap<>();
            String nomeVendedor = dado[0].toString();
            BigDecimal totalAtual = (BigDecimal) dado[1];
            
            vendedor.put("nome", nomeVendedor);
            vendedor.put("total", totalAtual);
            
            // Calcular anterior (agregado)
            BigDecimal totalAnterior = BigDecimal.ZERO;
            String nomeVendedorUpper = nomeVendedor.toUpperCase();
            
            if (filiais != null && !filiais.isEmpty()) {
                for (String f : filiais) {
                    BigDecimal totalFilial = financeiroClienteRepository.somaVendasPorFiltros(f, nomeVendedorUpper, periodoAnterior[0], periodoAnterior[1]);
                    if (totalFilial != null) totalAnterior = totalAnterior.add(totalFilial);
                }
            } else {
                totalAnterior = financeiroClienteRepository.somaVendasPorFiltros(null, nomeVendedorUpper, periodoAnterior[0], periodoAnterior[1]);
            }
            
            Double variacao = calcularVariacaoPercentual(totalAnterior, totalAtual);
            vendedor.put("variacao", variacao != null ? variacao : 0.0);
            
            top10.add(vendedor);
        }
        
        return top10;
    }

    // Obter dados gráficos para múltiplas filiais (aggregated)
    private List<Map<String, Object>> obterDadosGraficoMultiplasFiliais(
            List<String> filiais, String vendedor, LocalDate dataInicio, LocalDate dataFim) {
        
        // Log para debug
        logger.debug("obterDadosGraficoMultiplasFiliais: filiais={}", filiais);
        
        Map<String, BigDecimal> agregador = new HashMap<>();
        
        if (filiais != null && !filiais.isEmpty()) {
            for (String f : filiais) {
                List<Object[]> dadosRaw = financeiroClienteRepository.dadosGraficoVendasPorPeriodo(f, vendedor, dataInicio, dataFim);
                processarDadosGrafico(dadosRaw, agregador);
            }
        } else {
            List<Object[]> dadosRaw = financeiroClienteRepository.dadosGraficoVendasPorPeriodo(null, vendedor, dataInicio, dataFim);
            processarDadosGrafico(dadosRaw, agregador);
        }
        
        return converterMapaParaListaAleatoria(agregador);
    }

    // Obter dados gráficos por mês para múltiplas filiais (aggregated)
    private List<Map<String, Object>> obterDadosGraficoPorMesMultiplasFiliais(
            List<String> filiais, String vendedor, LocalDate dataInicio, LocalDate dataFim) {
            
        Map<String, BigDecimal> agregador = new HashMap<>();
        
        if (filiais != null && !filiais.isEmpty()) {
            for (String f : filiais) {
                List<Object[]> dadosRaw = financeiroClienteRepository.dadosGraficoVendasPorMes(f, vendedor, dataInicio, dataFim);
                processarDadosGrafico(dadosRaw, agregador);
            }
        } else {
            List<Object[]> dadosRaw = financeiroClienteRepository.dadosGraficoVendasPorMes(null, vendedor, dataInicio, dataFim);
            processarDadosGrafico(dadosRaw, agregador);
        }
        
        return converterMapaParaListaAleatoria(agregador);
    }

    private void processarDadosGrafico(List<Object[]> dadosRaw, Map<String, BigDecimal> agregador) {
        for (Object[] dado : dadosRaw) {
            Object rawData = dado[0];
            BigDecimal valor = (BigDecimal) dado[1];
            String dataStr = "";
            
            // Mesma lógica de extração de data do método original
            if (rawData instanceof java.time.LocalDate) {
                dataStr = ((java.time.LocalDate) rawData).toString();
            } else if (rawData instanceof java.sql.Date) {
                dataStr = ((java.sql.Date) rawData).toLocalDate().toString();
            } else if (rawData instanceof java.sql.Timestamp) {
                dataStr = ((java.sql.Timestamp) rawData).toLocalDateTime().toLocalDate().toString();
            } else if (rawData != null) {
                String rawStr = rawData.toString();
                if (rawStr.contains("T")) {
                    dataStr = rawStr.split("T")[0];
                } else {
                    dataStr = rawStr.split(" ")[0];
                }
            }
            
            if (!dataStr.isEmpty()) {
                agregador.merge(dataStr, valor, BigDecimal::add);
            }
        }
    }
    
    private List<Map<String, Object>> converterMapaParaListaAleatoria(Map<String, BigDecimal> mapa) {
        List<Map<String, Object>> resultado = new ArrayList<>();
        // Ordenar chaves para garantir ordem cronológica no gráfico
        List<String> datasOrdenadas = new ArrayList<>(mapa.keySet());
        java.util.Collections.sort(datasOrdenadas);
        
        for (String data : datasOrdenadas) {
            Map<String, Object> ponto = new HashMap<>();
            ponto.put("data", data);
            ponto.put("valor", mapa.get(data));
            resultado.add(ponto);
        }
        return resultado;
    }
    
    public List<String> obterFiliais() {
        return financeiroClienteRepository.findDistinctFiliais();
    }
    
    public List<String> obterVendedores() {
        return financeiroClienteRepository.findDistinctVendedores();
    }
    
    public List<String> obterVendedoresPorUnidade(String filial) {
        return financeiroClienteRepository.findDistinctVendedoresByFilial(filial);
    }
}
