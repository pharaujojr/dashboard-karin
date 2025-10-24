// Constantes
const API_BASE_URL = '/api';
const REFRESH_INTERVAL = 15000; // 15 segundos
const CHART_ROTATION_INTERVAL = 10000; // 10 segundos

// Variáveis globais
let autoRefreshInterval = null;
let chartRotationInterval = null;
let currentChartIndex = 0;
let placarConfig = null;
let topVendedoresChart = null;
let gaugeChart = null;
let chartAcumulado = null;
let chartDiario = null;

// Inicialização
document.addEventListener('DOMContentLoaded', () => {
    carregarFiltros();
    configurarEventos();
});

// Carregar opções de filtros
async function carregarFiltros() {
    try {
        // Carregar filiais
        const responseFiliais = await fetch(`${API_BASE_URL}/filiais`);
        const filiais = await responseFiliais.json();
        
        const selectUnidade = document.getElementById('filtro-unidade');
        filiais.forEach(filial => {
            const option = document.createElement('option');
            option.value = filial;
            option.textContent = filial;
            selectUnidade.appendChild(option);
        });
        
        // Carregar vendedores
        const responseVendedores = await fetch(`${API_BASE_URL}/vendedores`);
        const vendedores = await responseVendedores.json();
        
        const selectVendedor = document.getElementById('filtro-vendedor');
        vendedores.forEach(vendedor => {
            const option = document.createElement('option');
            option.value = vendedor;
            option.textContent = vendedor;
            selectVendedor.appendChild(option);
        });
    } catch (error) {
        console.error('Erro ao carregar filtros:', error);
    }
}

// Configurar eventos
function configurarEventos() {
    document.getElementById('tipo-periodo').addEventListener('change', (e) => {
        const datasPersonalizadas = document.getElementById('datas-personalizadas');
        if (e.target.value === 'personalizado') {
            datasPersonalizadas.classList.remove('hidden');
        } else {
            datasPersonalizadas.classList.add('hidden');
        }
    });
    
    document.getElementById('btn-iniciar').addEventListener('click', iniciarPlacar);
    document.getElementById('btn-reconfigurar').addEventListener('click', reconfigurar);
}

// Calcular datas baseadas no período
function calcularDatas(tipoPeriodo) {
    const hoje = new Date();
    let dataInicio, dataFim;
    
    switch (tipoPeriodo) {
        case 'hoje':
            dataInicio = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate());
            dataFim = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate());
            break;
            
        case 'ontem':
            const ontem = new Date(hoje);
            ontem.setDate(ontem.getDate() - 1);
            dataInicio = new Date(ontem.getFullYear(), ontem.getMonth(), ontem.getDate());
            dataFim = new Date(ontem.getFullYear(), ontem.getMonth(), ontem.getDate());
            break;
            
        case 'semana':
            const diaSemana = hoje.getDay();
            const diffParaSegunda = (diaSemana + 6) % 7;
            const inicioSemana = new Date(hoje);
            inicioSemana.setDate(hoje.getDate() - diffParaSegunda);
            dataInicio = new Date(inicioSemana.getFullYear(), inicioSemana.getMonth(), inicioSemana.getDate());
            dataFim = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate());
            break;
            
        case 'mes':
            dataInicio = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
            dataFim = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0);
            break;
            
        case 'mes-passado':
            const anoMesPassado = (hoje.getMonth() === 0) ? hoje.getFullYear() - 1 : hoje.getFullYear();
            const mesAnterior = (hoje.getMonth() + 11) % 12;
            dataInicio = new Date(anoMesPassado, mesAnterior, 1);
            dataFim = new Date(anoMesPassado, mesAnterior + 1, 0);
            break;
            
        case 'trimestre':
            const mesAtual = hoje.getMonth();
            const mesInicioTrimestre = Math.floor(mesAtual / 3) * 3;
            dataInicio = new Date(hoje.getFullYear(), mesInicioTrimestre, 1);
            dataFim = new Date(hoje.getFullYear(), mesInicioTrimestre + 3, 0);
            break;
            
        case 'ano':
            dataInicio = new Date(hoje.getFullYear(), 0, 1);
            dataFim = new Date(hoje.getFullYear(), 11, 31);
            break;
            
        case 'personalizado':
            const dataInicioInput = document.getElementById('data-inicio').value;
            const dataFimInput = document.getElementById('data-fim').value;
            if (!dataInicioInput || !dataFimInput) {
                alert('Por favor, preencha as datas de início e fim');
                return null;
            }
            dataInicio = new Date(dataInicioInput + 'T00:00:00');
            dataFim = new Date(dataFimInput + 'T00:00:00');
            break;
    }
    
    return {
        dataInicio: formatarDataParaAPI(dataInicio),
        dataFim: formatarDataParaAPI(dataFim)
    };
}

