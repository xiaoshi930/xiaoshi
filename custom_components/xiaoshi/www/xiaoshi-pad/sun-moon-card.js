import { LitElement, html, css } from "https://unpkg.com/lit-element@2.4.0/lit-element.js?module";

window.customCards = window.customCards || [];
window.customCards.push({
    type: 'xiaoshi-sun-moon-card',
    name: '消逝(A平板端)-日出日落月升月落卡片',
    description: '平板端日出日落月升月落卡片',
    preview: true
});

// ======================== 编辑器 ========================
class SunMoonCardEditor extends LitElement {
    static get properties() {
        return { _config: { type: Object } };
    }
    setConfig(config) { this._config = config || {}; }

    render() {
        return html`
            <div class="editor">
                <div class="field">
                    <label>太阳实体</label>
                    <input .value=${this._config.sun_entity || 'sun.sun'}
                        @input=${(e) => this._valueChanged('sun_entity', e.target.value)}>
                </div>
                <div class="field">
                    <label>卡片宽度 (px)</label>
                    <input type="number" .value=${this._config.width || '300'}
                        @input=${(e) => this._valueChanged('width', e.target.value)}>
                </div>
                <div class="field">
                    <label>卡片高度 (px)</label>
                    <input type="number" .value=${this._config.height || '240'}
                        @input=${(e) => this._valueChanged('height', e.target.value)}>
                </div>
            </div>`;
    }
    _valueChanged(key, value) {
        const ev = new CustomEvent('config-changed', {
            detail: { config: { ...this._config, [key]: value } },
            bubbles: true, composed: true
        });
        this.dispatchEvent(ev);
    }
    static get styles() {
        return css`
            .editor { padding: 16px; display: flex; flex-direction: column; gap: 12px; }
            .field { display: flex; flex-direction: column; gap: 4px; }
            .field label { font-size: 12px; color: var(--secondary-text-color); }
            .field input {
                padding: 8px; border: 1px solid var(--divider-color);
                border-radius: 4px; font-size: 14px;
                background: var(--card-background-color);
                color: var(--primary-text-color);
            }
        `;
    }
}
customElements.define('xiaoshi-sun-moon-card-editor', SunMoonCardEditor);

// ======================== 主卡片 ========================
class SunMoonCard extends LitElement {
    static getConfigElement() {
        return document.createElement("xiaoshi-sun-moon-card-editor");
    }
    static get properties() {
        return {
            hass: { type: Object },
            config: { type: Object },
            _sunData: { type: Object },
            _moonData: { type: Object },
            _now: { type: Number },
        };
    }

    constructor() {
        super();
        this._sunData = null;
        this._moonData = null;
        this._now = Date.now();
        this._updateTimer = null;
        this._width = 300;
        this._height = 240;
    }

    setConfig(config) {
        this.config = config;
        const w = parseInt(config.width) || 300;
        const h = parseInt(config.height) || 240;
        let changed = false;
        if (w !== this._width) { this._width = w; changed = true; }
        if (h !== this._height) { this._height = h; changed = true; }
        if (changed) this.requestUpdate();
    }

    connectedCallback() {
        super.connectedCallback();
        this._updateTimer = setInterval(() => {
            this._now = Date.now();
            this._computeData();
            this.requestUpdate();
        }, 60000);
        this._computeData();
    }

    disconnectedCallback() {
        super.disconnectedCallback();
        if (this._updateTimer) { clearInterval(this._updateTimer); this._updateTimer = null; }
    }

    set hass(hass) {
        this._hass = hass;
        this._computeData();
        this.requestUpdate();
    }

    // ---------- 数据计算 ----------
    _computeData() {
        if (!this._hass) return;
        const sunEntity = this.config?.sun_entity || 'sun.sun';
        const sunState = this._hass.states[sunEntity];
        if (sunState) {
            this._sunData = {
                rising: sunState.attributes.next_rising,
                setting: sunState.attributes.next_setting,
                dawn: sunState.attributes.next_dawn,
                dusk: sunState.attributes.next_dusk,
                above: sunState.state === 'above_horizon',
                elevation: sunState.attributes.elevation,
            };
        }
        this._moonData = this._calcMoon();
    }

