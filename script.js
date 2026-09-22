const CHAVE_GESTORES = "sigtm_gestores";
const CHAVE_USUARIO = "sigtm_usuario";
const CHAVE_TEMA = "sigtm_tema";

let gestores = JSON.parse(localStorage.getItem(CHAVE_GESTORES) || "[]");
let usuario = localStorage.getItem(CHAVE_USUARIO) || "Usuário";

const selecionar = id => document.getElementById(id);
const selecionarTodos = seletor => document.querySelectorAll(seletor);

const estados = [
    "AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO",
    "MA", "MT", "MS", "MG", "PA", "PB", "PR", "PE", "PI",
    "RJ", "RN", "RS", "RO", "RR", "SC", "SP", "SE", "TO"
];

selecionar("estado").innerHTML =
    '<option value="">Selecione</option>' +
    estados.map(estado => `<option>${estado}</option>`).join("");

function escapar(valor) {
    return String(valor ?? "").replace(/[&<>"']/g, caractere => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;"
    }[caractere]));
}

function salvarDados() {
    localStorage.setItem(CHAVE_GESTORES, JSON.stringify(gestores));
}

function mostrarNotificacao(mensagem, tipo = "sucesso") {
    const notificacao = document.createElement("div");

    notificacao.className = `notificacao ${tipo}`;
    notificacao.textContent = mensagem;

    selecionar("caixaNotificacoes").appendChild(notificacao);

    setTimeout(() => notificacao.remove(), 3000);
}

function obterInicial(nome) {
    return (nome || "U").trim()[0].toUpperCase();
}

function formatarData(data) {
    return new Intl.DateTimeFormat("pt-BR").format(new Date(data));
}

function gerarNovoId() {
    const maiorId = gestores.reduce(
        (maior, gestor) =>
            Math.max(maior, parseInt(gestor.codigo?.replace(/\D/g, "")) || 0),
        0
    );

    return `GST-${String(maiorId + 1).padStart(4, "0")}`;
}

function atualizarUsuario() {
    selecionar("nomeUsuario").textContent = usuario;
    selecionar("avatarUsuario").textContent = obterInicial(usuario);
    selecionar("nomeConfiguracao").value = usuario;
}

function navegarPara(pagina) {
    selecionarTodos(".pagina").forEach(item => item.classList.add("oculto"));

    selecionar(`pagina-${pagina}`).classList.remove("oculto");

    selecionarTodos(".botao-navegacao[data-pagina]").forEach(botao => {
        botao.classList.toggle("ativo", botao.dataset.pagina === pagina);
    });

    const titulos = {
        inicio: ["Início", "Cadastro de Gestores"],
        cadastro: ["Cadastro", "Cadastro de gestor"],
        historico: ["Consulta", "Histórico de cadastros"],
        configuracoes: ["Preferências", "Configurações"]
    };

    selecionar("caminhoSecundario").textContent = titulos[pagina][0];
    selecionar("tituloCaminho").textContent = titulos[pagina][1];

    if (pagina === "inicio") atualizarInicio();
    if (pagina === "historico") atualizarTabela();
    if (pagina === "configuracoes") atualizarUsuario();

    selecionar("barraLateral").classList.remove("aberta");
}

function atualizarInicio() {
    selecionar("totalGestores").textContent = gestores.length;

    selecionar("cadastrosCompletos").textContent =
        gestores.filter(gestor => gestor.completo).length;

    selecionar("ultimoCadastro").textContent =
        gestores.length
            ? formatarData(gestores[gestores.length - 1].criado)
            : "—";

    const recentes = gestores.slice(-5).reverse();

    selecionar("cadastrosRecentes").innerHTML = recentes.length
        ? recentes.map(gestor => `
            <div class="item-recente">

                <span class="avatar-pequeno">
                    ${obterInicial(gestor.responsavel)}
                </span>

                <div class="info-recente">
                    <b>${escapar(gestor.responsavel)}</b>
                    <small>
                        ${escapar(gestor.cargo)}
                        •
                        ${escapar(gestor.area)}
                    </small>
                </div>

                <span class="id-recente">
                    ${gestor.codigo}
                </span>

            </div>
        `).join("")
        : `
            <div class="estado-vazio">
                <span>＋</span>
                <h3>Nenhum gestor cadastrado</h3>
                <p>Adicione o primeiro registro.</p>
            </div>
        `;
}