// Formatar data para API
function formatarDataParaAPI(data) {
    const ano = data.getFullYear();
    const mes = String(data.getMonth() + 1).padStart(2, '0');
    const dia = String(data.getDate()).padStart(2, '0');
    return `${ano}-${mes}-${dia}`;
}

// Iniciar placar
async function iniciarPlacar() {
    const unidade = document.getElementById('filtro-unidade').value;
    const vendedor = document.getElementById('filtro-vendedor').value;
    const tipoPeriodo = document.getElementById('tipo-periodo').value;
    const meta = parseFloat(document.getElementById('meta-vendas').value);
    
    if (!meta || meta <= 0) {
        alert('Por favor, informe uma meta válida');
        return;
    }
    
    const datas = calcularDatas(tipoPeriodo);
    if (!datas) return;
    
    placarConfig = {
        unidade,
        vendedor,
        tipoPeriodo,
        dataInicio: datas.dataInicio,
        dataFim: datas.dataFim,
        meta
    };
    
    // Ocultar config e mostrar placar
    document.getElementById('config-panel').classList.add('hidden');
    document.getElementById('placar-panel').classList.remove('hidden');
    
    // Atualizar info do placar
    atualizarInfoPlacar();
    
    // Carregar dados
    await carregarDadosPlacar();
    
    // Iniciar auto-refresh
    iniciarAutoRefresh();
    
    // Iniciar rotação de gráficos
    iniciarRotacaoGraficos();
}

// Atualizar info do placar
function atualizarInfoPlacar() {
    const info = [];
    if (placarConfig.unidade) info.push(`Unidade: ${placarConfig.unidade}`);
    if (placarConfig.vendedor) info.push(`Vendedor: ${placarConfig.vendedor}`);
    info.push(`Período: ${getNomePeriodo(placarConfig.tipoPeriodo)}`);
    info.push(`Meta: ${formatarMoeda(placarConfig.meta)}`);
    
    document.getElementById('placar-config-info').textContent = info.join(' • ');
}

// Get nome do período
function getNomePeriodo(tipo) {
    const nomes = {
        'hoje': 'Hoje',
        'ontem': 'Ontem',
        'semana': 'Esta Semana',
        'mes': 'Este Mês',
        'mes-passado': 'Mês Passado',
        'trimestre': 'Trimestre Atual',
        'ano': 'Este Ano',
        'personalizado': 'Personalizado'
    };
    return nomes[tipo] || tipo;
}

// Carregar dados do placar
async function carregarDadosPlacar() {
    try {
        const params = new URLSearchParams({
            dataInicio: placarConfig.dataInicio,
            dataFim: placarConfig.dataFim
        });
        
        if (placarConfig.unidade) params.append('filial', placarConfig.unidade);
        if (placarConfig.vendedor) params.append('vendedor', placarConfig.vendedor);
        
        if (placarConfig.tipoPeriodo === 'ano' || placarConfig.tipoPeriodo === 'trimestre') {
            params.append('agruparPorMes', 'true');
        }
        
        const response = await fetch(`${API_BASE_URL}/dashboard?${params}`);
        const dados = await response.json();
        
        atualizarPlacar(dados);
        atualizarUltimoRefresh();
    } catch (error) {
        console.error('Erro ao carregar dados:', error);
    }
}

// Atualizar placar
function atualizarPlacar(dados) {
    // Atualizar métricas
    document.getElementById('total-vendas').textContent = formatarMoeda(dados.totalVendas);
    document.getElementById('numero-vendas').textContent = dados.numeroVendas || '0';
    document.getElementById('ticket-medio').textContent = formatarMoeda(dados.ticketMedio);
    
    // Atualizar gauge
    atualizarGauge(dados.totalVendas);
    
    // Atualizar top 10 vendedores
    atualizarTopVendedores(dados.top10Vendedores || []);
    
    // Atualizar gráficos
    atualizarGraficos(dados.dadosGrafico || []);
}

