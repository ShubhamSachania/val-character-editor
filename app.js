// Valheim Inventory & Character Forge Client Application

let currentCharacter = null;
let currentFileName = '';
let currentFilePath = '';
let currentFileHandle = null;
let activeSlotPos = { x: 0, y: 0 };
let draggedSlotPos = null;
let currentGridRows = 5; // Default 5 rows (40 slots) to support unlocked extra row

// UI Containers
const uploadDropzone = document.getElementById('upload-dropzone');
const editorWorkspace = document.getElementById('editor-workspace');
const gridContainer = document.getElementById('valheim-inventory-grid');
const equippedContainer = document.getElementById('equipped-gear-container');
const activeFoodsContainer = document.getElementById('active-foods-container');
const skillsContainer = document.getElementById('skills-list-container');
const progressionContainer = document.getElementById('progression-summary-container');
const selectGridRows = document.getElementById('select-grid-rows');

// Header Action Buttons
const btnLoadFile = document.getElementById('btn-load-file');
const btnSaveOverwrite = document.getElementById('btn-save-overwrite');
const btnExportFch = document.getElementById('btn-export-fch');
const btnExportJson = document.getElementById('btn-export-json');
const fileInput = document.getElementById('fch-file-input');

// Modals
const modalConfirmOverwrite = document.getElementById('modal-confirm-overwrite');
const confirmOverwriteFilename = document.getElementById('confirm-overwrite-filename');
const btnCloseConfirmModal = document.getElementById('btn-close-confirm-modal');
const btnCancelOverwrite = document.getElementById('btn-cancel-overwrite');
const btnExecuteOverwrite = document.getElementById('btn-execute-overwrite');

const modalItemEditor = document.getElementById('modal-item-editor');
const modalCatalog = document.getElementById('modal-item-catalog');
const modalCharStats = document.getElementById('modal-char-stats');

// Item Editor Inputs
const itemIdInput = document.getElementById('item-id-input');
const itemStackInput = document.getElementById('item-stack-input');
const itemQualitySelect = document.getElementById('item-quality-select');
const itemDurabilityInput = document.getElementById('item-durability-input');
const itemCrafterInput = document.getElementById('item-crafter-input');
const itemEquippedCheckbox = document.getElementById('item-equipped-checkbox');
const itemCheatedCheckbox = document.getElementById('item-cheated-checkbox');
const modalItemTitle = document.getElementById('modal-item-title');

// Catalog Search
const catalogSearchInput = document.getElementById('catalog-search-input');
const catalogCategories = document.getElementById('catalog-categories-container');
const catalogGrid = document.getElementById('catalog-grid');

// Alias mappings for friendly item names & game prefabs
const ITEM_ALIASES = {
  'staffoffracture': 'StaffClusterbomb',
  'stafffracture': 'StaffClusterbomb',
  'staffoffracturing': 'StaffClusterbomb',
  'staffclusterbomb': 'StaffClusterbomb',
  'seekeraspic': 'SeekerAspic',
  'seekeraspicfood': 'SeekerAspic',
  'volturemeat': 'CookedVoltureMeat',
  'cookedvolturemeat': 'CookedVoltureMeat',
  'feathercape': 'CapeFeather',
  'capefeather': 'CapeFeather'
};

// Helper to get item metadata from database
function getItemInfo(itemName) {
  if (!itemName || typeof VALHEIM_ITEMS === 'undefined') return null;
  const clean = itemName.toLowerCase().replace(/[^a-z0-9]/g, '');
  const aliasId = ITEM_ALIASES[clean];
  if (aliasId) {
    const found = VALHEIM_ITEMS.find(i => i.id.toLowerCase() === aliasId.toLowerCase());
    if (found) return found;
  }
  return VALHEIM_ITEMS.find(i => {
    const idClean = i.id.toLowerCase().replace(/[^a-z0-9]/g, '');
    const nameClean = i.name.toLowerCase().replace(/[^a-z0-9]/g, '');
    return idClean === clean || nameClean === clean;
  }) || null;
}

// Generate HTML <img> for item's authentic game icon
function getItemIconHtml(itemName) {
  if (!itemName) return `<span style="font-size: 1.5rem;">📦</span>`;
  const info = getItemInfo(itemName);
  let iconPath = `icons/${itemName}.png`;
  if (info && info.icon) {
    iconPath = info.icon;
  } else {
    const cleanId = itemName.replace(/[^a-zA-Z0-9_]/g, '');
    iconPath = `icons/${cleanId}.png`;
  }

  const cat = info ? info.category : 'Weapons';
  const emojiMap = {
    Weapons: '⚔️',
    Shields: '🛡️',
    Armor: '🪖',
    Magic: '🔮',
    Tools: '⛏️',
    Food: '🍖',
    Potions: '🧪',
    Ammo: '🏹',
    Trophies: '🏆',
    Accessories: '💍',
    Materials: '💎'
  };
  const fallbackEmoji = emojiMap[cat] || '⚔️';

  return `<img src="${iconPath}" class="item-sprite-img" alt="${itemName}" onerror="if (!this.dataset.triedAlt) { this.dataset.triedAlt = '1'; this.src = this.src.endsWith('.png') ? this.src.replace(/\\.png$/, '.svg') : this.src.replace(/\\.svg$/, '.png'); } else { this.style.display='none'; if (this.nextElementSibling) this.nextElementSibling.style.display='inline'; }"><span class="fallback-icon" style="display:none; font-size:1.4rem;">${fallbackEmoji}</span>`;
}

// Toast Notifications
function showToast(message, type = 'success') {
  const container = document.getElementById('toast-container');
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `<span>${type === 'success' ? '✅' : '⚠️'}</span><span>${message}</span>`;
  container.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = '0';
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}

