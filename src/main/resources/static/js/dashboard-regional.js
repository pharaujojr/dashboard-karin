// Constantes
const API_BASE_URL = '/api';
// Período: 27/10/2025 a 31/10/2025
const DATA_INICIO = '2025-10-27';
const DATA_FIM = '2025-10-31';
const META_PADRAO = 1000000;

// Configuração de paginação
const UNIDADES_POR_PAGINA = 3;
const INTERVALO_PAGINACAO = 10000; // 10 segundos
let paginaAtual = 0;
let intervaloPaginacao = null;

// Configuração de paginação de vendedores
const VENDEDORES_POR_PAGINA = 10; // Número de vendedores visíveis por vez
let paginaAtualVendedores = 0;
let totalPaginasVendedores = 0;
let todosVendedores = [];
let intervaloRotacaoVendedores = null;

// Controle de atualização inteligente
const INTERVALO_ATUALIZACAO = 15000; // 15 segundos
let ultimosDados = {};

// Configuração das unidades
const UNIDADES_CONFIG = {
    jaragua: {
        nome: 'Jaraguá do Sul',
        filiais: ['Jaraguá do Sul'],
        meta: META_PADRAO
    },
    matoGrosso: {
        nome: 'Mato Grosso',
        filiais: ['Matupá', 'Sorriso', 'Lucas do Rio Verde', 'Sinop'],
        meta: META_PADRAO * 4
    },
    matupa: {
        nome: 'Matupá',
        filiais: ['Matupá'],
        meta: META_PADRAO
    },
    sorriso: {
        nome: 'Sorriso',
        filiais: ['Sorriso'],
        meta: META_PADRAO
    },
    lucas: {
        nome: 'Lucas do Rio Verde',
        filiais: ['Lucas do Rio Verde'],
        meta: META_PADRAO
    },
    sinop: {
        nome: 'Sinop',
        filiais: ['Sinop'],
        meta: META_PADRAO
    }
};

// Array com IDs das unidades individuais para paginação
const UNIDADES_INDIVIDUAIS = ['jaragua', 'matupa', 'sorriso', 'lucas', 'sinop'];

// Função para mostrar página específica
function mostrarPagina(numeroPagina) {
    const inicio = numeroPagina * UNIDADES_POR_PAGINA;
    const fim = inicio + UNIDADES_POR_PAGINA;
    
    UNIDADES_INDIVIDUAIS.forEach((unidadeId, index) => {
        const elemento = document.querySelector(`#unidade-${unidadeId}`);
        if (elemento) {
            if (index >= inicio && index < fim) {
                elemento.classList.remove('hidden');
            } else {
                elemento.classList.add('hidden');
            }
        }
    });
}

// Função para iniciar rotação automática
function iniciarRotacaoPaginas() {
    // Limpar intervalo existente se houver
    if (intervaloPaginacao) {
        clearInterval(intervaloPaginacao);
    }
    
    // Mostrar primeira página
    mostrarPagina(paginaAtual);
    
    // Configurar rotação automática
    intervaloPaginacao = setInterval(() => {
        const totalPaginas = Math.ceil(UNIDADES_INDIVIDUAIS.length / UNIDADES_POR_PAGINA);
        paginaAtual = (paginaAtual + 1) % totalPaginas;
        mostrarPagina(paginaAtual);
    }, INTERVALO_PAGINACAO);
}

// Inicialização
document.addEventListener('DOMContentLoaded', async () => {
    console.log('Dashboard Regional: DOM carregado');
    
    // Aguardar um pouco para garantir que tudo está pronto
    await new Promise(resolve => setTimeout(resolve, 100));
    
    await carregarDados();
    
    // Atualizar a cada 15 segundos
    setInterval(carregarDados, INTERVALO_ATUALIZACAO);
});

