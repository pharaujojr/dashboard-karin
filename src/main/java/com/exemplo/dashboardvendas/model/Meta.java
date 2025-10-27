package com.exemplo.dashboardvendas.model;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDate;

@Entity
@Table(name = "metas", uniqueConstraints = {
    @UniqueConstraint(columnNames = {"filial", "data_inicio", "data_fim"})
})
public class Meta {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(name = "filial", nullable = false)
    private String filial;
    
    @Column(name = "valor_meta", nullable = false)
    private BigDecimal valorMeta;
    
    @Column(name = "data_inicio", nullable = false)
    private LocalDate dataInicio;
    
    @Column(name = "data_fim", nullable = false)
    private LocalDate dataFim;
    
    @Column(name = "ativa", nullable = false)
    private Boolean ativa = true;
    
    @Column(name = "descricao")
    private String descricao;
    
    // Construtores
    public Meta() {}
    
    public Meta(String filial, BigDecimal valorMeta, LocalDate dataInicio, LocalDate dataFim) {
        this.filial = filial;
        this.valorMeta = valorMeta;
        this.dataInicio = dataInicio;
        this.dataFim = dataFim;
        this.ativa = true;
    }
    
    // Getters e Setters
    public Long getId() {
        return id;
    }
    
    public void setId(Long id) {
        this.id = id;
    }
    
    public String getFilial() {
        return filial;
    }
    
    public void setFilial(String filial) {
        this.filial = filial;
    }
    
    public BigDecimal getValorMeta() {
        return valorMeta;
    }
    
    public void setValorMeta(BigDecimal valorMeta) {
        this.valorMeta = valorMeta;
    }
    
    public LocalDate getDataInicio() {
        return dataInicio;
    }
    
    public void setDataInicio(LocalDate dataInicio) {
        this.dataInicio = dataInicio;
    }
    
    public LocalDate getDataFim() {
        return dataFim;
    }
    
    public void setDataFim(LocalDate dataFim) {
        this.dataFim = dataFim;
    }
    
    public Boolean getAtiva() {
        return ativa;
    }
    
    public void setAtiva(Boolean ativa) {
        this.ativa = ativa;
    }
    
    public String getDescricao() {
        return descricao;
    }
    
    public void setDescricao(String descricao) {
        this.descricao = descricao;
    }
    
    @Override
    public String toString() {
        return "Meta{" +
                "id=" + id +
                ", filial='" + filial + '\'' +
                ", valorMeta=" + valorMeta +
                ", dataInicio=" + dataInicio +
                ", dataFim=" + dataFim +
                ", ativa=" + ativa +
                ", descricao='" + descricao + '\'' +
                '}';
    }
}