// Load and parse a user-selected file (.fch or .json)
async function handleFileSelected(file) {
  if (!file) return;

  currentFileName = file.name;

  if (file.name.endsWith('.json')) {
    try {
      const text = await file.text();
      currentCharacter = JSON.parse(text);
      onCharacterLoaded();
      showToast(`Loaded ${file.name} (${currentCharacter.playerName})`, 'success');
    } catch (err) {
      showToast('Invalid JSON file format.', 'error');
    }
  } else if (file.name.endsWith('.fch') || file.name.endsWith('.fch.old') || file.name.endsWith('.fch.bak')) {
    try {
      showToast('Decoding .fch save file...', 'success');
      const arrayBuffer = await file.arrayBuffer();
      const res = await fetch('/api/upload-fch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/octet-stream' },
        body: arrayBuffer
      });

      if (res.ok) {
        currentCharacter = await res.json();
        onCharacterLoaded();
        showToast(`Loaded ${file.name} (${currentCharacter.playerName})!`, 'success');
      } else {
        const errData = await res.json();
        showToast(errData.error || 'Failed to decode .fch file', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Error uploading save to decoder: ' + err.message, 'error');
    }
  } else {
    showToast('Please select a .fch or .json Valheim character file.', 'error');
  }
}

function onCharacterLoaded() {
  uploadDropzone.style.display = 'none';
  editorWorkspace.style.display = 'flex';

  btnSaveOverwrite.style.display = 'inline-flex';
  btnExportFch.style.display = 'inline-flex';
  btnExportJson.style.display = 'inline-flex';

  // Auto-detect unlocked extra rows from character inventory
  const inventory = (currentCharacter && currentCharacter.playerData && currentCharacter.playerData.inventory) || [];
  let maxY = 3;
  inventory.forEach(it => {
    if (it.pos && typeof it.pos.y === 'number' && it.pos.y > maxY) {
      maxY = it.pos.y;
    }
  });
  // Default to at least 5 rows so the unlocked extra row is visible, or higher if needed
  currentGridRows = Math.max(5, maxY + 1);
  if (selectGridRows) {
    selectGridRows.value = String(currentGridRows);
  }

  renderAll();
}

function switchCharacterFile() {
  currentCharacter = null;
  currentFileName = '';
  currentFilePath = '';
  currentFileHandle = null;
  uploadDropzone.style.display = 'block';
  editorWorkspace.style.display = 'none';

  btnSaveOverwrite.style.display = 'none';
  btnExportFch.style.display = 'none';
  btnExportJson.style.display = 'none';

  fileInput.value = '';
  loadDetectedSaves();
}

// Render everything
function renderAll() {
  if (!currentCharacter) return;

  renderHeroBanner();
  renderInventoryHUD();
  renderEquippedGear();
  renderActiveFoods();
  renderInventoryGrid();
  renderSkills();
  renderProgression();
}

// Calculate in-game Total Armor and Carry Weight
function calculateInGameStats() {
  const pd = currentCharacter.playerData || {};
  const inventory = pd.inventory || [];

  let totalArmor = 0;
  let totalWeight = 0;
  let hasMegingjord = false;

  inventory.forEach(item => {
    const q = item.quality || 1;
    const stack = item.stack || 1;

    // Weight approximation
    let itemWeight = 1.0;
    const lower = item.name.toLowerCase();
    if (lower.includes('scrap') || lower.includes('bar') || lower.includes('ore') || lower.includes('metal') || lower.includes('silver') || lower.includes('iron') || lower.includes('copper') || lower.includes('gold')) {
      itemWeight = 10.0;
    } else if (lower.includes('wood') || lower.includes('stone') || lower.includes('marble')) {
      itemWeight = 2.0;
    } else if (lower.includes('cuirass') || lower.includes('breastplate') || lower.includes('towershield') || lower.includes('heavychest')) {
      itemWeight = 10.0;
    } else if (lower.includes('greaves') || lower.includes('atgeir') || lower.includes('hammer') || lower.includes('heavylegs')) {
      itemWeight = 5.0;
    } else if (lower.includes('arrow') || lower.includes('bolt') || lower.includes('feather')) {
      itemWeight = 0.1;
    }

    totalWeight += itemWeight * stack;

    if (item.equipped) {
      if (item.name === 'BeltStrength') hasMegingjord = true;

      // Armor calculation
      let baseArmor = 0;
      if (lower.includes('deepnorthheavy') || lower.includes('protector') || lower.includes('dnheavy')) baseArmor = 42;
      else if (lower.includes('flametal')) baseArmor = 36;
      else if (lower.includes('deepnorthmedium') || lower.includes('vanguard') || lower.includes('dnmedium')) baseArmor = 34;
      else if (lower.includes('carapace')) baseArmor = 32;
      else if (lower.includes('padded')) baseArmor = 26;
      else if (lower.includes('lox')) baseArmor = 24;
      else if (lower.includes('deepnorthmage') || lower.includes('caller') || lower.includes('dnmage')) baseArmor = 22;
      else if (lower.includes('silver') || lower.includes('wolf')) baseArmor = 20;
      else if (lower.includes('mage')) baseArmor = 16;
      else if (lower.includes('iron')) baseArmor = 14;
      else if (lower.includes('bronze')) baseArmor = 8;
      else if (lower.includes('leather')) baseArmor = 2;
      else if (lower.includes('cape')) baseArmor = 1;

      if (baseArmor > 0) {
        totalArmor += baseArmor + (q - 1) * (baseArmor <= 2 ? 1 : 2);
      }
    }
  });

  let maxWeight = 300;
  if (hasMegingjord) maxWeight += 150;
  if (pd.guardianPower === 'GP_Fader') maxWeight += 300;

  return { totalArmor, totalWeight: Math.round(totalWeight), maxWeight, slotsUsed: inventory.length };
}

// Render Top Hero Banner
function renderHeroBanner() {
  document.getElementById('display-char-name').textContent = currentCharacter.playerName || 'Viking';
  document.getElementById('badge-version').textContent = `Save v${currentCharacter.saveVersion || 43}`;
  document.getElementById('badge-id').textContent = `ID: ${currentCharacter.playerId || 'Unknown'}`;
  document.getElementById('badge-filename').textContent = `File: ${currentFileName || (currentCharacter.playerName + '.fch')}`;

  const pd = currentCharacter.playerData || {};
  document.getElementById('display-health').textContent = `❤️ ${(pd.health || 25).toFixed(0)} / ${(pd.maxHealth || 25).toFixed(0)}`;
  document.getElementById('display-stamina').textContent = `⚡ ${(pd.stamina || 50).toFixed(0)}${pd.stamina2 > 0 ? ` (+${pd.stamina2.toFixed(0)})` : ''}`;
  document.getElementById('display-eitr').textContent = `✨ ${(pd.eitr || 0).toFixed(0)} / ${(pd.maxEitr || 0).toFixed(0)}`;

  const gp = pd.guardianPower ? pd.guardianPower.replace('GP_', '') : 'None';
  document.getElementById('display-guardian').textContent = `💀 ${gp}`;

  const invCount = (pd.inventory || []).length;
  const totalSlots = 8 * currentGridRows;
  document.getElementById('badge-items-count').textContent = `${invCount} / ${totalSlots} Slots`;

  // Cheat Status & Steam Achievements Eligibility
  renderCheatStatus();
}

