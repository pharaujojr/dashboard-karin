// ====================================================================
// Dashboard de Bonés - Análise de vendas com bone='SIM'
// ====================================================================
// Este dashboard analisa vendas apenas das filiais:
// - Sorriso
// - Lucas do Rio Verde  
// - Sinop
// Todos os dados são filtrados automaticamente para bone='SIM'
// ====================================================================

// Variáveis globais
let vendasChart;
let vendasAcumuladasChart;
let topVendedoresChart;
let autoRefreshInterval;
const API_BASE_URL = '/bone/api';
const REFRESH_INTERVAL = 15000; // 15 segundos em milissegundos
let ultimosDados = null; // Cache dos últimos dados recebidos
let ultimosFiltros = null; // Cache dos filtros usados na última requisição

// Variáveis de paginação do ranking
let todosVendedores = []; // Todos os vendedores
let paginaAtualRanking = 1;
let tipoPeriodoAtual = 'dia'; // Tipo de período atual (para controlar comparativos)
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

    // Dashboard de bonés: sem filtros, carrega automaticamente com data do dia
    
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

// Dashboard de bonés não carrega filtros (sem seção de filtros na UI)
async function carregarFiltros() {
    try {
        // Nota: Função mantida para compatibilidade, mas não carrega filtros
        console.log('Dashboard de bonés: sem filtros de vendedor');
    } catch (error) {
        console.error('Erro ao carregar filtros:', error);
        mostrarNotificacao('Erro ao carregar filtros', 'error');
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

    // Dashboard de bonés: período fixo da competição (19/11/2025 até 31/12/2025)
    const dataInicio = '2025-11-19';
    const dataFim = '2025-12-31';
    const vendedor = null; // Sem filtro de vendedor
    const tipoPeriodo = 'personalizado'; // Período personalizado fixo

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

        // Dashboard de bonés não precisa de filtro de unidade
        // As filiais Sorriso, Lucas do Rio Verde e Sinop são fixas no backend
        
        // Criar objeto com filtros atuais para comparação
        const filtrosAtuais = {
            vendedor: vendedor || '',
            dataInicio: dataInicio,
            dataFim: dataFim,
            tipoPeriodo: tipoPeriodo
        };
        
        if (vendedor) params.append('vendedor', vendedor);
        
        // Enviar tipo de período para cálculo de comparação
        // Se for personalizado, enviar 'dia' como padrão para cálculos
        const tipoPeriodoParam = (tipoPeriodo && tipoPeriodo !== 'personalizado') ? tipoPeriodo : 'dia';
        params.append('periodo', tipoPeriodoParam);

        const url = `${API_BASE_URL}/dados?${params}`;
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
function atualizarComparacao(elementoId, variacao, tipoPeriodo) {
    const elemento = document.getElementById(elementoId);
    if (!elemento) return;
    
    // Ocultar comparativo se período for personalizado
    if (tipoPeriodo === 'personalizado') {
        elemento.classList.add('hidden');
        return;
    }
    
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

    // Renderizar pódios (se foram retornados)
    function renderPodiumVendedores(podium) {
        if (!podium || !Array.isArray(podium)) return;
        // Expecting up to 3 items with {posicao, nome, total, filial}
        podium.forEach(item => {
            const pos = item.posicao;
            const el = document.getElementById(`podium-${pos}`);
            if (el) {
                const nomeEl = el.querySelector('.podium-nome');
                const filialEl = el.querySelector('.podium-filial');
                const totalEl = el.querySelector('.podium-total');
                if (nomeEl) nomeEl.textContent = (item.nome || '-').toUpperCase();
                if (filialEl) filialEl.textContent = (item.filial || '-');
                if (totalEl) totalEl.textContent = formatarMoeda(item.total || 0);
            }
        });
    }

    function renderPodiumUnidades(podiumUnidades) {
        if (!podiumUnidades || !Array.isArray(podiumUnidades)) return;
        
        // Função para formatar nome da equipe
        function formatarNomeEquipe(filial) {
            const filialUpper = (filial || '').toUpperCase();
            
            if (filialUpper.includes('LUCAS')) {
                return 'TEAM LUCAS';
            } else if (filialUpper.includes('SORRISO')) {
                return 'TEAM SORRISO';
            } else if (filialUpper.includes('SINOP')) {
                return 'TEAM SINOP';
            }
            return 'TEAM ' + filial;
        }
        
        podiumUnidades.forEach(item => {
            const pos = item.posicao;
            const el = document.getElementById(`podium-unit-${pos}`);
            if (el) {
                const nomeEl = el.querySelector('.podium-nome');
                const totalEl = el.querySelector('.podium-total');
                if (nomeEl) nomeEl.textContent = formatarNomeEquipe(item.filial || '-');
                if (totalEl) totalEl.textContent = formatarMoeda(item.total || 0);
            }
        });
    }

    if (dados.podiumVendedores) {
        renderPodiumVendedores(dados.podiumVendedores);
    }
    if (dados.podiumUnidades) {
        renderPodiumUnidades(dados.podiumUnidades);
    }

    // Atualizar tabela de classificação apenas se mudou (todos os vendedores)
    if (topVendedoresMudou) {
        console.log('[DASHBOARD] Top vendedores mudaram, redesenhando tabela...');
        atualizarTabelaClassificacao(dados.top10Vendedores || [], tipoPeriodo);
    } else {
        console.log('[DASHBOARD] Top vendedores NÃO mudaram, mantendo tabela');
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

// Nota: Gráfico diário/agregado removido para o dashboard de bonés conforme requisitos


// Atualizar lista de vendedores com scroll horizontal (estilo dashboard principal)
function atualizarTabelaClassificacao(vendedores) {
    const container = document.getElementById('top-vendedores-grid');
    if (!container) return;
    
    // Limpar container
    container.innerHTML = '';
    
    // Se não houver vendedores, mostrar mensagem
    if (!vendedores || vendedores.length === 0) {
        container.innerHTML = '<div style="text-align: center; padding: 2rem; color: #cccccc; width: 100%;">Nenhum dado disponível</div>';
        return;
    }
    
    // Calcular total do 1º lugar para gaps
    const primeiroTotal = vendedores.length > 0 ? (parseFloat(vendedores[0].total) || 0) : 0;
    
    // Função para formatar nome da equipe
    function formatarEquipe(filial) {
        const filialUpper = (filial || '').toUpperCase();
        
        if (filialUpper.includes('LUCAS')) {
            return 'TEAM LUCAS';
        } else if (filialUpper.includes('SORRISO')) {
            return 'TEAM SORRISO';
        } else if (filialUpper.includes('SINOP')) {
            return 'TEAM SINOP';
        }
        return 'TEAM ' + (filial || 'N/A');
    }
    
    // Renderizar cada vendedor como card
    vendedores.forEach((vendedor, index) => {
        const posicao = index + 1;
        const nome = vendedor.nome ? vendedor.nome.toUpperCase() : 'SEM NOME';
        const total = parseFloat(vendedor.total) || 0;
        const filial = vendedor.filial || 'Não informada';
        
        // Calcular diferença para o 1º
        const gap = primeiroTotal - total;
        
        // Criar card
        const card = document.createElement('div');
        card.className = 'vendedor-card';
        if (posicao === 1) card.classList.add('primeiro-lugar');
        
        card.innerHTML = `
            <div class="vendedor-posicao ${posicao === 1 ? 'pos-primeiro' : 'pos-outro'}">
                ${posicao}º
            </div>
            <div class="vendedor-info">
                <div class="vendedor-nome">${nome}</div>
                <div class="vendedor-equipe">${formatarEquipe(filial)}</div>
            </div>
            <div class="vendedor-stats">
                <div class="vendedor-total">${formatarMoeda(total)}</div>
            </div>
        `;
        
        container.appendChild(card);

        // Deterministic grid placement: cada coluna tem um par (col = ceil(pos/2))
        try {
            const col = Math.ceil(posicao / 2);
            // ímpares na linha de baixo (2), pares na linha de cima (1)
            const row = (posicao % 2 === 1) ? 2 : 1;
            card.style.gridColumn = String(col);
            card.style.gridRow = String(row);

            // Depth and offset: compute X offset proportionally using computed grid column width
            let offsetX = 0;
            let offsetY = 0;
            let z = 4;

            try {
                const cs = window.getComputedStyle(container);
                // grid-auto-columns can be like '260px' or '16rem'
                const gridAutoCols = cs.getPropertyValue('grid-auto-columns') || '220px';
                const gapFull = cs.getPropertyValue('gap') || cs.getPropertyValue('grid-gap') || '0px 16px';
                const colGap = (gapFull.split(/\s+/)[1]) || gapFull.split(/\s+/)[0];

                function toPx(value) {
                    if (!value) return 220;
                    value = value.trim();
                    if (value.endsWith('px')) return parseFloat(value);
                    if (value.endsWith('rem')) {
                        const root = parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;
                        return parseFloat(value) * root;
                    }
                    if (value.endsWith('%')) return 0; // not expected
                    return parseFloat(value) || 220;
                }

                const colWidthPx = toPx(gridAutoCols);
                const gapPx = toPx(colGap);

                // compute offsets proportional to column width so layout scales in fullscreen
                const baseTopOffset = Math.round(colWidthPx / 2); // top row starts at half the bottom card width
                const colIncrement = Math.max(20, Math.round(colWidthPx * 0.12)); // bigger extra shift per column to avoid overlap

                if (posicao === 1) {
                    offsetY = 6; // same as bottom items
                    z = 7;
                    card.style.gridColumn = '1';
                    card.style.gridRow = '2';
                } else if (posicao % 2 === 0) {
                    // top row: visually start half-column to the right of first bottom card
                    offsetY = -12;
                    z = 6;
                    card.classList.add('top-row');
                } else {
                    offsetY = 6;
                    z = 4;
                }

                // Apply X offset on the card itself (not on inner content) so the whole card shifts
                // X offset proportional to column to avoid overlap in fullscreen
                const offsetXCard = (posicao % 2 === 0)
                    ? baseTopOffset + (col - 1) * colIncrement
                    : (col - 1) * colIncrement;

                card.style.transform = `translate(${offsetXCard}px, ${offsetY}px)`;
                card.style.zIndex = String(z);
            } catch (err) {
                // fallback to prior simple offsets
                if (posicao === 1) {
                    card.style.transform = 'translate(0px, 6px)';
                    card.style.zIndex = '7';
                    card.style.gridColumn = '1';
                    card.style.gridRow = '2';
                } else if (posicao % 2 === 0) {
                    card.style.transform = 'translate(12px, -12px)';
                    card.style.zIndex = '6';
                } else {
                    card.style.transform = 'translate(0px, 6px)';
                    card.style.zIndex = '4';
                }
            }
        } catch (e) {
            // Não bloquear render caso algo dê errado
            console.warn('Erro ao posicionar card na grid:', e);
        }
    });
    
    // Transformar container em grid de largada e configurar botões de scroll
    container.classList.add('starting-grid');
    configurarScrollVendedores();
}

// Configurar scroll horizontal para vendedores
function configurarScrollVendedores() {
    const container = document.getElementById('top-vendedores-grid');
    const btnLeft = document.getElementById('scroll-left-vendedores');
    const btnRight = document.getElementById('scroll-right-vendedores');
    
    if (!container || !btnLeft || !btnRight) return;
    
    // Verificar se precisa de scroll
    function atualizarBotoesScroll() {
        const scrollLeft = container.scrollLeft;
        const scrollWidth = container.scrollWidth;
        const clientWidth = container.clientWidth;
        
        // Desabilitar botão esquerdo se estiver no início
        if (scrollLeft <= 0) {
            btnLeft.style.opacity = '0.3';
            btnLeft.style.pointerEvents = 'none';
        } else {
            btnLeft.style.opacity = '1';
            btnLeft.style.pointerEvents = 'auto';
        }
        
        // Desabilitar botão direito se estiver no fim
        if (scrollLeft + clientWidth >= scrollWidth - 10) {
            btnRight.style.opacity = '0.3';
            btnRight.style.pointerEvents = 'none';
        } else {
            btnRight.style.opacity = '1';
            btnRight.style.pointerEvents = 'auto';
        }
        
        // Esconder botões se não houver scroll
        if (scrollWidth <= clientWidth) {
            btnLeft.style.display = 'none';
            btnRight.style.display = 'none';
        } else {
            btnLeft.style.display = 'flex';
            btnRight.style.display = 'flex';
        }
    }
    
    // Scroll suave
    function scrollSuave(direcao) {
        const scrollAmount = container.clientWidth * 0.8;
        container.scrollBy({
            left: direcao * scrollAmount,
            behavior: 'smooth'
        });
    }
    
    // Event listeners
    btnLeft.onclick = () => scrollSuave(-1);
    btnRight.onclick = () => scrollSuave(1);
    container.addEventListener('scroll', atualizarBotoesScroll);
    
    // Atualizar estado inicial
    atualizarBotoesScroll();
}

// Funções antigas de gráfico removidas (não são mais necessárias)
function atualizarGraficoTopVendedores(topVendedores, tipoPeriodo) {
    // Função obsoleta - mantida para compatibilidade mas não faz nada
    console.log('Função de gráfico obsoleta - usando lista scrollável F1');
}

function renderizarPaginaRanking() {
    // Função obsoleta - mantida para compatibilidade mas não faz nada
    console.log('Paginação obsoleta - lista scrollável mostra todos');
}

function mudarPaginaRanking(novaPagina) {
    // Função obsoleta - mantida para compatibilidade mas não faz nada
    console.log('Paginação obsoleta - tabela F1 mostra todos');
}

function atualizarControlesPaginacao() {
    // Função obsoleta - mantida para compatibilidade mas não faz nada
    console.log('Paginação obsoleta - tabela F1 mostra todos');
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

// Nota: Gráfico acumulado removido para o dashboard de bonés conforme requisitos

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