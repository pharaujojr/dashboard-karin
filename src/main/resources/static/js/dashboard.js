// Variáveis globais
let vendasChart;
let topVendedoresChart;
const API_BASE_URL = '/api';

// Inicialização da página
document.addEventListener('DOMContentLoaded', function() {
    carregarFiltros();
    carregarDadosIniciais();
    configurarEventos();
});

// Configurar eventos
function configurarEventos() {
    // Função auxiliar para adicionar event listener com verificação
    function adicionarEvento(id, evento, callback) {
        const elemento = document.getElementById(id);
        if (elemento) {
            elemento.addEventListener(evento, callback);
        } else {
            console.warn(`Elemento com ID '${id}' não encontrado para evento '${evento}'`);
        }
    }

    adicionarEvento('btn-filtrar', 'click', filtrarDados);
    
    // Mudança no filtro de unidade
    adicionarEvento('filtro-unidade', 'change', function() {
        const unidadeSelecionada = this.value;
        carregarVendedoresPorUnidade(unidadeSelecionada);
    });

    // Mudança no tipo de período
    adicionarEvento('tipo-periodo', 'change', function() {
        const tipoPeriodo = this.value;
        const filtrosPersonalizados = document.getElementById('filtros-data-personalizada');
        if (tipoPeriodo === 'personalizado') {
            if (filtrosPersonalizados) filtrosPersonalizados.classList.remove('hidden');
        } else {
            if (filtrosPersonalizados) filtrosPersonalizados.classList.add('hidden');
            // Atualiza os campos de data automaticamente quando o usuário escolhe um período predefinido
            try {
                definirPeriodoPredefinido(tipoPeriodo);
            } catch (e) {
                console.error('Erro ao definir período predefinido:', e);
            }
        }
    });

    // Enter nos campos de data
    adicionarEvento('data-inicio', 'keypress', function(e) {
        if (e.key === 'Enter') filtrarDados();
    });
    adicionarEvento('data-fim', 'keypress', function(e) {
        if (e.key === 'Enter') filtrarDados();
    });
}

// Carregar opções dos filtros
async function carregarFiltros() {
    try {
        // Carregar filiais
        const filiaisResponse = await fetch(`${API_BASE_URL}/filiais`);
        const filiais = await filiaisResponse.json();
        
        const selectFilial = document.getElementById('filtro-unidade');
        if (selectFilial) {
            filiais.forEach(filial => {
                const option = document.createElement('option');
                option.value = filial;
                option.textContent = filial;
                selectFilial.appendChild(option);
            });
        }

        // Carregar vendedores
        const vendedoresResponse = await fetch(`${API_BASE_URL}/vendedores`);
        const vendedores = await vendedoresResponse.json();
        
        const selectVendedor = document.getElementById('filtro-vendedor');
        if (selectVendedor) {
            vendedores.forEach(vendedor => {
                const option = document.createElement('option');
                option.value = vendedor;
                option.textContent = vendedor.toUpperCase();
                selectVendedor.appendChild(option);
            });
        }
    } catch (error) {
        console.error('Erro ao carregar filtros:', error);
        mostrarNotificacao('Erro ao carregar filtros', 'error');
    }
}

// Carregar vendedores por unidade
async function carregarVendedoresPorUnidade(unidade) {
    try {
        const selectVendedor = document.getElementById('filtro-vendedor');
        if (!selectVendedor) {
            console.warn("Elemento 'filtro-vendedor' não encontrado");
            return;
        }
        
        // Limpar opções atuais exceto "Todos os vendedores"
        selectVendedor.innerHTML = '<option value="">Todos os vendedores</option>';
        
        let vendedores;
        if (unidade) {
            const response = await fetch(`${API_BASE_URL}/vendedores/por-unidade?filial=${encodeURIComponent(unidade)}`);
            vendedores = await response.json();
        } else {
            const response = await fetch(`${API_BASE_URL}/vendedores`);
            vendedores = await response.json();
        }
        
        vendedores.forEach(vendedor => {
            const option = document.createElement('option');
            option.value = vendedor;
            option.textContent = vendedor ? vendedor.toUpperCase() : '';
            selectVendedor.appendChild(option);
        });
        
    } catch (error) {
        console.error('Erro ao carregar vendedores:', error);
        mostrarNotificacao('Erro ao carregar vendedores', 'error');
    }
}

