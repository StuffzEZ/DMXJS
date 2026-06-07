/**
 * DMXJS - A DMX Console-Style Light Card for Home Assistant
 * Version: 1.0.0
 * Supports HA 2026+
 *
 * Licensed GNU GPLv3
 *
 * Cards:
 *   dmx-channel-card   — single R, G, or B slider for a light
 *   dmx-rgb-card       — all three sliders for one RGB light
 *   dmx-group-card     — group + brightness slider controlling multiple lights
 */

/* ─────────────────────────────────────────────────────────────
   SHARED STYLES
───────────────────────────────────────────────────────────── */
const BASE_CSS = `
  :host {
    --dmx-bg: #1a1a1f;
    --dmx-surface: #242429;
    --dmx-surface2: #2e2e35;
    --dmx-border: #3a3a44;
    --dmx-text: #e8e8f0;
    --dmx-text-muted: #6b6b7e;
    --dmx-accent: #4af;
    --dmx-knob-bg: #303038;
    --dmx-knob-line: #e8e8f0;
    --dmx-tick: #44444e;
    --dmx-tick-major: #5a5a6e;
    --dmx-font: 'JetBrains Mono', 'Fira Mono', 'Roboto Mono', monospace;
    display: block;
    font-family: var(--dmx-font);
  }

  .card {
    background: var(--dmx-bg);
    border: 1px solid var(--dmx-border);
    border-radius: 12px;
    padding: 16px 18px 18px;
    box-shadow: 0 4px 24px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.04);
    position: relative;
    overflow: hidden;
  }

  .card::before {
    content: '';
    position: absolute;
    top: 0; left: 0; right: 0;
    height: 2px;
    background: var(--channel-color, var(--dmx-accent));
    opacity: 0.7;
    border-radius: 12px 12px 0 0;
  }

  .card-title {
    font-size: 10px;
    letter-spacing: 0.18em;
    text-transform: uppercase;
    color: var(--dmx-text-muted);
    margin: 0 0 14px;
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .card-title .dot {
    width: 6px; height: 6px;
    border-radius: 50%;
    background: var(--channel-color, var(--dmx-accent));
    box-shadow: 0 0 6px var(--channel-color, var(--dmx-accent));
    flex-shrink: 0;
  }

  .channel-label {
    font-size: 9px;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: var(--dmx-text-muted);
    margin-bottom: 4px;
    display: flex;
    justify-content: space-between;
    align-items: baseline;
  }

  .channel-value {
    font-size: 22px;
    font-weight: 700;
    color: var(--channel-color, var(--dmx-accent));
    letter-spacing: -0.02em;
    line-height: 1;
    min-width: 44px;
    text-align: right;
    text-shadow: 0 0 12px var(--channel-color, var(--dmx-accent));
    transition: color 0.15s;
  }

  /* ── DMX SLIDER TRACK ── */
  .slider-wrap {
    position: relative;
    height: 56px;
    margin: 6px 0 2px;
    cursor: pointer;
    user-select: none;
    touch-action: none;
  }

  .track-bg {
    position: absolute;
    left: 0; right: 0;
    top: 50%;
    transform: translateY(-50%);
    height: 8px;
    background: var(--dmx-surface2);
    border-radius: 4px;
    border: 1px solid var(--dmx-border);
    overflow: hidden;
  }

  .track-fill {
    height: 100%;
    background: linear-gradient(90deg,
      color-mix(in srgb, var(--channel-color, var(--dmx-accent)) 40%, #000) 0%,
      var(--channel-color, var(--dmx-accent)) 100%);
    border-radius: 4px;
    transition: width 0.06s cubic-bezier(0.25,0.1,0.25,1);
    width: 0%;
  }

  /* tick marks */
  .ticks {
    position: absolute;
    left: 0; right: 0;
    top: 50%;
    transform: translateY(-50%);
    height: 8px;
    pointer-events: none;
  }

  .ticks svg {
    width: 100%;
    height: 100%;
    overflow: visible;
  }

  /* knob */
  .knob {
    position: absolute;
    top: 50%;
    transform: translate(-50%, -50%);
    width: 24px;
    height: 38px;
    background: var(--dmx-knob-bg);
    border: 1.5px solid var(--dmx-border);
    border-radius: 5px;
    box-shadow:
      0 2px 8px rgba(0,0,0,0.5),
      inset 0 1px 0 rgba(255,255,255,0.08),
      inset 0 -1px 0 rgba(0,0,0,0.3);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 3px;
    transition: left 0.06s cubic-bezier(0.25,0.1,0.25,1),
                box-shadow 0.1s;
    cursor: grab;
  }

  .knob:active { cursor: grabbing; }

  .knob.dragging {
    box-shadow:
      0 4px 16px rgba(0,0,0,0.6),
      0 0 0 2px var(--channel-color, var(--dmx-accent)),
      inset 0 1px 0 rgba(255,255,255,0.12);
  }

  .knob-line {
    width: 12px;
    height: 2px;
    background: var(--dmx-knob-line);
    border-radius: 1px;
    opacity: 0.85;
  }

  .knob-line.center {
    width: 14px;
    background: var(--channel-color, var(--dmx-accent));
    box-shadow: 0 0 4px var(--channel-color, var(--dmx-accent));
    opacity: 1;
  }

  /* tick labels */
  .tick-labels {
    display: flex;
    justify-content: space-between;
    margin-top: 2px;
    font-size: 8px;
    color: var(--dmx-text-muted);
    letter-spacing: 0.05em;
  }

  /* ── EDITOR ── */
  .editor {
    padding: 8px 0 0;
  }

  .editor label {
    display: block;
    font-size: 9px;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: var(--dmx-text-muted);
    margin-bottom: 5px;
  }

  .editor select,
  .editor input[type="text"],
  .editor input[type="color"] {
    width: 100%;
    background: var(--dmx-surface2);
    border: 1px solid var(--dmx-border);
    border-radius: 6px;
    color: var(--dmx-text);
    font-family: var(--dmx-font);
    font-size: 12px;
    padding: 7px 10px;
    margin-bottom: 12px;
    box-sizing: border-box;
    outline: none;
    transition: border-color 0.15s;
  }

  .editor select:focus,
  .editor input:focus {
    border-color: var(--dmx-accent);
  }

  .editor input[type="color"] {
    padding: 3px 6px;
    height: 34px;
    cursor: pointer;
  }

  .entity-name {
    font-size: 11px;
    color: var(--dmx-text);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
`;