function renderCheatStatus() {
  const card = document.getElementById('cheat-status-card');
  const icon = document.getElementById('cheat-badge-icon');
  const badge = document.getElementById('cheat-status-badge');
  const sub = document.getElementById('cheat-status-sub');
  const btn = document.getElementById('btn-revert-cheats');

  if (!card || !badge) return;

  const usedCheats = !!currentCharacter.usedCheats;
  const inventory = (currentCharacter.playerData && currentCharacter.playerData.inventory) || [];
  const cheatedItems = inventory.filter(item => !!item.cheated);
  const isCheated = usedCheats || cheatedItems.length > 0;

  if (isCheated) {
    card.style.display = 'flex';
    if (icon) icon.textContent = '⚠️';
    badge.className = 'badge badge-cheated';
    badge.textContent = 'Locked (Cheats Detected)';

    const reasons = [];
    if (usedCheats) reasons.push('Console cheats used (devcommands)');
    if (cheatedItems.length > 0) reasons.push(`${cheatedItems.length} cheated item${cheatedItems.length > 1 ? 's' : ''} in bag`);
    if (sub) sub.textContent = `${reasons.join(' & ')}. Steam achievements are disabled for this character!`;

    if (btn) btn.style.display = 'inline-flex';
  } else {
    card.style.display = 'flex';
    if (icon) icon.textContent = '🛡️';
    badge.className = 'badge badge-clean';
    badge.textContent = 'Eligible (Clean)';
    if (sub) sub.textContent = 'No console cheats or cheated items detected. Achievements will unlock normally.';
    if (btn) btn.style.display = 'none';
  }
}

// Render In-Game Stats Header (Armor & Weight HUD)
function renderInventoryHUD() {
  const stats = calculateInGameStats();
  const totalSlots = 8 * currentGridRows;
  document.getElementById('stat-armor-val').textContent = stats.totalArmor;
  document.getElementById('stat-weight-val').textContent = `${stats.totalWeight} / ${stats.maxWeight}`;
  document.getElementById('stat-slots-val').textContent = `${stats.slotsUsed} / ${totalSlots}`;
}

// Render Left Panel: Equipped Items
function renderEquippedGear() {
  equippedContainer.innerHTML = '';
  const pd = currentCharacter.playerData || {};
  const inventory = pd.inventory || [];
  const equippedItems = inventory.filter(it => it.equipped);

  if (equippedItems.length === 0) {
    equippedContainer.innerHTML = `
      <div style="font-size: 0.8rem; color: var(--valheim-text-muted); text-align: center; padding: 16px; font-family: var(--font-valheim);">
        No items currently equipped.<br>Equip gear in the inventory grid.
      </div>
    `;
    return;
  }

  equippedItems.forEach(item => {
    const card = document.createElement('div');
    card.className = 'equipped-slot-card active';
    const iconHtml = getItemIconHtml(item.name);
    const itemMeta = getItemInfo(item.name);
    const cat = itemMeta ? itemMeta.category : 'Gear';

    card.innerHTML = `
      <div class="slot-icon-box">
        ${iconHtml}
      </div>
      <div class="slot-info">
        <div class="slot-type-tag">${cat} ${item.quality > 1 ? `• Q${item.quality} ★` : ''}</div>
        <div class="slot-item-name" title="${item.name}">${itemMeta ? itemMeta.name : item.name}</div>
        <div class="slot-meta">
          <span>Durability: ${item.durability.toFixed(0)}</span>
          ${item.crafterName ? `<span>• By ${item.crafterName}</span>` : ''}
        </div>
      </div>
    `;

    card.addEventListener('click', () => {
      openItemEditor(item.pos.x, item.pos.y);
    });

    equippedContainer.appendChild(card);
  });
}

// Render Active Foods
function renderActiveFoods() {
  activeFoodsContainer.innerHTML = '';
  const pd = currentCharacter.playerData || {};
  const foods = pd.foods || [];

  if (foods.length === 0) {
    activeFoodsContainer.innerHTML = `<span style="font-size: 0.78rem; color: var(--valheim-text-muted); font-family: var(--font-valheim);">No active food buffs</span>`;
    return;
  }

  foods.forEach(f => {
    const badge = document.createElement('div');
    badge.className = 'vital-box';
    badge.style.minWidth = 'auto';
    badge.style.display = 'flex';
    badge.style.justifyContent = 'space-between';
    badge.style.alignItems = 'center';
    const iconHtml = getItemIconHtml(f.name);
    const info = getItemInfo(f.name);
    const displayName = info ? info.name : f.name;

    badge.innerHTML = `
      <div style="display: flex; align-items: center; gap: 8px;">
        <div style="width: 26px; height: 26px; display: flex; align-items: center; justify-content: center;">
          ${iconHtml}
        </div>
        <span style="font-weight: 600; font-size: 0.82rem; font-family: var(--font-valheim);">${displayName}</span>
      </div>
      <span style="color: var(--valheim-text-gold); font-size: 0.75rem; font-family: var(--font-valheim);">${(f.time || 0).toFixed(0)}s</span>
    `;
    activeFoodsContainer.appendChild(badge);
  });
}