// Definir período predefinido
function definirPeriodoPredefinido(tipo) {
    const hoje = new Date();
    let dataInicio, dataFim;
    switch (tipo) {
        case 'dia':
            // Hoje (aplica somente o dia atual)
            dataInicio = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate());
            dataFim = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate());
            break;

        case 'semana':
            // Início da semana: segunda-feira (ISO). Fim: hoje (week-to-date).
            // If you prefer full week (Mon-Sun) change dataFim to inicio + 6 days.
            const diaSemana = hoje.getDay(); // 0 (Sun) .. 6 (Sat)
            const diffParaSegunda = (diaSemana + 6) % 7; // Monday = 0
            const inicioSemanaDate = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate() - diffParaSegunda);
            dataInicio = inicioSemanaDate;
            dataFim = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate());
            break;

        case 'mes':
            // Primeiro dia do mês até o último dia do mês
            dataInicio = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
            dataFim = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0); // último dia do mês
            break;

        case 'mes-passado':
            // Primeiro dia do mês anterior até seu último dia
            const anoMesPassado = (hoje.getMonth() === 0) ? hoje.getFullYear() - 1 : hoje.getFullYear();
            const mesAnterior = (hoje.getMonth() + 11) % 12; // previous month index
            dataInicio = new Date(anoMesPassado, mesAnterior, 1);
            dataFim = new Date(anoMesPassado, mesAnterior + 1, 0); // último dia do mês anterior
            break;

        case 'trimestre':
            // Primeiro dia do trimestre atual até o último dia do trimestre
            const trimestreIndex = Math.floor(hoje.getMonth() / 3);
            const trimestreInicioMes = trimestreIndex * 3;
            dataInicio = new Date(hoje.getFullYear(), trimestreInicioMes, 1);
            dataFim = new Date(hoje.getFullYear(), trimestreInicioMes + 3, 0); // último dia do trimestre
            break;

        case 'ano':
            // Primeiro dia do ano até o último dia do ano
            dataInicio = new Date(hoje.getFullYear(), 0, 1);
            dataFim = new Date(hoje.getFullYear(), 11, 31);
            break;

        default:
            // Fallback: hoje
            dataInicio = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate());
            dataFim = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate());
            break;
    }
    
    const dataInicioElement = document.getElementById('data-inicio');
    const dataFimElement = document.getElementById('data-fim');
    
    if (dataInicioElement) dataInicioElement.value = formatarDataInput(dataInicio);
    if (dataFimElement) dataFimElement.value = formatarDataInput(dataFim);
    // Debug: log datas calculadas para auxiliar rastreio
    // Debug: sempre registrar as datas (YYYY-MM-DD)
    console.debug('definirPeriodoPredefinido -> tipo:', tipo, 'dataInicio:', formatarDataInput(dataInicio), 'dataFim:', formatarDataInput(dataFim));
    // Filtrar automaticamente
    setTimeout(filtrarDados, 100);
}

// Carregar dados iniciais
function carregarDadosIniciais() {
    // Usar o valor atualmente selecionado no select de período (se houver)
    const tipoSelect = document.getElementById('tipo-periodo');
    const tipo = tipoSelect ? tipoSelect.value : 'mes';
    if (tipo === 'personalizado') {
        const filtrosPersonalizados = document.getElementById('filtros-data-personalizada');
        if (filtrosPersonalizados) filtrosPersonalizados.classList.remove('hidden');
    }
    definirPeriodoPredefinido(tipo || 'mes');
}