function preencherFiltros() {
    const estadosCadastrados = [
        ...new Set(
            gestores
                .map(gestor => gestor.estado)
                .filter(Boolean)
        )
    ].sort();

    const gruposCadastrados = [
        ...new Set(
            gestores
                .map(gestor => gestor.grupo)
                .filter(Boolean)
        )
    ].sort();

    selecionar("filtroEstado").innerHTML =
        '<option value="">Todos os estados</option>' +
        estadosCadastrados
            .map(estado => `<option>${escapar(estado)}</option>`)
            .join("");

    selecionar("filtroGrupo").innerHTML =
        '<option value="">Todos os grupos</option>' +
        gruposCadastrados
            .map(grupo => `<option>${escapar(grupo)}</option>`)
            .join("");
}

function atualizarTabela() {
    preencherFiltros();

    const busca = selecionar("campoBusca").value.toLowerCase().trim();
    const estado = selecionar("filtroEstado").value;
    const grupo = selecionar("filtroGrupo").value;

    const filtrados = gestores.filter(gestor => {
        const texto = [
            gestor.codigo,
            gestor.responsavel,
            gestor.cargo,
            gestor.area,
            gestor.email,
            gestor.estado,
            gestor.grupo,
            gestor.funcao
        ]
            .join(" ")
            .toLowerCase();

        return (
            (!busca || texto.includes(busca)) &&
            (!estado || gestor.estado === estado) &&
            (!grupo || gestor.grupo === grupo)
        );
    });

    selecionar("estadoVazio").classList.toggle(
        "oculto",
        filtrados.length > 0
    );

    selecionar("tabelaGestores").innerHTML = filtrados.map(gestor => `
        <tr>

            <td>
                <b>${gestor.codigo}</b>
            </td>

            <td>
                <b>${escapar(gestor.responsavel)}</b>
                <br>
                <small>${escapar(gestor.email)}</small>
            </td>

            <td>${escapar(gestor.cargo)}</td>

            <td>${escapar(gestor.area)}</td>

            <td>${escapar(gestor.estado)}</td>

            <td>
                <span class="etiqueta-grupo">
                    ${escapar(gestor.grupo)}
                </span>
            </td>

            <td>
                <div class="acoes-tabela">

                    <button
                        class="botao-icone"
                        title="Visualizar"
                        onclick="visualizarGestor('${gestor.codigo}')">
                        ◉
                    </button>

                    <button
                        class="botao-icone"
                        title="Editar"
                        onclick="editarGestor('${gestor.codigo}')">
                        ✎
                    </button>

                    <button
                        class="botao-icone excluir"
                        title="Excluir"
                        onclick="excluirGestor('${gestor.codigo}')">
                        ⌫
                    </button>

                </div>
            </td>

        </tr>
    `).join("");
}

function limparFormulario() {
    selecionar("formularioGestor").reset();

    selecionar("idEdicao").value = "";
    selecionar("codigoGestor").value = gerarNovoId();

    selecionar("tituloFormulario").textContent = "Cadastro de gestor";
    selecionar("botaoSalvar").textContent = "Finalizar cadastro";
    selecionar("contadorEscopo").textContent = "0";
}

