/* ============================================
   LANDING ÓLEOS ESSENCIAIS — FERNANDA DELGADO
   JavaScript puro: catálogo, carrinho, CEP, PIX
   ============================================ */

// ---------- ESTADO GLOBAL ----------
const estado = {
    produtos: [],
    carrinho: {},           // { id: quantidade }
    config: {},             // whatsapp, instagram, pix, titular
    pedidoId: null,
    dadosPedido: null
};

// ---------- UTILITÁRIOS ----------
const formatarPreco = (valor) =>
    valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

const formatarTelefone = (valor) => {
    valor = valor.replace(/\D/g, '').slice(0, 11);
    if (valor.length <= 10) {
        return valor.replace(/(\d{2})(\d{0,4})(\d{0,4}).*/, (_, ddd, p1, p2) => {
            let out = `(${ddd})`;
            if (p1) out += ` ${p1}`;
            if (p2) out += `-${p2}`;
            return out;
        });
    }
    return valor.replace(/(\d{2})(\d{0,5})(\d{0,4}).*/, (_, ddd, p1, p2) => {
        let out = `(${ddd})`;
        if (p1) out += ` ${p1}`;
        if (p2) out += `-${p2}`;
        return out;
    });
};

const formatarCEP = (valor) => {
    valor = valor.replace(/\D/g, '').slice(0, 8);
    return valor.replace(/(\d{5})(\d)/, '$1-$2');
};

const mostrarToast = (mensagem) => {
    const toast = document.getElementById('toast');
    toast.textContent = mensagem;
    toast.hidden = false;
    setTimeout(() => toast.classList.add('toast--visivel'), 10);
    setTimeout(() => {
        toast.classList.remove('toast--visivel');
        setTimeout(() => toast.hidden = true, 300);
    }, 2500);
};

// ---------- CARREGAR PRODUTOS ----------
async function carregarProdutos() {
    try {
        const response = await fetch('produtos.json');
        if (!response.ok) throw new Error('Erro ao carregar produtos');
        const data = await response.json();
        estado.produtos = data.produtos || [];
        estado.config = {
            whatsapp: data.whatsapp_suporte,
            instagram: data.instagram,
            pix: data.chave_pix,
            titular: data.titular_pix,
            cidade: data.cidade_envio
        };
        renderizarCatalogo();
    } catch (erro) {
        console.error('Erro:', erro);
        document.getElementById('catalogo-grid').innerHTML =
            '<p style="text-align:center; padding:3rem; color:#7D822E;">⚠️ Erro ao carregar o catálogo. Recarregue a página.</p>';
    }
}

// ---------- RENDERIZAR CATÁLOGO ----------
function renderizarCatalogo() {
    const grid = document.getElementById('catalogo-grid');
    grid.innerHTML = '';

    estado.produtos.forEach(produto => {
        const card = document.createElement('article');
        card.className = 'produto';
        card.innerHTML = `
            <div class="produto__imagem">
                <img src="${produto.imagem}" alt="${produto.nome} ${produto.tamanho}" loading="lazy">
            </div>
            <div class="produto__info">
                <p class="produto__categoria">${produto.categoria}</p>
                <h3 class="produto__nome">${produto.nome}</h3>
                <p class="produto__tamanho">${produto.tamanho}${produto.nome_pt && produto.nome_pt !== produto.nome ? ' · ' + produto.nome_pt : ''}</p>
                <p class="produto__descricao">${produto.descricao_curta}</p>
                <p class="produto__preco">${formatarPreco(produto.preco)}</p>
                <div class="produto__acoes">
                    <div class="produto__quantidade">
                        <button type="button" onclick="alterarQuantidade('${produto.id}', -1)" aria-label="Diminuir">−</button>
                        <span id="qtd-${produto.id}">0</span>
                        <button type="button" onclick="alterarQuantidade('${produto.id}', 1)" aria-label="Aumentar">+</button>
                    </div>
                    <button type="button" class="produto__adicionar" id="btn-${produto.id}" onclick="adicionarAoCarrinho('${produto.id}')">
                        Adicionar
                    </button>
                </div>
            </div>
        `;
        grid.appendChild(card);
    });
}

// ---------- CARRINHO ----------
function alterarQuantidade(id, delta) {
    if (!estado.carrinho[id]) estado.carrinho[id] = 0;
    estado.carrinho[id] = Math.max(0, estado.carrinho[id] + delta);
    document.getElementById(`qtd-${id}`).textContent = estado.carrinho[id];
    atualizarBotao(id);
}

