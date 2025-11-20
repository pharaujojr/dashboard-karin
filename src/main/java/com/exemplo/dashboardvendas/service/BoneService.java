package com.exemplo.dashboardvendas.service;

import com.exemplo.dashboardvendas.dto.DashboardResponse;
import com.exemplo.dashboardvendas.repository.BoneRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.*;

@Service
public class BoneService {
    private static final Logger logger = LoggerFactory.getLogger(BoneService.class);
    
    @Autowired
    private BoneRepository boneRepository;
    
    public DashboardResponse getDadosDashboard(LocalDate dataInicio, LocalDate dataFim, String tipoPeriodo) {
        logger.info("Buscando dados do dashboard de bonés - dataInicio: {}, dataFim: {}, tipoPeriodo: {}", 
                    dataInicio, dataFim, tipoPeriodo);
        // Novo comportamento para dashboard de bonés (conforme solicitado):
        // - Não retornamos total de vendas, número de vendas, ticket médio, maior venda
        // - Construímos um pódio com os 3 primeiros vendedores (nome, total e filial onde mais venderam)
        // - Construímos um "pódio de unidades" baseado na filial de cada um dos 3 primeiros colocados
        // - O ranking retornado (top10Vendedores) começa a partir da 4ª posição

        // Obter ranking completo (vendor, total) do repositório
        List<Object[]> dadosRaw = boneRepository.topVendedoresBone(dataInicio, dataFim);
        logger.info("Total de vendedores encontrados: {}", dadosRaw != null ? dadosRaw.size() : 0);

        // Preparar pódio (3 primeiros)
        List<Map<String, Object>> podium = new ArrayList<>();
        List<Map<String, Object>> podiumUnidades = new ArrayList<>();

        int limitePodio = Math.min(3, dadosRaw.size());
        for (int i = 0; i < limitePodio; i++) {
            Object[] row = dadosRaw.get(i);
            String nome = row[0] != null ? row[0].toString() : "";
            BigDecimal total = row[1] != null ? new BigDecimal(row[1].toString()) : BigDecimal.ZERO;

            // Buscar filial onde o vendedor mais vendeu (primeiro resultado da query unidadeQueMaisVendeuBone para esse vendedor)
            List<Object[]> unidadePorVendedor = boneRepository.unidadeQueMaisVendeuBone(nome.toUpperCase(), dataInicio, dataFim);
            String filialDoVendedor = "";
            if (!unidadePorVendedor.isEmpty()) {
                Object[] u = unidadePorVendedor.get(0);
                filialDoVendedor = u[0] != null ? u[0].toString() : "";
            }

            Map<String, Object> pod = new HashMap<>();
            pod.put("posicao", i + 1);
            pod.put("nome", nome);
            pod.put("total", total);
            pod.put("filial", filialDoVendedor);
            podium.add(pod);

            Map<String, Object> podUn = new HashMap<>();
            podUn.put("posicao", i + 1);
            podUn.put("filial", filialDoVendedor);
            podUn.put("total", total);
            podiumUnidades.add(podUn);
        }

        // Construir ranking completo (TODOS os vendedores, incluindo os 3 primeiros)
        List<Map<String, Object>> ranking = new ArrayList<>();
        // Período anterior para cálculo de variação (mantemos variação por vendedor)
        LocalDate[] periodoAnterior = calcularPeriodoAnterior(dataInicio, dataFim, tipoPeriodo);
        LocalDate dataInicioAnterior = periodoAnterior[0];
        LocalDate dataFimAnterior = periodoAnterior[1];

        for (int i = 0; i < dadosRaw.size(); i++) {
            Object[] row = dadosRaw.get(i);
            String nome = row[0] != null ? row[0].toString() : "";
            BigDecimal totalAtual = row[1] != null ? new BigDecimal(row[1].toString()) : BigDecimal.ZERO;

            // Buscar filial onde o vendedor mais vendeu
            List<Object[]> unidadePorVendedor = boneRepository.unidadeQueMaisVendeuBone(nome.toUpperCase(), dataInicio, dataFim);
            String filialDoVendedor = "";
            if (!unidadePorVendedor.isEmpty()) {
                Object[] u = unidadePorVendedor.get(0);
                filialDoVendedor = u[0] != null ? u[0].toString() : "";
            }

            Map<String, Object> item = new HashMap<>();
            item.put("nome", nome);
            item.put("total", totalAtual);
            item.put("filial", filialDoVendedor);

            // Calcular variação com período anterior para esse vendedor
            BigDecimal totalAnterior = boneRepository.somaVendasBone(nome.toUpperCase(), dataInicioAnterior, dataFimAnterior);
            if (totalAnterior != null && totalAnterior.compareTo(BigDecimal.ZERO) > 0) {
                BigDecimal diferenca = totalAtual.subtract(totalAnterior);
                double variacao = diferenca.divide(totalAnterior, 4, java.math.RoundingMode.HALF_UP)
                                          .multiply(BigDecimal.valueOf(100))
                                          .doubleValue();
                item.put("variacao", variacao);
            } else {
                item.put("variacao", 0.0);
            }

            ranking.add(item);
        }

        // Construir resposta: deixamos campos de totais nulos/zerados e retornamos podium + ranking
        DashboardResponse response = new DashboardResponse(null, null, null, null, Collections.emptyList(), ranking, null, null);
        response.setPodiumVendedores(podium);
        response.setPodiumUnidades(podiumUnidades);

        return response;
    }
    
    
    private LocalDate[] calcularPeriodoAnterior(LocalDate dataInicio, LocalDate dataFim, String tipoPeriodo) {
        if (tipoPeriodo == null || tipoPeriodo.isEmpty()) {
            tipoPeriodo = "dia";
        }
        
        long dias = ChronoUnit.DAYS.between(dataInicio, dataFim);
        LocalDate dataInicioAnterior = dataInicio.minusDays(dias + 1);
        LocalDate dataFimAnterior = dataInicio.minusDays(1);
        
        return new LocalDate[]{dataInicioAnterior, dataFimAnterior};
    }
    
    
    
    public List<String> getVendedores() {
        return boneRepository.findDistinctVendedoresBone();
    }
}