/* ─────────────────────────────────────────────────────────────
   HELPER UTILITIES
───────────────────────────────────────────────────────────── */

/** Parse current RGB from HA light entity */
function getRGBFromState(stateObj) {
  if (!stateObj) return { r: 0, g: 0, b: 0 };
  const attr = stateObj.attributes || {};
  // HA stores rgb_color as [r,g,b]
  if (attr.rgb_color) {
    return { r: attr.rgb_color[0], g: attr.rgb_color[1], b: attr.rgb_color[2] };
  }
  return { r: 0, g: 0, b: 0 };
}

/** Send an rgb_color service call to HA */
function setRGB(hass, entityId, r, g, b) {
  r = Math.round(Math.max(0, Math.min(255, r)));
  g = Math.round(Math.max(0, Math.min(255, g)));
  b = Math.round(Math.max(0, Math.min(255, b)));

  if (r === 0 && g === 0 && b === 0) {
    hass.callService('light', 'turn_off', { entity_id: entityId });
  } else {
    hass.callService('light', 'turn_on', {
      entity_id: entityId,
      rgb_color: [r, g, b],
      brightness: 255, // RGB mode: let rgb_color drive brightness
    });
  }
}

const CHANNEL_COLORS = { r: '#ff3333', g: '#33ff66', b: '#3399ff' };
const CHANNEL_NAMES  = { r: 'Red', g: 'Green', b: 'Blue' };

/** Build SVG tick marks for the slider */
function buildTicks(totalWidth, height) {
  const minor = 5;   // every 5 units → 51 ticks (0,5,10...255)
  const major = 51;  // every 51 units → 0,51,102,153,204,255
  const STEPS = 255;
  let d = '';
  for (let i = 0; i <= STEPS; i++) {
    const x = (i / STEPS) * totalWidth;
    const isMajor = (i % major === 0);
    const isMinor = (i % minor === 0);
    if (!isMinor && !isMajor) continue;
    const tickH = isMajor ? height * 0.75 : height * 0.4;
    const y1 = (height - tickH) / 2;
    d += `M${x},${y1} L${x},${y1 + tickH} `;
  }
  return d;
}

/* ─────────────────────────────────────────────────────────────
   DMX SLIDER COMPONENT (reusable, not a custom element)
───────────────────────────────────────────────────────────── */
class DmxSlider {
  /**
   * @param {object} opts
   *   label, color, value (0-255), onChange(newVal)
   */
  constructor(opts) {
    this.label    = opts.label    || 'Channel';
    this.color    = opts.color    || '#4af';
    this.value    = opts.value    ?? 0;
    this.onChange = opts.onChange || (() => {});
    this._dragging = false;
    this._raf = null;
    this._pendingVal = null;
    this.el = this._build();
    this._bindEvents();
  }