function adicionarAoCarrinho(id) {
    estado.carrinho[id] = (estado.carrinho[id] || 0) + 1;
    document.getElementById(`qtd-${id}`).textContent = estado.carrinho[id];
    atualizarBotao(id, true);
    atualizarResumoCarrinho();
    mostrarToast('Adicionado ao carrinho ✓');
}

function atualizarBotao(id, adicionado = false) {
    const btn = document.getElementById(`btn-${id}`);
    const qtd = estado.carrinho[id] || 0;
    if (adicionado || qtd > 0) {
        btn.textContent = qtd > 0 ? `Adicionado (${qtd})` : 'Adicionar';
        btn.classList.add('produto__adicionado');
    } else {
        btn.textContent = 'Adicionar';
        btn.classList.remove('produto__adicionado');
    }
}

function atualizarResumoCarrinho() {
    const lista = document.getElementById('carrinho-lista');
    const totalEl = document.getElementById('carrinho-total');

    const itens = Object.entries(estado.carrinho).filter(([_, qtd]) => qtd > 0);

    if (itens.length === 0) {
        lista.innerHTML = '<li class="carrinho-resumo__vazio">Seu carrinho está vazio. Adicione óleos acima. 🌿</li>';
        totalEl.textContent = formatarPreco(0);
        return;
    }

    let total = 0;
    lista.innerHTML = itens.map(([id, qtd]) => {
        const produto = estado.produtos.find(p => p.id === id);
        if (!produto) return '';
        const subtotal = produto.preco * qtd;
        total += subtotal;
        return `
            <li class="carrinho-resumo__item">
                <span class="carrinho-resumo__item-nome">${produto.nome} <span class="carrinho-resumo__item-qtd">${produto.tamanho} · ${qtd}x</span></span>
                <span class="carrinho-resumo__item-preco">${formatarPreco(subtotal)}</span>
            </li>
        `;
    }).join('');

    totalEl.textContent = formatarPreco(total);
}

function calcularTotal() {
    return Object.entries(estado.carrinho).reduce((acc, [id, qtd]) => {
        const produto = estado.produtos.find(p => p.id === id);
        return acc + (produto ? produto.preco * qtd : 0);
    }, 0);
}

// ---------- AUTOCOMPLETE CEP (ViaCEP) ----------
async function buscarCEP(cep) {
    cep = cep.replace(/\D/g, '');
    if (cep.length !== 8) return;

    const campos = ['endereco', 'bairro', 'cidade', 'estado'];
    campos.forEach(id => document.getElementById(id).value = '...');

    try {
        const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
        const data = await response.json();

        if (data.erro) {
            mostrarToast('CEP não encontrado');
            campos.forEach(id => document.getElementById(id).value = '');
            return;
        }

        document.getElementById('endereco').value = data.logradouro || '';
        document.getElementById('bairro').value = data.bairro || '';
        document.getElementById('cidade').value = data.localidade || '';
        document.getElementById('estado').value = data.uf || '';
        document.getElementById('numero').focus();
    } catch (erro) {
        console.error('Erro CEP:', erro);
        mostrarToast('Erro ao buscar CEP');
    }
}

// ---------- SUBMIT DO FORMULÁRIO ----------
async function enviarPedido(evento) {
    evento.preventDefault();

    const itens = Object.entries(estado.carrinho).filter(([_, qtd]) => qtd > 0);
    if (itens.length === 0) {
        mostrarToast('Adicione pelo menos um óleo ao carrinho');
        document.getElementById('catalogo').scrollIntoView({ behavior: 'smooth' });
        return;
    }

    const form = evento.target;
    const botao = document.getElementById('botao-finalizar');
    botao.disabled = true;
    botao.textContent = 'Enviando...';

    const dados = {
        nome: form.nome.value.trim(),
        telefone: form.telefone.value.trim(),
        cep: form.cep.value.trim(),
        endereco: `${form.endereco.value.trim()}, ${form.numero.value.trim()}${form.complemento.value.trim() ? ' - ' + form.complemento.value.trim() : ''}`,
        bairro: form.bairro.value.trim(),
        cidade: form.cidade.value.trim(),
        estado: form.estado.value.trim(),
        complemento: form.complemento.value.trim(),
        produtos: itens.map(([id, qtd]) => {
            const produto = estado.produtos.find(p => p.id === id);
            return {
                id,
                nome: produto.nome,
                tamanho: produto.tamanho,
                quantidade: qtd,
                preco_unitario: produto.preco,
                subtotal: produto.preco * qtd
            };
        }),
        valor_total: calcularTotal()
    };

    estado.dadosPedido = dados;

    try {
        const response = await fetch('/api/pedido', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(dados)
        });

        const resultado = await response.json();

        if (response.ok && resultado.success) {
            estado.pedidoId = resultado.pedido_id || ('FD' + Date.now().toString().slice(-8));
            mostrarTelaPagamento();
        } else {
            throw new Error(resultado.message || 'Erro ao processar pedido');
        }
    } catch (erro) {
        // Fallback: se o backend não tá configurado, mostra pagamento mesmo assim
        console.warn('Backend não respondeu, modo fallback:', erro);
        estado.pedidoId = 'FD' + Date.now().toString().slice(-8);
        mostrarTelaPagamento();
    } finally {
        botao.disabled = false;
        botao.textContent = 'Finalizar pedido';
    }
}

