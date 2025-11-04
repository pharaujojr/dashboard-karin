// Variáveis globais
let vendasChart;
let vendasAcumuladasChart;
let topVendedoresChart;
let autoRefreshInterval;
const API_BASE_URL = '/api';
const REFRESH_INTERVAL = 15000; // 15 segundos em milissegundos
let ultimosDados = null; // Cache dos últimos dados recebidos
let ultimosFiltros = null; // Cache dos filtros usados na última requisição

// Variáveis de paginação do ranking
let todosVendedores = []; // Todos os vendedores
let paginaAtualRanking = 1;
const VENDEDORES_POR_PAGINA = 10;

// Inicialização da página
document.addEventListener('DOMContentLoaded', function() {
    carregarFiltros();
    carregarDadosIniciais();
    configurarEventos();
    configurarVisibilityChange();
});

// Configurar mudança de visibilidade da página
function configurarVisibilityChange() {
    document.addEventListener('visibilitychange', function() {
        if (document.hidden) {
            // Página não está visível, pausar auto-refresh
            console.log('Página oculta: pausando auto-refresh');
        } else {
            // Página voltou a ficar visível, retomar auto-refresh se estava ativo
            if (autoRefreshInterval) {
                console.log('Página visível: retomando auto-refresh');
                // Atualizar imediatamente ao voltar
                filtrarDados();
            }
        }
    });
}

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
    
    // Botões de paginação do ranking
    adicionarEvento('prev-page-btn', 'click', function() {
        if (paginaAtualRanking > 1) {
            mudarPaginaRanking(paginaAtualRanking - 1);
        }
    });
    adicionarEvento('next-page-btn', 'click', function() {
        const totalPaginas = Math.ceil(todosVendedores.length / VENDEDORES_POR_PAGINA);
        if (paginaAtualRanking < totalPaginas) {
            mudarPaginaRanking(paginaAtualRanking + 1);
        }
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
            // Primeiro dia do ano até o último dia do ano (Janeiro 1 a Dezembro 31)
            const anoAtual = hoje.getFullYear();
            dataInicio = new Date(anoAtual, 0, 1); // Janeiro 1
            dataFim = new Date(anoAtual, 11, 31); // Dezembro 31
            console.log('Ano calculation - Current year:', anoAtual, 'Start:', dataInicio, 'End:', dataFim);
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
    console.log('definirPeriodoPredefinido -> tipo:', tipo, 'dataInicio:', formatarDataInput(dataInicio), 'dataFim:', formatarDataInput(dataFim));
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
    // Adicionar classe de carregamento no indicador
    const refreshIndicator = document.querySelector('.auto-refresh-indicator');
    const refreshStatus = document.getElementById('refresh-status');
    
    if (refreshIndicator) {
        refreshIndicator.classList.add('refreshing');
    }
    if (refreshStatus) {
        refreshStatus.textContent = 'Atualizando...';
    }
    
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

    // mostrarLoading(true); // Removido - tela de loading desabilitada

    try {
        const params = new URLSearchParams({
            dataInicio: dataInicio,
            dataFim: dataFim
        });

        // Usar unidades selecionadas se a função existir (dashboard-extensions.js)
        let unidadesAtuais = [];
        if (typeof obterUnidadesSelecionadas === 'function') {
            const unidadesSelecionadas = obterUnidadesSelecionadas();
            if (unidadesSelecionadas && unidadesSelecionadas.length > 0) {
                unidadesSelecionadas.forEach(unidade => params.append('filial', unidade));
                unidadesAtuais = unidadesSelecionadas;
            }
        } else if (filial) {
            // Fallback para o select antigo
            params.append('filial', filial);
            unidadesAtuais = [filial];
        }
        
        // Criar objeto com filtros atuais para comparação
        const filtrosAtuais = {
            unidades: unidadesAtuais.sort().join(','),
            vendedor: vendedor || '',
            dataInicio: dataInicio,
            dataFim: dataFim,
            tipoPeriodo: tipoPeriodo
        };
        
        if (vendedor) params.append('vendedor', vendedor);
        
        // Se o período for "ano" ou "trimestre", agrupar por mês
        if (tipoPeriodo === 'ano' || tipoPeriodo === 'trimestre') {
            params.append('agruparPorMes', 'true');
        }
        
        // Enviar tipo de período para cálculo de comparação
        // Se for personalizado, enviar 'dia' como padrão para cálculos
        const tipoPeriodoParam = (tipoPeriodo && tipoPeriodo !== 'personalizado') ? tipoPeriodo : 'dia';
        params.append('tipoPeriodo', tipoPeriodoParam);

        const url = `${API_BASE_URL}/dashboard?${params}`;
        console.log('[FETCH] URL:', url);
        console.log('[FETCH] Parâmetros:', Object.fromEntries(params));
        
        let response;
        try {
            response = await fetch(url);
        } catch (fetchError) {
            console.error('[FETCH] Erro de rede:', fetchError);
            throw new Error(`Erro de conexão: ${fetchError.message}. Verifique se o servidor está rodando.`);
        }
        
        console.log('[FETCH] Response status:', response.status);
        console.log('[FETCH] Response ok:', response.ok);
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('[FETCH] Error response:', errorText);
            throw new Error(`Erro ao buscar dados do dashboard (${response.status}): ${errorText}`);
        }

        const dados = await response.json();
        console.log('[FETCH] Dados recebidos:', dados);
        atualizarDashboard(dados, tipoPeriodo, filtrosAtuais);
        
        // Iniciar auto-refresh após carregar dados com sucesso
        iniciarAutoRefresh();
        
    } catch (error) {
        console.error('Erro ao filtrar dados:', error);
        mostrarNotificacao('Erro ao carregar dados do dashboard', 'error');
    } finally {
        // mostrarLoading(false); // Removido - tela de loading desabilitada
        
        // Remover animação do indicador
        const refreshIndicator = document.querySelector('.auto-refresh-indicator');
        const refreshStatus = document.getElementById('refresh-status');
        
        if (refreshIndicator) {
            refreshIndicator.classList.remove('refreshing');
        }
        if (refreshStatus) {
            const now = new Date();
            const timeStr = now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
            refreshStatus.textContent = `Última atualização: ${timeStr}`;
        }
    }
}