// Render Center In-Game Grid (Supports Unlocked Extra Rows)
function renderInventoryGrid() {
  gridContainer.innerHTML = '';
  const pd = currentCharacter.playerData || {};
  const inventory = pd.inventory || [];

  const gridMap = {};
  inventory.forEach(it => {
    if (it.pos) {
      gridMap[`${it.pos.x},${it.pos.y}`] = it;
    }
  });

  const numRows = currentGridRows;
  const numCols = 8;

  const panelTitle = document.getElementById('inventory-panel-title');
  if (panelTitle) {
    panelTitle.textContent = `🎒 Inventory (8 x ${numRows})`;
  }

  // Valheim is 8 columns wide (x: 0..7) and dynamic rows tall (y: 0..numRows-1)
  for (let y = 0; y < numRows; y++) {
    for (let x = 0; x < numCols; x++) {
      const slot = document.createElement('div');
      const item = gridMap[`${x},${y}`];

      slot.className = 'inv-slot';
      slot.dataset.x = x;
      slot.dataset.y = y;
      slot.setAttribute('draggable', item ? 'true' : 'false');

      // In-game Hotbar Numbers on top row (y = 0: hotkeys 1 to 8)
      let hotkeyHtml = '';
      if (y === 0) {
        hotkeyHtml = `<div class="slot-hotkey-number">${x + 1}</div>`;
      }

      if (!item) {
        slot.classList.add('empty');
        slot.innerHTML = `${hotkeyHtml}`;
      } else {
        if (item.equipped) slot.classList.add('equipped');

        const iconHtml = getItemIconHtml(item.name);
        const info = getItemInfo(item.name);
        const displayName = info ? info.name : item.name;

        let qualityStars = '';
        if (item.quality > 1) {
          qualityStars = '★'.repeat(Math.min(item.quality, 5));
        }

        // Durability bar percentage calculation & color gradient
        const maxDur = (info && info.durability) ? info.durability : 1000;
        const durRatio = Math.min(1, Math.max(0, item.durability / maxDur));
        const durPercent = Math.max(5, durRatio * 100);
        let durColor = '#22c55e'; // Green
        if (durRatio < 0.25) durColor = '#ef4444'; // Red
        else if (durRatio < 0.6) durColor = '#eab308'; // Yellow

        const equippedTagHtml = item.equipped ? `<div class="slot-equipped-tag">E</div>` : '';

        slot.innerHTML = `
          ${hotkeyHtml}
          ${equippedTagHtml}
          <div class="slot-icon">${iconHtml}</div>
          ${qualityStars ? `<div class="slot-quality-stars">${qualityStars}</div>` : ''}
          ${item.stack > 1 ? `<div class="slot-stack-count">${item.stack}</div>` : ''}
          <div class="slot-durability-bar">
            <div class="slot-durability-fill" style="width: ${durPercent}%; background: ${durColor};"></div>
          </div>
          <div class="tooltip">
            <strong>${displayName}</strong> (${item.name})<br>
            <span>Quantity: ${item.stack}</span><br>
            <span>Quality: ${item.quality} ★</span><br>
            <span>Durability: ${item.durability.toFixed(0)} / ${maxDur}</span><br>
            ${item.crafterName ? `<span>Crafted by: ${item.crafterName}</span><br>` : ''}
            ${item.equipped ? `<span style="color: #60a5fa; font-weight: 700;">[Equipped]</span>` : ''}
          </div>
        `;
      }

      // Slot Click Event -> Open Editor
      slot.addEventListener('click', () => {
        openItemEditor(x, y);
      });

      // Drag and Drop
      slot.addEventListener('dragstart', (e) => {
        draggedSlotPos = { x, y };
        e.dataTransfer.setData('text/plain', `${x},${y}`);
        slot.style.opacity = '0.35';
      });

      slot.addEventListener('dragend', () => {
        slot.style.opacity = item ? '1' : '0.4';
      });

      slot.addEventListener('dragover', (e) => {
        e.preventDefault();
        slot.style.borderColor = 'var(--valheim-gold)';
      });

      slot.addEventListener('dragleave', () => {
        slot.style.borderColor = '';
      });

      slot.addEventListener('drop', (e) => {
        e.preventDefault();
        slot.style.borderColor = '';
        if (draggedSlotPos) {
          swapSlots(draggedSlotPos, { x, y });
          draggedSlotPos = null;
        }
      });

      gridContainer.appendChild(slot);
    }
  }
}

// Swap or Move items between slots
function swapSlots(posA, posB) {
  if (posA.x === posB.x && posA.y === posB.y) return;

  const inventory = currentCharacter.playerData.inventory;
  const itemA = inventory.find(i => i.pos.x === posA.x && i.pos.y === posA.y);
  const itemB = inventory.find(i => i.pos.x === posB.x && i.pos.y === posB.y);

  if (itemA && itemB) {
    itemA.pos = { x: posB.x, y: posB.y };
    itemB.pos = { x: posA.x, y: posA.y };
    showToast(`Swapped ${itemA.name} and ${itemB.name}`);
  } else if (itemA && !itemB) {
    itemA.pos = { x: posB.x, y: posB.y };
    showToast(`Moved ${itemA.name} to (${posB.x}, ${posB.y})`);
  }
  renderAll();
}

// Render Skills
const SKILL_ICONS = {
  Swords: '⚔️', Knives: '🗡️', Clubs: '🏏', Polearms: '🔱', Spears: '📍',
  Blocking: '🛡️', Axes: '🪓', Bows: '🏹', Crossbows: '🎯',
  ElementalMagic: '🔮', BloodMagic: '🩸', Unarmed: '🥊', Pickaxes: '⛏️',
  WoodCutting: '🪵', Jump: '🦘', Sneak: '🥷', Run: '🏃', Swim: '🏊',
  Fishing: '🎣', Cooking: '🍲', Farming: '🌾', Crafting: '🔨', Dodge: '🤸', Ride: '🐎'
};

function renderSkills() {
  skillsContainer.innerHTML = '';
  const pd = currentCharacter.playerData || {};
  const skills = pd.skills || {};

  const sortedSkills = Object.entries(skills).sort((a, b) => b[1].level - a[1].level);

  sortedSkills.forEach(([name, data]) => {
    const row = document.createElement('div');
    row.className = 'skill-row';
    const icon = SKILL_ICONS[name] || '⚡';
    row.innerHTML = `
      <div style="display: flex; align-items: center; gap: 6px;">
        <span>${icon}</span>
        <span class="skill-name">${name}</span>
      </div>
      <input type="number" class="skill-level-input" min="0" max="100" step="0.5" value="${data.level.toFixed(1)}" data-skill="${name}">
    `;

    const input = row.querySelector('.skill-level-input');
    input.addEventListener('change', (e) => {
      const val = parseFloat(e.target.value) || 0;
      data.level = Math.max(0, Math.min(100, val));
      showToast(`Updated ${name} to Level ${data.level.toFixed(1)}`);
    });

    skillsContainer.appendChild(row);
  });
}