// ---------- TELA DE PAGAMENTO ----------
function mostrarTelaPagamento() {
    // Esconde seções anteriores
    document.getElementById('pedido').hidden = true;
    document.getElementById('catalogo').hidden = true;
    document.getElementById('como-funciona').hidden = true;
    document.querySelector('.porque').hidden = true;

    // Mostra pagamento
    const pagamento = document.getElementById('pagamento');
    pagamento.hidden = false;

    // Número do pedido
    document.getElementById('pedido-id').textContent = estado.pedidoId;

    // Resumo do pedido
    const resumo = document.getElementById('pagamento-resumo');
    const linhas = estado.dadosPedido.produtos.map(p => `
        <div class="pagamento__resumo-linha">
            <span>${p.quantidade}× ${p.nome} <small>(${p.tamanho})</small></span>
            <strong>${formatarPreco(p.subtotal)}</strong>
        </div>
    `).join('');
    resumo.innerHTML = `
        <p class="pagamento__resumo-titulo">Resumo do pedido</p>
        ${linhas}
        <div class="pagamento__resumo-linha pagamento__resumo-total">
            <span>Total</span>
            <strong>${formatarPreco(estado.dadosPedido.valor_total)}</strong>
        </div>
    `;

    // Chave PIX
    const chavePIX = estado.config.pix && !estado.config.pix.startsWith('TROCAR_')
        ? estado.config.pix
        : 'Configurar chave PIX no produtos.json';
    document.getElementById('pix-chave-texto').textContent = chavePIX;
    document.getElementById('pix-titular').textContent = estado.config.titular || 'Fernanda Delgado';

    // Botão WhatsApp
    const mensagem = encodeURIComponent(
        `Olá! Acabei de fazer um pedido de óleos essenciais doTERRA.\n\n` +
        `📦 Pedido: ${estado.pedidoId}\n` +
        `👤 Nome: ${estado.dadosPedido.nome}\n` +
        `🛒 Itens: ${estado.dadosPedido.produtos.map(p => `${p.quantidade}x ${p.nome} ${p.tamanho}`).join(', ')}\n` +
        `💰 Total: ${formatarPreco(estado.dadosPedido.valor_total)}\n\n` +
        `Segue meu comprovante de pagamento em anexo. 🌿`
    );
    document.getElementById('botao-whatsapp').href = `https://wa.me/${estado.config.whatsapp}?text=${mensagem}`;

    // Scroll pro topo
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ---------- COPIAR PIX ----------
function copiarPIX() {
    const chave = document.getElementById('pix-chave-texto').textContent;
    if (chave.startsWith('Configurar')) {
        mostrarToast('⚠️ Chave PIX ainda não configurada');
        return;
    }
    navigator.clipboard.writeText(chave).then(() => {
        mostrarToast('Chave PIX copiada! 🌿');
    }).catch(() => {
        // Fallback
        const input = document.createElement('input');
        input.value = chave;
        document.body.appendChild(input);
        input.select();
        document.execCommand('copy');
        document.body.removeChild(input);
        mostrarToast('Chave PIX copiada! 🌿');
    });
}

// ---------- INICIALIZAÇÃO ----------
document.addEventListener('DOMContentLoaded', () => {
    carregarProdutos();
    atualizarResumoCarrinho();

    // Máscara de telefone
    document.getElementById('telefone').addEventListener('input', (e) => {
        e.target.value = formatarTelefone(e.target.value);
    });

    // Máscara e busca de CEP
    document.getElementById('cep').addEventListener('input', (e) => {
        e.target.value = formatarCEP(e.target.value);
        const cep = e.target.value.replace(/\D/g, '');
        if (cep.length === 8) buscarCEP(cep);
    });

    // Submit
    document.getElementById('formulario-pedido').addEventListener('submit', enviarPedido);

    // Copiar PIX
    document.getElementById('botao-copiar-pix').addEventListener('click', copiarPIX);

    // Ano no rodapé
    document.getElementById('ano-atual').textContent = new Date().getFullYear();
});

// Expor funções pro onclick inline
window.alterarQuantidade = alterarQuantidade;
window.adicionarAoCarrinho = adicionarAoCarrinho;