// Iniciar auto-refresh dos dados
function iniciarAutoRefresh() {
    // Limpar intervalo anterior se existir
    if (autoRefreshInterval) {
        clearInterval(autoRefreshInterval);
    }
    
    // Configurar novo intervalo
    autoRefreshInterval = setInterval(() => {
        console.log('Auto-refresh: atualizando dados do dashboard...');
        filtrarDados();
    }, REFRESH_INTERVAL);
    
    console.log(`Auto-refresh iniciado: ${REFRESH_INTERVAL / 1000} segundos`);
}

// Parar auto-refresh dos dados
function pararAutoRefresh() {
    if (autoRefreshInterval) {
        clearInterval(autoRefreshInterval);
        autoRefreshInterval = null;
        console.log('Auto-refresh parado');
    }
}

// Atualizar indicador de comparação com período anterior
function atualizarComparacao(elementoId, variacao) {
    const elemento = document.getElementById(elementoId);
    if (!elemento) return;
    
    // Se não houver variação, ocultar o indicador
    if (variacao === null || variacao === undefined) {
        elemento.classList.add('hidden');
        return;
    }
    
    // Mostrar o indicador
    elemento.classList.remove('hidden');
    
    // Determinar se é positivo ou negativo
    const isPositivo = variacao >= 0;
    
    // Atualizar classes
    elemento.classList.remove('positive', 'negative');
    elemento.classList.add(isPositivo ? 'positive' : 'negative');
    
    // Atualizar conteúdo (seta + percentual)
    const seta = isPositivo ? '↑' : '↓';
    const percentual = Math.abs(variacao).toFixed(1);
    elemento.textContent = `${seta} ${percentual}%`;
}

