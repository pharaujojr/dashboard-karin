package com.exemplo.dashboardvendas.dto;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

public class DashboardResponse {
    
    private BigDecimal totalVendas;
    private Long numeroVendas;
    private BigDecimal ticketMedio;
    private MaxResponse maxResponse;
    private List<Map<String, Object>> dadosGrafico;
    private List<Map<String, Object>> top10Vendedores;
    private List<Map<String, Object>> podiumVendedores;
    private List<Map<String, Object>> podiumUnidades;
    private List<String> filiais;
    private List<String> vendedores;
    
    // Campos de comparação com período anterior
    private ComparisonData comparison;
    
    // Metas por filial
    private Map<String, BigDecimal> metas;
    
    public static class ComparisonData {
        private Double totalVendasVariacao;
        private Double numeroVendasVariacao;
        private Double ticketMedioVariacao;
        
        public ComparisonData() {}
        
        public ComparisonData(Double totalVendasVariacao, Double numeroVendasVariacao, Double ticketMedioVariacao) {
            this.totalVendasVariacao = totalVendasVariacao;
            this.numeroVendasVariacao = numeroVendasVariacao;
            this.ticketMedioVariacao = ticketMedioVariacao;
        }
        
        public Double getTotalVendasVariacao() { return totalVendasVariacao; }
        public void setTotalVendasVariacao(Double totalVendasVariacao) { this.totalVendasVariacao = totalVendasVariacao; }
        
        public Double getNumeroVendasVariacao() { return numeroVendasVariacao; }
        public void setNumeroVendasVariacao(Double numeroVendasVariacao) { this.numeroVendasVariacao = numeroVendasVariacao; }
        
        public Double getTicketMedioVariacao() { return ticketMedioVariacao; }
        public void setTicketMedioVariacao(Double ticketMedioVariacao) { this.ticketMedioVariacao = ticketMedioVariacao; }
    }
    
    // Construtor
    public DashboardResponse() {}
    
    public DashboardResponse(BigDecimal totalVendas, Long numeroVendas, BigDecimal ticketMedio, 
                           MaxResponse maxResponse, List<Map<String, Object>> dadosGrafico,
                           List<Map<String, Object>> top10Vendedores,
                           List<String> filiais, List<String> vendedores) {
        this.totalVendas = totalVendas;
        this.numeroVendas = numeroVendas;
        this.ticketMedio = ticketMedio;
        this.maxResponse = maxResponse;
        this.dadosGrafico = dadosGrafico;
        this.top10Vendedores = top10Vendedores;
        this.filiais = filiais;
        this.vendedores = vendedores;
    }

    // Novos campos: pódio de vendedores e pódio de unidades (baseado na filial do vendedor)
    public List<Map<String, Object>> getPodiumVendedores() {
        return podiumVendedores;
    }

    public void setPodiumVendedores(List<Map<String, Object>> podiumVendedores) {
        this.podiumVendedores = podiumVendedores;
    }

    public List<Map<String, Object>> getPodiumUnidades() {
        return podiumUnidades;
    }

    public void setPodiumUnidades(List<Map<String, Object>> podiumUnidades) {
        this.podiumUnidades = podiumUnidades;
    }
    
    // Getters e Setters
    public BigDecimal getTotalVendas() {
        return totalVendas;
    }
    
    public void setTotalVendas(BigDecimal totalVendas) {
        this.totalVendas = totalVendas;
    }
    
    public Long getNumeroVendas() {
        return numeroVendas;
    }
    
    public void setNumeroVendas(Long numeroVendas) {
        this.numeroVendas = numeroVendas;
    }
    
    public BigDecimal getTicketMedio() {
        return ticketMedio;
    }
    
    public void setTicketMedio(BigDecimal ticketMedio) {
        this.ticketMedio = ticketMedio;
    }
    
    public MaxResponse getMaxResponse() {
        return maxResponse;
    }
    
    public void setMaxResponse(MaxResponse maxResponse) {
        this.maxResponse = maxResponse;
    }
    
    public List<Map<String, Object>> getDadosGrafico() {
        return dadosGrafico;
    }
    