function carregarGestor(gestor) {
    selecionar("idEdicao").value = gestor.codigo;
    selecionar("codigoGestor").value = gestor.codigo;
    selecionar("responsavel").value = gestor.responsavel;
    selecionar("cargo").value = gestor.cargo;
    selecionar("email").value = gestor.email;
    selecionar("telefone").value = gestor.telefone;
    selecionar("area").value = gestor.area;
    selecionar("estado").value = gestor.estado;
    selecionar("macroGrupo").value = gestor.grupo;
    selecionar("funcao").value = gestor.funcao;
    selecionar("escopo").value = gestor.escopo || "";

    selecionar("contadorEscopo").textContent =
        selecionar("escopo").value.length;

    selecionar("tituloFormulario").textContent = "Editar gestor";
    selecionar("botaoSalvar").textContent = "Salvar alterações";
}

function editarGestor(codigo) {
    const gestor = gestores.find(item => item.codigo === codigo);

    if (!gestor) {
        return;
    }

    carregarGestor(gestor);
    navegarPara("cadastro");

    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });
}

function visualizarGestor(codigo) {
    const gestor = gestores.find(item => item.codigo === codigo);

    if (!gestor) {
        return;
    }

    selecionar("conteudoModal").innerHTML = `
        <h2>${escapar(gestor.responsavel)}</h2>

        <p>
            <b>${gestor.codigo}</b>
            •
            ${escapar(gestor.cargo)}
        </p>

        <p>
            <b>E-mail:</b> ${escapar(gestor.email)}
            <br>
            <b>Telefone:</b> ${escapar(gestor.telefone || "Não informado")}
            <br>
            <b>Área:</b> ${escapar(gestor.area)}
            <br>
            <b>Estado:</b> ${escapar(gestor.estado)}
            <br>
            <b>Macro-grupo:</b> ${escapar(gestor.grupo)}
            <br>
            <b>Função:</b> ${escapar(gestor.funcao)}
            <br>
            <b>Escopo:</b> ${escapar(gestor.escopo || "Não informado")}
        </p>

        <div class="acoes-formulario">
            <button class="botao-secundario" onclick="fecharModal()">
                Fechar
            </button>

            <button
                class="botao-principal"
                onclick="fecharModal(); editarGestor('${gestor.codigo}')">
                Editar
            </button>
        </div>
    `;

    selecionar("fundoModal").classList.remove("oculto");
}

function fecharModal() {
    selecionar("fundoModal").classList.add("oculto");
}

function excluirGestor(codigo) {
    const gestor = gestores.find(item => item.codigo === codigo);

    if (!gestor) {
        return;
    }

    if (!confirm(`Excluir o cadastro de ${gestor.responsavel}?`)) {
        return;
    }

    gestores = gestores.filter(item => item.codigo !== codigo);

    salvarDados();
    atualizarInicio();
    atualizarTabela();

    mostrarNotificacao("Cadastro excluído.");
}

function exportarJson() {
    if (!gestores.length) {
        mostrarNotificacao("Não existem gestores para exportar.", "erro");
        return;
    }

    const arquivo = new Blob(
        [JSON.stringify(gestores, null, 4)],
        { type: "application/json" }
    );

    const link = document.createElement("a");

    link.href = URL.createObjectURL(arquivo);
    link.download = "sigtm-gestores.json";
    link.click();

    URL.revokeObjectURL(link.href);

    mostrarNotificacao("JSON exportado com sucesso.");
}

function exportarCsv() {
    if (!gestores.length) {
        mostrarNotificacao("Não existem gestores para exportar.", "erro");
        return;
    }

    const cabecalho = [
        "ID",
        "Responsável",
        "Cargo",
        "E-mail",
        "Telefone",
        "Área",
        "Estado",
        "Macro-grupo",
        "Função",
        "Escopo"
    ];

    const linhas = gestores.map(gestor => [
        gestor.codigo,
        gestor.responsavel,
        gestor.cargo,
        gestor.email,
        gestor.telefone,
        gestor.area,
        gestor.estado,
        gestor.grupo,
        gestor.funcao,
        gestor.escopo
    ]);

    const csv = [cabecalho, ...linhas]
        .map(linha =>
            linha
                .map(valor => `"${String(valor ?? "").replace(/"/g, '""')}"`)
                .join(";")
        )
        .join("\n");

    const arquivo = new Blob(
        ["\ufeff" + csv],
        { type: "text/csv;charset=utf-8" }
    );

    const link = document.createElement("a");

    link.href = URL.createObjectURL(arquivo);
    link.download = "sigtm-gestores.csv";
    link.click();

    URL.revokeObjectURL(link.href);

    mostrarNotificacao("CSV exportado com sucesso.");
}