// Render Progression Counts
function renderProgression() {
  progressionContainer.innerHTML = '';
  const pd = currentCharacter.playerData || {};
  const biomes = pd.knownBiomes || [];
  const biomeNames = biomes.map(b => typeof b === 'object' ? (b.name || b.id) : b);
  const hasDeepNorth = biomeNames.some(b => String(b).toLowerCase().includes('deep'));

  progressionContainer.innerHTML = `
    <div>📜 Known Recipes: <strong>${(pd.knownRecipes || []).length}</strong></div>
    <div>🪵 Known Materials: <strong>${(pd.knownMaterials || []).length}</strong></div>
    <div>🏆 Trophies Claimed: <strong>${(pd.trophies || []).length}</strong></div>
    <div>🌲 Discovered Biomes: <strong>${biomes.length}</strong></div>
    <div style="font-size:0.75rem; color:#67e8f9; line-height:1.4; margin: 2px 0 6px 0;">${biomeNames.join(', ') || 'None'}</div>
    <div>🔨 Crafting Stations: <strong>${Object.keys(pd.knownStations || {}).length}</strong></div>
    ${!hasDeepNorth ? `<button class="btn btn-secondary" id="btn-discover-deep-north" style="margin-top:6px; font-size:0.75rem; padding:4px 10px; width: 100%; justify-content: center;">❄️ Discover Deep North</button>` : `<div style="color:#a7f3d0; font-size:0.75rem; margin-top:4px; font-weight:600;">❄️ Deep North Discovered!</div>`}
  `;

  const btnDiscover = document.getElementById('btn-discover-deep-north');
  if (btnDiscover) {
    btnDiscover.addEventListener('click', () => {
      if (pd.version >= 33) {
        if (!pd.knownBiomes) pd.knownBiomes = [];
        pd.knownBiomes.push({ name: 'Deep North' });
      } else {
        if (!pd.knownBiomes) pd.knownBiomes = [];
        pd.knownBiomes.push({ id: 64, name: 'DeepNorth' });
      }
      renderProgression();
      showToast('Deep North biome discovered & registered to character!', 'success');
    });
  }
}

// Open Item Editor Modal
function openItemEditor(x, y) {
  activeSlotPos = { x, y };
  modalItemTitle.innerHTML = `<span>📦</span><span>Slot (${x}, ${y}) Editor</span>`;

  const inventory = currentCharacter.playerData.inventory;
  const item = inventory.find(i => i.pos.x === x && i.pos.y === y);

  if (item) {
    itemIdInput.value = item.name;
    itemStackInput.value = item.stack || 1;
    itemQualitySelect.value = Math.min(5, Math.max(1, item.quality || 1));
    itemDurabilityInput.value = Math.round(item.durability || 100);
    itemCrafterInput.value = item.crafterName || '';
    itemEquippedCheckbox.checked = !!item.equipped;
    if (itemCheatedCheckbox) itemCheatedCheckbox.checked = !!item.cheated;
    document.getElementById('btn-delete-item').style.display = 'block';
  } else {
    itemIdInput.value = '';
    itemStackInput.value = 1;
    itemQualitySelect.value = 1;
    itemDurabilityInput.value = 100;
    itemCrafterInput.value = currentCharacter.playerName || 'Viking';
    itemEquippedCheckbox.checked = false;
    if (itemCheatedCheckbox) itemCheatedCheckbox.checked = false;
    document.getElementById('btn-delete-item').style.display = 'none';
  }

  modalItemEditor.classList.add('show');
}

// Close Item Editor
function closeItemEditor() {
  modalItemEditor.classList.remove('show');
}

// Save Item Editor changes
document.getElementById('btn-save-item-editor').addEventListener('click', () => {
  const name = itemIdInput.value.trim();
  if (!name) {
    showToast('Please enter an Item Name or select from catalog', 'error');
    return;
  }

  const stack = Math.max(1, parseInt(itemStackInput.value, 10) || 1);
  const quality = Math.max(1, parseInt(itemQualitySelect.value, 10) || 1);
  const durability = Math.max(0, parseFloat(itemDurabilityInput.value) || 100);
  const crafterName = itemCrafterInput.value.trim();
  const equipped = itemEquippedCheckbox.checked;
  const cheated = itemCheatedCheckbox ? itemCheatedCheckbox.checked : false;

  const inventory = currentCharacter.playerData.inventory;
  let item = inventory.find(i => i.pos.x === activeSlotPos.x && i.pos.y === activeSlotPos.y);

  if (item) {
    item.name = name;
    item.stack = stack;
    item.quality = quality;
    item.durability = durability;
    item.crafterName = crafterName;
    item.equipped = equipped;
    item.cheated = cheated;
  } else {
    item = {
      name,
      stack,
      durability,
      pos: { x: activeSlotPos.x, y: activeSlotPos.y },
      equipped,
      quality,
      variant: 0,
      crafterId: '0',
      crafterName,
      customData: {},
      worldLevel: 0,
      pickedUp: true,
      cheated
    };
    inventory.push(item);
  }

  closeItemEditor();
  renderAll();
  showToast(`Updated Slot (${activeSlotPos.x}, ${activeSlotPos.y}): ${name}`);
});

// Delete Item
document.getElementById('btn-delete-item').addEventListener('click', () => {
  const inventory = currentCharacter.playerData.inventory;
  const idx = inventory.findIndex(i => i.pos.x === activeSlotPos.x && i.pos.y === activeSlotPos.y);
  if (idx !== -1) {
    const removedName = inventory[idx].name;
    inventory.splice(idx, 1);
    closeItemEditor();
    renderAll();
    showToast(`Removed ${removedName} from slot (${activeSlotPos.x}, ${activeSlotPos.y})`);
  }
});

// Modal Catalog Browser
function openCatalog() {
  renderCatalogItems('All', catalogSearchInput.value);
  modalCatalog.classList.add('show');
}

function closeCatalog() {
  modalCatalog.classList.remove('show');
}