    public void setDadosGrafico(List<Map<String, Object>> dadosGrafico) {
        this.dadosGrafico = dadosGrafico;
    }
    
    public List<Map<String, Object>> getTop10Vendedores() {
        return top10Vendedores;
    }
    
    public void setTop10Vendedores(List<Map<String, Object>> top10Vendedores) {
        this.top10Vendedores = top10Vendedores;
    }
    
    public List<String> getFiliais() {
        return filiais;
    }
    
    public void setFiliais(List<String> filiais) {
        this.filiais = filiais;
    }
    
    public List<String> getVendedores() {
        return vendedores;
    }
    
    public void setVendedores(List<String> vendedores) {
        this.vendedores = vendedores;
    }
    
    public ComparisonData getComparison() {
        return comparison;
    }
    
    public void setComparison(ComparisonData comparison) {
        this.comparison = comparison;
    }
    
    public Map<String, BigDecimal> getMetas() {
        return metas;
    }
    
    public void setMetas(Map<String, BigDecimal> metas) {
        this.metas = metas;
    }
    
    // Classe interna para os dados MAX
    public static class MaxResponse {
        private BigDecimal maiorVenda;
        private String clienteMaiorVenda;
        private String vendedorMaiorVenda;
        private String vendedorQueMaisVendeu;
        private BigDecimal totalVendedorMax;
        private String unidadeQueMaisVendeu;
        private BigDecimal totalUnidadeMax;
        
        public MaxResponse() {}
        
        public MaxResponse(BigDecimal maiorVenda, String clienteMaiorVenda, String vendedorMaiorVenda,
                          String vendedorQueMaisVendeu, BigDecimal totalVendedorMax,
                          String unidadeQueMaisVendeu, BigDecimal totalUnidadeMax) {
            this.maiorVenda = maiorVenda;
            this.clienteMaiorVenda = clienteMaiorVenda;
            this.vendedorMaiorVenda = vendedorMaiorVenda;
            this.vendedorQueMaisVendeu = vendedorQueMaisVendeu;
            this.totalVendedorMax = totalVendedorMax;
            this.unidadeQueMaisVendeu = unidadeQueMaisVendeu;
            this.totalUnidadeMax = totalUnidadeMax;
        }
        
        // Getters e Setters
        public BigDecimal getMaiorVenda() {
            return maiorVenda;
        }
        
        public void setMaiorVenda(BigDecimal maiorVenda) {
            this.maiorVenda = maiorVenda;
        }
        
        public String getClienteMaiorVenda() {
            return clienteMaiorVenda;
        }
        
        public void setClienteMaiorVenda(String clienteMaiorVenda) {
            this.clienteMaiorVenda = clienteMaiorVenda;
        }
        
        public String getVendedorMaiorVenda() {
            return vendedorMaiorVenda;
        }
        
        public void setVendedorMaiorVenda(String vendedorMaiorVenda) {
            this.vendedorMaiorVenda = vendedorMaiorVenda;
        }
        
        public String getVendedorQueMaisVendeu() {
            return vendedorQueMaisVendeu;
        }
        
        public void setVendedorQueMaisVendeu(String vendedorQueMaisVendeu) {
            this.vendedorQueMaisVendeu = vendedorQueMaisVendeu;
        }
        
        public BigDecimal getTotalVendedorMax() {
            return totalVendedorMax;
        }
        
        public void setTotalVendedorMax(BigDecimal totalVendedorMax) {
            this.totalVendedorMax = totalVendedorMax;
        }
        
        public String getUnidadeQueMaisVendeu() {
            return unidadeQueMaisVendeu;
        }
        
        public void setUnidadeQueMaisVendeu(String unidadeQueMaisVendeu) {
            this.unidadeQueMaisVendeu = unidadeQueMaisVendeu;
        }
        
        public BigDecimal getTotalUnidadeMax() {
            return totalUnidadeMax;
        }
        
        public void setTotalUnidadeMax(BigDecimal totalUnidadeMax) {
            this.totalUnidadeMax = totalUnidadeMax;
        }
    }
}