  _build() {
    const wrap = document.createElement('div');
    wrap.innerHTML = `
      <div class="channel-label">
        <span>${this.label}</span>
        <span class="channel-value" style="color:${this.color};text-shadow:0 0 12px ${this.color}">0</span>
      </div>
      <div class="slider-wrap" role="slider" aria-valuemin="0" aria-valuemax="255" aria-valuenow="0" tabindex="0">
        <div class="track-bg">
          <div class="track-fill" style="background:linear-gradient(90deg,color-mix(in srgb,${this.color} 40%,#000),${this.color})"></div>
        </div>
        <div class="ticks">
          <svg preserveAspectRatio="none"></svg>
        </div>
        <div class="knob">
          <div class="knob-line"></div>
          <div class="knob-line center" style="background:${this.color};box-shadow:0 0 4px ${this.color}"></div>
          <div class="knob-line"></div>
        </div>
      </div>
      <div class="tick-labels">
        <span>0</span><span>64</span><span>128</span><span>192</span><span>255</span>
      </div>
    `;
    this._valueEl  = wrap.querySelector('.channel-value');
    this._trackEl  = wrap.querySelector('.track-fill');
    this._knobEl   = wrap.querySelector('.knob');
    this._sliderEl = wrap.querySelector('.slider-wrap');
    this._svgEl    = wrap.querySelector('svg');
    this.el = wrap;

    // Draw ticks once the element is sized — use ResizeObserver
    this._ro = new ResizeObserver(() => this._drawTicks());
    this._ro.observe(this._sliderEl);

    this.setValue(this.value, false);
    return wrap;
  }

  _drawTicks() {
    const w = this._sliderEl.clientWidth;
    const h = 8; // track height
    const path = buildTicks(w, h);
    this._svgEl.setAttribute('viewBox', `0 0 ${w} ${h}`);
    this._svgEl.innerHTML = `
      <path d="${path}" stroke="#44444e" stroke-width="0.8" fill="none" opacity="0.7"/>
    `;
  }

  _bindEvents() {
    const onDown = (e) => {
      e.preventDefault();
      this._dragging = true;
      this._knobEl.classList.add('dragging');
      this._moveHandler(e);
    };
    const onMove = (e) => {
      if (!this._dragging) return;
      e.preventDefault();
      this._moveHandler(e);
    };
    const onUp = () => {
      if (!this._dragging) return;
      this._dragging = false;
      this._knobEl.classList.remove('dragging');
      if (this._pendingVal !== null) {
        this.onChange(this._pendingVal);
        this._pendingVal = null;
      }
    };

    this._sliderEl.addEventListener('mousedown', onDown);
    this._sliderEl.addEventListener('touchstart', onDown, { passive: false });
    window.addEventListener('mousemove', onMove);
    window.addEventListener('touchmove', onMove, { passive: false });
    window.addEventListener('mouseup', onUp);
    window.addEventListener('touchend', onUp);

    // Keyboard
    this._sliderEl.addEventListener('keydown', (e) => {
      let delta = 0;
      if (e.key === 'ArrowRight' || e.key === 'ArrowUp') delta = e.shiftKey ? 10 : 1;
      if (e.key === 'ArrowLeft'  || e.key === 'ArrowDown') delta = e.shiftKey ? -10 : -1;
      if (delta === 0) return;
      e.preventDefault();
      const newVal = Math.max(0, Math.min(255, this.value + delta));
      this.setValue(newVal, true);
    });
  }

  _moveHandler(e) {
    const rect = this._sliderEl.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    const newVal = Math.round(ratio * 255);

    // Update display immediately (smooth)
    cancelAnimationFrame(this._raf);
    this._raf = requestAnimationFrame(() => {
      this._updateDisplay(newVal);
    });

    this._pendingVal = newVal;
    this.value = newVal;
    // Fire onChange during drag too (throttled by rAF effectively via HA debounce)
    this.onChange(newVal);
  }

  _updateDisplay(val) {
    const pct = (val / 255) * 100;
    this._trackEl.style.width = pct + '%';
    this._knobEl.style.left = `calc(${pct}% )`;
    this._valueEl.textContent = val;
    this._sliderEl.setAttribute('aria-valuenow', val);
  }

  setValue(val, fireChange = false) {
    val = Math.round(Math.max(0, Math.min(255, val)));
    this.value = val;
    this._updateDisplay(val);
    if (fireChange) this.onChange(val);
  }

  setColor(color) {
    this.color = color;
    this._valueEl.style.color = color;
    this._valueEl.style.textShadow = `0 0 12px ${color}`;
    this._trackEl.style.background = `linear-gradient(90deg,color-mix(in srgb,${color} 40%,#000),${color})`;
    const cl = this._knobEl.querySelector('.knob-line.center');
    if (cl) {
      cl.style.background = color;
      cl.style.boxShadow = `0 0 4px ${color}`;
    }
  }

  destroy() {
    this._ro.disconnect();
  }
}