function renderCatalogItems(category = 'All', query = '') {
  catalogGrid.innerHTML = '';
  if (typeof VALHEIM_ITEMS === 'undefined') return;

  const filtered = VALHEIM_ITEMS.filter(it => {
    const matchesCat = category === 'All' || it.category.toLowerCase() === category.toLowerCase();
    const q = query.toLowerCase().trim();
    const matchesQuery = !q || it.id.toLowerCase().includes(q) || it.name.toLowerCase().includes(q) || it.desc.toLowerCase().includes(q);
    return matchesCat && matchesQuery;
  });

  filtered.forEach(it => {
    const card = document.createElement('div');
    card.className = 'catalog-item-card';
    const iconHtml = getItemIconHtml(it.id);

    card.innerHTML = `
      <div class="catalog-item-icon">${iconHtml}</div>
      <div class="catalog-item-name">${it.name}</div>
      <div class="catalog-item-cat">${it.category} • Max Q${it.maxQuality}</div>
    `;

    card.addEventListener('click', () => {
      if (modalItemEditor.classList.contains('show')) {
        itemIdInput.value = it.id;
        itemStackInput.value = it.maxStack > 1 ? Math.min(20, it.maxStack) : 1;
        itemQualitySelect.value = it.maxQuality || 1;
        itemDurabilityInput.value = it.durability || 100;
        closeCatalog();
      } else {
        const inventory = currentCharacter.playerData.inventory;
        const gridMap = {};
        inventory.forEach(i => gridMap[`${i.pos.x},${i.pos.y}`] = true);

        let emptyPos = null;
        for (let y = 0; y < currentGridRows; y++) {
          for (let x = 0; x < 8; x++) {
            if (!gridMap[`${x},${y}`]) {
              emptyPos = { x, y };
              break;
            }
          }
          if (emptyPos) break;
        }

        if (!emptyPos) {
          const totalSlots = 8 * currentGridRows;
          showToast(`Inventory is full! (${totalSlots}/${totalSlots} slots used)`, 'error');
          return;
        }

        inventory.push({
          name: it.id,
          stack: it.maxStack > 1 ? Math.min(20, it.maxStack) : 1,
          durability: it.durability || 100,
          pos: emptyPos,
          equipped: false,
          quality: it.maxQuality || 1,
          variant: 0,
          crafterId: '0',
          crafterName: currentCharacter.playerName || 'Viking',
          customData: {},
          worldLevel: 0,
          pickedUp: true
        });

        closeCatalog();
        renderAll();
        showToast(`Added ${it.name} to slot (${emptyPos.x}, ${emptyPos.y})`);
      }
    });

    catalogGrid.appendChild(card);
  });
}

// Catalog Category Filtering
catalogCategories.addEventListener('click', (e) => {
  if (e.target.classList.contains('cat-btn')) {
    catalogCategories.querySelectorAll('.cat-btn').forEach(b => b.classList.remove('active'));
    e.target.classList.add('active');
    renderCatalogItems(e.target.dataset.cat, catalogSearchInput.value);
  }
});

catalogSearchInput.addEventListener('input', (e) => {
  const activeCatBtn = catalogCategories.querySelector('.cat-btn.active');
  const cat = activeCatBtn ? activeCatBtn.dataset.cat : 'All';
  renderCatalogItems(cat, e.target.value);
});

// Item max durability shortcut
document.getElementById('btn-item-max-durability').addEventListener('click', () => {
  itemDurabilityInput.value = 1000;
});

// Event Listeners for Modals
document.getElementById('btn-close-item-editor').addEventListener('click', closeItemEditor);
document.getElementById('btn-cancel-item-editor').addEventListener('click', closeItemEditor);
document.getElementById('btn-browse-catalog').addEventListener('click', openCatalog);
document.getElementById('btn-open-catalog').addEventListener('click', openCatalog);
document.getElementById('btn-close-catalog').addEventListener('click', closeCatalog);
document.getElementById('btn-close-catalog-footer').addEventListener('click', closeCatalog);

// Toolbar Actions: Repair All
document.getElementById('btn-repair-all').addEventListener('click', () => {
  const inventory = currentCharacter.playerData.inventory || [];
  inventory.forEach(it => {
    it.durability = Math.max(it.durability, 1000);
  });
  renderAll();
  showToast('Repaired all items in inventory to 100% durability!');
});

// Toolbar Actions: Max Quality
document.getElementById('btn-max-quality').addEventListener('click', () => {
  const inventory = currentCharacter.playerData.inventory || [];
  let count = 0;
  inventory.forEach(it => {
    if (it.quality < 4) {
      it.quality = 4;
      count++;
    }
  });
  renderAll();
  showToast(`Upgraded ${count} items to Max Quality (Quality 4 ★★★★)!`);
});

// Toolbar Actions: Max Stacks
document.getElementById('btn-max-stacks').addEventListener('click', () => {
  const inventory = currentCharacter.playerData.inventory || [];
  inventory.forEach(it => {
    if (it.stack > 1 || it.name.includes('Arrow') || it.name.includes('Wood') || it.name.includes('Stone') || it.name.includes('Ore') || it.name.includes('Bar') || it.name.includes('Coins') || it.name.includes('Mushroom') || it.name.includes('Pie') || it.name.includes('Stew') || it.name.includes('Pudding')) {
      it.stack = Math.max(it.stack, 100);
    }
  });
  renderAll();
  showToast('Increased item stacks to maximum!');
});

// Toolbar Actions: Clear Bag
document.getElementById('btn-clear-inventory').addEventListener('click', () => {
  if (confirm('Are you sure you want to clear all unequipped items from your bag?')) {
    currentCharacter.playerData.inventory = currentCharacter.playerData.inventory.filter(i => i.equipped);
    renderAll();
    showToast('Unequipped items cleared from inventory.');
  }
});

// Toolbar Actions: Max All Skills
document.getElementById('btn-max-skills').addEventListener('click', () => {
  const pd = currentCharacter.playerData;
  if (!pd) return;
  if (!pd.skills) pd.skills = {};

  const allSkills = {
    Swords: 1, Knives: 2, Clubs: 3, Polearms: 4, Spears: 5,
    Blocking: 6, Axes: 7, Bows: 8, ElementalMagic: 9, BloodMagic: 10,
    Unarmed: 11, Pickaxes: 12, WoodCutting: 13, Crossbows: 14,
    Jump: 100, Sneak: 101, Run: 102, Swim: 103, Fishing: 104,
    Cooking: 105, Farming: 106, Crafting: 107, Dodge: 108, Ride: 110
  };

  for (const [name, id] of Object.entries(allSkills)) {
    pd.skills[name] = {
      skillId: id,
      level: 100,
      accumulator: 0
    };
  }
  renderSkills();
  showToast('Maxed all 24 Valheim 1.0 skills to Level 100!');
});