// Carregar dados
async function carregarDados() {
    console.log('=== Iniciando carregamento de dados ===');
    try {
        // Carregar dados de Jaraguá do Sul
        const dadosJaragua = await buscarDadosUnidade(['Jaraguá do Sul']);
        console.log('Dados Jaraguá:', dadosJaragua);
        
        // Verificar se os dados mudaram antes de atualizar
        if (dadosMudaram('jaragua', dadosJaragua)) {
            atualizarGaugePrincipal('jaragua', dadosJaragua, UNIDADES_CONFIG.jaragua.meta);
            atualizarGaugeUnidade('jaragua', dadosJaragua, UNIDADES_CONFIG.jaragua.meta);
            ultimosDados['jaragua'] = dadosJaragua;
        }
        
        // Carregar dados do Mato Grosso (agregado)
        const dadosMT = await buscarDadosUnidade(UNIDADES_CONFIG.matoGrosso.filiais);
        console.log('Dados Mato Grosso:', dadosMT);
        if (dadosMudaram('mt', dadosMT)) {
            atualizarGaugePrincipal('mt', dadosMT, UNIDADES_CONFIG.matoGrosso.meta);
            ultimosDados['mt'] = dadosMT;
        }
        
        // Carregar dados individuais de cada unidade do MT
        const dadosMatupa = await buscarDadosUnidade(['Matupá']);
        if (dadosMudaram('matupa', dadosMatupa)) {
            atualizarGaugeUnidade('matupa', dadosMatupa, UNIDADES_CONFIG.matupa.meta);
            ultimosDados['matupa'] = dadosMatupa;
        }
        
        const dadosSorriso = await buscarDadosUnidade(['Sorriso']);
        if (dadosMudaram('sorriso', dadosSorriso)) {
            atualizarGaugeUnidade('sorriso', dadosSorriso, UNIDADES_CONFIG.sorriso.meta);
            ultimosDados['sorriso'] = dadosSorriso;
        }
        
        const dadosLucas = await buscarDadosUnidade(['Lucas do Rio Verde']);
        if (dadosMudaram('lucas', dadosLucas)) {
            atualizarGaugeUnidade('lucas', dadosLucas, UNIDADES_CONFIG.lucas.meta);
            ultimosDados['lucas'] = dadosLucas;
        }
        
        const dadosSinop = await buscarDadosUnidade(['Sinop']);
        if (dadosMudaram('sinop', dadosSinop)) {
            atualizarGaugeUnidade('sinop', dadosSinop, UNIDADES_CONFIG.sinop.meta);
            ultimosDados['sinop'] = dadosSinop;
        }
        
        // Buscar top 10 vendedores de todas as filiais usando o endpoint correto
        const todasFiliais = ['Jaraguá do Sul', ...UNIDADES_CONFIG.matoGrosso.filiais];
        const vendedoresData = await buscarTopVendedoresCorreto(todasFiliais);
        if (dadosMudaram('topVendedores', vendedoresData)) {
            renderizarTopVendedoresGeral(vendedoresData);
            ultimosDados['topVendedores'] = vendedoresData;
        }
        
        console.log('=== Todos os dados carregados ===');
    } catch (error) {
        console.error('ERRO ao carregar dados:', error);
    }
}

// Verificar se os dados mudaram
function dadosMudaram(chave, novosDados) {
    if (!ultimosDados[chave]) {
        return true; // Primeira carga
    }
    
    const dadosAntigos = ultimosDados[chave];
    
    // Comparar objetos de forma simples
    return JSON.stringify(dadosAntigos) !== JSON.stringify(novosDados);
}

// Buscar dados de uma ou mais unidades
async function buscarDadosUnidade(filiais) {
    try {
        const params = new URLSearchParams({
            dataInicio: DATA_INICIO,
            dataFim: DATA_FIM,
            tipoPeriodo: 'personalizado'
        });
        
        filiais.forEach(filial => {
            params.append('filial', filial);
        });
        
        const url = `${API_BASE_URL}/dashboard?${params}`;
        console.log('Buscando:', url);
        
        const response = await fetch(url);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const dados = await response.json();
        
        return {
            totalVendas: dados.totalVendas || 0,
            numeroVendas: dados.numeroVendas || 0,
            ticketMedio: dados.ticketMedio || 0
        };
    } catch (error) {
        console.error('Erro ao buscar dados:', filiais, error);
        return {
            totalVendas: 0,
            numeroVendas: 0,
            ticketMedio: 0
        };
    }
}

// Atualizar gauge principal (grandes) - responsivo
function atualizarGaugePrincipal(id, dados, meta) {
    const percentual = (dados.totalVendas / meta) * 100;
    const percentualLimitado = Math.min(percentual, 110);
    
    // Atualizar valores de texto
    const elementoTotal = document.getElementById(`total-${id}`);
    const elementoMeta = document.getElementById(`meta-${id}`);
    
    if (elementoTotal) {
        elementoTotal.textContent = formatarMoeda(dados.totalVendas);
    }
    
    if (elementoMeta) {
        elementoMeta.textContent = formatarMoeda(meta);
    }
    
    // Desenhar gauge (200x140 - reduzido)
    const canvas = document.getElementById(`gauge-${id}`);
    if (canvas) {
        desenharGauge(canvas, percentualLimitado, 200, 140);
    }
}