/* ─────────────────────────────────────────────────────────────
   CARD 1: dmx-channel-card
   Single channel (R, G, or B) for one light entity
───────────────────────────────────────────────────────────── */
class DmxChannelCard extends HTMLElement {
  static get properties() {
    return { hass: {}, config: {} };
  }

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this._hass = null;
    this._config = {};
    this._slider = null;
    this._unsub = null;
    this._updating = false; // guard against feedback loops
  }

  setConfig(config) {
    if (!config.entity) throw new Error('dmx-channel-card: entity is required');
    if (!config.channel || !['r','g','b'].includes(config.channel)) {
      throw new Error('dmx-channel-card: channel must be r, g, or b');
    }
    this._config = {
      entity:  config.entity,
      channel: config.channel,
      color:   config.color || CHANNEL_COLORS[config.channel],
      name:    config.name  || null,
    };
    this._render();
  }

  set hass(hass) {
    this._hass = hass;
    if (!this._slider) return;
    if (this._updating) return;
    const stateObj = hass.states[this._config.entity];
    const rgb = getRGBFromState(stateObj);
    const val = rgb[this._config.channel];
    if (val !== this._slider.value) {
      this._slider.setValue(val, false);
    }
  }

  _render() {
    const cfg = this._config;
    const color = cfg.color || CHANNEL_COLORS[cfg.channel];
    const label = CHANNEL_NAMES[cfg.channel] + ' (DMX)';

    this.shadowRoot.innerHTML = `
      <style>
        ${BASE_CSS}
        :host { --channel-color: ${color}; }
      </style>
      <ha-card>
        <div class="card">
          <div class="card-title">
            <span class="dot"></span>
            <span>${cfg.name || label}</span>
          </div>
          <div id="slider-mount"></div>
        </div>
      </ha-card>
    `;

    if (this._slider) this._slider.destroy();
    this._slider = new DmxSlider({
      label: CHANNEL_NAMES[cfg.channel],
      color,
      value: 0,
      onChange: (val) => this._onSliderChange(val),
    });
    this.shadowRoot.getElementById('slider-mount').appendChild(this._slider.el);

    // Sync current state
    if (this._hass) {
      const stateObj = this._hass.states[cfg.entity];
      const rgb = getRGBFromState(stateObj);
      this._slider.setValue(rgb[cfg.channel], false);
    }
  }

  _onSliderChange(val) {
    if (!this._hass) return;
    this._updating = true;
    const stateObj = this._hass.states[this._config.entity];
    const rgb = getRGBFromState(stateObj);
    rgb[this._config.channel] = val;
    setRGB(this._hass, this._config.entity, rgb.r, rgb.g, rgb.b);
    setTimeout(() => { this._updating = false; }, 800);
  }

  // ── Config UI (Lovelace editor)
  static getConfigElement() {
    return document.createElement('dmx-channel-card-editor');
  }

  static getStubConfig() {
    return { entity: 'light.rgb_light', channel: 'r' };
  }
}

/* Editor for dmx-channel-card */
class DmxChannelCardEditor extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this._config = {};
    this._hass = null;
  }

  setConfig(config) {
    this._config = { ...config };
    this._render();
  }

  set hass(hass) {
    this._hass = hass;
    this._render();
  }

  _render() {
    const cfg = this._config;
    const entities = this._hass
      ? Object.keys(this._hass.states).filter(e => e.startsWith('light.'))
      : [];

    this.shadowRoot.innerHTML = `
      <style>${BASE_CSS}</style>
      <div class="editor">
        <label>Light Entity</label>
        <select id="entity">
          ${entities.map(e => `<option value="${e}" ${e === cfg.entity ? 'selected' : ''}>${e}</option>`).join('')}
        </select>
        <label>Channel</label>
        <select id="channel">
          <option value="r" ${cfg.channel === 'r' ? 'selected' : ''}>Red</option>
          <option value="g" ${cfg.channel === 'g' ? 'selected' : ''}>Green</option>
          <option value="b" ${cfg.channel === 'b' ? 'selected' : ''}>Blue</option>
        </select>
        <label>Card Name (optional)</label>
        <input type="text" id="name" value="${cfg.name || ''}" placeholder="Leave blank for default">
        <label>Slider Colour</label>
        <input type="color" id="color" value="${cfg.color || CHANNEL_COLORS[cfg.channel || 'r']}">
      </div>
    `;

    const fire = () => {
      this._config = {
        ...this._config,
        entity:  this.shadowRoot.getElementById('entity').value,
        channel: this.shadowRoot.getElementById('channel').value,
        name:    this.shadowRoot.getElementById('name').value || undefined,
        color:   this.shadowRoot.getElementById('color').value,
      };
      this.dispatchEvent(new CustomEvent('config-changed', { detail: { config: this._config }, bubbles: true, composed: true }));
    };

    this.shadowRoot.getElementById('entity').addEventListener('change', fire);
    this.shadowRoot.getElementById('channel').addEventListener('change', () => {
      // Auto-set color to channel default
      const ch = this.shadowRoot.getElementById('channel').value;
      this.shadowRoot.getElementById('color').value = CHANNEL_COLORS[ch];
      fire();
    });
    this.shadowRoot.getElementById('name').addEventListener('input', fire);
    this.shadowRoot.getElementById('color').addEventListener('input', fire);
  }
}