function normalizarCabecalho(valor) {
    return String(valor || "")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .replace(/[^a-z0-9]/g, "");
}

function encontrarColuna(objeto, nomes) {
    const colunas = Object.keys(objeto);
    const nomesNormalizados = nomes.map(normalizarCabecalho);

    return colunas.find(coluna =>
        nomesNormalizados.includes(normalizarCabecalho(coluna))
    );
}

function obterValorColuna(objeto, nomes) {
    const coluna = encontrarColuna(objeto, nomes);

    return coluna
        ? String(objeto[coluna] ?? "").trim()
        : "";
}

function prepararGestorImportado(linha) {
    const responsavel = obterValorColuna(linha, [
        "responsavel",
        "responsável",
        "nome",
        "nomegestor",
        "gestor"
    ]);

    const cargo = obterValorColuna(linha, [
        "cargo",
        "funcao",
        "função"
    ]);

    const email = obterValorColuna(linha, [
        "email",
        "e-mail",
        "mail"
    ]);

    const telefone = obterValorColuna(linha, [
        "telefone",
        "tel",
        "celular",
        "fone"
    ]);

    const area = obterValorColuna(linha, [
        "area",
        "área",
        "departamento",
        "setor"
    ]);

    const estado = obterValorColuna(linha, [
        "estado",
        "uf"
    ]);

    const grupo = obterValorColuna(linha, [
        "macrogrupo",
        "macro-grupo",
        "macro grupo",
        "grupo"
    ]);

    const funcao = obterValorColuna(linha, [
        "funcao",
        "função",
        "tipo"
    ]);

    const escopo = obterValorColuna(linha, [
        "escopo",
        "descrição",
        "descricao",
        "responsabilidade"
    ]);

    return {
        codigo: gerarNovoId(),
        responsavel,
        cargo,
        email,
        telefone,
        area,
        estado,
        grupo,
        funcao,
        escopo,
        criado: new Date().toISOString(),
        completo: Boolean(
            responsavel &&
            cargo &&
            email &&
            area &&
            estado &&
            grupo &&
            funcao
        )
    };
}