// Atualizar gauge
function atualizarGauge(valorAtual) {
    const percentual = Math.min((valorAtual / placarConfig.meta) * 100, 100);
    
    document.getElementById('gauge-realizado').textContent = formatarMoeda(valorAtual);
    document.getElementById('gauge-meta').textContent = formatarMoeda(placarConfig.meta);
    document.getElementById('gauge-percentual').textContent = `${percentual.toFixed(1)}%`;
    
    const ctx = document.getElementById('gaugeChart').getContext('2d');
    
    if (gaugeChart) {
        gaugeChart.destroy();
    }
    
    gaugeChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            datasets: [{
                data: [percentual, 100 - percentual],
                backgroundColor: [
                    percentual >= 100 ? '#10b981' : percentual >= 75 ? '#667eea' : percentual >= 50 ? '#f59e0b' : '#ef4444',
                    '#e5e7eb'
                ],
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            circumference: 180,
            rotation: -90,
            cutout: '75%',
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    enabled: false
                }
            }
        }
    });
}

// Atualizar top vendedores
function atualizarTopVendedores(vendedores) {
    const ctx = document.getElementById('topVendedoresChart').getContext('2d');
    
    if (topVendedoresChart) {
        topVendedoresChart.destroy();
    }
    
    const labels = vendedores.map(v => {
        const nome = v.nome || v.vendedor || 'Sem vendedor';
        return nome.toUpperCase();
    });
    const valores = vendedores.map(v => parseFloat(v.total) || 0);
    
    topVendedoresChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Total de Vendas',
                data: valores,
                backgroundColor: 'rgba(102, 126, 234, 0.8)',
                borderColor: 'rgba(102, 126, 234, 1)',
                borderWidth: 2,
                borderRadius: 8
            }]
        },
        options: {
            indexAxis: 'y',
            responsive: true,
            maintainAspectRatio: false,
            layout: {
                padding: {
                    left: 10,
                    right: 100,
                    top: 10,
                    bottom: 10
                }
            },
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return 'R$ ' + context.parsed.x.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
                        }
                    }
                },
                datalabels: {
                    anchor: 'end',
                    align: 'end',
                    formatter: function(value) {
                        return 'R$ ' + value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
                    },
                    color: '#374151',
                    font: {
                        weight: 'bold',
                        size: 11
                    }
                }
            },
            scales: {
                x: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return 'R$ ' + value.toLocaleString('pt-BR');
                        }
                    },
                    grid: {
                        display: true,
                        color: 'rgba(0, 0, 0, 0.05)'
                    }
                },
                y: {
                    grid: {
                        display: false
                    }
                }
            }
        },
        plugins: [ChartDataLabels]
    });
}

// Atualizar gráficos
function atualizarGraficos(dadosGrafico) {
    const labels = dadosGrafico.map(item => formatarDataGrafico(item.data));
    const valores = dadosGrafico.map(item => parseFloat(item.valor) || 0);
    
    // Calcular valores acumulados
    const valoresAcumulados = [];
    let acumulado = 0;
    valores.forEach(valor => {
        acumulado += valor;
        valoresAcumulados.push(acumulado);
    });
    
    // Gráfico acumulado
    const ctxAcumulado = document.getElementById('chart-acumulado').getContext('2d');
    if (chartAcumulado) {
        chartAcumulado.destroy();
    }
    
    chartAcumulado = new Chart(ctxAcumulado, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Vendas Acumuladas',
                data: valoresAcumulados,
                borderColor: '#f97316',
                backgroundColor: 'rgba(249, 115, 22, 0.1)',
                fill: true,
                tension: 0.4,
                borderWidth: 3,
                pointRadius: 4,
                pointHoverRadius: 6
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return 'R$ ' + context.parsed.y.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return 'R$ ' + value.toLocaleString('pt-BR');
                        }
                    }
                }
            }
        }
    });
    
    // Gráfico diário
    const ctxDiario = document.getElementById('chart-diario').getContext('2d');
    if (chartDiario) {
        chartDiario.destroy();
    }
    
    chartDiario = new Chart(ctxDiario, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Vendas do Dia',
                data: valores,
                backgroundColor: 'rgba(59, 130, 246, 0.8)',
                borderColor: 'rgba(59, 130, 246, 1)',
                borderWidth: 2,
                borderRadius: 6
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return 'R$ ' + context.parsed.y.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return 'R$ ' + value.toLocaleString('pt-BR');
                        }
                    }
                }
            }
        }
    });
}