// Filtrar dados
async function filtrarDados() {
    // Função auxiliar para obter valor de elemento com verificação
    function obterValor(id) {
        const elemento = document.getElementById(id);
        return elemento ? elemento.value : null;
    }

    const filial = obterValor('filtro-unidade') || null;
    const vendedor = obterValor('filtro-vendedor') || null;
    const dataInicio = obterValor('data-inicio');
    const dataFim = obterValor('data-fim');
    const tipoPeriodo = obterValor('tipo-periodo');

    if (!dataInicio || !dataFim) {
        mostrarNotificacao('Por favor, selecione as datas de início e fim', 'warning');
        return;
    }

    // Evitar parsing ambíguo de 'YYYY-MM-DD' com new Date(str) (UTC vs local).
    function parseISODateToLocal(dateStr) {
        if (!dateStr) return null;
        if (typeof dateStr === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
            const parts = dateStr.split('-').map(Number);
            return new Date(parts[0], parts[1] - 1, parts[2]);
        }
        // fallback
        return new Date(dateStr);
    }

    const dataInicioObj = parseISODateToLocal(dataInicio);
    const dataFimObj = parseISODateToLocal(dataFim);
    if (dataInicioObj && dataFimObj && dataInicioObj.getTime() > dataFimObj.getTime()) {
        mostrarNotificacao('A data de início deve ser anterior à data de fim', 'warning');
        return;
    }

    mostrarLoading(true);

    try {
        const params = new URLSearchParams({
            dataInicio: dataInicio,
            dataFim: dataFim
        });

        if (filial) params.append('filial', filial);
        if (vendedor) params.append('vendedor', vendedor);
        
        // Se o período for "ano" ou "trimestre", agrupar por mês
        if (tipoPeriodo === 'ano' || tipoPeriodo === 'trimestre') {
            params.append('agruparPorMes', 'true');
        }

        const response = await fetch(`${API_BASE_URL}/dashboard?${params}`);
        
        if (!response.ok) {
            throw new Error('Erro ao buscar dados do dashboard');
        }

        const dados = await response.json();
        atualizarDashboard(dados, tipoPeriodo);
        
    } catch (error) {
        console.error('Erro ao filtrar dados:', error);
        mostrarNotificacao('Erro ao carregar dados do dashboard', 'error');
    } finally {
        mostrarLoading(false);
    }
}

// Atualizar dashboard com novos dados
function atualizarDashboard(dados, tipoPeriodo = 'dia') {
    // Função auxiliar para atualizar elemento com verificação
    function atualizarElemento(id, texto) {
        const elemento = document.getElementById(id);
        if (elemento) {
            elemento.textContent = texto;
        }
    }

    // Atualizar métricas principais
    atualizarElemento('total-vendas', formatarMoeda(dados.totalVendas));
    atualizarElemento('ticket-medio', formatarMoeda(dados.ticketMedio));

    // Atualizar seção MAX
    if (dados.maxResponse) {
        atualizarElemento('maior-venda-valor', formatarMoeda(dados.maxResponse.maiorVenda));
        const vendedorTexto = dados.maxResponse.vendedorMaiorVenda ? 
            `Vendedor: ${dados.maxResponse.vendedorMaiorVenda.toUpperCase()}` : '-';
        atualizarElemento('maior-venda-vendedor', vendedorTexto);
    }

    // Atualizar gráfico
    atualizarGrafico(dados.dadosGrafico || [], tipoPeriodo);
    
    // Atualizar gráfico de top vendedores
    atualizarGraficoTopVendedores(dados.top10Vendedores || []);

    // Animação de entrada
    animarCartoes();
}