// Character Vitals Modal
document.getElementById('btn-edit-char-stats').addEventListener('click', () => {
  const pd = currentCharacter.playerData || {};
  document.getElementById('char-name-input').value = currentCharacter.playerName || '';
  document.getElementById('char-health-input').value = pd.health || 25;
  document.getElementById('char-maxhealth-input').value = pd.maxHealth || 25;
  document.getElementById('char-stamina-input').value = pd.stamina || 50;
  document.getElementById('char-stamina2-input').value = pd.stamina2 || 0;
  document.getElementById('char-eitr-input').value = pd.eitr || 0;
  document.getElementById('char-maxeitr-input').value = pd.maxEitr || 0;
  document.getElementById('char-guardian-select').value = pd.guardianPower || '';
  modalCharStats.classList.add('show');
});

document.getElementById('btn-close-char-stats').addEventListener('click', () => modalCharStats.classList.remove('show'));
document.getElementById('btn-cancel-char-stats').addEventListener('click', () => modalCharStats.classList.remove('show'));

document.getElementById('btn-save-char-stats').addEventListener('click', () => {
  currentCharacter.playerName = document.getElementById('char-name-input').value.trim() || currentCharacter.playerName;
  const pd = currentCharacter.playerData;
  pd.health = parseFloat(document.getElementById('char-health-input').value) || 25;
  pd.maxHealth = parseFloat(document.getElementById('char-maxhealth-input').value) || 25;
  pd.stamina = parseFloat(document.getElementById('char-stamina-input').value) || 50;
  pd.stamina2 = parseFloat(document.getElementById('char-stamina2-input').value) || 0;
  pd.eitr = parseFloat(document.getElementById('char-eitr-input').value) || 0;
  pd.maxEitr = parseFloat(document.getElementById('char-maxeitr-input').value) || 0;
  pd.guardianPower = document.getElementById('char-guardian-select').value;

  modalCharStats.classList.remove('show');
  renderAll();
  showToast('Saved character vitals successfully!');
});

// Confirmation Overwrite Dialog Logic
btnSaveOverwrite.addEventListener('click', () => {
  if (!currentCharacter) return;
  const filename = currentFileName || `${currentCharacter.playerName || 'character'}.fch`;
  confirmOverwriteFilename.textContent = filename;
  modalConfirmOverwrite.classList.add('show');
});

btnCloseConfirmModal.addEventListener('click', () => modalConfirmOverwrite.classList.remove('show'));
btnCancelOverwrite.addEventListener('click', () => modalConfirmOverwrite.classList.remove('show'));

// Execute Overwrite on Confirmation
btnExecuteOverwrite.addEventListener('click', async () => {
  modalConfirmOverwrite.classList.remove('show');
  const filename = currentFileName || `${currentCharacter.playerName || 'character'}.fch`;
  showToast(`Overwriting ${filename}...`, 'success');

  try {
    // 1. Fetch encoded binary buffer from encoder
    const exportRes = await fetch('/api/export-fch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(currentCharacter)
    });

    if (!exportRes.ok) {
      const err = await exportRes.json();
      throw new Error(err.error || 'Failed to encode character binary data');
    }

    const fchBlob = await exportRes.blob();
    const fchArrayBuffer = await fchBlob.arrayBuffer();

    let overwrittenSuccessfully = false;

    // 2. If File System Access API handle exists, write directly back to original picked file!
    if (currentFileHandle) {
      try {
        const writable = await currentFileHandle.createWritable();
        await writable.write(fchArrayBuffer);
        await writable.close();
        overwrittenSuccessfully = true;
      } catch (handleErr) {
        console.warn('File handle write failed, attempting server/fallback save:', handleErr);
      }
    }

    // 3. If file was loaded from a known system path, save directly to it with .bak backup
    if (currentFilePath) {
      try {
        const pathSaveRes = await fetch('/api/save-to-path', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ filePath: currentFilePath, characterData: currentCharacter })
        });
        if (pathSaveRes.ok) {
          overwrittenSuccessfully = true;
        }
      } catch (pathErr) {
        console.warn('Direct path save failed:', pathErr);
      }
    }

    // 4. Also notify server /api/save to ensure workspace disk copy and .bak backup are kept
    const saveRes = await fetch('/api/save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ filename, characterData: currentCharacter })
    });

    if (saveRes.ok) {
      overwrittenSuccessfully = true;
    }

    if (overwrittenSuccessfully) {
      showToast(`✅ Successfully replaced & saved ${filename}! (.bak backup kept)`, 'success');
    } else {
      // Fallback: trigger download with original filename
      downloadBlob(fchBlob, filename);
      showToast(`Saved & downloaded ${filename}!`, 'success');
    }
  } catch (err) {
    console.error(err);
    showToast('Error saving file: ' + err.message, 'error');
  }
});

// Export .fch file directly as a new file
btnExportFch.addEventListener('click', async () => {
  try {
    const res = await fetch('/api/export-fch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(currentCharacter)
    });
    if (res.ok) {
      const blob = await res.blob();
      const filename = currentFileName && currentFileName.endsWith('.fch') ? currentFileName : `${currentCharacter.playerName || 'character'}.fch`;
      downloadBlob(blob, filename);
      showToast(`Exported ${filename} binary save file!`, 'success');
      return;
    }
  } catch (err) {
    console.error(err);
  }
  showToast('Exporting JSON backup as fallback...', 'error');
  exportJsonFile();
});

