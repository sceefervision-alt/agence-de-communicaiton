// L'univers de Bao : boutique d'accessoires, jardin, trophées et évolution.

import { SHOP, TROPHIES, buy, toggleEquip } from './rewards.js';
import { panda, garden, STAGES } from './panda.js';
import { recalledCount } from './progress.js';
import { LEVELS } from './curriculum.js';
import { state, app, persist, esc, $$, toast, icon, bambooIcon, bao, stage, level, items, cards, updateBambooCounter } from './app-state.js';

const SLOT_LABEL = { head: 'Chapeaux', eyes: 'Lunettes', neck: 'Cou', garden: 'Jardin' };
const STAGE_GIFTS = ['Une pousse de bambou', 'Une écharpe', 'Des lunettes', 'Un béret', 'Un nœud papillon', 'Le chapeau de diplômé'];

export function gardenScene() {
  const stalks = 2 + Math.floor(recalledCount(items(), cards()) / 3);
  return `<div class="garden-wrap">${garden({ stalks, level: stage(), decor: state.rewards.garden })}<div class="garden-bao">${bao(stalks > 4 ? 'happy' : 'hello', 92)}</div></div>`;
}

export function renderBao() {
  const r = state.rewards;
  const st = stage();
  const lv = level();
  const unlocked = TROPHIES.filter((t) => r.trophies[t.id]).length;

  const shopCard = (item) => {
    const owned = r.owned.includes(item.id);
    const worn = item.slot === 'garden' ? r.garden.includes(item.id) : r.equipped[item.slot] === item.id;
    const preview =
      item.slot === 'garden'
        ? `<div class="shop-garden">${garden({ stalks: 2, level: st, decor: [item.id], width: 220, height: 110 })}</div>`
        : panda({ mood: 'happy', size: 96, stage: st, equipped: { ...r.equipped, [item.slot]: item.id } });
    return `<div class="shop-item ${worn ? 'worn' : ''}">
      ${preview}
      <strong>${esc(item.name)}</strong>
      ${
        owned
          ? `<button class="btn ${worn ? 'primary' : ''}" data-equip="${item.id}">${worn ? `${icon('check', 16)} ${item.slot === 'garden' ? 'Installé' : 'Porté'}` : item.slot === 'garden' ? 'Installer' : 'Porter'}</button>`
          : `<button class="btn" data-buy="${item.id}" ${r.bamboo < item.cost ? 'disabled' : ''}>${bambooIcon(16)} ${item.cost}</button>`
      }
    </div>`;
  };

  app.innerHTML = `
    <section class="card hero level-${st} bao-hero">
      <div class="bao-hero-panda">${bao('proud', 170)}</div>
      <div>
        <p class="eyebrow">Votre compagnon</p>
        <h1>Bao</h1>
        <p>Bao grandit avec vous : à chaque niveau terminé, il reçoit une nouvelle tenue. Habillez-le et décorez son jardin avec les bambous gagnés en apprenant.</p>
        <span class="bamboo-pill big">${bambooIcon(22)} ${r.bamboo} bambous</span>
      </div>
    </section>

    <section class="card">
      <h2>Le jardin de Bao</h2>
      <p class="muted small">Chaque élément ancré en mémoire fait pousser du bambou. Le ciel change avec votre niveau.</p>
      ${gardenScene()}
    </section>

    <section class="card">
      <div class="row spread"><h2>Évolution</h2><span class="badge">${esc(LEVELS[lv.current].cefr)} · ${esc(LEVELS[lv.current].name)}</span></div>
      <div class="evolution">
        ${STAGES.map(
          (_, i) => `<div class="evo ${i <= st ? 'reached' : 'locked'}">
            ${panda({ mood: i <= st ? 'happy' : 'sleep', size: 84, stage: i })}
            <strong>${esc(LEVELS[i].cefr)}</strong>
            <span class="small muted">${i <= st ? esc(STAGE_GIFTS[i]) : `${icon('lock', 12)} ${esc(STAGE_GIFTS[i])}`}</span>
          </div>`,
        ).join('')}
      </div>
    </section>

    <section class="card">
      <div class="row spread"><h2>Boutique</h2><span class="bamboo-pill">${bambooIcon(16)} ${r.bamboo}</span></div>
      <p class="muted small">Les bambous se gagnent en apprenant vraiment : éléments ancrés, compétences validées, objectif de la semaine, défi du jour. Jamais en payant.</p>
      ${['head', 'eyes', 'neck', 'garden']
        .map((slot) => `<h3 class="shop-title">${SLOT_LABEL[slot]}</h3><div class="shop">${SHOP.filter((i) => i.slot === slot).map(shopCard).join('')}</div>`)
        .join('')}
    </section>

    <section class="card">
      <div class="row spread"><h2>Trophées</h2><span class="badge">${unlocked} / ${TROPHIES.length}</span></div>
      <div class="trophies">
        ${TROPHIES.map((t) => `<div class="trophy ${r.trophies[t.id] ? 'got' : ''}">${icon(r.trophies[t.id] ? 'sparkle' : 'lock', 22)}<strong>${esc(t.name)}</strong><span>${esc(t.desc)}</span></div>`).join('')}
      </div>
    </section>`;

  $$('[data-buy]').forEach((b) =>
    b.addEventListener('click', () => {
      try {
        state.rewards = buy(state.rewards, b.dataset.buy);
        if (!state.rewards.trophies.style) state.rewards.trophies.style = new Date().toISOString().slice(0, 10);
        persist();
        updateBambooCounter();
        toast('Bao adore son cadeau !');
        renderBao();
      } catch (err) {
        toast(err.message);
      }
    }),
  );
  $$('[data-equip]').forEach((b) =>
    b.addEventListener('click', () => {
      state.rewards = toggleEquip(state.rewards, b.dataset.equip);
      persist();
      renderBao();
    }),
  );
}
