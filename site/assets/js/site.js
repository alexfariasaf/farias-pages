/* Site institucional AFAA — comportamento.
   Regra: a animação é enfeite, o conteúdo não. Tudo já está no HTML com o valor final,
   e sem JavaScript (ou com animações desligadas no aparelho) a página aparece completa. */
(function () {
  "use strict";
  var doc = document.documentElement;
  /* avisa a trava do <head>: o script rodou, a classe js pode ficar */
  window.afaaPronto = true;
  doc.classList.add("js");
  var semMovimento = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- cabeçalho que encolhe e botão flutuante ---------- */
  var topo = document.querySelector(".topo");
  var flutua = document.querySelector(".flutua");
  var abertura = document.querySelector(".abertura");
  function aoRolar() {
    var y = window.scrollY || window.pageYOffset;
    if (topo) topo.classList.toggle("rolou", y > 30);
    if (flutua) {
      var limite = abertura ? abertura.offsetHeight * 0.7 : 400;
      flutua.classList.toggle("mostra", y > limite);
    }
    atualizarMetodo();
  }

  /* ---------- menu no celular ---------- */
  var botaoMenu = document.querySelector(".abre-menu");
  var menu = document.getElementById("menu");
  if (botaoMenu && menu) {
    botaoMenu.addEventListener("click", function () {
      var aberto = botaoMenu.getAttribute("aria-expanded") === "true";
      botaoMenu.setAttribute("aria-expanded", String(!aberto));
      menu.classList.toggle("aberto", !aberto);
    });
    menu.addEventListener("click", function (e) {
      if (e.target.closest("a")) {
        botaoMenu.setAttribute("aria-expanded", "false");
        menu.classList.remove("aberto");
      }
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && menu.classList.contains("aberto")) {
        botaoMenu.setAttribute("aria-expanded", "false");
        menu.classList.remove("aberto");
        botaoMenu.focus();
      }
    });
  }

  /* ---------- revelação no scroll ---------- */
  document.querySelectorAll(".cascata").forEach(function (grupo) {
    Array.prototype.forEach.call(grupo.children, function (filho, i) {
      filho.style.setProperty("--i", i);
    });
  });
  var alvos = document.querySelectorAll(".reveal, .cascata");
  if (semMovimento || !("IntersectionObserver" in window)) {
    alvos.forEach(function (el) { el.classList.add("in"); });
  } else {
    var obs = new IntersectionObserver(function (entradas) {
      entradas.forEach(function (en) {
        if (en.isIntersecting) {
          en.target.classList.add("in");
          obs.unobserve(en.target);
        }
      });
    }, { rootMargin: "0px 0px -10% 0px", threshold: 0.08 });
    alvos.forEach(function (el) { obs.observe(el); });
  }

  /* ---------- contadores ---------- */
  var fmt = new Intl.NumberFormat("pt-BR");
  function escrever(el, n) {
    el.textContent = (el.dataset.prefixo || "") + fmt.format(n) + (el.dataset.sufixo || "");
  }
  function contar(el) {
    var alvo = parseInt(el.dataset.alvo, 10);
    if (isNaN(alvo)) return;
    var dur = 1800, ini = null;
    function passo(t) {
      if (ini === null) ini = t;
      var p = Math.min((t - ini) / dur, 1);
      var e = 1 - Math.pow(1 - p, 4); /* desacelera no fim */
      escrever(el, Math.round(alvo * e));
      if (p < 1) requestAnimationFrame(passo);
    }
    requestAnimationFrame(passo);
  }
  var contadores = document.querySelectorAll("[data-alvo]");
  function valorFinal() {
    contadores.forEach(function (el) { escrever(el, parseInt(el.dataset.alvo, 10)); });
  }
  if (!semMovimento && "IntersectionObserver" in window) {
    contadores.forEach(function (el) {
      /* leitor de tela ouve o valor final, não a contagem */
      var final = el.textContent;
      var sr = document.createElement("span");
      sr.className = "sr";
      sr.textContent = final;
      el.parentNode.insertBefore(sr, el);
      el.setAttribute("aria-hidden", "true");
      escrever(el, 0);
    });
    /* impressão e PDF saem sempre com o valor final */
    window.addEventListener("beforeprint", valorFinal);
    var obsN = new IntersectionObserver(function (entradas) {
      entradas.forEach(function (en) {
        if (en.isIntersecting) { contar(en.target); obsN.unobserve(en.target); }
      });
    }, { threshold: 0.5 });
    contadores.forEach(function (el) { obsN.observe(el); });
  }

  /* ---------- item ativo do menu ---------- */
  var links = document.querySelectorAll('.menu a[href^="#"]');
  if ("IntersectionObserver" in window && links.length) {
    var mapa = {};
    links.forEach(function (a) { mapa[a.getAttribute("href").slice(1)] = a; });
    var obsS = new IntersectionObserver(function (entradas) {
      entradas.forEach(function (en) {
        var a = mapa[en.target.id];
        if (a && en.isIntersecting) {
          links.forEach(function (l) { l.classList.remove("ativo"); l.removeAttribute("aria-current"); });
          a.classList.add("ativo");
          a.setAttribute("aria-current", "true");
        }
      });
    }, { rootMargin: "-45% 0px -50% 0px" });
    Object.keys(mapa).forEach(function (id) {
      var s = document.getElementById(id);
      if (s) obsS.observe(s);
    });
  }

  /* ---------- filtro das áreas ---------- */
  var botoes = document.querySelectorAll(".filtro button");
  var areas = document.querySelectorAll(".area");
  var anuncio = document.getElementById("filtro-status");
  botoes.forEach(function (b) {
    b.addEventListener("click", function () {
      var publico = b.dataset.publico;
      botoes.forEach(function (x) { x.setAttribute("aria-pressed", String(x === b)); });
      var visiveis = 0;
      areas.forEach(function (a) {
        var mostra = publico === "todas" || (a.dataset.publico || "").split(" ").indexOf(publico) !== -1;
        a.classList.toggle("some", !mostra);
        if (mostra) visiveis++;
      });
      if (anuncio) anuncio.textContent = visiveis + (visiveis === 1 ? " área exibida" : " áreas exibidas");
    });
  });

  /* ---------- trilho do método ---------- */
  var passos = document.querySelector(".passos");
  var itens = passos ? passos.querySelectorAll(".passo") : [];
  function atualizarMetodo() {
    if (!passos) return;
    var r = passos.getBoundingClientRect();
    var meio = window.innerHeight * 0.6;
    var p = (meio - r.top) / r.height;
    p = Math.max(0, Math.min(1, p));
    passos.style.setProperty("--progresso", semMovimento ? 1 : p);
    itens.forEach(function (it) {
      var ri = it.getBoundingClientRect();
      it.classList.toggle("feito", semMovimento || ri.top < meio);
    });
  }

  /* ---------- ano no rodapé ---------- */
  var ano = document.getElementById("ano");
  if (ano) ano.textContent = new Date().getFullYear();

  var pendente = false;
  window.addEventListener("scroll", function () {
    if (pendente) return;
    pendente = true;
    requestAnimationFrame(function () { pendente = false; aoRolar(); });
  }, { passive: true });
  window.addEventListener("resize", aoRolar);
  aoRolar();
})();
