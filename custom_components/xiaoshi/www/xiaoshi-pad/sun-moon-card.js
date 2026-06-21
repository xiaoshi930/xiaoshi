const whenDefined = (t) => customElements.whenDefined(t);
await Promise.race([whenDefined("ha-card"), whenDefined("ha-panel-lovelace")]);
const LitElement = window.LitElement || Object.getPrototypeOf(customElements.get("ha-card"));
const html = LitElement.prototype.html;
const css = LitElement.prototype.css;

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
        const jdNew = 2451550.260;
        const syn = 29.53058867;
        const age = ((jd - jdNew) % syn + syn) % syn;
        const angle = (age / syn) * 2 * Math.PI;
        const ill = (1 - Math.cos(angle)) / 2;

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

        // 从太阳数据反算坐标，再精确计算月出月落
        const coords = this._calcLatLon();
        if (coords) {
            return this._calcMoonAccurate(now, jd, { age, angle, ill, name }, coords);
        }

        // 回退：近似计算
        return this._calcMoonApprox(now, { age, angle, ill, name, syn });
    }

    // ---------- 反算经纬度 ----------
    _calcLatLon() {
        const sd = this._sunData;
        if (!sd?.rising || !sd?.setting) return null;
        const r = new Date(sd.rising);
        const s = new Date(sd.setting);

        // 确保日出日落来自同一天
        let sunrise, sunset;
        if (r < s) { sunrise = r; sunset = s; }
        else {
            // next_rising 是明天，用昨天的近似替代
            sunrise = new Date(r.getTime() - 86400000);
            sunset = s;
        }

        // 昼长（小时）
        const dayLen = (sunset.getTime() - sunrise.getTime()) / 3600000;

        // 太阳正午 UTC 时刻
        const noonMs = (sunrise.getTime() + sunset.getTime()) / 2;
        const noon = new Date(noonMs);
        const noonH = noon.getUTCHours() + noon.getUTCMinutes() / 60 + noon.getUTCSeconds() / 3600;

        // 经度：每差1小时 = 15°
        const lon = (12 - noonH) * 15;

        // 太阳赤纬
        const doy = this._dayOfYear(sunrise);
        const dec = this._solarDeclination(doy);

        // 纬度：cos(HA) = -tan(lat)·tan(dec)
        const HA = dayLen * 7.5; // 半天角（度）
        const cosHA = Math.cos(HA * Math.PI / 180);
        const tanDec = Math.tan(dec * Math.PI / 180);

        if (Math.abs(tanDec) < 1e-8) return { lat: 35, lon };

        const tanLat = -cosHA / tanDec;
        let lat = Math.atan(tanLat) * 180 / Math.PI;
        lat = Math.max(-80, Math.min(80, lat));

        return { lat, lon };
    }

    _dayOfYear(d) {
        const start = new Date(Date.UTC(d.getUTCFullYear(), 0, 0));
        return Math.floor((d.getTime() - start.getTime()) / 86400000);
    }

    _solarDeclination(doy) {
        const B = (doy - 1) * 2 * Math.PI / 365;
        return (0.006918 - 0.399912 * Math.cos(B) + 0.070257 * Math.sin(B)
              - 0.006758 * Math.cos(2*B) + 0.000907 * Math.sin(2*B)
              - 0.002697 * Math.cos(3*B) + 0.00148 * Math.sin(3*B)) * 180 / Math.PI;
    }

    // ---------- 精确月出月落 ----------
    _calcMoonAccurate(now, jd, phase, coords) {
        const { lat, lon } = coords;

        // 计算今天0h UT的月球赤经赤纬
        const jd0 = jd - (jd + 0.5) % 1; // truncate to 0h UT
        const pos0 = this._moonRaDec(jd0);

        // 第一次近似：用0h UT的月球位置算升落
        let times = this._moonRST(jd0, pos0.ra, pos0.dec, lat, lon);
        if (!times) return this._calcMoonApprox(now, phase);

        // 第二次迭代：用近似月出/月落时刻重新算月球位置
        const jdRise = jd0 + times.riseUT / 24;
        const jdSet = jd0 + times.setUT / 24;
        const posRise = this._moonRaDec(jdRise);
        const posSet = this._moonRaDec(jdSet);
        const raMid = (posRise.ra + posSet.ra) / 2;
        const decMid = (posRise.dec + posSet.dec) / 2;

        times = this._moonRST(jd0, raMid, decMid, lat, lon);
        if (!times) return this._calcMoonApprox(now, phase);

        // UT 小时数
        let riseUT = times.riseUT, setUT = times.setUT;

        // 归一化到当天 0-24 范围
        while (riseUT < 0) riseUT += 24;
        while (riseUT >= 24) riseUT -= 24;
        while (setUT < 0) setUT += 24;
        while (setUT >= 24) setUT -= 24;

        // 转换为本地时间
        const tzOff = -now.getTimezoneOffset() / 60; // 本地时区偏移（小时，如 +8）
        const riseLocal = (riseUT + tzOff + 48) % 24;
        const setLocal = (setUT + tzOff + 48) % 24;

        // 构造本地 Date 对象
        const today = new Date(now); today.setHours(0,0,0,0);
        const mRise = new Date(today);
        mRise.setHours(0,0,0,0);
        mRise.setMilliseconds(riseLocal * 3600000);
        const mSet = new Date(today);
        mSet.setHours(0,0,0,0);
        mSet.setMilliseconds(setLocal * 3600000);

        // 判断当前月亮是否在地平线上
        let up = false;
        const t = now.getTime();
        if (mSet > mRise) {
            up = t >= mRise.getTime() && t < mSet.getTime();
        } else {
            up = t >= mRise.getTime() || t < mSet.getTime();
        }
        if (!up) {
            const yRise = new Date(mRise); yRise.setDate(yRise.getDate() - 1);
            const ySet = new Date(mSet); ySet.setDate(ySet.getDate() - 1);
            if (ySet > yRise && t >= yRise.getTime() && t < ySet.getTime()) up = true;
        }

        return {
            age: phase.age, angle: phase.angle, ill: phase.ill, name: phase.name,
            rise: mRise, set: mSet, up, riseH: riseLocal, setH: setLocal
        };
    }

    // 月球赤经赤纬（低精度，基于轨道根数）
    _moonRaDec(jd) {
        const d = jd - 2451545.0;
        const toR = Math.PI / 180;

        let Lp = (218.316 + 13.176396 * d) % 360;
        let Mp = (134.963 + 13.064993 * d) % 360;
        let F  = (93.272  + 13.229350 * d) % 360;
        let D  = (297.850 + 12.190749 * d) % 360;

        Lp = ((Lp % 360) + 360) % 360;
        Mp = ((Mp % 360) + 360) % 360;
        F  = ((F  % 360) + 360) % 360;
        D  = ((D  % 360) + 360) % 360;

        // 黄经（包含主摄动项）
        const lambda = Lp
            + 6.289 * Math.sin(Mp * toR)
            + 1.274 * Math.sin((2*D - Mp) * toR)
            + 0.658 * Math.sin(2*D * toR)
            + 0.214 * Math.sin(2*Mp * toR)
            - 0.186 * Math.sin(Mp * toR)  // 简化项
            + 0.114 * Math.sin(2*F * toR);

        // 黄纬
        const beta = 5.128 * Math.sin(F * toR)
            + 0.281 * Math.sin((Mp + F) * toR);

        // 黄赤交角
        const T = d / 36525;
        const eps = 23.439291 - 0.013004 * T;
        const epsR = eps * toR;

        const lambdaR = lambda * toR;
        const betaR = beta * toR;

        const sinDec = Math.sin(betaR) * Math.cos(epsR) + Math.cos(betaR) * Math.sin(epsR) * Math.sin(lambdaR);
        const dec = Math.asin(sinDec) * 180 / Math.PI;

        const y = Math.sin(lambdaR) * Math.cos(epsR) - Math.tan(betaR) * Math.sin(epsR);
        const x = Math.cos(lambdaR);
        let ra = Math.atan2(y, x) * 180 / Math.PI;
        if (ra < 0) ra += 360;

        return { ra, dec };
    }

    // 由赤经赤纬计算月出月落 UT 时刻
    _moonRST(jd0, ra, dec, lat, lon) {
        const toR = Math.PI / 180;

        // 格林尼治恒星时 (0h UT)
        const dSince = jd0 - 2451545.0;
        let GST = (280.46061837 + 360.98564736629 * dSince) % 360;
        GST = ((GST % 360) + 360) % 360;

        // 月球中天时刻 (UT 小时)
        let transitRA = ra - lon - GST;
        transitRA = ((transitRA % 360) + 360) % 360;
        let transitUT = transitRA / 15 * 0.9972696; // 恒星日→平太阳日

        // 时角公式：cos(HA) = (sin(-0.833°) - sin(lat)*sin(dec)) / (cos(lat)*cos(dec))
        const sinAlt = Math.sin(-0.833 * toR); // 大气折射 + 视半径
        const sinLat = Math.sin(lat * toR);
        const cosLat = Math.cos(lat * toR);
        const sinDec = Math.sin(dec * toR);
        const cosDec = Math.cos(dec * toR);

        const cosHA = (sinAlt - sinLat * sinDec) / (cosLat * cosDec);

        if (Math.abs(cosHA) > 1) return null; // 不升不落（极圈内）

        const HA = Math.acos(cosHA) * 180 / Math.PI;
        const haH = HA / 15;

        let riseUT = transitUT - haH;
        let setUT = transitUT + haH;

        // 归一化到当天
        riseUT = ((riseUT % 24) + 24) % 24;
        setUT = ((setUT % 24) + 24) % 24;

        return { riseUT, setUT, transitUT };
    }

    // 回退：近似月出月落
    _calcMoonApprox(now, phase) {
        const syn = 29.53058867;
        const riseH = (phase.age / syn) * 24 + 6;
        const setH = riseH + 12.42;

        const today = new Date(now); today.setHours(0,0,0,0);
        const mRise = new Date(today); mRise.setHours(0,0,0,0);
        mRise.setMilliseconds(riseH * 3600000);
        const mSet = new Date(today); mSet.setHours(0,0,0,0);
        mSet.setMilliseconds(setH * 3600000);

        let up = false;
        const t = now.getTime();
        if (mSet > mRise) {
            up = t >= mRise.getTime() && t < mSet.getTime();
        } else {
            up = t >= mRise.getTime() || t < mSet.getTime();
        }
        if (!up) {
            const yRise = new Date(mRise); yRise.setDate(yRise.getDate() - 1);
            const ySet = new Date(mSet); ySet.setDate(ySet.getDate() - 1);
            if (ySet > yRise && t >= yRise.getTime() && t < ySet.getTime()) up = true;
        }

        return {
            age: phase.age, angle: phase.angle, ill: phase.ill, name: phase.name,
            rise: mRise, set: mSet, up, riseH, setH
        };
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

        const hY = H * 0.50;
        const cx = W / 2, cy = hY;
        const rx = W * 0.38, ry = H * 0.35;

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
                    'rgba(255,200,50,0.5)','rgba(255,120,20,0.4)','rgba(255,60,10,0)');
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
                // 当太阳和月亮同时在上弧时，月亮使用透明色
                if (sp?.on) {
                    ctx.save(); ctx.globalAlpha = 0.35;
                    this._drawGlow(ctx, mx, my, 5, 22,
                        'rgba(170,205,255)','rgba(130,160,240,0.3)','rgba(100,130,220,0)');
                    this._drawMoonBody(ctx, mx, my, 11, mp);
                    ctx.restore();
                } else {
                    this._drawGlow(ctx, mx, my, 5, 22,
                        'rgba(170,205,255)','rgba(130,160,240,0.3)','rgba(100,130,220,0)');
                    this._drawMoonBody(ctx, mx, my, 11, mp);
                }
            } else {
                ctx.save(); ctx.globalAlpha = 0.4;
                this._drawMoonBody(ctx, mx, my, 11, mp);
                ctx.restore();
            }
        }
    }

    _drawMoonBody(ctx, mx, my, r, mp) {
        const angle = mp.angle;
        const ill = mp.ill;
        const cosA = Math.cos(angle);

        // 满月：全亮
        if (ill > 0.99) {
            ctx.fillStyle = '#D0DEF5';
            ctx.beginPath(); ctx.arc(mx, my, r, 0, Math.PI*2); ctx.fill();
            return;
        }
        // 新月：全暗
        if (ill < 0.01) {
            ctx.fillStyle = 'rgba(18,20,35,0.78)';
            ctx.beginPath(); ctx.arc(mx, my, r, 0, Math.PI*2); ctx.fill();
            return;
        }

        // 先画亮面底圆
        ctx.fillStyle = '#D0DEF5';
        ctx.beginPath(); ctx.arc(mx, my, r, 0, Math.PI*2); ctx.fill();

        // 暗面：用大半径偏移圆近似，clipped to moon
        ctx.save();
        ctx.beginPath(); ctx.arc(mx, my, r, 0, Math.PI*2); ctx.clip();
        ctx.fillStyle = 'rgba(18,20,35,0.78)';

        const R = r * 5; // 大半径，接近半平面效果
        let ox;
        if (angle <= Math.PI) {
            // 盈月（0→π）：暗面在左侧，右边界 = mx + r*cos(angle)
            ox = mx + r * cosA - R;
        } else {
            // 亏月（π→2π）：暗面在右侧，左边界 = mx - r*cos(angle)
            ox = mx - r * cosA + R;
        }
        ctx.beginPath(); ctx.arc(ox, my, R, 0, Math.PI*2); ctx.fill();
        ctx.restore();
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