    _calcMoon() {
        const now = new Date(this._now);
        const jd = this._toJD(now);
        // 已知新月：2000-01-06 18:14 UTC（JD 2451550.260）
        const jdNew = 2451550.260;
        const syn = 29.53058867;
        const age = ((jd - jdNew) % syn + syn) % syn;
        const angle = (age / syn) * 2 * Math.PI;
        const ill = (1 - Math.cos(angle)) / 2;

        // 月相名称
        let name;
        if (age < 1.84566) name = '新月';
        else if (age < 5.53699) name = '蛾眉月';
        else if (age < 9.22831) name = '上弦月';
        else if (age < 12.91963) name = '盈凸月';
        else if (age < 16.61096) name = '满月';
        else if (age < 20.30228) name = '亏凸月';
        else if (age < 23.99361) name = '下弦月';
        else if (age < 27.68493) name = '残月';
        else name = '新月';

        // 近似月出月落：新月≈6:00升起, 满月≈18:00升起
        const riseH = (age / syn) * 24 + 6;
        const setH = riseH + 12.42;

        const today = new Date(now); today.setHours(0,0,0,0);
        const mRise = new Date(today); mRise.setHours(0,0,0,0);
        mRise.setMilliseconds(riseH * 3600000);
        const mSet = new Date(today); mSet.setHours(0,0,0,0);
        mSet.setMilliseconds(setH * 3600000);

        // 判断当前月亮是否在地平线上
        let up = false;
        const t = now.getTime();
        if (mSet > mRise) {
            up = t >= mRise.getTime() && t < mSet.getTime();
        } else {
            up = t >= mRise.getTime() || t < mSet.getTime();
        }
        // 同时检查昨天是否延续到今天
        if (!up) {
            const yRise = new Date(mRise); yRise.setDate(yRise.getDate() - 1);
            const ySet = new Date(mSet); ySet.setDate(ySet.getDate() - 1);
            if (ySet > yRise && t >= yRise.getTime() && t < ySet.getTime()) up = true;
        }

        return { age, angle, ill, name, rise: mRise, set: mSet, up, riseH, setH };
    }

    _toJD(d) {
        let y = d.getUTCFullYear(), m = d.getUTCMonth() + 1;
        const day = d.getUTCDate() + d.getUTCHours()/24 + d.getUTCMinutes()/1440 + d.getUTCSeconds()/86400;
        if (m <= 2) { y--; m += 12; }
        const a = Math.floor(y/100), b = 2 - a + Math.floor(a/4);
        return Math.floor(365.25*(y+4716)) + Math.floor(30.6001*(m+1)) + day + b - 1524.5;
    }

    // ---------- 位置计算 ----------
    // 日出=右(东)=x≈1，日落=左(西)=x≈0
    // y = ±2·√(x·(1-x))  精确落在椭圆弧线上
    _arcY(x) { return 2 * Math.sqrt(Math.max(0, x * (1 - x))); }

    _sunPos() {
        const sd = this._sunData;
        if (!sd?.rising || !sd?.setting) return null;
        const now = new Date(this._now);
        const r = new Date(sd.rising);
        const s = new Date(sd.setting);
        const nowH = now.getHours() + now.getMinutes()/60 + now.getSeconds()/3600;
        const rH = r.getHours() + r.getMinutes()/60;
        const sH = s.getHours() + s.getMinutes()/60;
        if (sd.above) {
            // 白天：太阳在上弧，右(日出)→左(日落)
            const pct = (nowH - rH) / (sH - rH);
            const x = 1 - pct;
            return { x, y: -this._arcY(x), on: true };
        }
        // 夜晚：太阳在地下，从左(日落)走到右(次日日出)
        let rAbs = rH, sAbs = sH;
        if (nowH < rH) sAbs -= 24;
        else rAbs += 24;
        const pct = (nowH - sAbs) / (rAbs - sAbs);
        const x = pct;
        return { x, y: this._arcY(x), on: false };
    }

    _moonPos() {
        const md = this._moonData;
        if (!md) return null;
        const now = this._now;
        let r = md.rise.getTime(), s = md.set.getTime();
        if (r > s) {
            if (now > s) r = new Date(md.rise).setDate(md.rise.getDate()-1);
            else s = new Date(md.set).setDate(md.set.getDate()+1);
        }
        const on = now >= r && now < s;
        if (on) {
            // 月亮在上弧，右(月出)→左(月落)
            const pct = (now - r) / (s - r);
            const x = 1 - pct;
            return { x, y: -this._arcY(x), on, ill: md.ill, angle: md.angle, name: md.name };
        }
        // 月亮在地下
        const x = 1 - md.riseH / 24;
        return { x, y: this._arcY(x), on: false, ill: md.ill, angle: md.angle, name: md.name };
    }

    _fmt(d) {
        if (!d) return '--:--';
        const dt = new Date(d);
        return dt.getHours().toString().padStart(2,'0')+':'+dt.getMinutes().toString().padStart(2,'0');
    }

    // ---------- 渲染 ----------
    render() {
        const sd = this._sunData;
        if (!sd) return html`<ha-card><div class="loading">加载中...</div></ha-card>`;
        const w = this._width, h = this._height;
        return html`
            <ha-card style="width:${w}px">
                <canvas id="cvs" width="${w}" height="${h}"></canvas>
            </ha-card>`;
    }

    updated() {
        this._draw();
    }

