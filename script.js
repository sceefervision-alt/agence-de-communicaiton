// À remplacer par l'adresse e-mail réelle de ConsultIng.
const CONTACT_EMAIL = "contact@votredomaine.com";

// Tracé d'électrocardiogramme qui monte dans le « I » du logo.
function drawPulse() {
  const mark = document.querySelector(".wordmark");
  const text = mark && mark.querySelector(".wordmark-text");
  const letter = text && text.querySelector(".i");
  const svg = mark && mark.querySelector(".pulse");
  if (!svg) return;

  const m = mark.getBoundingClientRect();
  const l = letter.getBoundingClientRect();
  const w = m.width, h = m.height;
  const x = l.left - m.left + l.width / 2;
  const base = h * 0.9;           // ligne de base du tracé
  const top = h * 0.0;             // sommet du pic, haut du « I »
  const low = h * 0.98;
  const u = h * 0.07;              // petite unité de tracé

  const d = [
    `M0 ${base}`,
    `H${x - u * 9}`,
    `l${u} 0 l${u} ${-u * 1.2} l${u} ${u * 1.2} l${u * 0.6} 0`,
    `l${u * 0.7} ${u * 1.4} l${u * 0.9} ${-u * 2.4}`,
    `L${x} ${top}`,
    `L${x + u * 1.1} ${low}`,
    `L${x + u * 2.2} ${base}`,
    `H${w}`,
  ].join(" ");

  svg.setAttribute("viewBox", `0 0 ${w} ${h}`);
  const path = svg.querySelector("path");
  path.setAttribute("d", d);
  path.style.setProperty("--len", Math.ceil(path.getTotalLength()) + 2);
}

let resizeTimer;
window.addEventListener("resize", () => { clearTimeout(resizeTimer); resizeTimer = setTimeout(drawPulse, 150); });
if (document.fonts && document.fonts.ready) document.fonts.ready.then(drawPulse);
drawPulse();

// Pré-sélectionne la formule choisie depuis la grille tarifaire.
document.querySelectorAll("[data-formule]").forEach((link) => {
  link.addEventListener("click", () => {
    document.getElementById("formule").value = link.dataset.formule;
  });
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
