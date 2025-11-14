const STORAGE_KEY = 'prodo_passports';

const CATEGORY_METADATA = {
  battery: { label: 'Battery', icon: 'B' },
  textile: { label: 'Textile', icon: 'T' },
  furniture: { label: 'Furniture', icon: 'F' },
  electronics: { label: 'Electronics', icon: 'E' },
  metal: { label: 'Metal Component', icon: 'M' },
  toy: { label: 'Toy', icon: 'Y' },
  other: { label: 'Other', icon: '?' }
};

const SAMPLE_DATA = {
  names: [
    'Genk Battery Pack',
    'Looped Textile Sheet',
    'Flexi Furniture Frame',
    'LumiWear Jacket',
    'Metro E-Scooter Motor',
    'ReForma Toy Block',
    'SMAFACC Demo Cell'
  ],
  funFacts: [
    'Packed in a modular housing so components can be swapped in minutes.',
    'Made with 72% recycled feedstock from local suppliers.',
    'Designed for disassembly with only four standard fasteners.',
    'Includes a digital care manual embedded in the NFC tag.',
    'Ships with a prepaid return label to enable circular logistics.'
  ],
  categories: ['battery', 'textile', 'furniture', 'electronics', 'metal', 'toy', 'other'],
  materials: ['steel', 'aluminium', 'plastic', 'textile', 'lithium', 'mixed']
};

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('passport-form');
  const previewContainer = document.getElementById('preview');
  const generateBtn = document.getElementById('generatePreview');
  const randomizeBtn = document.getElementById('randomize');
  const saveBtn = document.getElementById('savePassport');
  const wallGrid = document.getElementById('wallGrid');
  const wallEmpty = document.getElementById('wallEmpty');
  const co2Value = document.getElementById('co2Value');
  const recyclabilityValue = document.getElementById('recyclabilityValue');
  const previewStatus = document.getElementById('previewStatus');

  let passports = [];
  let previewData = null;
  let previewLive = false;

  passports = loadPassports();
  renderWall();

  generateBtn.addEventListener('click', () => {
    const ready = buildPreview();
    if (ready) {
      previewLive = true;
      previewStatus.textContent = 'Preview ready. Tweak the form and it will stay in sync.';
    }
  });

  saveBtn.addEventListener('click', () => {
    if (!previewData) {
      previewStatus.textContent = 'Generate a preview before saving.';
      return;
    }

    const entry = {
      ...previewData,
      id: `${Date.now()}`,
      createdAt: new Date().toISOString()
    };

    passports.unshift(entry);
    persistPassports(passports);
    renderWall();
    previewStatus.textContent = 'Saved! Scroll down to see it on the wall.';
    saveBtn.disabled = true;
    previewLive = false;
  });

  randomizeBtn.addEventListener('click', () => {
    randomizeForm();
    updateRangeLabels();
    if (previewLive) {
      buildPreview({ silent: true });
    }
  });

  form.addEventListener('input', (event) => {
    if (event.target.id === 'co2' || event.target.id === 'recyclability') {
      updateRangeLabels();
    }
    if (previewLive) {
      buildPreview({ silent: true });
    }
  });

  wallGrid.addEventListener('click', (event) => {
    const actionButton = event.target.closest('button[data-action]');
    if (!actionButton) return;
    const card = actionButton.closest('.wall-card');
    if (!card) return;
    const passportId = card.dataset.id;
    if (!passportId) return;

    const action = actionButton.dataset.action;
    if (action === 'delete') {
      const confirmed = window.confirm('Remove this passport from the wall?');
      if (!confirmed) return;
      passports = passports.filter((item) => item.id !== passportId);
      persistPassports(passports);
      renderWall();
      return;
    }

    if (action === 'toggle') {
      const details = card.querySelector('.wall-details');
      if (!details) return;
      const expanded = details.classList.toggle('active');
      actionButton.textContent = expanded ? 'Hide details' : 'View details';
      if (expanded && !details.dataset.qrReady) {
        const data = passports.find((item) => item.id === passportId);
        const qrTarget = details.querySelector('.wall-qr');
        if (data && qrTarget) {
          renderQrCode(qrTarget, data, 88);
          details.dataset.qrReady = 'true';
        }
      }
    }
  });

  function buildPreview(options = {}) {
    const { silent = false } = options;
    const data = readFormData();
    if (!data) {
      if (!silent) {
        previewStatus.textContent = 'Please fill in the required fields to generate a preview.';
      }
      return false;
    }
    previewData = data;
    renderPreviewCard(data);
    saveBtn.disabled = false;
    return true;
  }

  function readFormData() {
    const productName = document.getElementById('productName').value.trim();
    const category = document.getElementById('category').value;
    const material = document.getElementById('material').value;
    const origin = document.getElementById('origin').value;
    const co2 = Number(document.getElementById('co2').value);
    const recyclability = Number(document.getElementById('recyclability').value);
    const funFact = document.getElementById('funFact').value.trim();

    if (!productName || !category || !material || !origin) {
      return null;
    }

    return {
      productName,
      category,
      material,
      origin,
      co2,
      recyclability,
      funFact
    };
  }

  function renderPreviewCard(data) {
    const qrHolderId = `preview-qr-${Date.now()}`;
    previewContainer.innerHTML = `
      <article class="passport-card">
        <div>
          <h3>${escapeHtml(data.productName)}</h3>
          <span class="category-pill">
            <span class="pill-icon">${getCategoryMeta(data.category).icon}</span>
            ${getCategoryMeta(data.category).label}
          </span>
          <div class="passport-meta">
            <div><strong>Material:</strong> ${formatMaterial(data.material)}</div>
            <div><strong>Origin:</strong> ${escapeHtml(data.origin)}</div>
            <div class="metric">
              <div class="metric-label">
                <span>CO2 footprint</span>
                <span>${data.co2} kg | ${formatCo2Level(data.co2)}</span>
              </div>
              <div class="meter-bar"><span style="width:${data.co2}%;"></span></div>
            </div>
            <div class="metric">
              <div class="metric-label">
                <span>Recyclability</span>
                <span>${data.recyclability}%</span>
              </div>
              <div class="meter-bar"><span style="width:${data.recyclability}%;"></span></div>
            </div>
          </div>
          ${data.funFact ? `<p class="fun-fact"><strong>Fun fact:</strong> ${escapeHtml(data.funFact)}</p>` : ''}
        </div>
        <div class="qr-box" id="${qrHolderId}"></div>
      </article>
    `;
    const holder = document.getElementById(qrHolderId);
    renderQrCode(holder, data, 106);
  }

  function renderWall() {
    wallGrid.innerHTML = '';
    if (!passports.length) {
      wallEmpty.style.display = 'block';
      return;
    }
    wallEmpty.style.display = 'none';
    const fragment = document.createDocumentFragment();
    passports.forEach((passport) => {
      const card = document.createElement('article');
      card.className = 'wall-card';
      card.dataset.id = passport.id;
      const summary = formatSummary(passport);
      card.innerHTML = `
        <div class="wall-card-header">
          <span class="badge">${getCategoryMeta(passport.category).label}</span>
          <div class="wall-actions">
            <button type="button" class="ghost" data-action="toggle">View details</button>
            <button type="button" class="ghost" data-action="delete">Delete</button>
          </div>
        </div>
        <h3 class="wall-title">${escapeHtml(passport.productName)}</h3>
        <p class="wall-summary">${summary}</p>
        <p class="wall-summary">Saved ${formatTimestamp(passport.createdAt)}</p>
        <div class="wall-details">
          <div><strong>Material:</strong> ${formatMaterial(passport.material)}</div>
          <div><strong>Origin:</strong> ${escapeHtml(passport.origin)}</div>
          <div><strong>CO2:</strong> ${passport.co2} kg (${formatCo2Level(passport.co2)})</div>
          <div><strong>Recyclability:</strong> ${passport.recyclability}%</div>
          ${passport.funFact ? `<div><strong>Fun fact:</strong> ${escapeHtml(passport.funFact)}</div>` : ''}
          <div class="wall-qr"></div>
        </div>
      `;
      fragment.appendChild(card);
    });
    wallGrid.appendChild(fragment);
  }

  function renderQrCode(target, payload, size) {
    if (!target || typeof QRCode === 'undefined') return;
    target.innerHTML = '';
    new QRCode(target, {
      text: JSON.stringify(payload),
      width: size,
      height: size,
      colorDark: '#0f172a',
      colorLight: '#ffffff',
      correctLevel: QRCode.CorrectLevel.M
    });
  }

  function updateRangeLabels() {
    const co2 = document.getElementById('co2').value;
    const recyclability = document.getElementById('recyclability').value;
    co2Value.textContent = `${co2}`;
    recyclabilityValue.textContent = `${recyclability}%`;
  }

  function randomizeForm() {
    const randomName = pickRandom(SAMPLE_DATA.names);
    const category = pickRandom(SAMPLE_DATA.categories);
    const material = pickRandom(SAMPLE_DATA.materials);
    const origins = Array.from(document.getElementById('origin').options).slice(1);
    const origin = pickRandom(origins).value;
    const co2 = Math.floor(Math.random() * 101);
    const recyclability = Math.floor(Math.random() * 101);
    const funFact = Math.random() > 0.3 ? pickRandom(SAMPLE_DATA.funFacts) : '';

    document.getElementById('productName').value = randomName;
    document.getElementById('category').value = category;
    document.getElementById('material').value = material;
    document.getElementById('origin').value = origin;
    document.getElementById('co2').value = co2;
    document.getElementById('recyclability').value = recyclability;
    document.getElementById('funFact').value = funFact;
  }

  function loadPassports() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
      console.error('Unable to parse saved passports', error);
      return [];
    }
  }

  function persistPassports(items) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch (error) {
      console.error('Unable to save passports', error);
    }
  }

  function formatSummary(passport) {
    const parts = [
      `${formatMaterial(passport.material)}`,
      `${passport.co2} kg CO2e`,
      `${passport.recyclability}% recyclable`,
      `Made in ${passport.origin}`
    ];
    return parts.join(' | ');
  }

  function formatMaterial(value) {
    if (value === 'lithium') return 'Lithium-based';
    if (value === 'metal') return 'Metal Component';
    return value.charAt(0).toUpperCase() + value.slice(1);
  }

  function formatCo2Level(value) {
    if (value < 34) return 'Low';
    if (value < 67) return 'Medium';
    return 'High';
  }

  function formatTimestamp(isoString) {
    const date = new Date(isoString);
    return date.toLocaleString(undefined, {
      weekday: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  function getCategoryMeta(category) {
    return CATEGORY_METADATA[category] || CATEGORY_METADATA.other;
  }

  function pickRandom(array) {
    return array[Math.floor(Math.random() * array.length)];
  }

  function escapeHtml(value) {
    const div = document.createElement('div');
    div.textContent = value;
    return div.innerHTML;
  }

  updateRangeLabels();
});