async function importarOds(arquivo) {
    if (typeof XLSX === "undefined") {
        mostrarNotificacao(
            "A biblioteca de leitura da planilha não foi carregada.",
            "erro"
        );

        return;
    }

    try {
        const dados = await arquivo.arrayBuffer();

        const planilha = XLSX.read(dados, {
            type: "array"
        });

        const primeiraAba = planilha.SheetNames[0];

        if (!primeiraAba) {
            mostrarNotificacao("O arquivo não possui uma aba.", "erro");
            return;
        }

        const folha = planilha.Sheets[primeiraAba];

        const linhas = XLSX.utils.sheet_to_json(
            folha,
            {
                defval: ""
            }
        );

        if (!linhas.length) {
            mostrarNotificacao("A planilha está vazia.", "erro");
            return;
        }

        const gestoresImportados = linhas
            .map(prepararGestorImportado)
            .filter(gestor =>
                gestor.responsavel ||
                gestor.cargo ||
                gestor.email ||
                gestor.area
            );

        if (!gestoresImportados.length) {
            mostrarNotificacao(
                "Nenhum dado reconhecível foi encontrado.",
                "erro"
            );

            return;
        }

        const completos = gestoresImportados.filter(
            gestor => gestor.completo
        ).length;

        selecionar("conteudoModal").innerHTML = `
            <h2>Importar base ODS</h2>

            <p>
                Foram encontrados
                <b>${gestoresImportados.length}</b>
                registros na aba
                <b>${escapar(primeiraAba)}</b>.
            </p>

            <div style="
                background:#f7eafa;
                border-radius:10px;
                padding:14px;
                margin:12px 0;
                font-size:12px;
            ">
                <b>${completos}</b> cadastros completos
                <br>
                <b>${gestoresImportados.length - completos}</b>
                cadastros com campos pendentes
            </div>

            <p>
                Os registros serão adicionados à base atual
                e receberão IDs automáticos.
            </p>

            <div class="acoes-formulario">

                <button class="botao-secundario" onclick="fecharModal()">
                    Cancelar
                </button>

                <button class="botao-principal" id="confirmarImportacao">
                    Importar ${gestoresImportados.length} registros
                </button>

            </div>
        `;

        selecionar("fundoModal").classList.remove("oculto");

        selecionar("confirmarImportacao").onclick = () => {
            gestores.push(...gestoresImportados);

            salvarDados();
            atualizarInicio();
            atualizarTabela();
            fecharModal();

            mostrarNotificacao(
                `${gestoresImportados.length} gestores importados com sucesso.`
            );
        };

    } catch (erro) {
        console.error(erro);

        mostrarNotificacao(
            "Não foi possível ler o arquivo.",
            "erro"
        );
    }

    selecionar("importarOds").value = "";
}

selecionarTodos("[data-pagina]").forEach(botao => {
    botao.addEventListener("click", () => {
        navegarPara(botao.dataset.pagina);
    });
});

selecionar("formularioGestor").addEventListener("submit", evento => {
    evento.preventDefault();

    if (!selecionar("formularioGestor").checkValidity()) {
        mostrarNotificacao(
            "Preencha todos os campos obrigatórios.",
            "erro"
        );

        selecionar("formularioGestor").reportValidity();

        return;
    }

    const codigoEdicao = selecionar("idEdicao").value;

    const gestor = {
        codigo: selecionar("codigoGestor").value,
        responsavel: selecionar("responsavel").value.trim(),
        cargo: selecionar("cargo").value.trim(),
        email: selecionar("email").value.trim(),
        telefone: selecionar("telefone").value.trim(),
        area: selecionar("area").value.trim(),
        estado: selecionar("estado").value,
        grupo: selecionar("macroGrupo").value,
        funcao: selecionar("funcao").value,
        escopo: selecionar("escopo").value.trim(),
        criado: new Date().toISOString(),
        completo: true
    };

    if (codigoEdicao) {
        const indice = gestores.findIndex(
            item => item.codigo === codigoEdicao
        );

        gestor.criado = gestores[indice].criado;
        gestores[indice] = gestor;

        mostrarNotificacao("Cadastro atualizado com sucesso.");
    } else {
        gestores.push(gestor);

        mostrarNotificacao("Gestor cadastrado com sucesso.");
    }

    salvarDados();
    limparFormulario();
    atualizarInicio();
    navegarPara("historico");
});

selecionar("telefone").addEventListener("input", evento => {
    let valor = evento.target.value
        .replace(/\D/g, "")
        .slice(0, 11);

    evento.target.value =
        valor.length <= 10
            ? valor.replace(
                /(\d{2})(\d{4})(\d{0,4})/,
                "($1) $2-$3"
            ).replace(/-$/, "")
            : valor.replace(
                /(\d{2})(\d{5})(\d{0,4})/,
                "($1) $2-$3"
            ).replace(/-$/, "");
});

selecionar("escopo").addEventListener("input", () => {
    selecionar("contadorEscopo").textContent =
        selecionar("escopo").value.length;
});

selecionar("limparFormulario").addEventListener("click", () => {
    if (confirm("Limpar os campos preenchidos?")) {
        limparFormulario();
    }
});