    _draw() {
        const cvs = this.shadowRoot?.querySelector('#cvs');
        if (!cvs) return;
        const ctx = cvs.getContext('2d');
        const W = cvs.width, H = cvs.height;
        ctx.clearRect(0,0,W,H);

        const hY = H * 0.48;
        const cx = W / 2, cy = hY;
        const rx = W * 0.38, ry = H * 0.38;

        // ---- 地平线 ----
        ctx.strokeStyle = 'rgba(255,255,255,0.4)';
        ctx.lineWidth = 1; ctx.setLineDash([5,4]);
        ctx.beginPath(); ctx.moveTo(35, hY); ctx.lineTo(W-35, hY); ctx.stroke();
        ctx.setLineDash([]);
        // 东西标注
        ctx.fillStyle = 'rgba(255,255,255,0.6)'; ctx.font = '11px sans-serif';
        ctx.textBaseline = 'middle';
        ctx.textAlign = 'left';  ctx.fillText('西', 8, hY);
        ctx.textAlign = 'right'; ctx.fillText('东', W-8, hY);

        // ---- 上弧轨道 ----
        ctx.strokeStyle = 'rgba(255,255,255,0.3)';
        ctx.lineWidth = 1; ctx.setLineDash([3,4]);
        ctx.beginPath(); ctx.ellipse(cx, cy, rx, ry, 0, Math.PI, 0); ctx.stroke();
        ctx.setLineDash([]);

        // ---- 下弧轨道 ----
        ctx.strokeStyle = 'rgba(255,255,255,0.2)';
        ctx.setLineDash([3,4]);
        ctx.beginPath(); ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI); ctx.stroke();
        ctx.setLineDash([]);

        const sp = this._sunPos();
        const mp = this._moonPos();

        // ========== 太阳 ==========
        if (sp) {
            const sx = cx - rx + sp.x * rx * 2;
            const sy = cy + sp.y * ry;
            if (sp.on) {
                this._drawGlow(ctx, sx, sy, 10, 30,
                    'rgba(255,200,50)','rgba(255,120,20,0.4)','rgba(255,60,10,0)');
                ctx.fillStyle = '#FFD54F';
                ctx.beginPath(); ctx.arc(sx, sy, 14, 0, Math.PI*2); ctx.fill();
            } else {
                ctx.save(); ctx.globalAlpha = 0.5;
                ctx.fillStyle = '#FFD54F';
                ctx.beginPath(); ctx.arc(sx, sy, 14, 0, Math.PI*2); ctx.fill();
                ctx.restore();
            }
        }

        // ========== 月亮 ==========
        if (mp) {
            const mx = cx - rx + mp.x * rx * 2;
            const my = cy + mp.y * ry;
            if (mp.on) {
                this._drawGlow(ctx, mx, my, 5, 22,
                    'rgba(170,205,255)','rgba(130,160,240,0.3)','rgba(100,130,220,0)');
                this._drawMoonBody(ctx, mx, my, 11, mp);
            } else {
                ctx.save(); ctx.globalAlpha = 0.4;
                this._drawMoonBody(ctx, mx, my, 11, mp);
                ctx.restore();
            }
        }
    }

    _drawMoonBody(ctx, mx, my, r, mp) {
        // 亮面
        ctx.fillStyle = '#D0DEF5';
        ctx.beginPath(); ctx.arc(mx, my, r, 0, Math.PI*2); ctx.fill();
        // 暗面
        if (mp.ill < 0.99) {
            ctx.save();
            ctx.beginPath(); ctx.arc(mx, my, r, 0, Math.PI*2); ctx.clip();
            ctx.fillStyle = 'rgba(18,20,35,0.78)';
            const dx = Math.cos(mp.angle) * (r + 0.5);
            ctx.beginPath(); ctx.ellipse(mx + dx, my, r + 0.5, r * Math.abs(Math.sin(mp.angle||0.01)), 0, 0, Math.PI*2);
            ctx.fill();
            ctx.restore();
        }
    }

    _drawGlow(ctx, x, y, r0, r1, c0, c1, c2) {
        const g = ctx.createRadialGradient(x, y, r0, x, y, r1);
        g.addColorStop(0, c0); g.addColorStop(0.5, c1); g.addColorStop(1, c2);
        ctx.fillStyle = g;
        ctx.beginPath(); ctx.arc(x, y, r1, 0, Math.PI*2); ctx.fill();
    }

    // ---------- 样式 ----------
    static get styles() {
        return css`
            :host { display: block; }
            ha-card {
                background: transparent !important;
                box-shadow: none !important;
                border: none !important;
                padding: 0 !important;
                border-radius: 0;
            }
            #cvs { display: block; }
            .loading { text-align: center; padding: 18px; opacity: 0.5; color: #fff; }
        `;
    }
}
customElements.define('xiaoshi-sun-moon-card', SunMoonCard);
