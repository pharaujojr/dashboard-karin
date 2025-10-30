// Extensões para o Dashboard: Seleção múltipla de unidades e indicadores do vendedor

let unidadesSelecionadas = [];
let vendedorIndicadoresChart = null;

// Inicializar funcionalidades adicionais
document.addEventListener('DOMContentLoaded', function() {
    setTimeout(() => {
        inicializarDropdownUnidades();
        inicializarMonitorVendedor();
    }, 500);
});

// Inicializar dropdown de checkboxes para unidades
function inicializarDropdownUnidades() {
    const dropdownToggle = document.getElementById('dropdown-unidades-toggle');
    const dropdownMenu = document.getElementById('dropdown-unidades-menu');
    const checkboxTodas = document.getElementById('unidade-todas');
    
    if (!dropdownToggle || !dropdownMenu) {
        console.warn('Elementos do dropdown de unidades não encontrados');
        return;
    }
    
    // Toggle do dropdown
    dropdownToggle.addEventListener('click', function(e) {
        e.stopPropagation();
        dropdownMenu.classList.toggle('show');
        dropdownToggle.classList.toggle('active');
    });
    
    // Fechar dropdown ao clicar fora
    document.addEventListener('click', function(e) {
        if (!dropdownToggle.contains(e.target) && !dropdownMenu.contains(e.target)) {
            dropdownMenu.classList.remove('show');
            dropdownToggle.classList.remove('active');
        }
    });
    
    // Carregar unidades
    carregarUnidadesCheckbox();
    
    // Checkbox "Todas"
    if (checkboxTodas) {
        checkboxTodas.addEventListener('change', function() {
            const checkboxesUnidades = dropdownMenu.querySelectorAll('input[type="checkbox"]:not(#unidade-todas)');
            checkboxesUnidades.forEach(cb => {
                cb.checked = this.checked;
            });
            atualizarUnidadesSelecionadas();
        });
    }
}

// Carregar unidades como checkboxes
async function carregarUnidadesCheckbox() {
    try {
        const response = await fetch(`${API_BASE_URL}/filiais`);
        const filiais = await response.json();
        
        const container = document.getElementById('lista-unidades-checkbox');
        if (!container) return;
        
        container.innerHTML = '';
        
        filiais.forEach((filial, index) => {
            const div = document.createElement('div');
            div.className = 'checkbox-item';
            
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.id = `unidade-${index}`;
            checkbox.value = filial;
            checkbox.checked = true; // Todas selecionadas por padrão
            
            const label = document.createElement('label');
            label.htmlFor = `unidade-${index}`;
            label.textContent = filial;
            
            div.appendChild(checkbox);
            div.appendChild(label);
            container.appendChild(div);
            
            // Event listener para cada checkbox
            checkbox.addEventListener('change', function() {
                atualizarUnidadesSelecionadas();
            });
        });
        
        // Inicializar array de unidades selecionadas
        atualizarUnidadesSelecionadas();
        
    } catch (error) {
        console.error('Erro ao carregar unidades:', error);
    }
}

// Atualizar lista de unidades selecionadas
function atualizarUnidadesSelecionadas() {
    const dropdownMenu = document.getElementById('dropdown-unidades-menu');
    const checkboxTodas = document.getElementById('unidade-todas');
    const textoSelecionadas = document.getElementById('unidades-selecionadas-texto');
    
    if (!dropdownMenu) return;
    
    const checkboxes = dropdownMenu.querySelectorAll('input[type="checkbox"]:not(#unidade-todas)');
    unidadesSelecionadas = Array.from(checkboxes)
        .filter(cb => cb.checked)
        .map(cb => cb.value);
    
    // Atualizar checkbox "Todas"
    if (checkboxTodas) {
        checkboxTodas.checked = unidadesSelecionadas.length === checkboxes.length;
    }
    
    // Atualizar texto do botão
    if (textoSelecionadas) {
        if (unidadesSelecionadas.length === 0) {
            textoSelecionadas.textContent = 'Nenhuma unidade selecionada';
        } else if (unidadesSelecionadas.length === checkboxes.length) {
            textoSelecionadas.textContent = 'Todas as unidades';
        } else if (unidadesSelecionadas.length === 1) {
            textoSelecionadas.textContent = unidadesSelecionadas[0];
        } else {
            textoSelecionadas.textContent = `${unidadesSelecionadas.length} unidades selecionadas`;
        }
    }
    
    console.log('Unidades selecionadas:', unidadesSelecionadas);
}