// Export JSON
function exportJsonFile() {
  const jsonStr = JSON.stringify(currentCharacter, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const filename = `${currentCharacter.playerName || 'character'}.json`;
  downloadBlob(blob, filename);
  showToast(`Exported ${filename}!`);
}
btnExportJson.addEventListener('click', exportJsonFile);

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// File Picker with File System Access API (preserves file handle for in-place overwrite)
async function triggerFilePicker() {
  if (window.showOpenFilePicker) {
    try {
      const [handle] = await window.showOpenFilePicker({
        types: [
          {
            description: 'Valheim Character Save (*.fch, *.json)',
            accept: {
              'application/octet-stream': ['.fch', '.fch.bak', '.fch.old'],
              'application/json': ['.json']
            }
          }
        ],
        multiple: false
      });
      currentFileHandle = handle;
      const file = await handle.getFile();
      await handleFileSelected(file);
      return;
    } catch (err) {
      if (err.name === 'AbortError') return;
      console.warn('showOpenFilePicker error, falling back to input:', err);
    }
  }
  fileInput.click();
}

btnLoadFile.addEventListener('click', triggerFilePicker);
document.getElementById('btn-browse-fch').addEventListener('click', triggerFilePicker);
document.getElementById('btn-switch-file').addEventListener('click', switchCharacterFile);

fileInput.addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (file) handleFileSelected(file);
});

// Drag & Drop on Dropzone
uploadDropzone.addEventListener('dragover', (e) => {
  e.preventDefault();
  uploadDropzone.classList.add('dragover');
});

uploadDropzone.addEventListener('dragleave', () => {
  uploadDropzone.classList.remove('dragover');
});

uploadDropzone.addEventListener('drop', (e) => {
  e.preventDefault();
  uploadDropzone.classList.remove('dragover');
  const file = e.dataTransfer.files[0];
  if (file) handleFileSelected(file);
});

// Global Drag & Drop anywhere on page
window.addEventListener('dragover', (e) => e.preventDefault());
window.addEventListener('drop', (e) => {
  e.preventDefault();
  const file = e.dataTransfer.files[0];
  if (file && (file.name.endsWith('.fch') || file.name.endsWith('.json') || file.name.endsWith('.fch.bak'))) {
    handleFileSelected(file);
  }
});

// ==========================================================================
// Valheim 1.0 Deep North - Cheats Reverter & System Save Auto-Detection
// ==========================================================================

// Revert Cheats & Restore Achievements
const btnRevertCheats = document.getElementById('btn-revert-cheats');
if (btnRevertCheats) {
  btnRevertCheats.addEventListener('click', async () => {
    if (!currentCharacter) return;

    // 1. Reset cheat flags in editor memory
    currentCharacter.usedCheats = false;
    let cleanedItemCount = 0;
    if (currentCharacter.playerData && currentCharacter.playerData.inventory) {
      currentCharacter.playerData.inventory.forEach(item => {
        if (item.cheated) {
          item.cheated = false;
          cleanedItemCount++;
        }
      });
    }

    // 2. If loaded from known disk file, execute direct revert on server to update disk & backup
    if (currentFilePath) {
      try {
        const res = await fetch('/api/revert-cheats', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ filePath: currentFilePath })
        });
        const data = await res.json();
        if (data.success) {
          showToast(`🏆 Reverted cheats on disk & backup kept! Achievements restored.`, 'success');
        } else {
          showToast(`Cleaned in editor. Save file to apply to disk!`, 'warning');
        }
      } catch (err) {
        showToast(`Cleaned in editor. Save file to apply to disk!`, 'warning');
      }
    } else {
      showToast(`🏆 Reverted cheats! Save or export your file now to enable achievements.`, 'success');
    }

    renderAll();
  });
}

// Auto-detect and populate system characters in Dropzone
async function loadDetectedSaves() {
  const container = document.getElementById('detected-saves-section');
  const list = document.getElementById('detected-saves-list');
  if (!container || !list) return;

  try {
    const res = await fetch('/api/system-saves');
    if (!res.ok) return;
    const data = await res.json();
    const saves = data.saves || [];

    if (saves.length === 0) {
      container.style.display = 'none';
      return;
    }

    container.style.display = 'block';
    list.innerHTML = '';

    saves.forEach(save => {
      const card = document.createElement('div');
      card.className = 'detected-save-card';

      const tagClass = save.type === 'active' ? 'tag-active' : (save.type === 'steam' ? 'tag-steam' : 'tag-locallow');
      const tagLabel = save.type === 'active' ? 'Active / OnlineFix' : (save.type === 'steam' ? 'Steam' : 'LocalLow');
      const isCheated = save.usedCheats || (save.cheatedItemsCount > 0);
      const cheatBadgeHtml = isCheated 
        ? `<span class="cheat-badge badge-cheated" style="font-size:0.68rem; padding: 2px 7px;">⚠️ Cheats</span>` 
        : `<span class="cheat-badge badge-clean" style="font-size:0.68rem; padding: 2px 7px;">🛡️ Clean</span>`;

      card.innerHTML = `
        <div class="detected-save-info">
          <div class="detected-save-title-row">
            <span class="detected-save-name">${save.playerName || save.name}</span>
            <span class="detected-save-tag ${tagClass}">${tagLabel}</span>
            ${cheatBadgeHtml}
          </div>
          <div class="detected-save-path">${save.filePath}</div>
        </div>
        <button class="btn btn-secondary" style="font-size: 0.78rem; padding: 6px 12px; pointer-events: none;">Open</button>
      `;

      card.addEventListener('click', async () => {
        await loadSaveFromPath(save.filePath, save.filename);
      });

      list.appendChild(card);
    });
  } catch (err) {
    console.warn('Error loading detected system saves:', err);
  }
}

async function loadSaveFromPath(filePath, filename) {
  try {
    showToast(`Loading ${filename}...`, 'success');
    const res = await fetch(`/api/load-from-path?path=${encodeURIComponent(filePath)}`);
    if (!res.ok) {
      const err = await res.json();
      showToast(err.error || 'Failed to load character from path', 'error');
      return;
    }

    currentCharacter = await res.json();
    currentFileName = filename;
    currentFilePath = filePath;
    onCharacterLoaded();
    showToast(`Loaded ${filename} (${currentCharacter.playerName})!`, 'success');
  } catch (err) {
    showToast(`Error loading file: ${err.message}`, 'error');
  }
}

// Row selector change handler
if (selectGridRows) {
  selectGridRows.addEventListener('change', (e) => {
    currentGridRows = parseInt(e.target.value, 10) || 5;
    renderAll();
    showToast(`Inventory grid updated to ${currentGridRows} rows (${8 * currentGridRows} slots)`);
  });
}

// Initialize save detection on startup
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', loadDetectedSaves);
} else {
  loadDetectedSaves();
}