/* ─────────────────────────────────────────────────────────────
   CARD 2: dmx-rgb-card
   All three channels for one RGB light
───────────────────────────────────────────────────────────── */
class DmxRgbCard extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this._hass = null;
    this._config = {};
    this._sliders = {};
    this._updating = false;
  }

  setConfig(config) {
    if (!config.entity) throw new Error('dmx-rgb-card: entity is required');
    this._config = {
      entity:   config.entity,
      name:     config.name    || null,
      color_r:  config.color_r || CHANNEL_COLORS.r,
      color_g:  config.color_g || CHANNEL_COLORS.g,
      color_b:  config.color_b || CHANNEL_COLORS.b,
    };
    this._render();
  }

  set hass(hass) {
    this._hass = hass;
    if (this._updating) return;
    const stateObj = hass.states[this._config.entity];
    const rgb = getRGBFromState(stateObj);
    for (const ch of ['r','g','b']) {
      if (this._sliders[ch] && this._sliders[ch].value !== rgb[ch]) {
        this._sliders[ch].setValue(rgb[ch], false);
      }
    }
  }

  _render() {
    const cfg = this._config;

    this.shadowRoot.innerHTML = `
      <style>${BASE_CSS}</style>
      <ha-card>
        <div class="card">
          <div class="card-title">
            <span class="dot" style="background:linear-gradient(135deg,${cfg.color_r},${cfg.color_g},${cfg.color_b});box-shadow:none"></span>
            <span>${cfg.name || 'RGB DMX'}</span>
            <span class="entity-name" style="margin-left:auto;font-size:9px;color:var(--dmx-text-muted)">${cfg.entity}</span>
          </div>
          <div id="r-mount" style="--channel-color:${cfg.color_r}"></div>
          <div style="height:10px"></div>
          <div id="g-mount" style="--channel-color:${cfg.color_g}"></div>
          <div style="height:10px"></div>
          <div id="b-mount" style="--channel-color:${cfg.color_b}"></div>
        </div>
      </ha-card>
    `;

    for (const [ch, color] of [['r', cfg.color_r],['g', cfg.color_g],['b', cfg.color_b]]) {
      if (this._sliders[ch]) this._sliders[ch].destroy();
      const sl = new DmxSlider({
        label: CHANNEL_NAMES[ch],
        color,
        value: 0,
        onChange: (val) => this._onSliderChange(ch, val),
      });
      this._sliders[ch] = sl;
      this.shadowRoot.getElementById(ch + '-mount').appendChild(sl.el);
    }

    if (this._hass) {
      const rgb = getRGBFromState(this._hass.states[cfg.entity]);
      for (const ch of ['r','g','b']) this._sliders[ch].setValue(rgb[ch], false);
    }
  }

  _onSliderChange(changedCh, val) {
    if (!this._hass) return;
    this._updating = true;
    const rgb = {
      r: this._sliders.r.value,
      g: this._sliders.g.value,
      b: this._sliders.b.value,
    };
    rgb[changedCh] = val;
    setRGB(this._hass, this._config.entity, rgb.r, rgb.g, rgb.b);
    setTimeout(() => { this._updating = false; }, 800);
  }

  static getConfigElement() { return document.createElement('dmx-rgb-card-editor'); }
  static getStubConfig() { return { entity: 'light.rgb_light' }; }
}

/* Editor for dmx-rgb-card */
class DmxRgbCardEditor extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this._config = {};
    this._hass = null;
  }
  setConfig(config) { this._config = { ...config }; this._render(); }
  set hass(hass) { this._hass = hass; this._render(); }

  _render() {
    const cfg = this._config;
    const entities = this._hass
      ? Object.keys(this._hass.states).filter(e => e.startsWith('light.'))
      : [];

    this.shadowRoot.innerHTML = `
      <style>${BASE_CSS}</style>
      <div class="editor">
        <label>Light Entity</label>
        <select id="entity">
          ${entities.map(e => `<option value="${e}" ${e === cfg.entity ? 'selected' : ''}>${e}</option>`).join('')}
        </select>
        <label>Card Name (optional)</label>
        <input type="text" id="name" value="${cfg.name || ''}" placeholder="RGB DMX">
        <label>Red Slider Colour</label>
        <input type="color" id="color_r" value="${cfg.color_r || CHANNEL_COLORS.r}">
        <label>Green Slider Colour</label>
        <input type="color" id="color_g" value="${cfg.color_g || CHANNEL_COLORS.g}">
        <label>Blue Slider Colour</label>
        <input type="color" id="color_b" value="${cfg.color_b || CHANNEL_COLORS.b}">
      </div>
    `;

    const fire = () => {
      this._config = {
        entity:  this.shadowRoot.getElementById('entity').value,
        name:    this.shadowRoot.getElementById('name').value || undefined,
        color_r: this.shadowRoot.getElementById('color_r').value,
        color_g: this.shadowRoot.getElementById('color_g').value,
        color_b: this.shadowRoot.getElementById('color_b').value,
      };
      this.dispatchEvent(new CustomEvent('config-changed', { detail: { config: this._config }, bubbles: true, composed: true }));
    };
    this.shadowRoot.querySelectorAll('select, input').forEach(el => el.addEventListener('input', fire));
    this.shadowRoot.querySelectorAll('select, input').forEach(el => el.addEventListener('change', fire));
  }
}

