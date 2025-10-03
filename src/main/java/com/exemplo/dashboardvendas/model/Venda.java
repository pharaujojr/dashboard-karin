package com.exemplo.dashboardvendas.model;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDate;

@Entity
@Table(name = "vendas_nacional")
public class Venda {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(name = "cliente", nullable = false)
    private String cliente;
    
    @Column(name = "vendedor", nullable = false)
    private String vendedor;
    
    @Column(name = "data_venda", nullable = false)
    private LocalDate dataVenda;
    
    @Column(name = "filial", nullable = false)
    private String filial;
    
    @Column(name = "valor_venda", nullable = false)
    private BigDecimal valorVenda;
    
    // Construtores
    public Venda() {}
    
    public Venda(String cliente, String vendedor, LocalDate dataVenda, String filial, BigDecimal valorVenda) {
        this.cliente = cliente;
        this.vendedor = vendedor;
        this.dataVenda = dataVenda;
        this.filial = filial;
        this.valorVenda = valorVenda;
    }
    
    // Getters e Setters
    public Long getId() {
        return id;
    }
    
    public void setId(Long id) {
        this.id = id;
    }
    
    public String getCliente() {
        return cliente;
    }
    
    public void setCliente(String cliente) {
        this.cliente = cliente;
    }
    
    public String getVendedor() {
        return vendedor;
    }
    
    public void setVendedor(String vendedor) {
        this.vendedor = vendedor;
    }
    
    public LocalDate getDataVenda() {
        return dataVenda;
    }
    
    public void setDataVenda(LocalDate dataVenda) {
        this.dataVenda = dataVenda;
    }
    
    public String getFilial() {
        return filial;
    }
    
    public void setFilial(String filial) {
        this.filial = filial;
    }
    
    public BigDecimal getValorVenda() {
        return valorVenda;
    }
    
    public void setValorVenda(BigDecimal valorVenda) {
        this.valorVenda = valorVenda;
    }
}