// Atualizar gráfico
function atualizarGrafico(dadosGrafico, tipoPeriodo = 'dia') {
    const ctx = document.getElementById('vendasChart').getContext('2d');

    // Destruir gráfico anterior se existir
    if (vendasChart) {
        vendasChart.destroy();
    }

    const labels = dadosGrafico.map(item => formatarDataGrafico(item.data, tipoPeriodo));
    const valores = dadosGrafico.map(item => parseFloat(item.valor) || 0);

    vendasChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Vendas (R$)',
                data: valores,
                borderColor: '#1e3a8a',
                backgroundColor: 'rgba(30, 58, 138, 0.1)',
                borderWidth: 3,
                fill: true,
                tension: 0.4,
                pointBackgroundColor: '#f97316',
                pointBorderColor: '#f97316',
                pointBorderWidth: 2,
                pointRadius: 6,
                pointHoverRadius: 8,
                pointHoverBackgroundColor: '#ea580c',
                pointHoverBorderColor: '#ea580c'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: true,
                    position: 'top',
                    labels: {
                        font: {
                            size: 14,
                            weight: '600'
                        },
                        color: '#374151'
                    }
                },
                tooltip: {
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    titleColor: '#ffffff',
                    bodyColor: '#ffffff',
                    borderColor: '#f97316',
                    borderWidth: 1,
                    callbacks: {
                        label: function(context) {
                            return 'Vendas: ' + formatarMoeda(context.parsed.y);
                        }
                    }
                }
            },
            scales: {
                x: {
                    grid: {
                        display: true,
                        color: 'rgba(0, 0, 0, 0.1)'
                    },
                    ticks: {
                        color: '#6b7280',
                        font: {
                            size: 12
                        }
                    }
                },
                y: {
                    grid: {
                        display: true,
                        color: 'rgba(0, 0, 0, 0.1)'
                    },
                    ticks: {
                        color: '#6b7280',
                        font: {
                            size: 12
                        },
                        callback: function(value) {
                            return formatarMoeda(value);
                        }
                    }
                }
            },
            interaction: {
                intersect: false,
                mode: 'index'
            },
            elements: {
                line: {
                    tension: 0.4
                }
            }
        }
    });
}

// Atualizar gráfico de top vendedores
function atualizarGraficoTopVendedores(topVendedores) {
    const ctx = document.getElementById('topVendedoresChart').getContext('2d');

    // Destruir gráfico anterior se existir
    if (topVendedoresChart) {
        topVendedoresChart.destroy();
    }

    const labels = topVendedores.map(item => item.nome ? item.nome.toUpperCase() : 'SEM NOME');
    const valores = topVendedores.map(item => parseFloat(item.total) || 0);

    topVendedoresChart = new Chart(ctx, {
        type: 'bar',
        // render bars horizontally (left to right)
        indexAxis: 'y',
        // plugin to draw value labels at end of bars
        plugins: [
            {
                id: 'valueLabels',
                afterDatasetsDraw: function(chart) {
                    const ctx = chart.ctx;
                    ctx.save();
                    const dataset = chart.data.datasets[0];
                    const meta = chart.getDatasetMeta(0);
                    ctx.font = 'bold 14px Arial';
                    ctx.fillStyle = '#374151';
                    ctx.textBaseline = 'middle';
                    ctx.textAlign = 'left';
                    
                    for (let i = 0; i < meta.data.length; i++) {
                        const bar = meta.data[i];
                        const value = dataset.data[i] || 0;
                        const label = formatarMoeda(value);
                        // Position at end of the bar plus offset
                        const x = bar.x + 10;
                        const y = bar.y;
                        ctx.fillText(label, x, y);
                    }
                    ctx.restore();
                }
            }
        ],
        data: {
            labels: labels,
            datasets: [{
                label: 'Vendas (R$)',
                data: valores,
                backgroundColor: [
                    '#f97316', '#ea580c', '#1e3a8a', '#3b82f6', '#6366f1',
                    '#8b5cf6', '#a855f7', '#ec4899', '#f43f5e', '#ef4444'
                ],
                borderColor: [
                    '#f97316', '#ea580c', '#1e3a8a', '#3b82f6', '#6366f1',
                    '#8b5cf6', '#a855f7', '#ec4899', '#f43f5e', '#ef4444'
                ],
                borderWidth: 2,
                borderRadius: 6,
                borderSkipped: false
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            layout: {
                padding: {
                    right: 80 // Extra space for value labels
                }
            },
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    titleColor: '#ffffff',
                    bodyColor: '#ffffff',
                    borderColor: '#f97316',
                    borderWidth: 1,
                    callbacks: {
                        label: function(context) {
                            // For horizontal bars the value is in parsed.x
                            const value = (context.parsed && context.parsed.x != null) ? context.parsed.x : context.parsed;
                            return 'Total: ' + formatarMoeda(value);
                        }
                    }
                }
            },
            scales: {
                x: {
                    // hide x axis scale (values are shown at bar tips)
                    display: false,
                    grid: {
                        display: false
                    }
                },
                y: {
                    // vendor names on the left
                    grid: {
                        display: false
                    },
                    ticks: {
                        color: '#374151',
                        font: {
                            size: 12,
                            weight: '500'
                        },
                        maxRotation: 0,
                        padding: 10
                    }
                }
            }
        }
    });
}

