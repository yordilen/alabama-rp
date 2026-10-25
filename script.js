
document.addEventListener("DOMContentLoaded", () => {
  const botaoMenu = document.getElementById("botaoMenu");
  const menuLateral = document.getElementById("menuLateral");
  const pesquisa = document.getElementById("pesquisaGlobal");
  const resultados = document.getElementById("resultadosBusca");

  // Destaca a página atual no menu.
  const paginaAtual =
    window.location.pathname.split("/").pop() || "index.html";

  document.querySelectorAll(".menu a").forEach(link => {
    const destino = link.getAttribute("href")?.split("#")[0];

    if (destino === paginaAtual) {
      link.classList.add("ativo");
      link.setAttribute("aria-current", "page");
    }
  });

  // Abre e fecha o menu no celular.
  if (botaoMenu && menuLateral) {
    botaoMenu.addEventListener("click", () => {
      const aberta = menuLateral.classList.toggle("aberta");
      botaoMenu.setAttribute("aria-expanded", String(aberta));
    });
  }

  // Pesquisa entre todas as páginas do site.
  if (!pesquisa || !resultados) return;

  const paginas = [
    { nome: "Início", url: "index.html" },
    { nome: "Regulamento", url: "regulamento.html" },
    { nome: "Territórios", url: "territorios.html" },
    { nome: "Guia do Jogador", url: "guia.html" },
    { nome: "Economia", url: "economia.html" },
    { nome: "Mensalidades e VIP", url: "mensalidades.html" },
    { nome: "Comunidade", url: "comunidade.html" }
  ];

  function normalizar(texto) {
    return texto.normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLocaleLowerCase("pt-BR");
  }

  function limparResultados() {
    resultados.replaceChildren();
    resultados.hidden = true;
  }

  let indice = [];
  let indicePronto = false;

  // Lê o conteúdo das páginas para pesquisar também
  // dentro das regras, tutoriais e informações.
  async function carregarIndice() {
    if (indicePronto) return;
    indicePronto = true;

    const respostas = await Promise.allSettled(
      paginas.map(async pagina => {
        const resposta = await fetch(pagina.url);

        if (!resposta.ok) return [];

        const html = await resposta.text();
        const documento = new DOMParser()
          .parseFromString(html, "text/html");

        const conteudo = documento.querySelector("main");
        if (!conteudo) return [];

        const itens = [{
          titulo: pagina.nome,
          texto: conteudo.textContent.trim(),
          url: pagina.url
        }];

        conteudo.querySelectorAll(
          ".regra, .cartao, .painel, .aviso"
        ).forEach((bloco, posicao) => {
          const titulo = bloco.querySelector("h2,h3")
            ?.textContent.trim() || pagina.nome;

          if (!bloco.id) {
            bloco.id = "resultado-" + posicao;
          }

          itens.push({
            titulo,
            texto: bloco.textContent.trim(),
            url: pagina.url + "#" + bloco.id
          });
        });

        return itens;
      })
    );

    indice = respostas.flatMap(resposta =>
      resposta.status === "fulfilled" ? resposta.value : []
    );
  }

  function mostrarResultados() {
    const termo = normalizar(pesquisa.value.trim());
    limparResultados();

    if (termo.length < 2) return;

    const encontrados = indice
      .filter(item => normalizar(item.texto).includes(termo))
      .slice(0, 15);

    if (encontrados.length === 0) {
      const aviso = document.createElement("div");
      aviso.className = "resultado";
      aviso.textContent = "Nenhum resultado encontrado.";
      resultados.appendChild(aviso);
    }

    encontrados.forEach(item => {
      const botao = document.createElement("button");
      botao.type = "button";
      botao.className = "resultado";

      const titulo = document.createElement("strong");
      titulo.textContent = item.titulo;

      const descricao = document.createElement("small");
      descricao.textContent =
        item.texto.replace(/\s+/g, " ").slice(0, 130) + "...";

      botao.append(titulo, descricao);

      botao.addEventListener("click", () => {
        window.location.href = item.url;
      });

      resultados.appendChild(botao);
    });

    resultados.hidden = false;
  }

  pesquisa.addEventListener("focus", async () => {
    await carregarIndice();
    mostrarResultados();
  });

  pesquisa.addEventListener("input", async () => {
    await carregarIndice();
    mostrarResultados();
  });

  pesquisa.addEventListener("keydown", evento => {
    if (evento.key === "Escape") {
      limparResultados();
    }

    if (evento.key === "Enter") {
      const primeiro = resultados.querySelector("button.resultado");
      if (primeiro && !resultados.hidden) primeiro.click();
    }
  });

  document.addEventListener("click", evento => {
    if (!evento.target.closest(".pesquisa")) {
      resultados.hidden = true;
    }
  });
});