// Atualizar dashboard com novos dados
function atualizarDashboard(dados, tipoPeriodo = 'dia', filtrosAtuais = null) {
    // Verificar se os filtros mudaram
    const filtrosMudaram = !ultimosFiltros || 
        JSON.stringify(ultimosFiltros) !== JSON.stringify(filtrosAtuais);
    
    // PROTEÇÃO: Evitar regressão de dados - MAS APENAS se os filtros NÃO mudaram
    if (!filtrosMudaram && ultimosDados && dados && dados.totalVendas !== undefined && ultimosDados.totalVendas !== undefined) {
        const totalVendasNovo = parseFloat(dados.totalVendas) || 0;
        const totalVendasAntigo = parseFloat(ultimosDados.totalVendas) || 0;
        
        if (totalVendasNovo < totalVendasAntigo) {
            console.warn('[DASHBOARD] ⚠️ Total de vendas menor que o anterior - atualização bloqueada');
            console.warn('Anterior:', formatarMoeda(totalVendasAntigo), 'Novo:', formatarMoeda(totalVendasNovo));
            return; // Não atualiza nada
        }
    }
    
    if (filtrosMudaram) {
        console.log('[DASHBOARD] ℹ️ Filtros mudaram - permitindo atualização');
        console.log('Filtros anteriores:', ultimosFiltros);
        console.log('Filtros atuais:', filtrosAtuais);
    }
    
    // Verificar se os dados mudaram
    const dadosMudaram = !ultimosDados || JSON.stringify(ultimosDados) !== JSON.stringify(dados);
    
    // Verificações específicas para otimizar atualizações
    const metricasMudaram = !ultimosDados || 
        ultimosDados.totalVendas !== dados.totalVendas ||
        ultimosDados.numeroVendas !== dados.numeroVendas ||
        ultimosDados.ticketMedio !== dados.ticketMedio;
    
    const graficoMudou = !ultimosDados || 
        JSON.stringify(ultimosDados.dadosGrafico) !== JSON.stringify(dados.dadosGrafico);
    
    // Comparação específica para top vendedores (apenas nome e total)
    const topVendedoresMudou = !ultimosDados || !ultimosDados.top10Vendedores ||
        ultimosDados.top10Vendedores.length !== dados.top10Vendedores.length ||
        ultimosDados.top10Vendedores.some((v, i) => 
            v.nome !== dados.top10Vendedores[i]?.nome || 
            v.total !== dados.top10Vendedores[i]?.total
        );
    
    // Função auxiliar para atualizar elemento com verificação
    function atualizarElemento(id, texto) {
        const elemento = document.getElementById(id);
        if (elemento) {
            elemento.textContent = texto;
        }
    }

    // Atualizar métricas principais apenas se mudaram
    if (metricasMudaram) {
        atualizarElemento('total-vendas', formatarMoeda(dados.totalVendas));
        atualizarElemento('numero-vendas', dados.numeroVendas || '0');
        atualizarElemento('ticket-medio', formatarMoeda(dados.ticketMedio));
        
        // Atualizar indicadores de comparação
        atualizarComparacao('comparison-total-vendas', dados.comparison?.totalVendasVariacao);
        atualizarComparacao('comparison-numero-vendas', dados.comparison?.numeroVendasVariacao);
        atualizarComparacao('comparison-ticket-medio', dados.comparison?.ticketMedioVariacao);
    }

    // Atualizar seção MAX
    if (dados.maxResponse) {
        const maxMudou = !ultimosDados || !ultimosDados.maxResponse ||
            ultimosDados.maxResponse.maiorVenda !== dados.maxResponse.maiorVenda;
        
        if (maxMudou) {
            atualizarElemento('maior-venda-valor', formatarMoeda(dados.maxResponse.maiorVenda));
            
            // Build the details text with vendor and client
            let detailsText = '';
            if (dados.maxResponse.vendedorMaiorVenda && dados.maxResponse.clienteMaiorVenda) {
                detailsText = `${dados.maxResponse.vendedorMaiorVenda.toUpperCase()} • ${dados.maxResponse.clienteMaiorVenda.toUpperCase()}`;
            } else if (dados.maxResponse.vendedorMaiorVenda) {
                detailsText = `Vendedor: ${dados.maxResponse.vendedorMaiorVenda.toUpperCase()}`;
            } else if (dados.maxResponse.clienteMaiorVenda) {
                detailsText = `Cliente: ${dados.maxResponse.clienteMaiorVenda.toUpperCase()}`;
            } else {
                detailsText = '-';
            }
            atualizarElemento('maior-venda-vendedor', detailsText);
        }
    }

    // Atualizar gráfico de vendas apenas se mudou
    if (graficoMudou) {
        console.log('[DASHBOARD] Dados do gráfico mudaram, redesenhando...');
        atualizarGrafico(dados.dadosGrafico || [], tipoPeriodo);
        atualizarGraficoAcumulado(dados.dadosGrafico || [], tipoPeriodo);
    }
    
    // Atualizar gráfico de top vendedores apenas se mudou
    if (topVendedoresMudou) {
        console.log('[DASHBOARD] Top vendedores mudaram, redesenhando...');
        console.log('Anterior:', ultimosDados?.top10Vendedores?.map(v => ({nome: v.nome, total: v.total})));
        console.log('Novo:', dados.top10Vendedores?.map(v => ({nome: v.nome, total: v.total})));
        atualizarGraficoTopVendedores(dados.top10Vendedores || []);
    } else {
        console.log('[DASHBOARD] Top vendedores NÃO mudaram, mantendo gráfico');
    }

    // Animação de entrada apenas na primeira carga
    if (!ultimosDados) {
        animarCartoes();
    }
    
    // Armazenar dados e filtros atuais
    if (dadosMudaram) {
        ultimosDados = JSON.parse(JSON.stringify(dados));
        ultimosFiltros = filtrosAtuais ? JSON.parse(JSON.stringify(filtrosAtuais)) : null;
    }
}