selecionar("cancelarFormulario").addEventListener(
    "click",
    () => navegarPara("inicio")
);

["campoBusca", "filtroEstado", "filtroGrupo"].forEach(id => {
    selecionar(id).addEventListener("input", atualizarTabela);
});

selecionar("limparFiltros").addEventListener("click", () => {
    selecionar("campoBusca").value = "";
    selecionar("filtroEstado").value = "";
    selecionar("filtroGrupo").value = "";

    atualizarTabela();
});

selecionar("exportarJson").addEventListener("click", exportarJson);
selecionar("exportarCsv").addEventListener("click", exportarCsv);
selecionar("exportarMenu").addEventListener("click", exportarJson);
selecionar("backupInicio").addEventListener("click", exportarJson);

selecionar("limparMenu").addEventListener(
    "click",
    () => selecionar("limparTodos").click()
);

selecionar("limparTodos").addEventListener("click", () => {
    if (!gestores.length) {
        mostrarNotificacao("A base já está vazia.");
        return;
    }

    if (!confirm(
        "Isso excluirá todos os gestores deste navegador. Continuar?"
    )) {
        return;
    }

    gestores = [];

    salvarDados();
    atualizarInicio();
    atualizarTabela();

    mostrarNotificacao("Base limpa.");
});

selecionar("salvarNome").addEventListener("click", () => {
    const novoNome = selecionar("nomeConfiguracao").value.trim();

    if (!novoNome) {
        mostrarNotificacao("Digite um nome.", "erro");
        return;
    }

    usuario = novoNome;

    localStorage.setItem(CHAVE_USUARIO, usuario);

    atualizarUsuario();

    mostrarNotificacao("Nome atualizado.");
});

selecionar("botaoUsuario").addEventListener("click", () => {
    selecionar("menuUsuario").classList.toggle("aberto");
});

selecionar("botaoAlterarNome").addEventListener("click", () => {
    navegarPara("configuracoes");
    selecionar("menuUsuario").classList.remove("aberto");
});

selecionar("botaoPerfil").addEventListener("click", () => {
    navegarPara("configuracoes");
    selecionar("menuUsuario").classList.remove("aberto");
});

document.addEventListener("click", evento => {
    if (!evento.target.closest(".area-usuario")) {
        selecionar("menuUsuario").classList.remove("aberto");
    }
});

selecionar("menuCelular").addEventListener("click", () => {
    selecionar("barraLateral").classList.toggle("aberta");
});

selecionar("fecharModal").addEventListener("click", fecharModal);

selecionar("fundoModal").addEventListener("click", evento => {
    if (evento.target === selecionar("fundoModal")) {
        fecharModal();
    }
});

selecionar("alternarTema").addEventListener("click", () => {
    document.body.classList.toggle("modo-escuro");

    localStorage.setItem(
        CHAVE_TEMA,
        document.body.classList.contains("modo-escuro")
            ? "escuro"
            : "claro"
    );
});

selecionar("importarJson").addEventListener("change", evento => {
    const arquivo = evento.target.files[0];

    if (!arquivo) {
        return;
    }

    const leitor = new FileReader();

    leitor.onload = () => {
        try {
            const dados = JSON.parse(leitor.result);

            if (!Array.isArray(dados)) {
                throw new Error();
            }

            gestores = dados;

            salvarDados();
            atualizarInicio();
            atualizarTabela();

            mostrarNotificacao("Backup importado com sucesso.");

        } catch {
            mostrarNotificacao(
                "Arquivo JSON inválido.",
                "erro"
            );
        }
    };

    leitor.readAsText(arquivo);
});

selecionar("importarOds").addEventListener("change", evento => {
    const arquivo = evento.target.files[0];

    if (arquivo) {
        importarOds(arquivo);
    }
});

if (localStorage.getItem(CHAVE_TEMA) === "escuro") {
    document.body.classList.add("modo-escuro");
}

atualizarUsuario();
limparFormulario();
atualizarInicio();