// Atualizar gauge de unidade (pequenos) - responsivo
function atualizarGaugeUnidade(id, dados, meta) {
    const percentual = (dados.totalVendas / meta) * 100;
    const percentualLimitado = Math.min(percentual, 110);
    
    // Atualizar métricas
    const elementoVendas = document.getElementById(`vendas-${id}`);
    const elementoTicket = document.getElementById(`ticket-${id}`);
    const elementoTotal = document.getElementById(`total-unidade-${id}`);
    const elementoMeta = document.getElementById(`meta-unidade-${id}`);
    
    if (elementoVendas) {
        elementoVendas.textContent = dados.numeroVendas || 0;
    }
    
    if (elementoTicket) {
        elementoTicket.textContent = formatarMoeda(dados.ticketMedio);
    }
    
    if (elementoTotal) {
        elementoTotal.textContent = formatarMoeda(dados.totalVendas);
    }
    
    if (elementoMeta) {
        elementoMeta.textContent = 'Meta: ' + formatarMoeda(meta);
    }
    
    // Desenhar gauge (140x100 - reduzido)
    const canvas = document.getElementById(`gauge-unidade-${id}`);
    if (canvas) {
        desenharGauge(canvas, percentualLimitado, 140, 100);
    }
}

// Buscar top 10 vendedores usando o endpoint correto /api/dashboard
async function buscarTopVendedoresCorreto(filiais) {
    try {
        const params = new URLSearchParams({
            dataInicio: DATA_INICIO,
            dataFim: DATA_FIM,
            tipoPeriodo: 'personalizado'
        });
        
        // Adicionar todas as filiais
        filiais.forEach(filial => {
            params.append('filial', filial);
        });
        
        const response = await fetch(`${API_BASE_URL}/dashboard?${params}`);
        const dados = await response.json();
        
        console.log('Top vendedores recebidos:', dados.top10Vendedores);
        
        return dados.top10Vendedores || [];
    } catch (error) {
        console.error('Erro ao buscar top vendedores:', error);
        return [];
    }
}

// Renderiza o ranking geral de vendedores com paginação
function renderizarTopVendedoresGeral(vendedores) {
    const chartContainer = document.getElementById('vendedores-chart');
    
    if (!vendedores || vendedores.length === 0) {
        chartContainer.innerHTML = '<p style="text-align: center; color: rgba(255,255,255,0.5); font-size: 12px;">Nenhum dado disponível</p>';
        todosVendedores = [];
        totalPaginasVendedores = 0;
        pararRotacaoVendedores();
        return;
    }

    todosVendedores = vendedores;
    totalPaginasVendedores = Math.ceil(vendedores.length / VENDEDORES_POR_PAGINA);
    
    // Se tem mais de uma página, inicia a rotação
    if (totalPaginasVendedores > 1) {
        iniciarRotacaoVendedores();
    } else {
        pararRotacaoVendedores();
    }
    
    mostrarPaginaVendedores();
}

// Mostra uma página específica de vendedores
function mostrarPaginaVendedores() {
    const chartContainer = document.getElementById('vendedores-chart');
    const inicio = paginaAtualVendedores * VENDEDORES_POR_PAGINA;
    const fim = Math.min(inicio + VENDEDORES_POR_PAGINA, todosVendedores.length);
    const vendedoresPagina = todosVendedores.slice(inicio, fim);
    
    const maxVendas = Math.max(...todosVendedores.map(v => v.totalVendas));
    
    chartContainer.innerHTML = vendedoresPagina.map((vendedor, index) => {
        const posicaoReal = inicio + index + 1;
        const percentual = maxVendas > 0 ? (vendedor.totalVendas / maxVendas * 100) : 0;
        return `
            <div class="vendedor-item">
                <div class="vendedor-posicao">${posicaoReal}º</div>
                <div class="vendedor-nome">${(vendedor.nome || 'N/A').toUpperCase()}</div>
                <div class="vendedor-barra-container">
                    <div class="vendedor-barra" style="width: ${percentual}%"></div>
                </div>
                <div class="vendedor-valor">R$ ${vendedor.totalVendas.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</div>
            </div>
        `;
    }).join('');
}

// Inicia a rotação automática das páginas de vendedores
function iniciarRotacaoVendedores() {
    pararRotacaoVendedores();
    intervaloRotacaoVendedores = setInterval(() => {
        paginaAtualVendedores = (paginaAtualVendedores + 1) % totalPaginasVendedores;
        mostrarPaginaVendedores();
    }, INTERVALO_PAGINACAO);
}