// Atualizar gráfico
function atualizarGrafico(dadosGrafico, tipoPeriodo = 'dia') {
    const ctx = document.getElementById('vendasChart').getContext('2d');

    // Destruir gráfico anterior se existir
    if (vendasChart) {
        vendasChart.destroy();
    }

    // Debug: log raw data from backend
    console.log('=== CHART DATA DEBUG ===');
    console.log('- tipoPeriodo:', tipoPeriodo);
    console.log('- dadosGrafico raw:', dadosGrafico);
    
    const labels = dadosGrafico.map(item => formatarDataGrafico(item.data, tipoPeriodo));
    const valores = dadosGrafico.map(item => parseFloat(item.valor) || 0);
    
    // Debug: log processed data
    console.log('- processed labels:', labels);
    console.log('- processed valores:', valores);
    console.log('- data/label pairs:', dadosGrafico.map(item => ({
        rawDate: item.data,
        processedLabel: formatarDataGrafico(item.data, tipoPeriodo),
        value: parseFloat(item.valor) || 0
    })));
    console.log('========================');

    vendasChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Vendas (R$)',
                data: valores,
                backgroundColor: 'rgba(30, 58, 138, 0.8)',
                borderColor: '#1e3a8a',
                borderWidth: 2,
                borderRadius: {
                    topLeft: 6,
                    topRight: 6,
                    bottomLeft: 0,
                    bottomRight: 0
                },
                borderSkipped: false,
                hoverBackgroundColor: 'rgba(249, 115, 22, 0.9)',
                hoverBorderColor: '#f97316'
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
            }
        }
    });
}

// Atualizar gráfico de top vendedores
function atualizarGraficoTopVendedores(topVendedores) {
    // Armazenar todos os vendedores
    todosVendedores = topVendedores || [];
    
    // Resetar para página 1 quando receber novos dados
    paginaAtualRanking = 1;
    
    // Renderizar a primeira página
    renderizarPaginaRanking();
}

