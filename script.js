// ---------------------------------------------------------------------------
// Réglages à compléter (voir README.md)
// ---------------------------------------------------------------------------
const SITE = {
  // Vidéo de présentation : déposer assets/intro.mp4 (et assets/intro-poster.jpg),
  // ou renseigner ici le lien d'intégration YouTube / Vimeo (ex. "https://www.youtube.com/embed/XXXX").
  videoEmbedUrl: "",
  // Publications LinkedIn : renseigner UNE des trois options.
  linkedin: {
    elfsightId: "",   // identifiant Elfsight (la partie après "elfsight-app-")
    juicerFeed: "",   // nom du flux Juicer
    postUrls: [],     // ou liens d'intégration de posts : "https://www.linkedin.com/embed/feed/update/urn:li:share:XXXX"
  },
};
const CONTACT = { whatsapp: "https://wa.me/237680807047", email: "cabconsulting0@gmail.com" };


const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
const root = document.documentElement;

// Entrée de l'accueil, une fois les polices prêtes.
const start = () => requestAnimationFrame(() => root.classList.add("loaded"));
if (document.fonts && document.fonts.ready) document.fonts.ready.then(start); else start();
setTimeout(start, 1500);

// En-tête : devient plein après l'accueil.
const header = document.querySelector(".site-header");
const onScroll = () => header.classList.toggle("stuck", window.scrollY > 40);
window.addEventListener("scroll", onScroll, { passive: true });
onScroll();

// Apparition au défilement, avec décalage entre cartes voisines.
const io = new IntersectionObserver((entries) => {
  entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } });
}, { threshold: 0.15, rootMargin: "0px 0px -6% 0px" });
document.querySelectorAll("[data-reveal]").forEach((el) => {
  const siblings = [...el.parentElement.children].filter((n) => n.hasAttribute("data-reveal"));
  el.style.setProperty("--d", `${siblings.indexOf(el) * 0.12}s`);
  io.observe(el);
});

if (finePointer && !reduced) {
  // Inclinaison 3D et reflet des cartes.
  document.querySelectorAll("[data-tilt]").forEach((card) => {
    const max = card.classList.contains("portrait") ? 6 : 9;
    card.addEventListener("pointermove", (e) => {
      const r = card.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width, py = (e.clientY - r.top) / r.height;
      card.classList.add("tilting");
      card.style.setProperty("--rx", `${(0.5 - py) * max * 2}deg`);
      card.style.setProperty("--ry", `${(px - 0.5) * max * 2}deg`);
      card.style.setProperty("--gx", `${px * 100}%`);
      card.style.setProperty("--gy", `${py * 100}%`);
      card.style.setProperty("--glare", 1);
    });
    card.addEventListener("pointerleave", () => {
      card.classList.remove("tilting");
      ["--rx", "--ry", "--glare"].forEach((p) => card.style.removeProperty(p));
    });
  });

  // Boutons magnétiques.
  document.querySelectorAll(".magnetic").forEach((btn) => {
    btn.addEventListener("pointermove", (e) => {
      const r = btn.getBoundingClientRect();
      btn.style.transform = `translate(${(e.clientX - r.left - r.width / 2) * 0.18}px, ${(e.clientY - r.top - r.height / 2) * 0.28}px)`;
    });
    btn.addEventListener("pointerleave", () => { btn.style.transform = ""; });
  });

  // Halo lumineux qui suit le pointeur dans l'accueil.
  const hero = document.querySelector(".hero");
  hero.addEventListener("pointermove", (e) => {
    const r = hero.getBoundingClientRect();
    hero.style.setProperty("--mx", `${e.clientX - r.left}px`);
    hero.style.setProperty("--my", `${e.clientY - r.top}px`);
  });
}

// Bande de mots : défile en continu et accélère avec le défilement de la page.
const track = document.querySelector(".band-track");
if (track && !reduced) {
  let x = 0, last = performance.now(), lastY = window.scrollY, boost = 0;
  const loop = (now) => {
    const dt = (now - last) / 1000; last = now;
    const y = window.scrollY;
    boost += ((y - lastY) * 0.9 - boost) * 0.12; lastY = y;
    x = (x - (50 * dt + boost)) % (track.scrollWidth / 2);
    track.style.transform = `translate3d(${x}px,0,0)`;
    requestAnimationFrame(loop);
  };
  requestAnimationFrame(loop);
}