/* ─────────────────────────────────────────────────────────────
   CARD 3: dmx-group-card
   Group + Brightness slider — controls multiple lights at once.
   Compatible with dmx-channel-card / dmx-rgb-card (listens to
   same entities so those cards update reactively too).
───────────────────────────────────────────────────────────── */
class DmxGroupCard extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this._hass = null;
    this._config = {};
    this._sliders = {};      // keyed by entity id + channel
    this._brightnessSlider = null;
    this._groupSlider = null;
    this._updating = false;
    this._baseRGB = {};      // stores per-entity rgb when brightness was set
  }

  setConfig(config) {
    if (!config.entities || !Array.isArray(config.entities)) {
      throw new Error('dmx-group-card: entities[] is required');
    }
    this._config = {
      entities: config.entities,
      name:     config.name          || 'DMX Group',
      color:    config.color         || '#4af',
      color_r:  config.color_r       || CHANNEL_COLORS.r,
      color_g:  config.color_g       || CHANNEL_COLORS.g,
      color_b:  config.color_b       || CHANNEL_COLORS.b,
    };
    this._render();
  }

  set hass(hass) {
    this._hass = hass;
    if (this._updating) return;
    // Update per-entity sliders
    for (const entry of this._config.entities) {
      const entityId = typeof entry === 'string' ? entry : entry.entity;
      const rgb = getRGBFromState(hass.states[entityId]);
      for (const ch of ['r','g','b']) {
        const key = entityId + ':' + ch;
        if (this._sliders[key] && this._sliders[key].value !== rgb[ch]) {
          this._sliders[key].setValue(rgb[ch], false);
        }
      }
    }
  }

  _render() {
    const cfg = this._config;

    // Build entity sections HTML
    let entityHtml = '';
    for (const entry of cfg.entities) {
      const entityId = typeof entry === 'string' ? entry : entry.entity;
      const label    = typeof entry === 'object' && entry.name ? entry.name : entityId.split('.')[1].replace(/_/g, ' ');
      entityHtml += `
        <div class="entity-section">
          <div class="card-title" style="margin-bottom:8px">
            <span class="dot" style="background:linear-gradient(135deg,${cfg.color_r},${cfg.color_g},${cfg.color_b});box-shadow:none;width:5px;height:5px"></span>
            <span style="font-size:9px">${label}</span>
          </div>
          <div id="mount-${this._safeId(entityId)}-r" style="--channel-color:${cfg.color_r}"></div>
          <div style="height:8px"></div>
          <div id="mount-${this._safeId(entityId)}-g" style="--channel-color:${cfg.color_g}"></div>
          <div style="height:8px"></div>
          <div id="mount-${this._safeId(entityId)}-b" style="--channel-color:${cfg.color_b}"></div>
        </div>
        <div style="height:16px;border-bottom:1px solid var(--dmx-border);margin-bottom:16px"></div>
      `;
    }

    this.shadowRoot.innerHTML = `
      <style>
        ${BASE_CSS}
        :host { --channel-color: ${cfg.color}; }
        .divider { height:1px; background:var(--dmx-border); margin:14px 0; }
        .entity-section { margin-bottom:0; }
        .group-section { margin-bottom:14px; }
      </style>
      <ha-card>
        <div class="card">
          <div class="card-title">
            <span class="dot"></span>
            <span>${cfg.name}</span>
          </div>

          <div class="group-section">
            <div class="card-title" style="margin-bottom:4px;font-size:8px;color:var(--dmx-text-muted)">
              <span>GROUP MASTER</span>
            </div>
            <div id="group-mount"></div>
          </div>

          <div class="group-section">
            <div class="card-title" style="margin-bottom:4px;font-size:8px;color:var(--dmx-text-muted)">
              <span>BRIGHTNESS</span>
            </div>
            <div id="brightness-mount"></div>
          </div>

          <div class="divider"></div>
          ${entityHtml}
        </div>
      </ha-card>
    `;

    // Group master slider — sets all entities to same R,G,B value (white balance)
    this._groupSlider = new DmxSlider({
      label: 'Master',
      color: cfg.color,
      value: 255,
      onChange: (val) => this._onGroupChange(val),
    });
    this.shadowRoot.getElementById('group-mount').appendChild(this._groupSlider.el);

    // Brightness slider — scales all channels proportionally
    this._brightnessSlider = new DmxSlider({
      label: 'Brightness',
      color: '#ffd700',
      value: 255,
      onChange: (val) => this._onBrightnessChange(val),
    });
    this.shadowRoot.getElementById('brightness-mount').appendChild(this._brightnessSlider.el);

    // Per-entity RGB sliders
    this._sliders = {};
    for (const entry of cfg.entities) {
      const entityId = typeof entry === 'string' ? entry : entry.entity;
      const sid = this._safeId(entityId);
      for (const [ch, color] of [['r', cfg.color_r],['g', cfg.color_g],['b', cfg.color_b]]) {
        const sl = new DmxSlider({
          label: CHANNEL_NAMES[ch],
          color,
          value: 0,
          onChange: (val) => this._onEntityChannelChange(entityId, ch, val),
        });
        const key = entityId + ':' + ch;
        this._sliders[key] = sl;
        const mount = this.shadowRoot.getElementById(`mount-${sid}-${ch}`);
        if (mount) mount.appendChild(sl.el);
      }
    }

    // Sync from HA state
    if (this._hass) {
      for (const entry of cfg.entities) {
        const entityId = typeof entry === 'string' ? entry : entry.entity;
        const rgb = getRGBFromState(this._hass.states[entityId]);
        for (const ch of ['r','g','b']) {
          const key = entityId + ':' + ch;
          if (this._sliders[key]) this._sliders[key].setValue(rgb[ch], false);
        }
      }
    }
  }

  _safeId(entityId) {
    return entityId.replace(/[^a-zA-Z0-9]/g, '_');
  }

  _onGroupChange(val) {
    if (!this._hass) return;
    this._updating = true;
    for (const entry of this._config.entities) {
      const entityId = typeof entry === 'string' ? entry : entry.entity;
      // Set each channel slider to val
      for (const ch of ['r','g','b']) {
        const key = entityId + ':' + ch;
        if (this._sliders[key]) this._sliders[key].setValue(val, false);
      }
      setRGB(this._hass, entityId, val, val, val);
    }
    // Reset brightness to 255 when group changes
    this._brightnessSlider.setValue(255, false);
    setTimeout(() => { this._updating = false; }, 800);
  }

  _onBrightnessChange(brightness) {
    if (!this._hass) return;
    this._updating = true;
    const scale = brightness / 255;
    for (const entry of this._config.entities) {
      const entityId = typeof entry === 'string' ? entry : entry.entity;
      // Use current slider values as the base
      const base = {
        r: this._sliders[entityId + ':r']?.value ?? 255,
        g: this._sliders[entityId + ':g']?.value ?? 255,
        b: this._sliders[entityId + ':b']?.value ?? 255,
      };
      const newR = Math.round(base.r * scale);
      const newG = Math.round(base.g * scale);
      const newB = Math.round(base.b * scale);
      setRGB(this._hass, entityId, newR, newG, newB);
    }
    setTimeout(() => { this._updating = false; }, 800);
  }

  _onEntityChannelChange(entityId, changedCh, val) {
    if (!this._hass) return;
    this._updating = true;
    const rgb = {
      r: this._sliders[entityId + ':r']?.value ?? 0,
      g: this._sliders[entityId + ':g']?.value ?? 0,
      b: this._sliders[entityId + ':b']?.value ?? 0,
    };
    rgb[changedCh] = val;
    setRGB(this._hass, entityId, rgb.r, rgb.g, rgb.b);
    setTimeout(() => { this._updating = false; }, 800);
  }

  static getConfigElement() { return document.createElement('dmx-group-card-editor'); }

  static getStubConfig() {
    return {
      name: 'DMX Group',
      entities: ['light.rgb_light_1', 'light.rgb_light_2'],
    };
  }
}