// Obter unidades selecionadas (para uso na filtragem)
function obterUnidadesSelecionadas() {
    return unidadesSelecionadas;
}

// Inicializar monitoramento de seleção de vendedor
function inicializarMonitorVendedor() {
    const selectVendedor = document.getElementById('filtro-vendedor');
    if (!selectVendedor) return;
    
    selectVendedor.addEventListener('change', function() {
        const vendedorSelecionado = this.value;
        
        if (vendedorSelecionado) {
            // Vendedor específico selecionado - mostrar indicadores
            mostrarIndicadoresVendedor(vendedorSelecionado);
        } else {
            // "Todos os vendedores" - mostrar destaques
            mostrarDestaquesPeriodo();
        }
    });
}

// Mostrar seção de indicadores do vendedor
async function mostrarIndicadoresVendedor(vendedor) {
    const sectionDestaques = document.getElementById('section-destaques');
    const sectionVendedor = document.getElementById('section-vendedor');
    const vendedorNomeTitulo = document.getElementById('vendedor-nome-titulo');
    
    if (!sectionDestaques || !sectionVendedor) return;
    
    // Esconder destaques, mostrar indicadores
    sectionDestaques.classList.add('hidden');
    sectionVendedor.classList.remove('hidden');
    
    // Atualizar título
    if (vendedorNomeTitulo) {
        vendedorNomeTitulo.textContent = vendedor.toUpperCase();
    }
    
    // Carregar dados do vendedor
    await carregarIndicadoresVendedor(vendedor);
}

// Mostrar seção de destaques do período
function mostrarDestaquesPeriodo() {
    const sectionDestaques = document.getElementById('section-destaques');
    const sectionVendedor = document.getElementById('section-vendedor');
    
    if (!sectionDestaques || !sectionVendedor) return;
    
    // Mostrar destaques, esconder indicadores
    sectionDestaques.classList.remove('hidden');
    sectionVendedor.classList.add('hidden');
}

// Carregar indicadores do vendedor (ano, mês, semana)
async function carregarIndicadoresVendedor(vendedor) {
    try {
        const hoje = new Date();
        
        // Definir períodos
        const periodos = {
            ano: {
                inicio: new Date(hoje.getFullYear(), 0, 1),
                fim: new Date(hoje.getFullYear(), 11, 31)
            },
            mes: {
                inicio: new Date(hoje.getFullYear(), hoje.getMonth(), 1),
                fim: new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0)
            },
            semana: {
                inicio: new Date(hoje.setDate(hoje.getDate() - hoje.getDay())),
                fim: new Date(hoje.setDate(hoje.getDate() - hoje.getDay() + 6))
            }
        };
        
        // Buscar dados para cada período
        const dadosAno = await buscarDadosVendedor(vendedor, periodos.ano.inicio, periodos.ano.fim);
        const dadosMes = await buscarDadosVendedor(vendedor, periodos.mes.inicio, periodos.mes.fim);
        const dadosSemana = await buscarDadosVendedor(vendedor, periodos.semana.inicio, periodos.semana.fim);
        
        // Atualizar cards
        atualizarCardIndicador('vendedor-ano', dadosAno);
        atualizarCardIndicador('vendedor-mes', dadosMes);
        atualizarCardIndicador('vendedor-semana', dadosSemana);
        
        // Buscar dados dos últimos 12 meses para o gráfico
        const dadosUltimos12Meses = await buscarDadosUltimos12Meses(vendedor);
        
        // Atualizar gráfico com dados mensais
        atualizarGraficoIndicadores(dadosUltimos12Meses);
        
    } catch (error) {
        console.error('Erro ao carregar indicadores do vendedor:', error);
    }
}

// Buscar dados dos últimos 12 meses (ou menos se não houver)
async function buscarDadosUltimos12Meses(vendedor) {
    const hoje = new Date();
    const mesesDados = [];
    
    // Buscar dados de cada um dos últimos 12 meses
    for (let i = 11; i >= 0; i--) {
        const dataFim = new Date(hoje.getFullYear(), hoje.getMonth() - i + 1, 0); // Último dia do mês
        const dataInicio = new Date(hoje.getFullYear(), hoje.getMonth() - i, 1); // Primeiro dia do mês
        
        const dados = await buscarDadosVendedor(vendedor, dataInicio, dataFim);
        
        mesesDados.push({
            mes: dataInicio.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' }),
            mesCompleto: dataInicio.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }),
            totalVendas: dados.totalVendas,
            numeroVendas: dados.numeroVendas
        });
    }
    
    // Filtrar apenas meses com vendas (remover meses sem dados no início)
    const primeiroMesComVendas = mesesDados.findIndex(m => m.totalVendas > 0);
    if (primeiroMesComVendas > 0) {
        return mesesDados.slice(primeiroMesComVendas);
    }
    
    return mesesDados;
}