// Formatar data para gráfico
function formatarDataGrafico(dataStr) {
    const data = new Date(dataStr + 'T00:00:00');
    const dia = String(data.getDate()).padStart(2, '0');
    const mes = String(data.getMonth() + 1).padStart(2, '0');
    return `${dia}/${mes}`;
}

// Formatar moeda
function formatarMoeda(valor) {
    if (valor === null || valor === undefined) return 'R$ 0,00';
    return 'R$ ' + parseFloat(valor).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

// Auto-refresh
function iniciarAutoRefresh() {
    if (autoRefreshInterval) {
        clearInterval(autoRefreshInterval);
    }
    
    autoRefreshInterval = setInterval(() => {
        if (!document.hidden) {
            carregarDadosPlacar();
        }
    }, REFRESH_INTERVAL);
}

function pararAutoRefresh() {
    if (autoRefreshInterval) {
        clearInterval(autoRefreshInterval);
        autoRefreshInterval = null;
    }
}

function atualizarUltimoRefresh() {
    const agora = new Date();
    const horas = String(agora.getHours()).padStart(2, '0');
    const minutos = String(agora.getMinutes()).padStart(2, '0');
    const segundos = String(agora.getSeconds()).padStart(2, '0');
    document.getElementById('ultimo-refresh').textContent = `${horas}:${minutos}:${segundos}`;
}

// Rotação de gráficos
function iniciarRotacaoGraficos() {
    if (chartRotationInterval) {
        clearInterval(chartRotationInterval);
    }
    
    chartRotationInterval = setInterval(() => {
        alternarGraficos();
    }, CHART_ROTATION_INTERVAL);
}

function pararRotacaoGraficos() {
    if (chartRotationInterval) {
        clearInterval(chartRotationInterval);
        chartRotationInterval = null;
    }
}

function alternarGraficos() {
    const chartAcumuladoEl = document.getElementById('chart-acumulado');
    const chartDiarioEl = document.getElementById('chart-diario');
    const title = document.getElementById('chart-title');
    const indicators = document.querySelectorAll('.toggle-indicator i');
    
    if (currentChartIndex === 0) {
        // Mostrar diário
        chartAcumuladoEl.classList.remove('active');
        chartDiarioEl.classList.add('active');
        title.innerHTML = '<i class="fas fa-chart-bar"></i> Evolução Diária das Vendas';
        indicators[0].classList.remove('active');
        indicators[1].classList.add('active');
        currentChartIndex = 1;
    } else {
        // Mostrar acumulado
        chartDiarioEl.classList.remove('active');
        chartAcumuladoEl.classList.add('active');
        title.innerHTML = '<i class="fas fa-chart-area"></i> Vendas Acumuladas';
        indicators[1].classList.remove('active');
        indicators[0].classList.add('active');
        currentChartIndex = 0;
    }
}

// Reconfigurar
function reconfigurar() {
    if (confirm('Deseja realmente reconfigurar o placar? Os dados atuais serão perdidos.')) {
        pararAutoRefresh();
        pararRotacaoGraficos();
        
        // Limpar gráficos
        if (topVendedoresChart) topVendedoresChart.destroy();
        if (gaugeChart) gaugeChart.destroy();
        if (chartAcumulado) chartAcumulado.destroy();
        if (chartDiario) chartDiario.destroy();
        
        // Resetar configuração
        placarConfig = null;
        currentChartIndex = 0;
        
        // Voltar para config
        document.getElementById('placar-panel').classList.add('hidden');
        document.getElementById('config-panel').classList.remove('hidden');
        
        // Limpar form
        document.getElementById('meta-vendas').value = '';
    }
}

// Listener para visibilidade da página
document.addEventListener('visibilitychange', () => {
    if (placarConfig) {
        if (document.hidden) {
            pararRotacaoGraficos();
        } else {
            iniciarRotacaoGraficos();
            carregarDadosPlacar();
        }
    }
});