/* Editor for dmx-group-card */
class DmxGroupCardEditor extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this._config = {};
    this._hass = null;
  }
  setConfig(config) { this._config = { ...config, entities: [...(config.entities || [])] }; this._render(); }
  set hass(hass) { this._hass = hass; this._render(); }

  _render() {
    const cfg = this._config;
    const entities = this._hass
      ? Object.keys(this._hass.states).filter(e => e.startsWith('light.'))
      : [];

    const entRows = (cfg.entities || []).map((e, i) => {
      const id = typeof e === 'string' ? e : e.entity;
      const nm = typeof e === 'object' && e.name ? e.name : '';
      return `
        <div style="display:flex;gap:6px;align-items:center;margin-bottom:6px">
          <select class="ent-entity" data-i="${i}" style="flex:1">
            ${entities.map(en => `<option value="${en}" ${en === id ? 'selected':''}>${en}</option>`).join('')}
          </select>
          <input type="text" class="ent-name" data-i="${i}" value="${nm}" placeholder="Name" style="flex:0.6">
          <button class="ent-remove" data-i="${i}" style="background:#c33;border:none;color:#fff;border-radius:4px;padding:4px 8px;cursor:pointer;font-size:10px">✕</button>
        </div>
      `;
    }).join('');

    this.shadowRoot.innerHTML = `
      <style>${BASE_CSS}
        button.add { background:var(--dmx-surface2);border:1px solid var(--dmx-border);color:var(--dmx-text);border-radius:6px;padding:6px 12px;cursor:pointer;font-family:var(--dmx-font);font-size:10px;letter-spacing:0.1em;text-transform:uppercase; }
      </style>
      <div class="editor">
        <label>Group Name</label>
        <input type="text" id="name" value="${cfg.name || 'DMX Group'}">
        <label>Master/Group Slider Colour</label>
        <input type="color" id="color" value="${cfg.color || '#44aaff'}">
        <label>Red Channel Colour</label>
        <input type="color" id="color_r" value="${cfg.color_r || CHANNEL_COLORS.r}">
        <label>Green Channel Colour</label>
        <input type="color" id="color_g" value="${cfg.color_g || CHANNEL_COLORS.g}">
        <label>Blue Channel Colour</label>
        <input type="color" id="color_b" value="${cfg.color_b || CHANNEL_COLORS.b}">
        <label>Entities</label>
        <div id="ent-list">${entRows}</div>
        <button class="add" id="add-entity">+ Add Light</button>
      </div>
    `;

    const fire = () => {
      const ents = [];
      this.shadowRoot.querySelectorAll('.ent-entity').forEach((sel, i) => {
        const nameEl = this.shadowRoot.querySelectorAll('.ent-name')[i];
        const nm = nameEl ? nameEl.value : '';
        ents.push(nm ? { entity: sel.value, name: nm } : sel.value);
      });
      this._config = {
        ...this._config,
        name:     this.shadowRoot.getElementById('name').value,
        color:    this.shadowRoot.getElementById('color').value,
        color_r:  this.shadowRoot.getElementById('color_r').value,
        color_g:  this.shadowRoot.getElementById('color_g').value,
        color_b:  this.shadowRoot.getElementById('color_b').value,
        entities: ents,
      };
      this.dispatchEvent(new CustomEvent('config-changed', { detail: { config: this._config }, bubbles: true, composed: true }));
    };

    this.shadowRoot.querySelectorAll('input,select').forEach(el => {
      el.addEventListener('input', fire);
      el.addEventListener('change', fire);
    });

    this.shadowRoot.getElementById('add-entity').addEventListener('click', () => {
      this._config.entities = [...(this._config.entities || []), entities[0] || 'light.rgb_light'];
      this._render();
      fire();
    });

    this.shadowRoot.querySelectorAll('.ent-remove').forEach(btn => {
      btn.addEventListener('click', () => {
        const i = parseInt(btn.dataset.i);
        this._config.entities = this._config.entities.filter((_, idx) => idx !== i);
        this._render();
        fire();
      });
    });
  }
}