// Buscar dados do vendedor para um período específico
async function buscarDadosVendedor(vendedor, dataInicio, dataFim) {
    try {
        const params = new URLSearchParams({
            vendedor: vendedor,
            dataInicio: formatarDataISO(dataInicio),
            dataFim: formatarDataISO(dataFim),
            tipoPeriodo: 'personalizado'
        });
        
        // Adicionar unidades selecionadas
        const unidades = obterUnidadesSelecionadas();
        if (unidades && unidades.length > 0) {
            unidades.forEach(unidade => params.append('filial', unidade));
        }
        
        const response = await fetch(`${API_BASE_URL}/dashboard?${params}`);
        const dados = await response.json();
        
        return {
            totalVendas: dados.totalVendas || 0,
            numeroVendas: dados.numeroVendas || 0,
            ticketMedio: dados.ticketMedio || 0
        };
    } catch (error) {
        console.error('Erro ao buscar dados do vendedor:', error);
        return { totalVendas: 0, numeroVendas: 0, ticketMedio: 0 };
    }
}

// Atualizar card de indicador
function atualizarCardIndicador(prefixo, dados) {
    const elementoValor = document.getElementById(`${prefixo}-valor`);
    const elementoVendas = document.getElementById(`${prefixo}-vendas`);
    
    if (elementoValor) {
        elementoValor.textContent = formatarMoeda(dados.totalVendas);
    }
    
    if (elementoVendas) {
        const vendas = dados.numeroVendas || 0;
        elementoVendas.textContent = `${vendas} ${vendas === 1 ? 'venda' : 'vendas'}`;
    }
}

// Atualizar gráfico de indicadores - Últimos 12 meses
function atualizarGraficoIndicadores(dadosMensais) {
    const canvas = document.getElementById('vendedorIndicadoresChart');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    
    // Destruir gráfico anterior se existir
    if (vendedorIndicadoresChart) {
        vendedorIndicadoresChart.destroy();
    }
    
    // Preparar dados para o gráfico
    const labels = dadosMensais.map(m => m.mes);
    const valores = dadosMensais.map(m => m.totalVendas);
    const numeroVendas = dadosMensais.map(m => m.numeroVendas);
    
    vendedorIndicadoresChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Total de Vendas (R$)',
                data: valores,
                backgroundColor: 'rgba(30, 58, 138, 0.1)',
                borderColor: 'rgb(30, 58, 138)',
                borderWidth: 3,
                fill: true,
                tension: 0.4,
                pointBackgroundColor: 'rgb(30, 58, 138)',
                pointBorderColor: '#fff',
                pointBorderWidth: 2,
                pointRadius: 5,
                pointHoverRadius: 7
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    titleColor: '#ffffff',
                    bodyColor: '#ffffff',
                    borderColor: '#1e3a8a',
                    borderWidth: 1,
                    callbacks: {
                        title: function(context) {
                            const index = context[0].dataIndex;
                            return dadosMensais[index].mesCompleto;
                        },
                        label: function(context) {
                            const valor = context.parsed.y;
                            const index = context.dataIndex;
                            const vendas = numeroVendas[index];
                            return [
                                'Total: R$ ' + valor.toLocaleString('pt-BR', {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2
                                }),
                                'Vendas: ' + vendas
                            ];
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return 'R$ ' + value.toLocaleString('pt-BR', {
                                minimumFractionDigits: 0,
                                maximumFractionDigits: 0
                            });
                        },
                        color: '#64748b',
                        font: {
                            size: 11
                        }
                    },
                    grid: {
                        color: 'rgba(0, 0, 0, 0.05)'
                    }
                },
                x: {
                    ticks: {
                        color: '#64748b',
                        font: {
                            size: 10
                        }
                    },
                    grid: {
                        display: false
                    }
                }
            }
        }
    });
}

// Função auxiliar para formatar data em ISO
function formatarDataISO(data) {
    const ano = data.getFullYear();
    const mes = String(data.getMonth() + 1).padStart(2, '0');
    const dia = String(data.getDate()).padStart(2, '0');
    return `${ano}-${mes}-${dia}`;
}

// Função auxiliar para formatar moeda
function formatarMoeda(valor) {
    if (valor === null || valor === undefined) return 'R$ 0,00';
    return 'R$ ' + parseFloat(valor).toLocaleString('pt-BR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
}