// Utilitários
function formatarMoeda(valor) {
    const numero = parseFloat(valor) || 0;
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    }).format(numero);
}

function formatarMoedaSimples(valor) {
    const numero = parseFloat(valor) || 0;
    if (numero >= 1000000) {
        return 'R$ ' + (numero / 1000000).toFixed(1) + 'M';
    } else if (numero >= 1000) {
        return 'R$ ' + (numero / 1000).toFixed(1) + 'K';
    } else {
        return 'R$ ' + numero.toFixed(0);
    }
}

function formatarDataInput(data) {
    if (!data) return '';
    // Se for string no formato ISO já, retorne o prefixo
    if (typeof data === 'string') return data.split('T')[0];
    const yyyy = data.getFullYear();
    const mm = String(data.getMonth() + 1).padStart(2, '0');
    const dd = String(data.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
}

function formatarDataGrafico(data, tipoPeriodo = 'dia') {
    // Parse backend dates (YYYY-MM-DD) as local dates to avoid timezone shift
    function parseISODateToLocal(dateStr) {
        if (!dateStr) return new Date();
        if (typeof dateStr === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
            const parts = dateStr.split('-').map(Number);
            return new Date(parts[0], parts[1] - 1, parts[2]);
        }
        return new Date(dateStr);
    }
    const dataObj = parseISODateToLocal(data);
    
    if (tipoPeriodo === 'ano' || tipoPeriodo === 'trimestre') {
        // Para período anual e trimestral, mostrar apenas mês/ano
        return dataObj.toLocaleDateString('pt-BR', {
            month: 'short',
            year: 'numeric'
        });
    } else {
        // Para outros períodos, mostrar dia/mês
        return dataObj.toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: '2-digit'
        });
    }
}

function mostrarLoading(mostrar) {
    const loading = document.getElementById('loading');
    if (loading) {
        if (mostrar) {
            loading.classList.remove('hidden');
        } else {
            loading.classList.add('hidden');
        }
    } else {
        console.warn("Elemento 'loading' não encontrado");
    }
}

function mostrarNotificacao(mensagem, tipo = 'info') {
    // Criar elemento de notificação
    const notificacao = document.createElement('div');
    notificacao.className = `notificacao ${tipo}`;
    notificacao.innerHTML = `
        <i class="fas fa-${tipo === 'error' ? 'exclamation-circle' : tipo === 'warning' ? 'exclamation-triangle' : 'info-circle'}"></i>
        <span>${mensagem}</span>
    `;

    // Estilos da notificação
    notificacao.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${tipo === 'error' ? '#ef4444' : tipo === 'warning' ? '#f59e0b' : '#3b82f6'};
        color: white;
        padding: 15px 20px;
        border-radius: 10px;
        box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
        z-index: 1001;
        display: flex;
        align-items: center;
        gap: 10px;
        font-weight: 500;
        animation: slideInRight 0.3s ease;
    `;

    document.body.appendChild(notificacao);

    // Remover após 4 segundos
    setTimeout(() => {
        notificacao.style.animation = 'slideOutRight 0.3s ease';
        setTimeout(() => {
            if (notificacao.parentNode) {
                notificacao.parentNode.removeChild(notificacao);
            }
        }, 300);
    }, 4000);
}

function animarCartoes() {
    const cartoes = document.querySelectorAll('.metric-card, .max-card');
    cartoes.forEach((cartao, index) => {
        cartao.style.animation = 'none';
        setTimeout(() => {
            cartao.style.animation = `fadeInUp 0.6s ease-out ${index * 0.1}s both`;
        }, 50);
    });
}

// Adicionar estilos de animação via CSS dinâmico
const style = document.createElement('style');
style.textContent = `
    @keyframes slideInRight {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOutRight {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);