// Para a rotação de vendedores
function pararRotacaoVendedores() {
    if (intervaloRotacaoVendedores) {
        clearInterval(intervaloRotacaoVendedores);
        intervaloRotacaoVendedores = null;
    }
}

// Desenhar gauge no canvas
function desenharGauge(canvas, percentual, width, height) {
    const ctx = canvas.getContext('2d');
    
    // Ajustar tamanho do canvas
    canvas.width = width;
    canvas.height = height;
    
    const centerX = width / 2;
    const centerY = height * 0.75;
    const radius = Math.min(width, height) * 0.35;
    const startAngle = Math.PI * 0.75;
    const endAngle = Math.PI * 2.25;
    const totalAngle = endAngle - startAngle;
    
    // Limpar canvas
    ctx.clearRect(0, 0, width, height);
    
    // Desenhar arco colorido de fundo (0% a 110%)
    const segments = 110;
    for (let i = 0; i < segments; i++) {
        const segmentPercent = i;
        const angle = startAngle + (totalAngle * (segmentPercent / 110));
        const nextAngle = startAngle + (totalAngle * ((segmentPercent + 1) / 110));
        
        let color;
        if (segmentPercent < 20) {
            color = '#dc2626';
        } else if (segmentPercent < 40) {
            color = '#ef4444';
        } else if (segmentPercent < 60) {
            color = '#f59e0b';
        } else if (segmentPercent < 80) {
            color = '#fbbf24';
        } else if (segmentPercent < 100) {
            color = '#84cc16';
        } else {
            color = '#10b981';
        }
        
        ctx.strokeStyle = color;
        ctx.lineWidth = 20; // Largura fixa de 20px para todos os tamanhos
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, angle, nextAngle);
        ctx.stroke();
    }
    
    // Desenhar marcações
    ctx.strokeStyle = '#ffffff';
    ctx.fillStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.font = `bold ${width > 250 ? 12 : 10}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    for (let i = 0; i <= 100; i += 20) {
        const angle = startAngle + (totalAngle * (i / 110));
        
        const innerX = centerX + Math.cos(angle) * (radius - (width > 250 ? 15 : 12));
        const innerY = centerY + Math.sin(angle) * (radius - (width > 250 ? 15 : 12));
        const outerX = centerX + Math.cos(angle) * (radius + 5);
        const outerY = centerY + Math.sin(angle) * (radius + 5);
        
        ctx.beginPath();
        ctx.moveTo(innerX, innerY);
        ctx.lineTo(outerX, outerY);
        ctx.stroke();
        
        const textX = centerX + Math.cos(angle) * (radius + (width > 250 ? 18 : 15));
        const textY = centerY + Math.sin(angle) * (radius + (width > 250 ? 18 : 15));
        ctx.fillText(i + '%', textX, textY);
    }
    
    // Desenhar ponteiro
    const needleAngle = startAngle + (totalAngle * (percentual / 110));
    const needleLength = radius - 5;
    const needleWidth = width > 250 ? 10 : 8;
    
    ctx.save();
    ctx.translate(centerX, centerY);
    ctx.rotate(needleAngle);
    
    ctx.fillStyle = '#000000';
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(needleLength, 0);
    ctx.lineTo(-10, -needleWidth / 2);
    ctx.lineTo(-10, needleWidth / 2);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    
    ctx.restore();
    
    // Círculo central
    ctx.fillStyle = '#000000';
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(centerX, centerY, 10, 0, 2 * Math.PI); // Tamanho fixo
    ctx.fill();
    ctx.stroke();
    
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(centerX, centerY, 4, 0, 2 * Math.PI); // Tamanho fixo
    ctx.fill();
}

// Formatar moeda
function formatarMoeda(valor) {
    if (valor === null || valor === undefined) return 'R$ 0,00';
    return 'R$ ' + parseFloat(valor).toLocaleString('pt-BR', { 
        minimumFractionDigits: 2, 
        maximumFractionDigits: 2 
    });
}

// Formatar data de yyyy-MM-dd para dd/MM/yyyy
function formatarData(dataStr) {
    const [ano, mes, dia] = dataStr.split('-');
    return `${dia}/${mes}/${ano}`;
}

// Inicializar quando o DOM carregar
document.addEventListener('DOMContentLoaded', () => {
    carregarDados();
    
    // Iniciar rotação de páginas
    iniciarRotacaoPaginas();
});