function renderizarPaginaRanking() {
    const ctx = document.getElementById('topVendedoresChart').getContext('2d');
    
    // Adicionar classe de animação
    const chartContainer = document.querySelector('.top-vendedores-chart');
    if (chartContainer) {
        chartContainer.classList.add('chart-transitioning');
        setTimeout(() => {
            chartContainer.classList.remove('chart-transitioning');
        }, 600);
    }

    // Destruir gráfico anterior se existir
    if (topVendedoresChart) {
        topVendedoresChart.destroy();
    }

    // Calcular índices da página atual
    const inicio = (paginaAtualRanking - 1) * VENDEDORES_POR_PAGINA;
    const fim = inicio + VENDEDORES_POR_PAGINA;
    const vendedoresPagina = todosVendedores.slice(inicio, fim);
    
    // Adicionar posição aos labels (ex: "1º JOÃO SILVA")
    const labels = vendedoresPagina.map((item, index) => {
        const posicao = inicio + index + 1;
        const nome = item.nome ? item.nome.toUpperCase() : 'SEM NOME';
        return `${posicao}º ${nome}`;
    });
    
    const valores = vendedoresPagina.map(item => parseFloat(item.total) || 0);
    const variacoes = vendedoresPagina.map(item => item.variacao || 0);

    topVendedoresChart = new Chart(ctx, {
        type: 'bar',
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
        plugins: [
            {
                id: 'valueLabels',
                afterDatasetsDraw: function(chart) {
                    const ctx = chart.ctx;
                    ctx.save();
                    const meta = chart.getDatasetMeta(0);
                    ctx.font = 'bold 12px Arial';
                    ctx.textAlign = 'left';
                    ctx.textBaseline = 'middle';
                    
                    for (let i = 0; i < meta.data.length; i++) {
                        const bar = meta.data[i];
                        const value = chart.data.datasets[0].data[i] || 0;
                        const variacao = variacoes[i];
                        const label = formatarMoeda(value);
                        
                        // Valor em preto
                        ctx.fillStyle = '#374151';
                        ctx.fillText(label, bar.x + 10, bar.y);
                        
                        // Adicionar indicador de comparação se houver variação
                        if (variacao !== null && variacao !== undefined && variacao !== 0) {
                            const variacaoText = Math.abs(variacao).toFixed(1) + '%';
                            const arrow = variacao > 0 ? '▲' : '▼';
                            const color = variacao > 0 ? '#10b981' : '#ef4444';
                            
                            // Medir largura do valor para posicionar a variação
                            const labelWidth = ctx.measureText(label).width;
                            
                            ctx.fillStyle = color;
                            ctx.font = 'bold 11px Arial';
                            ctx.fillText(arrow + ' ' + variacaoText, bar.x + 15 + labelWidth, bar.y);
                        }
                    }
                    ctx.restore();
                }
            }
        ],
        options: {
            indexAxis: 'y',
            responsive: true,
            maintainAspectRatio: false,
            layout: {
                padding: {
                    right: 120
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
                            const value = context.parsed.x;
                            const index = context.dataIndex;
                            const variacao = variacoes[index];
                            
                            let tooltipText = 'Total: ' + formatarMoeda(value);
                            if (variacao !== null && variacao !== undefined && variacao !== 0) {
                                const variacaoText = variacao > 0 ? '+' + variacao.toFixed(1) : variacao.toFixed(1);
                                tooltipText += ' (' + variacaoText + '%)';
                            }
                            return tooltipText;
                        }
                    }
                }
            },
            scales: {
                x: {
                    display: false,
                    grid: {
                        display: false
                    },
                    beginAtZero: true
                },
                y: {
                    grid: {
                        display: false
                    },
                    ticks: {
                        color: '#374151',
                        font: {
                            size: 10,
                            weight: '500'
                        },
                        maxRotation: 0,
                        padding: 10
                    }
                }
            }
        }
    });
    
    // Atualizar controles de paginação
    atualizarControlesPaginacao();
}

function mudarPaginaRanking(novaPagina) {
    paginaAtualRanking = novaPagina;
    renderizarPaginaRanking();
}

