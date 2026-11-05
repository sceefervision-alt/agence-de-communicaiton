// Outils d'autodiagnostic : simulateur de BFR et quiz flash.
(function () {
  const $ = (id) => document.getElementById(id);
  if (!$("panel-bfr")) return;

  // Envoie le visiteur vers le formulaire, avec sa formule, son défi et un résumé de son résultat.
  function askDiagnostic({ formule, defi, note }) {
    if (formule) $("formule").value = formule;
    if (defi) $("defi").value = defi;
    if (note) {
      const msg = $("message");
      msg.value = msg.value.trim() ? note + "\n\n" + msg.value.trim() : note;
    }
    const target = $("contact");
    target.scrollIntoView({ behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
    setTimeout(() => $("nom").focus({ preventScroll: true }), 500);
  }

  // ---------- Onglets ----------
  const tabs = [$("tab-bfr"), $("tab-quiz")];
  const panels = [$("panel-bfr"), $("panel-quiz")];
  function selectTab(i, focus) {
    tabs.forEach((t, k) => {
      t.setAttribute("aria-selected", k === i);
      t.tabIndex = k === i ? 0 : -1;
      panels[k].hidden = k !== i;
    });
    if (focus) tabs[i].focus();
    if (i === 1 && !$("quiz-body").hasChildNodes() && $("quiz-result").hidden) renderQuestion();
  }
  tabs.forEach((t, i) => {
    t.addEventListener("click", () => selectTab(i));
    t.addEventListener("keydown", (e) => {
      if (e.key === "ArrowRight" || e.key === "ArrowLeft") { e.preventDefault(); selectTab((i + 1) % 2, true); }
    });
  });

  // ---------- Simulateur de BFR ----------
  const CUR = {
    FCFA: { min: 1000000, max: 100000000, step: 1000000, def: 10000000 },
    CAD: { min: 5000, max: 200000, step: 5000, def: 25000 },
  };
  let currency = "FCFA";
  const money = (v) => currency === "FCFA"
    ? new Intl.NumberFormat("fr-FR").format(v) + " FCFA"
    : new Intl.NumberFormat("fr-CA", { style: "currency", currency: "CAD", maximumFractionDigits: 0 }).format(v);

  const STATES = {
    good: { badge: "Sain et maîtrisé", gauge: "Excellente maîtrise", width: "25%" },
    warn: { badge: "À surveiller", gauge: "Tension modérée", width: "60%" },
    bad: { badge: "Alerte trésorerie", gauge: "Risque d’impasse", width: "95%" },
  };
  let last = null;

  function updateBFR() {
    const ca = +$("in-ca").value, clients = +$("in-clients").value, stock = +$("in-stock").value, fourn = +$("in-fourn").value;
    $("val-ca").textContent = money(ca);
    $("val-clients").textContent = clients + " jours";
    $("val-stock").textContent = stock + " jours";
    $("val-fourn").textContent = fourn + " jours";

    const days = clients + stock - fourn;
    const cash = Math.round((ca / 30) * days);
    $("bfr-days").textContent = Math.max(days, 0) + " jours de CA";
    $("bfr-cash").textContent = money(Math.max(cash, 0));

    const state = days <= 20 ? "good" : days <= 45 ? "warn" : "bad";
    const s = STATES[state];
    $("bfr-badge").textContent = s.badge; $("bfr-badge").dataset.state = state;
    $("bfr-gauge-text").textContent = s.gauge;
    $("bfr-gauge").dataset.state = state; $("bfr-gauge").style.width = s.width;
    $("bfr-advice").textContent = state === "good"
      ? "Votre cycle d’exploitation est fluide. Vous pouvez consacrer vos fonds à l’expansion stratégique."
      : state === "warn"
        ? `Un simple acompte de 30 % ou une relance structurée réduirait le BFR de 15 jours et réinjecterait ${money(Math.round((ca / 30) * 15))} immédiatement en caisse.`
        : "Attention : votre croissance risque de provoquer un mur de trésorerie. Une restructuration d’urgence de vos conditions de paiement est préconisée.";
    last = { ca, clients, stock, fourn, days: Math.max(days, 0), cash: Math.max(cash, 0), label: s.badge };
  }

  function setCurrency(c) {
    currency = c;
    const cfg = CUR[c], ca = $("in-ca");
    ca.min = cfg.min; ca.max = cfg.max; ca.step = cfg.step; ca.value = cfg.def;
    $("min-ca").textContent = money(cfg.min); $("max-ca").textContent = money(cfg.max);
    $("cur-fcfa").setAttribute("aria-pressed", c === "FCFA");
    $("cur-cad").setAttribute("aria-pressed", c === "CAD");
    updateBFR();
  }
  $("cur-fcfa").addEventListener("click", () => setCurrency("FCFA"));
  $("cur-cad").addEventListener("click", () => setCurrency("CAD"));
  ["in-ca", "in-clients", "in-stock", "in-fourn"].forEach((id) => $(id).addEventListener("input", updateBFR));
  updateBFR();

  $("bfr-cta").addEventListener("click", () => askDiagnostic({
    formule: "Bilan Flash",
    defi: "Problème de trésorerie / BFR sous tension",
    note: `Résultat du simulateur de BFR : ${last.days} jours de CA, soit ${money(last.cash)} bloqués (${last.label}). ` +
      `Chiffre d’affaires mensuel ${money(last.ca)}, clients ${last.clients} j, stock ${last.stock} j, fournisseurs ${last.fourn} j.`,
  }));

  // ---------- Quiz flash ----------
  const QUESTIONS = [
    { q: "Séparez-vous strictement vos finances personnelles du compte bancaire de votre entreprise ?", o: [
      { t: "Oui, compte professionnel 100 % dédié et rémunération fixe versée.", s: 20, tag: "Compte séparé sain" },
      { t: "Non, je règle parfois des dépenses perso ou pioche selon le solde disponible.", s: 0, tag: "Mélange des trésoreries" } ] },
    { q: "Connaissez-vous votre coût de revient exact et votre marge sur chaque produit ou service ?", o: [
      { t: "Oui, tout est calculé précisément sur grille tarifaire.", s: 20, tag: "Coûts maîtrisés" },
      { t: "Approximativement, je me fie plutôt aux prix des concurrents.", s: 5, tag: "Marge incertaine" } ] },
    { q: "Combien de temps vos factures clients restent-elles généralement en souffrance ?", o: [
      { t: "Moins de 15 jours (procédures de relance automatisées).", s: 20, tag: "Encaissements rapides" },
      { t: "Entre 30 et 60 jours.", s: 10, tag: "Délais clients moyens" },
      { t: "Plus de 60 jours, ou aucun suivi régulier des impayés.", s: 0, tag: "Créances à risque" } ] },
    { q: "Votre entreprise a-t-elle déjà manqué de liquidités un mois pourtant déclaré bénéficiaire ?", o: [
      { t: "Jamais, la trésorerie suit toujours la rentabilité.", s: 20, tag: "Trésorerie alignée" },
      { t: "Oui, régulièrement (problème récurrent de BFR).", s: 0, tag: "BFR non financé" } ] },
    { q: "Disposez-vous d’une feuille de route opérationnelle ou d’un tableau de suivi pour les 90 prochains jours ?", o: [
      { t: "Oui, plan d’action structuré avec des indicateurs précis.", s: 20, tag: "Pilotage rigoureux" },
      { t: "Non, gestion au jour le jour.", s: 0, tag: "Pilotage à vue" } ] },
  ];
  let step = 0, answers = [], total = 0;

  const el = (tag, cls, text) => { const n = document.createElement(tag); if (cls) n.className = cls; if (text) n.textContent = text; return n; };

  function renderQuestion() {
    const item = QUESTIONS[step];
    $("quiz-step").textContent = `Question ${step + 1} / ${QUESTIONS.length}`;
    $("quiz-bar").style.width = `${((step + 1) / QUESTIONS.length) * 100}%`;
    const body = $("quiz-body");
    body.replaceChildren();
    body.appendChild(el("h4", "q-title", item.q));
    const list = el("div", "q-options");
    item.o.forEach((opt, i) => {
      const b = el("button", "q-opt"); b.type = "button";
      b.appendChild(el("span", "q-key", String.fromCharCode(65 + i)));
      b.appendChild(el("span", "", opt.t));
      b.addEventListener("click", () => { answers.push(opt); step++; step < QUESTIONS.length ? renderQuestion() : renderResult(); });
      list.appendChild(b);
    });
    body.appendChild(list);
  }

  function renderResult() {
    total = answers.reduce((a, c) => a + c.s, 0);
    $("quiz-run").hidden = true; $("quiz-result").hidden = false;
    $("quiz-score").textContent = `${total}/100`;
    const f = $("quiz-findings"); f.replaceChildren();
    answers.forEach((a, i) => {
      const best = Math.max(...QUESTIONS[i].o.map((o) => o.s));
      const level = a.s === best ? "ok" : a.s > 0 ? "mid" : "ko";
      const li = el("li", level);
      li.appendChild(el("span", "", a.tag));
      li.appendChild(el("b", "", level === "ok" ? "Point solide" : level === "mid" ? "À améliorer" : "À corriger"));
      f.appendChild(li);
    });
    let title, desc, presc;
    if (total >= 80) {
      title = "Excellente santé financière"; desc = "Vos fondations sont très solides. ConsultIng peut vous accompagner sur le passage à l’échelle.";
      presc = ["Optimisation fiscale et structuration des investissements.", "Mise en place d’un tableau de bord prospectif à 12 mois."];
    } else if (total >= 50) {
      title = "Santé fragilisée, à consolider"; desc = "Votre entreprise produit de la valeur mais souffre de fuites de trésorerie ou d’un manque de visibilité.";
      presc = ["Établissement prioritaire d’une feuille de route opérationnelle sur 90 jours.", "Normalisation de la rémunération du dirigeant et séparation stricte des comptes.", "Automatisation du processus de relance des créances clients."];
    } else {
      title = "Alerte rouge : diagnostic urgent"; desc = "Vos comptes nécessitent un assainissement immédiat pour éviter un blocage d’activité.";
      presc = ["Audit d’urgence des impayés et renégociation des délais fournisseurs.", "Calcul immédiat du coût de revient exact sur vos 3 offres principales.", "Consultation stratégique avec le cabinet sous 48 h."];
    }
    $("quiz-title").textContent = title; $("quiz-desc").textContent = desc;
    const p = $("quiz-presc"); p.replaceChildren();
    presc.forEach((t) => p.appendChild(el("li", "", t)));
    $("quiz-result").scrollIntoView({ block: "nearest" });
  }

  $("quiz-restart").addEventListener("click", () => {
    step = 0; answers = []; total = 0;
    $("quiz-result").hidden = true; $("quiz-run").hidden = false; renderQuestion();
  });
  $("quiz-cta").addEventListener("click", () => {
    const tags = answers.map((a) => a.tag);
    const cash = tags.includes("Créances à risque") || tags.includes("BFR non financé");
    askDiagnostic({
      formule: "Bilan Flash",
      defi: cash ? "Problème de trésorerie / BFR sous tension" : tags.includes("Pilotage à vue") ? "Manque de visibilité / Absence de tableau de bord" : "",
      note: `Résultat du quiz flash : ${total}/100. ` + answers.map((a, i) => `${a.tag} (${a.s === Math.max(...QUESTIONS[i].o.map((o) => o.s)) ? "solide" : a.s > 0 ? "à améliorer" : "à corriger"})`).join(", ") + ".",
    });
  });
})();