/* ─────────────────────────────────────────────────────────────
   REGISTER EVERYTHING
───────────────────────────────────────────────────────────── */
customElements.define('dmx-channel-card',        DmxChannelCard);
customElements.define('dmx-channel-card-editor', DmxChannelCardEditor);
customElements.define('dmx-rgb-card',            DmxRgbCard);
customElements.define('dmx-rgb-card-editor',     DmxRgbCardEditor);
customElements.define('dmx-group-card',          DmxGroupCard);
customElements.define('dmx-group-card-editor',   DmxGroupCardEditor);

window.customCards = window.customCards || [];
window.customCards.push(
  {
    type:        'dmx-channel-card',
    name:        'DMX Channel Card',
    description: 'Single R, G, or B DMX-style slider for a light entity',
    preview:     true,
    documentationURL: 'https://github.com/StuffzEZ/DMXJS',
  },
  {
    type:        'dmx-rgb-card',
    name:        'DMX RGB Card',
    description: 'Three-channel RGB DMX controller for one light entity',
    preview:     true,
    documentationURL: 'https://github.com/StuffzEZ/DMXJS',
  },
  {
    type:        'dmx-group-card',
    name:        'DMX Group Card',
    description: 'Group + brightness control for multiple RGB lights',
    preview:     true,
    documentationURL: 'https://github.com/StuffzEZ/DMXJS',
  }
);

console.info(
  '%c DMX LIGHT CARD %c v1.0.0 ',
  'background:#1a1a1f;color:#4af;font-weight:700;padding:2px 6px;border-radius:4px 0 0 4px;border:1px solid #3a3a44',
  'background:#4af;color:#000;font-weight:700;padding:2px 6px;border-radius:0 4px 4px 0'
);