function atualizarControlesPaginacao() {
    const totalPaginas = Math.ceil(todosVendedores.length / VENDEDORES_POR_PAGINA);
    
    const prevBtn = document.getElementById('prev-page-btn');
    const nextBtn = document.getElementById('next-page-btn');
    const paginationInfo = document.getElementById('pagination-info');
    const paginationContainer = document.getElementById('ranking-pagination');
    
    // Mostrar/esconder paginação
    if (paginationContainer) {
        if (totalPaginas <= 1) {
            paginationContainer.style.display = 'none';
        } else {
            paginationContainer.style.display = 'flex';
        }
    }
    
    // Atualizar botões
    if (prevBtn) {
        prevBtn.disabled = paginaAtualRanking === 1;
    }
    if (nextBtn) {
        nextBtn.disabled = paginaAtualRanking >= totalPaginas;
    }
    
    // Atualizar texto
    if (paginationInfo) {
        paginationInfo.textContent = `Página ${paginaAtualRanking} de ${totalPaginas}`;
    }
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
        
        // Handle ISO format with timezone (e.g., "2025-09-01T00:00:00Z")
        if (typeof dateStr === 'string' && dateStr.includes('T')) {
            // Extract just the date part before 'T' to avoid timezone conversion
            const datePart = dateStr.split('T')[0];
            if (/^\d{4}-\d{2}-\d{2}$/.test(datePart)) {
                const parts = datePart.split('-').map(Number);
                return new Date(parts[0], parts[1] - 1, parts[2]);
            }
        }
        
        // Handle simple YYYY-MM-DD format
        if (typeof dateStr === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
            const parts = dateStr.split('-').map(Number);
            return new Date(parts[0], parts[1] - 1, parts[2]);
        }
        
        // fallback
        return new Date(dateStr);
    }
    const dataObj = parseISODateToLocal(data);
    
    // Debug: log each date processing
    console.log('formatarDataGrafico:', {
        input: data,
        tipoPeriodo: tipoPeriodo,
        parsedDate: dataObj,
        month: dataObj.getMonth() + 1, // 1-based month for clarity
        year: dataObj.getFullYear()
    });
    
    if (tipoPeriodo === 'ano' || tipoPeriodo === 'trimestre') {
        // Para período anual e trimestral, mostrar apenas mês/ano
        const formatted = dataObj.toLocaleDateString('pt-BR', {
            month: 'short',
            year: 'numeric'
        });
        console.log('formatarDataGrafico result:', formatted);
        return formatted;
    } else {
        // Para outros períodos, mostrar dia/mês
        const formatted = dataObj.toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: '2-digit'
        });
        console.log('formatarDataGrafico result:', formatted);
        return formatted;
    }
}

// Atualizar gráfico de vendas acumuladas
function atualizarGraficoAcumulado(dadosGrafico, tipoPeriodo) {
    const ctx = document.getElementById('vendasAcumuladasChart').getContext('2d');

    // Destruir gráfico anterior se existir
    if (vendasAcumuladasChart) {
        vendasAcumuladasChart.destroy();
    }

    // Calcular valores acumulados
    let acumulado = 0;
    const dadosAcumulados = dadosGrafico.map(item => {
        acumulado += parseFloat(item.valor || 0);
        return {
            data: item.data,
            total: acumulado
        };
    });

    const labels = dadosAcumulados.map(item => formatarDataGrafico(item.data, tipoPeriodo));
    const data = dadosAcumulados.map(item => item.total);

    vendasAcumuladasChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Vendas Acumuladas',
                data: data,
                borderColor: '#f97316',
                backgroundColor: 'rgba(249, 115, 22, 0.1)',
                borderWidth: 3,
                fill: true,
                tension: 0.4,
                pointBackgroundColor: '#f97316',
                pointBorderColor: '#ffffff',
                pointBorderWidth: 2,
                pointRadius: 5,
                pointHoverRadius: 7
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
                        usePointStyle: true,
                        font: {
                            size: 12,
                            weight: 'bold'
                        }
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
                            return 'Acumulado: ' + formatarMoeda(context.parsed.y);
                        }
                    }
                }
            },
            scales: {
                x: {
                    grid: {
                        display: false
                    },
                    ticks: {
                        maxRotation: 45,
                        minRotation: 0,
                        font: {
                            size: 11
                        }
                    }
                },
                y: {
                    beginAtZero: true,
                    grid: {
                        color: 'rgba(0, 0, 0, 0.1)'
                    },
                    ticks: {
                        font: {
                            size: 11
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

// Função desabilitada - tela de loading removida
function mostrarLoading(mostrar) {
    // Não faz nada - loading removido do dashboard
    return;
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