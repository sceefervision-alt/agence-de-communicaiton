// À remplacer par l'adresse e-mail réelle de ConsultIng.
const CONTACT_EMAIL = "contact@votredomaine.com";

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

// Pré-sélectionne la formule choisie depuis la grille tarifaire.
document.querySelectorAll("[data-formule]").forEach((link) => {
  link.addEventListener("click", () => { document.getElementById("formule").value = link.dataset.formule; });
});

// Le formulaire ouvre le client mail avec le message prêt à envoyer.
const form = document.getElementById("contact-form");
const error = document.getElementById("form-error");
form.addEventListener("submit", (e) => {
  e.preventDefault();
  const data = new FormData(form);
  const nom = (data.get("nom") || "").trim();
  const email = (data.get("email") || "").trim();
  const message = (data.get("message") || "").trim();
  const valid = nom && message && /^\S+@\S+\.\S+$/.test(email);
  error.hidden = !!valid;
  if (!valid) return;

  const subject = `Demande de consultation – ${data.get("formule")}`;
  const body = `Nom : ${nom}\nE-mail : ${email}\nFormule : ${data.get("formule")}\n\n${message}`;
  window.location.href = `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
});
