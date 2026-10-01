/* ====================== SELEÇÃO DE ELEMENTOS ====================== */
// Pegamos as referências dos elementos do HTML que vamos manipular.
const formulario = document.getElementById('formulario');
const campoDescricao = document.getElementById('descricao');
const campoValor = document.getElementById('valor');
const campoData = document.getElementById('data');
const mensagemErro = document.getElementById('mensagemErro');
const listaGastos = document.getElementById('listaGastos');
const totalGastoElemento = document.getElementById('totalGasto');
const quantidadeGastosElemento = document.getElementById('quantidadeGastos');
const campoFiltro = document.getElementById('filtroMes');

// Chave usada no localStorage para salvar os gastos.
const CHAVE_LOCAL_STORAGE = 'gastosAnalisador';

// Array que guarda todos os gastos em memória.
// Cada gasto tem: { id, descricao, valor, data }
let gastos = carregarGastosDoLocalStorage();

// Período selecionado no filtro.
// Valores possíveis: 'todos' | 'atual' | 'passado' | 'AAAA-MM' (mês específico)
let filtroAtual = 'todos';

/* ====================== FUNÇÕES AUXILIARES ====================== */

/**
 * Lê os gastos salvos no localStorage.
 * Se não houver nada salvo, retorna uma lista vazia.
 */
function carregarGastosDoLocalStorage() {
    const dados = localStorage.getItem(CHAVE_LOCAL_STORAGE);

    // Se não existir nada salvo, começamos com a lista vazia.
    if (!dados) {
        return [];
    }

    try {
        // Converte o texto JSON de volta para um array de objetos.
        const lista = JSON.parse(dados);
        return Array.isArray(lista) ? lista : [];
    } catch (erro) {
        // Se o dado salvo estiver corrompido, ignoramos e começamos do zero.
        return [];
    }
}

/**
 * Salva o array de gastos atual no localStorage.
 */
function salvarGastosNoLocalStorage() {
    // JSON.stringify transforma o array em texto para ser guardado.
    localStorage.setItem(CHAVE_LOCAL_STORAGE, JSON.stringify(gastos));
}

/**
 * Formata um valor numérico como moeda brasileira (R$ 1.234,56).
 */