// ---------------------------------------------------------------------------
// Vidéo d'introduction : la section n'apparaît que si une vidéo est disponible.
// ---------------------------------------------------------------------------
(function () {
  const section = document.getElementById("presentation");
  const player = document.getElementById("player");
  if (!section || !player) return;
  if (SITE.videoEmbedUrl) {
    const frame = document.createElement("iframe");
    frame.src = SITE.videoEmbedUrl;
    frame.title = "Présentation de ConsultIng en 60 secondes";
    frame.allow = "accelerometer; autoplay; encrypted-media; picture-in-picture; fullscreen";
    frame.allowFullscreen = true;
    frame.loading = "lazy";
    player.replaceChildren(frame);
    section.hidden = false;
    return;
  }
  const video = player.querySelector("video");
  if (!video) return;
  video.addEventListener("loadedmetadata", () => { section.hidden = false; }, { once: true });
  video.load();
  // Lecture automatique, sans son, quand la vidéo arrive à l'écran (sauf si le visiteur réduit les animations).
  if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    video.muted = true;
    let started = false;
    new IntersectionObserver((entries, obs) => {
      if (!started && entries[0].isIntersecting) {
        started = true; obs.disconnect();
        video.play().catch(() => {});
      }
    }, { threshold: 0.5 }).observe(player);
  }
})();

// ---------------------------------------------------------------------------
// L'Œil de la Consultante : flux LinkedIn (widget ou posts intégrés).
// Rien n'est chargé depuis un service tiers tant qu'un réglage n'est pas renseigné.
// ---------------------------------------------------------------------------
(function () {
  const feed = document.getElementById("linkedin-feed");
  if (!feed) return;
  const { elfsightId, juicerFeed, postUrls } = SITE.linkedin;
  const loadScript = (src) => { const s = document.createElement("script"); s.src = src; s.async = true; document.body.appendChild(s); };

  if (elfsightId) {
    const box = document.createElement("div");
    box.className = "elfsight-app-" + elfsightId;
    box.setAttribute("data-elfsight-app-lazy", "");
    feed.replaceChildren(box);
    loadScript("https://static.elfsight.com/platform/platform.js");
  } else if (juicerFeed) {
    const css = document.createElement("link");
    css.rel = "stylesheet"; css.href = "https://assets.juicer.io/embed.css";
    document.head.appendChild(css);
    const ul = document.createElement("ul");
    ul.className = "juicer-feed"; ul.setAttribute("data-feed-id", juicerFeed);
    feed.replaceChildren(ul);
    loadScript("https://assets.juicer.io/embed.js");
  } else if (postUrls.length) {
    const grid = document.createElement("div");
    grid.className = "posts";
    postUrls.slice(0, 3).forEach((url, i) => {
      const f = document.createElement("iframe");
      f.src = url; f.loading = "lazy"; f.title = "Publication LinkedIn " + (i + 1);
      f.height = "560"; f.setAttribute("frameborder", "0"); f.allowFullscreen = true;
      grid.appendChild(f);
    });
    feed.replaceChildren(grid);
  }
})();

// ---------------------------------------------------------------------------
// Formules : pré-sélectionne la formule choisie depuis la grille tarifaire.
// ---------------------------------------------------------------------------
document.querySelectorAll("[data-formule]").forEach((link) => {
  link.addEventListener("click", () => { document.getElementById("formule").value = link.dataset.formule; });
});

// ---------------------------------------------------------------------------
// Formulaire de demande de diagnostic : envoi réel, puis message de confirmation.
// ---------------------------------------------------------------------------
const form = document.getElementById("contact-form");
const errorBox = document.getElementById("form-error");
const okBox = document.getElementById("form-ok");
const submitBtn = document.getElementById("form-submit");

function showError(html) { errorBox.innerHTML = html; errorBox.hidden = false; }

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  errorBox.hidden = true;

  const missing = [...form.querySelectorAll("[required]")].filter((f) => !f.value.trim() || (f.type === "email" && !f.checkValidity()));
  if (missing.length) {
    missing[0].focus();
    showError("Merci de renseigner : nom, e-mail professionnel valide, numéro WhatsApp ou téléphone, entreprise, secteur d’activité et défi prioritaire.");
    return;
  }

  submitBtn.disabled = true;
  const label = submitBtn.textContent;
  submitBtn.textContent = "Envoi en cours…";
  try {
    const res = await fetch("/", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams(new FormData(form)).toString(),
    });
    if (!res.ok) throw new Error("HTTP " + res.status);
    form.hidden = true;
    okBox.hidden = false;
    okBox.focus();
  } catch (err) {
    showError(`Votre demande n’a pas pu être envoyée. Écrivez-nous directement : <a href="${CONTACT.whatsapp}" target="_blank" rel="noopener">WhatsApp</a> ou <a href="mailto:${CONTACT.email}">${CONTACT.email}</a>.`);
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = label;
  }
});