function formatarMoeda(valor) {
    return valor.toLocaleString('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    });
}

/**
 * Formata uma data no padrão brasileiro (dia/mês/ano).
 * Recebe a data como "AAAA-MM-DD" (formato do campo date do HTML).
 */
function formatarData(dataIso) {
    // O campo date envia a data no formato "AAAA-MM-DD",
    // então já podemos mostrar na ordem dia/mês/ano.
    const partes = dataIso.split('-');
    if (partes.length !== 3) {
        return dataIso; // se o formato for inesperado, mostramos como está
    }
    return `${partes[2]}/${partes[1]}/${partes[0]}`;
}

/**
 * Exibe uma mensagem de erro na tela, com cor vermelha.
 */
function exibirErro(mensagem) {
    mensagemErro.textContent = mensagem;
    mensagemErro.hidden = false;
}

/**
 * Limpa a mensagem de erro da tela.
 */
function limparErro() {
    mensagemErro.textContent = '';
    mensagemErro.hidden = true;
}

/* ====================== FILTRO POR PERÍODO ====================== */

/**
 * Converte um objeto Date em texto "AAAA-MM" (ano-mês).
 */
function formarAnoMes(data) {
    const ano = data.getFullYear();
    const mes = String(data.getMonth() + 1).padStart(2, '0');
    return `${ano}-${mes}`;
}

/**
 * Retorna o "AAAA-MM" do mês atual.
 */
function anoMesAtual() {
    return formarAnoMes(new Date());
}

/**
 * Retorna o "AAAA-MM" do mês passado.
 */
function anoMesPassado() {
    const data = new Date();
    data.setDate(1); // evita problemas em meses com menos dias
    data.setMonth(data.getMonth() - 1);
    return formarAnoMes(data);
}

/**
 * Lista os meses que existem nos gastos salvos (ex.: "2026-08").
 * Remove duplicados e ordena do mais novo para o mais antigo.
 */
function mesesDisponiveis() {
    const meses = new Set();

    gastos.forEach((gasto) => {
        // Só considera gastos que possuem data preenchida.
        if (gasto.data) {
            meses.add(gasto.data.substring(0, 7)); // pega só ano e mês
        }
    });

    return Array.from(meses).sort().reverse();
}

/**
 * Retorna os gastos de acordo com o período selecionado no filtro.
 */
function obterGastosFiltrados() {
    // "Todos os meses": retorna a lista completa.
    if (filtroAtual === 'todos') {
        return gastos;
    }

    // Define qual "AAAA-MM" deve corresponder ao filtro.
    let anoMesFiltrado = filtroAtual;
    if (filtroAtual === 'atual') {
        anoMesFiltrado = anoMesAtual();
    } else if (filtroAtual === 'passado') {
        anoMesFiltrado = anoMesPassado();
    }

    // Mantém apenas os gastos cuja data começa com o "AAAA-MM" escolhido.
    return gastos.filter((gasto) => {
        return gasto.data && gasto.data.startsWith(anoMesFiltrado);
    });
}

/**
 * Atualiza as opções do seletor de período, adicionando
 * um item para cada mês que possui gastos cadastrados.
 */
function atualizarOpcoesFiltro() {
    // Guarda a seleção atual para não perder ao recarregar as opções.
    const selecaoAtual = campoFiltro.value;
    campoFiltro.innerHTML = '';

    // Opções fixas sempre disponíveis.
    const opcoesFixas = [
        { valor: 'todos', texto: 'Todos os meses' },
        { valor: 'atual', texto: 'Mês atual' },
        { valor: 'passado', texto: 'Mês passado' }
    ];

    opcoesFixas.forEach((opcao) => {
        const elemento = document.createElement('option');
        elemento.value = opcao.valor;
        elemento.textContent = opcao.texto;
        campoFiltro.appendChild(elemento);
    });

    // Separa os meses específicos do restante das opções.
    const meses = mesesDisponiveis();
    if (meses.length > 0) {
        const separador = document.createElement('option');
        separador.disabled = true;
        separador.textContent = '── Mês específico ──';
        campoFiltro.appendChild(separador);

        // Converte "AAAA-MM" em uma descrição legível, ex.: "Agosto de 2026".
        meses.forEach((mes) => {
            const elemento = document.createElement('option');
            elemento.value = mes;
            const [ano, mesNumero] = mes.split('-');
            const nomeMes = new Date(ano, Number(mesNumero) - 1, 1)
                .toLocaleDateString('pt-BR', { month: 'long' });
            elemento.textContent = `${nomeMes} de ${ano}`;
            campoFiltro.appendChild(elemento);
        });
    }

    // Restaura a seleção anterior (se ainda existir entre as opções).
    campoFiltro.value = [...opcoesFixas.map(o => o.valor), ...meses]
        .includes(selecaoAtual) ? selecaoAtual : 'todos';
}

/* ====================== RENDERIZAÇÃO ====================== */

/**
 * Atualiza o resumo (total gasto e quantidade de gastos).
 * Usa apenas os gastos do período selecionado no filtro.
 */
function atualizarResumo() {
    const gastosFiltrados = obterGastosFiltrados();

    // Calcula a soma de todos os valores com reduce.
    // Se a lista estiver vazia, o total é 0.
    const total = gastosFiltrados.reduce((soma, gasto) => soma + gasto.valor, 0);

    totalGastoElemento.textContent = formatarMoeda(total);
    quantidadeGastosElemento.textContent = gastosFiltrados.length;
}

/**
 * Cria um item (card) da lista de gastos no HTML.
 */
function criarItemGasto(gasto) {
    // Cria o <article> que representa um gasto na lista.
    const item = document.createElement('article');
    item.classList.add('item-gasto');

    // Bloco com descrição e data.
    const informacoes = document.createElement('div');
    informacoes.classList.add('informacoes');

    // Descrição do gasto.
    const descricao = document.createElement('span');
    descricao.classList.add('descricao');
    descricao.textContent = gasto.descricao;

    // Data do gasto (se existir).
    const data = document.createElement('span');
    data.classList.add('data');
    // Usa "?" para só mostrar a data quando ela foi preenchida.
    data.textContent = gasto.data ? formatarData(gasto.data) : 'Sem data';

    // Valor em destaque (vermelho).
    const valor = document.createElement('span');
    valor.classList.add('valor-item');
    valor.textContent = formatarMoeda(gasto.valor);

    // Botão de remover.
    const botaoRemover = document.createElement('button');
    botaoRemover.classList.add('botao-remover');
    botaoRemover.textContent = 'Remover';
    // Guarda o id do gasto para sabermos qual remover.
    botaoRemover.addEventListener('click', () => removerGasto(gasto.id));

    // Monta a estrutura do card.
    informacoes.appendChild(descricao);
    informacoes.appendChild(data);
    item.appendChild(informacoes);
    item.appendChild(valor);
    item.appendChild(botaoRemover);

    return item;
}

/**
 * Renderiza toda a lista de gastos na tela.
 * Mostra apenas os gastos do período selecionado.
 */
function renderizarLista() {
    // Limpa a lista antes de redesenhar.
    listaGastos.innerHTML = '';

    // Obtém apenas os gastos do período filtrado.
    const gastosFiltrados = obterGastosFiltrados();

    // Se não houver gastos, mostra uma mensagem simples.
    if (gastosFiltrados.length === 0) {
        const vazio = document.createElement('p');
        vazio.classList.add('lista-vazia');
        vazio.textContent = gastos.length === 0
            ? 'Nenhum gasto cadastrado ainda.'
            : 'Nenhum gasto encontrado para este período.';
        listaGastos.appendChild(vazio);
        return;
    }

    // Percorre todos os gastos filtrados e adiciona cada um na lista.
    gastosFiltrados.forEach((gasto) => {
        listaGastos.appendChild(criarItemGasto(gasto));
    });
}

/**
 * Renderiza tudo: filtro, resumo e lista de gastos.
 */
function renderizarTudo() {
    atualizarOpcoesFiltro();
    atualizarResumo();
    renderizarLista();
}

/* ====================== AÇÕES (ADICIONAR E REMOVER) ====================== */

/**
 * Adiciona um novo gasto à lista (vindo do formulário).
 */
function adicionarGasto(evento) {
    // Previne o comportamento padrão do formulário (recarregar a página).
    evento.preventDefault();

    // Lê os valores digitados.
    const descricao = campoDescricao.value.trim();
    const valor = parseFloat(campoValor.value);
    const data = campoData.value; // vazio "" quando não preenchido

    // VALIDAÇÃO:
    // 1) Descrição não pode ser vazia.
    if (!descricao) {
        exibirErro('Informe uma descrição para o gasto.');
        campoDescricao.focus();
        return;
    }

    // 2) Valor deve ser um número válido e maior que zero.
    if (isNaN(valor) || valor <= 0) {
        exibirErro('Informe um valor válido (maior que zero).');
        campoValor.focus();
        return;
    }

    // Se passou nas validações, cria o objeto do gasto.
    const novoGasto = {
        id: Date.now(), // número único baseado no relógio
        descricao,
        valor,
        data
    };

    // Adiciona no array de gastos.
    gastos.push(novoGasto);

    // Salva no localStorage para não perder ao recarregar a página.
    salvarGastosNoLocalStorage();

    // Atualiza a tela.
    renderizarTudo();

    // Limpa o formulário para facilitar o cadastro do próximo gasto.
    formulario.reset();
    limparErro();
    campoDescricao.focus();
}

/**
 * Remove um gasto pelo seu id.
 */
function removerGasto(id) {
    // Filtra a lista mantendo apenas os gastos com id diferente do recebido.
    gastos = gastos.filter((gasto) => gasto.id !== id);

    // Salva a lista atualizada no localStorage.
    salvarGastosNoLocalStorage();

    // Redesenha a tela (total e contagem são recalculados).
    renderizarTudo();
}

/* ====================== EVENTOS INICIAIS ====================== */

// Ao enviar o formulário, chamamos a função de adicionar gasto.
formulario.addEventListener('submit', adicionarGasto);

// Ao trocar o período no filtro, atualizamos resumo e lista.
campoFiltro.addEventListener('change', () => {
    filtroAtual = campoFiltro.value;
    renderizarTudo();
});

// Ao carregar a página, mostramos os gastos que já estavam salvos.
renderizarTudo();