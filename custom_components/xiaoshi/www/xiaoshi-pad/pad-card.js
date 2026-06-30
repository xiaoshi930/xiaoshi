const whenDefined = (t) => customElements.whenDefined(t);
await Promise.race([whenDefined("ha-card"), whenDefined("ha-panel-lovelace")]);
const LitElement = window.LitElement || Object.getPrototypeOf(customElements.get("ha-card"));
const html = LitElement.prototype.html;
const css = LitElement.prototype.css;
import { yamlToJson } from '../function/function.js';

window.customCards = window.customCards || [];
window.customCards.push({
    type: 'xiaoshi-pad-card',
    name: '消逝卡(A平板端)-背景卡',
    description: '平板端背景卡'
});

const PRESET_ON_STATES = [
    'on', 'open', 'opening','home',  'active', 'running',
    'detected', 'occupied', 'unlocked', 'power_on', '开机','resume',
    'Playing','playing', '播放中',
    'heat', 'cool', 'heating', 'cooling', 'dry', 'fan',
    'auto', 'heat_cool', 'fan_only',
    '有人', 'one',
    '正在拖地','正在扫地','启动','cleaning',
    '烹饪中', '保温中', '预约中', 'Busy', 'Keep Warm',"低档","中档","高档"
];

// ==================== 编辑器 ====================
class XiaoshiPadCardEditor extends LitElement {
    static get properties() {
        return {
            hass: { type: Object },
            config: { type: Object }
        };
    }

    static get styles() {
        return css`            .form { display: flex; flex-direction: column; gap: 12px; min-height: 400px; }
            .form-row { display: flex; align-items: center; gap: 8px; }
            .form-row label { font-weight: bold; white-space: nowrap; min-width: 50px; }
            .form-row input, .form-row select { flex: 1; padding: 6px 8px; border: 1px solid #ddd; border-radius: 4px; }
            .size-row { display: flex; gap: 8px; align-items: center; }
            .size-row .form-row,
            .size-row .glow-row { flex: 1 1 0; }
            .size-row .form-row:first-child { flex: 0 0 auto; }
            .size-row input[type="text"] { width: 55px; flex: none; }
            .size-row .glow-row label { min-width: auto; }
            .card-section { border: 1px solid #ddd; border-radius: 8px; padding: 10px; display: flex; flex-direction: column; gap: 6px; }
            .card-section-title { font-weight: bold; font-size: 14px; color: var(--primary-text-color); margin-bottom: 4px; }
            .color-row { display: flex; align-items: center; gap: 8px; }
            .color-row label { font-weight: bold; white-space: nowrap; min-width: 50px; font-size: 13px; }
            .color-row input[type="color"] { width: 40px; height: 30px; padding: 0; border: 1px solid #ddd; border-radius: 4px; cursor: pointer; }
            .color-preview { flex: 1; height: 30px; border-radius: 4px; border: 1px solid #ddd; }
            .glow-item { border: 1px solid #ddd; border-radius: 8px; padding: 10px; display: flex; flex-direction: column; gap: 6px; background: var(--card-background-color, #fff); }
            .glow-item-header { display: flex; justify-content: space-between; align-items: center; }
            .glow-item-header span { font-weight: bold; font-size: 13px; }
            .glow-remove-btn { background: none; border: 1px solid #ccc; border-radius: 4px; cursor: pointer; padding: 2px 8px; font-size: 12px; color: var(--error-color, #db4437); }
            .glow-row { display: flex; align-items: center; gap: 6px; }
            .glow-row label { font-weight: bold; white-space: nowrap; min-width: 50px; font-size: 12px; }
            .glow-row input, .glow-row select { flex: 1; padding: 4px 6px; border: 1px solid #ddd; border-radius: 4px; font-size: 12px; }
            .state-colors-textarea { width: 100%; min-height: 40px; padding: 6px 8px; border: 1px solid #ddd; border-radius: 4px; font-size: 12px; font-family: monospace; resize: vertical; }
            .add-glow-btn { background: var(--primary-color, #03a9f4); color: #fff; border: none; border-radius: 4px; padding: 6px 12px; cursor: pointer; font-size: 13px; }`;
    }

    constructor() {
        super();
        this._editFloorIdx = 0;
    }

    setConfig(config) {
        this.config = config;
    }

    // ========== 多楼层辅助方法 ==========
    _getData() {
        if (this.config && this.config.enable_multi_floor && this.config.floors && this.config.floors.length > 0) {
            const idx = Math.min(this._editFloorIdx, this.config.floors.length - 1);
            return this.config.floors[idx] || {};
        }
        return this.config || {};
    }

    _updateData(key, value) {
        if (this.config && this.config.enable_multi_floor && this.config.floors && this.config.floors.length > 0) {
            const idx = Math.min(this._editFloorIdx, this.config.floors.length - 1);
            const floors = [...this.config.floors];
            floors[idx] = { ...floors[idx], [key]: value };
            this.config = { ...this.config, floors };
        } else {
            this.config = { ...this.config, [key]: value };
        }
        this.dispatchEvent(new CustomEvent('config-changed', {
            detail: { config: this.config },
            bubbles: true,
            composed: true
        }));
    }

    _multiFloorChanged(e) {
        const enabled = e.target.checked;
        if (enabled) {
            // 启用时，将现有数据迁移到第一个楼层
            const existingFloor = {
                id: '1',
                name: '一楼',
                background_image: this.config.background_image || '',
                light_buttons: this.config.light_buttons || [],
                person_icons: this.config.person_icons || [],
                device_glows: this.config.device_glows || [],
                device_icons: this.config.device_icons || []
            };
            this.config = {
                ...this.config,
                enable_multi_floor: true,
                floors: [existingFloor],
                active_floor_idx: 0
            };
            this._editFloorIdx = 0;
        } else {
            // 禁用时，恢复第一个楼层数据到顶层
            const firstFloor = (this.config.floors && this.config.floors[0]) ? this.config.floors[0] : {};
            this.config = {
                ...this.config,
                enable_multi_floor: false,
                active_floor_idx: 0,
                background_image: firstFloor.background_image || this.config.background_image || '',
                light_buttons: firstFloor.light_buttons || this.config.light_buttons || [],
                person_icons: firstFloor.person_icons || this.config.person_icons || [],
                device_glows: firstFloor.device_glows || this.config.device_glows || [],
                device_icons: firstFloor.device_icons || this.config.device_icons || []
            };
        }
        this.dispatchEvent(new CustomEvent('config-changed', {
            detail: { config: this.config },
            bubbles: true,
            composed: true
        }));
    }

    _addFloor() {
        const floors = [...(this.config.floors || [])];
        const newId = String(floors.length + 1);
        floors.push({
            id: newId,
            name: '楼层' + newId,
            background_image: '',
            light_buttons: [],
            person_icons: [],
            device_glows: [],
            device_icons: []
        });
        this.config = { ...this.config, floors, active_floor_idx: floors.length - 1 };
        this._editFloorIdx = floors.length - 1;
        this.dispatchEvent(new CustomEvent('config-changed', {
            detail: { config: this.config },
            bubbles: true,
            composed: true
        }));
    }

    _removeFloor(index) {
        const floors = [...(this.config.floors || [])];
        floors.splice(index, 1);
        this.config = { ...this.config, floors };
        if (this._editFloorIdx >= floors.length) {
            this._editFloorIdx = Math.max(0, floors.length - 1);
        }
        this.dispatchEvent(new CustomEvent('config-changed', {
            detail: { config: this.config },
            bubbles: true,
            composed: true
        }));
    }

    _updateFloorField(index, field, value) {
        const floors = [...(this.config.floors || [])];
        floors[index] = { ...floors[index], [field]: value };
        this.config = { ...this.config, floors };
        this.dispatchEvent(new CustomEvent('config-changed', {
            detail: { config: this.config },
            bubbles: true,
            composed: true
        }));
    }

    _editFloorChanged(e) {
        this._editFloorIdx = parseInt(e.target.value, 10) || 0;
        this.config = { ...this.config, active_floor_idx: this._editFloorIdx };
        this.dispatchEvent(new CustomEvent('config-changed', {
            detail: { config: this.config },
            bubbles: true,
            composed: true
        }));
    }

    _valueChanged(e) {
        const { name, value } = e.target;
        if (!name) return;
        this.config = {
            ...this.config,
            [name]: value
        };
        this.dispatchEvent(new CustomEvent('config-changed', {
            detail: { config: this.config },
            bubbles: true,
            composed: true
        }));
    }

    _weatherAnimationChanged(e) {
        this.config = { ...this.config, weather_animation: e.target.checked };
        this.dispatchEvent(new CustomEvent('config-changed', {
            detail: { config: this.config },
            bubbles: true,
            composed: true
        }));
    }

    _rgbToHex(rgb) {
        const match = rgb.match(/(\d+)/g);
        if (!match || match.length < 3) return '#964646';
        return '#' + match.slice(0, 3).map(n => parseInt(n).toString(16).padStart(2, '0')).join('');
    }

    _hexToRgb(hex) {
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        return 'rgb(' + r + ',' + g + ',' + b + ')';
    }

    _bgColorChanged(e) {
        this.config = {
            ...this.config,
            bg_color: this._hexToRgb(e.target.value)
        };
        this.dispatchEvent(new CustomEvent('config-changed', {
            detail: { config: this.config },
            bubbles: true,
            composed: true
        }));
    }

    _addLightButton() {
        const data = this._getData();
        const btns = [...(data.light_buttons || [])];
        btns.push({ entity: '', color: 'rgb(220,130,0)', shape: '圆形', width: '25px', height: '25px', top: '100px', left: '100px' });
        this._updateData('light_buttons', btns);
    }

    _removeLightButton(index) {
        const data = this._getData();
        const btns = [...(data.light_buttons || [])];
        btns.splice(index, 1);
        this._updateData('light_buttons', btns);
    }

    _updateLightButtonField(index, field, value) {
        const data = this._getData();
        const btns = [...(data.light_buttons || [])];
        btns[index] = { ...btns[index], [field]: value };
        this._updateData('light_buttons', btns);
    }

    _addPersonIcon() {
        const data = this._getData();
        const icons = [...(data.person_icons || [])];
        icons.push({ entity: '', width: '20px', height: '20px', color: 'rgb(255,87,34)', top: '100px', left: '100px', condition_mode: '', status_conditions: '' });
        this._updateData('person_icons', icons);
    }

    _removePersonIcon(index) {
        const data = this._getData();
        const icons = [...(data.person_icons || [])];
        icons.splice(index, 1);
        this._updateData('person_icons', icons);
    }

    _updatePersonIconField(index, field, value) {
        const data = this._getData();
        const icons = [...(data.person_icons || [])];
        icons[index] = { ...icons[index], [field]: value };
        this._updateData('person_icons', icons);
    }

    _addDeviceIcon() {
        const data = this._getData();
        const icons = [...(data.device_icons || [])];
        icons.push({ entity: '', width: '25px', height: '25px', top: '100px', left: '100px', popup_cards: '' });
        this._updateData('device_icons', icons);
    }

    _removeDeviceIcon(index) {
        const data = this._getData();
        const icons = [...(data.device_icons || [])];
        icons.splice(index, 1);
        this._updateData('device_icons', icons);
    }

    _updateDeviceIconField(index, field, value) {
        const data = this._getData();
        const icons = [...(data.device_icons || [])];
        icons[index] = { ...icons[index], [field]: value };
        this._updateData('device_icons', icons);
    }

    _addDeviceIconStateImage(index) {
        const data = this._getData();
        const icons = [...(data.device_icons || [])];
        const sis = [...(icons[index].state_images || [])];
        sis.push({ state: '', image: '' });
        icons[index] = { ...icons[index], state_images: sis };
        this._updateData('device_icons', icons);
    }

    _removeDeviceIconStateImage(index, siIndex) {
        const data = this._getData();
        const icons = [...(data.device_icons || [])];
        const sis = [...(icons[index].state_images || [])];
        sis.splice(siIndex, 1);
        icons[index] = { ...icons[index], state_images: sis };
        this._updateData('device_icons', icons);
    }

    _updateDeviceIconStateImageField(index, siIndex, field, value) {
        const data = this._getData();
        const icons = [...(data.device_icons || [])];
        const sis = [...(icons[index].state_images || [])];
        sis[siIndex] = { ...sis[siIndex], [field]: value };
        icons[index] = { ...icons[index], state_images: sis };
        this._updateData('device_icons', icons);
    }

    _addDeviceGlow() {
        const data = this._getData();
        const glows = [...(data.device_glows || [])];
        glows.push({ entity: '', color: 'rgb(33,150,243)', width: '200px', height: '200px', direction: '右下', top: '100px', left: '100px', state_colors: {} });
        this._updateData('device_glows', glows);
    }

    _removeDeviceGlow(index) {
        const data = this._getData();
        const glows = [...(data.device_glows || [])];
        glows.splice(index, 1);
        this._updateData('device_glows', glows);
    }

    _updateDeviceGlowField(index, field, value) {
        const data = this._getData();
        const glows = [...(data.device_glows || [])];
        glows[index] = { ...glows[index], [field]: value };
        this._updateData('device_glows', glows);
    }

    _updateDeviceGlowStateColors(index, text) {
        const stateColors = this._parseStateColors(text);
        this._updateDeviceGlowField(index, 'state_colors', stateColors);
    }

    _formatStateColors(stateColors) {
        if (!stateColors || typeof stateColors !== 'object') return '';
        return Object.entries(stateColors).map(([k, v]) => k + ': ' + v).join('\n');
    }

    _parseStateColors(text) {
        const result = {};
        if (!text) return result;
        text.split('\n').forEach(line => {
            const idx = line.indexOf(':');
            if (idx > 0) {
                const key = line.substring(0, idx).trim();
                const val = line.substring(idx + 1).trim();
                if (key && val) result[key] = val;
            }
        });
        return result;
    }

    render() {
        if (!this.hass || !this.config) return html``;
        const c = this.config;
        const bgColor = c.bg_color || 'rgb(150,70,70)';
        // 多楼层模式：数据根指向当前编辑楼层；否则用顶层config
        const data = c.enable_multi_floor ? this._getData() : c;

        const previewStyle = 'background: ' + bgColor;

        return html`
            <div class="form">
                <div class="size-row">
                    <div class="form-row">
                        <label>主题</label>
                        <select name="theme" @change="${this._valueChanged}">
                            <option value="sun" .selected="${c.theme === 'sun' || !c.theme}">跟随sun</option>
                            <option value="light" .selected="${c.theme === 'light'}">白天</option>
                            <option value="dark" .selected="${c.theme === 'dark'}">黑天</option>
                        </select>
                    </div>
                    <div class="form-row">
                        <label>宽度</label>
                        <input type="text" name="width" .value="${c.width || '1024px'}" @change="${this._valueChanged}" placeholder="1024px">
                    </div>
                    <div class="form-row">
                        <label>高度</label>
                        <input type="text" name="height" .value="${c.height || '768px'}" @change="${this._valueChanged}" placeholder="768px">
                    </div>
                </div>
                <div class="color-row">
                    <label>背景色</label>
                    <input type="color" .value="${this._rgbToHex(bgColor)}" @change="${this._bgColorChanged}">
                    <div class="color-preview" style="${previewStyle}"></div>
                    <label style="font-size:12px;font-weight:normal;display:flex;align-items:center;gap:4px;white-space:nowrap;">
                        <input type="checkbox" name="auto_color" .checked="${c.auto_color !== false}" @change="${this._valueChanged}"> 自动变色
                    </label>
                </div>
                <div class="form-row">
                    <label>背景图片</label>
                    <input type="text" name="background_image" .value="${c.background_image || ''}" @change="${this._valueChanged}" placeholder="/local/UI/背景/彩平图.png">
                </div>
                <div class="form-row">
                    <label>按钮区Left</label>
                    <input type="text" name="btn_area_left" .value="${c.btn_area_left || '20px'}" @change="${this._valueChanged}" placeholder="20px">
                </div>
                <div class="form-row">
                    <label style="font-weight:bold;font-size:13px;white-space:nowrap;display:flex;align-items:center;gap:4px;">
                        <input type="checkbox" name="weather_animation" .checked="${c.weather_animation === true}" @change="${this._weatherAnimationChanged}"> 启用天气动画
                    </label>
                </div>
                ${c.weather_animation ? html`
                <div class="form-row">
                    <label>天气实体</label>
                    <input type="text" name="weather_entity" .value="${c.weather_entity || ''}" @change="${this._valueChanged}" placeholder="weather.xxx">
                </div>
                ` : ''}
                <div class="form-row">
                    <label style="font-weight:bold;font-size:13px;white-space:nowrap;display:flex;align-items:center;gap:4px;">
                        <input type="checkbox" name="enable_multi_floor" .checked="${c.enable_multi_floor === true}" @change="${this._multiFloorChanged}"> 启用多楼层/多家庭
                    </label>
                </div>
                ${c.enable_multi_floor ? html`
                <div class="card-section">
                    <div class="card-section-title">楼层管理</div>
                    ${(c.floors || []).map((floor, i) => html`
                        <div class="glow-item">
                            <div class="glow-item-header">
                                <span>楼层 ${i + 1}</span>
                                <button class="glow-remove-btn" @click="${() => this._removeFloor(i)}" ?disabled="${(c.floors || []).length <= 1}">删除</button>
                            </div>
                            <div class="glow-row">
                                <label>编号</label>
                                <input type="text" .value="${floor.id || ''}" @change="${(e) => this._updateFloorField(i, 'id', e.target.value)}" placeholder="1">
                            </div>
                            <div class="glow-row">
                                <label>名称</label>
                                <input type="text" .value="${floor.name || ''}" @change="${(e) => this._updateFloorField(i, 'name', e.target.value)}" placeholder="一楼">
                            </div>
                            <div class="glow-row">
                                <label>背景图片</label>
                                <input type="text" .value="${floor.background_image || ''}" @change="${(e) => this._updateFloorField(i, 'background_image', e.target.value)}" placeholder="/local/UI/背景/彩平图.png">
                            </div>
                        </div>
                    `)}
                    <button class="add-glow-btn" @click="${this._addFloor}">+ 添加楼层</button>
                </div>
                <div class="form-row">
                    <label>当前编辑楼层</label>
                    <select @change="${this._editFloorChanged}">
                        ${(c.floors || []).map((f, i) => html`<option value="${i}" ?selected="${this._editFloorIdx === i}">${f.name || ('楼层'+(i+1))}</option>`)}
                    </select>
                </div>
                ` : ''}
                <div class="card-section">
                    <div class="card-section-title">灯光按钮</div>
                    ${(data.light_buttons || []).map((btn, i) => html`
                        <div class="glow-item">
                            <div class="glow-item-header">
                                <span>灯光 ${i + 1}</span>
                                <button class="glow-remove-btn" @click="${() => this._removeLightButton(i)}">删除</button>
                            </div>
                            <div class="glow-row">
                                <label>实体</label>
                                <input type="text" .value="${btn.entity || ''}" @change="${(e) => this._updateLightButtonField(i, 'entity', e.target.value)}" placeholder="light.xxx">
                            </div>
                            <div class="glow-row">
                                <label>颜色</label>
                                <input type="color" .value="${this._rgbToHex(btn.color || 'rgb(220,130,0)')}" @change="${(e) => this._updateLightButtonField(i, 'color', this._hexToRgb(e.target.value))}">
                                <label style="font-weight:bold;font-size:12px;white-space:nowrap;min-width:auto;margin-left:8px;">形状</label>
                                <select @change="${(e) => this._updateLightButtonField(i, 'shape', e.target.value)}">
                                    ${[,'横线','竖线','圆形','圆形内十字','圆形外十字','圆形内X字','圆形外X字','方形','方形内十字','方形外十字','方形内X字','方形外X字','六边形1','六边形2','心形','月亮形','五角星形','六角星形'].map(s => html`<option value="${s}" ?selected="${(btn.shape || '圆形') === s}">${s}</option>`)}
                                </select>
                            </div>
                            <div class="size-row">
                                <div class="glow-row">
                                    <label style="width: 50px;">宽</label>
                                    <input type="text" .value="${btn.width || '25px'}" @change="${(e) => this._updateLightButtonField(i, 'width', e.target.value)}">
                                </div>
                                <div class="glow-row">
                                    <label>高</label>
                                    <input type="text" .value="${btn.height || '25px'}" @change="${(e) => this._updateLightButtonField(i, 'height', e.target.value)}">
                                </div>
                                <div class="glow-row">
                                    <label>Top</label>
                                    <input type="text" .value="${btn.top || '100px'}" @change="${(e) => this._updateLightButtonField(i, 'top', e.target.value)}">
                                </div>
                                <div class="glow-row">
                                    <label>Left</label>
                                    <input type="text" .value="${btn.left || '100px'}" @change="${(e) => this._updateLightButtonField(i, 'left', e.target.value)}">
                                </div>
                            </div>
                        </div>
                    `)}
                    <button class="add-glow-btn" @click="${this._addLightButton}">+ 添加灯光按钮</button>
                </div>
                <div class="card-section">
                    <div class="card-section-title">人在图标</div>
                    ${(data.person_icons || []).map((pi, i) => html`
                        <div class="glow-item">
                            <div class="glow-item-header">
                                <span>人在 ${i + 1}</span>
                                <button class="glow-remove-btn" @click="${() => this._removePersonIcon(i)}">删除</button>
                            </div>
                            <div class="glow-row">
                                <label>实体</label>
                                <input type="text" .value="${pi.entity || ''}" @change="${(e) => this._updatePersonIconField(i, 'entity', e.target.value)}" placeholder="binary_sensor.xxx">
                            </div>
                            <div class="glow-row">
                                <label>颜色</label>
                                <input type="color" .value="${this._rgbToHex(pi.color || 'rgb(255,87,34)')}" @change="${(e) => this._updatePersonIconField(i, 'color', this._hexToRgb(e.target.value))}">
                                <label style="font-weight:bold;font-size:12px;white-space:nowrap;min-width:auto;margin-left:8px;">条件</label>
                                <select @change="${(e) => this._updatePersonIconField(i, 'condition_mode', e.target.value)}">
                                    <option value="" ?selected="${!pi.condition_mode}">预置</option>
                                    <option value="append" ?selected="${pi.condition_mode === 'append'}">新增</option>
                                    <option value="override" ?selected="${pi.condition_mode === 'override'}">覆盖</option>
                                </select>
                            </div>
                            ${pi.condition_mode ? html`
                            <div class="glow-row">
                                <label>条件值</label>
                                <input type="text" .value="${pi.status_conditions || ''}" @change="${(e) => this._updatePersonIconField(i, 'status_conditions', e.target.value)}" placeholder="on,home,有人">
                            </div>
                            ` : ''}
                            <div class="size-row">
                                <div class="glow-row">
                                    <label style="width: 50px;">宽</label>
                                    <input type="text" .value="${pi.width || '20px'}" @change="${(e) => this._updatePersonIconField(i, 'width', e.target.value)}">
                                </div>
                                <div class="glow-row">
                                    <label>高</label>
                                    <input type="text" .value="${pi.height || '20px'}" @change="${(e) => this._updatePersonIconField(i, 'height', e.target.value)}">
                                </div>
                                <div class="glow-row">
                                    <label>Top</label>
                                    <input type="text" .value="${pi.top || '100px'}" @change="${(e) => this._updatePersonIconField(i, 'top', e.target.value)}">
                                </div>
                                <div class="glow-row">
                                    <label>Left</label>
                                    <input type="text" .value="${pi.left || '100px'}" @change="${(e) => this._updatePersonIconField(i, 'left', e.target.value)}">
                                </div>
                            </div>
                        </div>
                    `)}
                    <button class="add-glow-btn" @click="${this._addPersonIcon}">+ 添加人在图标</button>
                </div>
                <div class="card-section">
                    <div class="card-section-title">设备光效</div>
                    ${(data.device_glows || []).map((glow, i) => html`
                        <div class="glow-item">
                            <div class="glow-item-header">
                                <span>设备 ${i + 1}</span>
                                <button class="glow-remove-btn" @click="${() => this._removeDeviceGlow(i)}">删除</button>
                            </div>
                            <div class="glow-row">
                                <label>实体</label>
                                <input type="text" .value="${glow.entity || ''}" @change="${(e) => this._updateDeviceGlowField(i, 'entity', e.target.value)}" placeholder="climate.xxx">
                            </div>
                            <div class="glow-row">
                                <label>颜色</label>
                                <input type="color" .value="${this._rgbToHex(glow.color || 'rgb(33,150,243)')}" @change="${(e) => this._updateDeviceGlowField(i, 'color', this._hexToRgb(e.target.value))}">
                                <label style="font-weight:bold;font-size:12px;white-space:nowrap;min-width:auto;margin-left:8px;">方向</label>
                                <select @change="${(e) => this._updateDeviceGlowField(i, 'direction', e.target.value)}">
                                    ${['左上','左下','右上','右下','上','下','左','右','四周'].map(d => html`
                                        <option value="${d}" ?selected="${(glow.direction || '右下') === d}">${d}</option>
                                    `)}
                                </select>
                            </div>
                            <div class="size-row">
                                <div class="glow-row">
                                    <label style="width: 50px;">宽</label>
                                    <input type="text" .value="${glow.width || '200px'}" @change="${(e) => this._updateDeviceGlowField(i, 'width', e.target.value)}">
                                </div>
                                <div class="glow-row">
                                    <label>高</label>
                                    <input type="text" .value="${glow.height || '200px'}" @change="${(e) => this._updateDeviceGlowField(i, 'height', e.target.value)}">
                                </div>
                                <div class="glow-row">
                                    <label>Top</label>
                                    <input type="text" .value="${glow.top || '100px'}" @change="${(e) => this._updateDeviceGlowField(i, 'top', e.target.value)}">
                                </div>
                                <div class="glow-row">
                                    <label>Left</label>
                                    <input type="text" .value="${glow.left || '100px'}" @change="${(e) => this._updateDeviceGlowField(i, 'left', e.target.value)}">
                                </div>
                            </div>
                            <div class="glow-row">
                                <label>状态颜色</label>
                                <textarea class="state-colors-textarea" .value="${this._formatStateColors(glow.state_colors)}" @change="${(e) => this._updateDeviceGlowStateColors(i, e.target.value)}" placeholder="cool: rgb(33,150,243)&#10;heat: rgb(254,111,33)"></textarea>
                            </div>
                        </div>
                    `)}
                    <button class="add-glow-btn" @click="${this._addDeviceGlow}">+ 添加设备光效</button>
                </div>
                <div class="card-section">
                    <div class="card-section-title">设备图标</div>
                    ${(data.device_icons || []).map((di, i) => html`
                        <div class="glow-item">
                            <div class="glow-item-header">
                                <span>设备图标 ${i + 1}</span>
                                <button class="glow-remove-btn" @click="${() => this._removeDeviceIcon(i)}">删除</button>
                            </div>
                            <div class="glow-row">
                                <label>实体</label>
                                <input type="text" .value="${di.entity || ''}" @change="${(e) => this._updateDeviceIconField(i, 'entity', e.target.value)}" placeholder="climate.xxx">
                            </div>
                            <div class="glow-row">
                                <label>图片</label>
                                <select @change="${(e) => this._updateDeviceIconField(i, 'image_mode', e.target.value)}">
                                    <option value="" ?selected="${!di.image_mode}">on/off状态</option>
                                    <option value="custom" ?selected="${di.image_mode === 'custom'}">其他状态</option>
                                    <option value="no_entity" ?selected="${di.image_mode === 'no_entity'}">无实体</option>
                                </select>
                                <label style="font-weight:bold;font-size:12px;white-space:nowrap;min-width:auto;margin-left:8px;">方向</label>
                                <select @change="${(e) => this._updateDeviceIconField(i, 'image_flip', e.target.value)}">
                                    <option value="" ?selected="${!di.image_flip}">正常</option>
                                    <option value="flip-h" ?selected="${di.image_flip === 'flip-h'}">左右翻转</option>
                                    <option value="flip-v" ?selected="${di.image_flip === 'flip-v'}">上下翻转</option>
                                    <option value="rotate-90" ?selected="${di.image_flip === 'rotate-90'}">旋转90°</option>
                                    <option value="rotate-270" ?selected="${di.image_flip === 'rotate-270'}">旋转270°</option>
                                </select>
                                <label style="font-weight:bold;font-size:12px;white-space:nowrap;min-width:auto;margin-left:8px;">条件</label>
                                <select @change="${(e) => this._updateDeviceIconField(i, 'condition_mode', e.target.value)}">
                                    <option value="" ?selected="${!di.condition_mode}">预置</option>
                                    <option value="append" ?selected="${di.condition_mode === 'append'}">新增</option>
                                    <option value="override" ?selected="${di.condition_mode === 'override'}">覆盖</option>
                                </select>
                            </div>
                            ${di.condition_mode ? html`
                            <div class="glow-row">
                                <label>条件值</label>
                                <input type="text" .value="${di.status_conditions || ''}" @change="${(e) => this._updateDeviceIconField(i, 'status_conditions', e.target.value)}" placeholder="on,home,有人">
                            </div>
                            ` : ''}
                            ${di.image_mode === 'no_entity' ? html`
                            <div class="glow-row">
                                <label>图片</label>
                                <input type="text" .value="${di.on_image || ''}" @change="${(e) => this._updateDeviceIconField(i, 'on_image', e.target.value)}" placeholder="/local/images/device.png">
                            </div>
                            ` : !di.image_mode || di.image_mode === '' ? html`
                            <div class="glow-row">
                                <label>开启图片</label>
                                <input type="text" .value="${di.on_image || ''}" @change="${(e) => this._updateDeviceIconField(i, 'on_image', e.target.value)}" placeholder="/local/images/device_on.png">
                            </div>
                            <div class="glow-row">
                                <label>关闭图片</label>
                                <input type="text" .value="${di.off_image || ''}" @change="${(e) => this._updateDeviceIconField(i, 'off_image', e.target.value)}" placeholder="/local/images/device_off.png">
                            </div>
                            ` : html`
                            ${(di.state_images || []).map((si, siIdx) => html`
                            <div class="glow-row" style="gap:4px;">
                                <label>值</label>
                                <input type="text" style="flex:0.8; max-width: 60px;" .value="${si.state || ''}" @change="${(e) => this._updateDeviceIconStateImageField(i, siIdx, 'state', e.target.value)}" placeholder="heat">
                                <label>图</label>
                                <input type="text" style="flex:1.2;" .value="${si.image || ''}" @change="${(e) => this._updateDeviceIconStateImageField(i, siIdx, 'image', e.target.value)}" placeholder="/local/images/device_heat.png">
                                <button class="glow-remove-btn" style="padding:2px 4px;font-size:11px;" @click="${() => this._removeDeviceIconStateImage(i, siIdx)}">✕</button>
                            </div>
                            `)}
                            <button class="add-glow-btn" style="font-size:11px;padding:3px 8px;align-self:flex-start;" @click="${() => this._addDeviceIconStateImage(i)}">+ 添加状态图片</button>
                            `}
                            <div class="size-row">
                                <div class="glow-row">
                                    <label style="width: 50px;">宽</label>
                                    <input type="text" .value="${di.width || '25px'}" @change="${(e) => this._updateDeviceIconField(i, 'width', e.target.value)}">
                                </div>
                                <div class="glow-row">
                                    <label>高</label>
                                    <input type="text" .value="${di.height || '25px'}" @change="${(e) => this._updateDeviceIconField(i, 'height', e.target.value)}">
                                </div>
                                <div class="glow-row">
                                    <label>Top</label>
                                    <input type="text" .value="${di.top || '100px'}" @change="${(e) => this._updateDeviceIconField(i, 'top', e.target.value)}">
                                </div>
                                <div class="glow-row">
                                    <label>Left</label>
                                    <input type="text" .value="${di.left || '100px'}" @change="${(e) => this._updateDeviceIconField(i, 'left', e.target.value)}">
                                </div>
                            </div>
                            <div class="size-row">
                                <div class="glow-row">
                                    <label>弹窗宽度</label>
                                    <input style="width: 80px;" type="text" .value="${di.popup_width || '400px'}" @change="${(e) => this._updateDeviceIconField(i, 'popup_width', e.target.value)}" placeholder="400px">
                                </div>
                                <div class="glow-row">
                                    <label>弹窗位置</label>
                                    <input style="width: 80px;" type="text" .value="${di.popup_top || '50%'}" @change="${(e) => this._updateDeviceIconField(i, 'popup_top', e.target.value)}" placeholder="50%">
                                </div>
                            </div>
                            <div class="glow-row">
                                <label>弹窗</label>
                                <textarea class="state-colors-textarea" .value="${di.popup_cards || ''}" @change="${(e) => this._updateDeviceIconField(i, 'popup_cards', e.target.value)}" placeholder="- type: custom:xiaoshi-chart-card&#10;  entities:&#10;    - entity: sensor.xxx"></textarea>
                            </div>
                        </div>
                    `)}
                    <button class="add-glow-btn" @click="${this._addDeviceIcon}">+ 添加设备图标</button>
                </div>

            </div>
        `;
    }
}
customElements.define('xiaoshi-pad-card-editor', XiaoshiPadCardEditor);

// ==================== 主卡片 ====================
class XiaoshiPadCard extends LitElement {
  static get properties() {
    return {
      hass: Object,
      config: Object,
      _kioskOn: { type: Boolean },
      _themeOverride: { type: String }
    };
  }

  static get styles() {
    return css`      :host { display: block; }
      .container { position: relative; display: block; overflow: hidden; }
      .bg-image { position: absolute; top: 0; left: 0; width: 100%; height: 100%; background-size: cover; background-position: center; background-repeat: no-repeat; pointer-events: none; z-index: 2; }
      .device-glow { position: absolute; pointer-events: none; z-index: 4; }
      .light-btn { position: absolute; z-index: 7; border: none; cursor: pointer; display: flex; align-items: center; justify-content: center; padding: 0; transition: opacity 0.3s, box-shadow 0.3s; transform: translate(-50%, -50%); }
      .light-btn:active { transform: translate(-50%, -50%) scale(0.92); }
      .btn-area { position: absolute; top: 8px; display: flex; gap: 6px; z-index: 20; }
      .ctrl-btn { width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; cursor: none; border: none; background: var(--btn-bg, rgba(0,0,0,0.3)); backdrop-filter: blur(6px); -webkit-backdrop-filter: blur(6px); border-radius: 8px; font-size: 18px; padding: 0; transition: opacity 0.2s; }
      .ctrl-btn:active { box-shadow: 0 2px 12px rgba(255,255,255,0.4), 0 2px 8px rgba(0,0,0,0.4); transform: scale(0.95); }
      .ctrl-btn ha-icon { --mdi-icon-size: 18px; display: inline-flex; align-items: center; justify-content: center; width: 18px; height: 18px; line-height: 1; }
      .ctrl-btn ha-icon svg { width: 18px; height: 18px; display: block; }
      .weather-canvas { position: absolute; top: 0; left: 0; width: 100%; height: 100%; pointer-events: none; z-index: 3; }
      .person-icon-item { position: absolute; z-index: 5; cursor: pointer; display: flex; align-items: center; justify-content: center; transform: translate(-50%, -50%); }
      .person-icon-item ha-icon { display: inline-flex; align-items: center; justify-content: center; }
      @keyframes person-blink {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.3; }
      }
      .person-home { animation: person-blink 0.6s ease-in-out infinite; }
      .person-hidden { display: none; }
      .device-icon-item { position: absolute; z-index: 6; cursor: pointer; display: flex; align-items: center; justify-content: center; transform: translate(-50%, -50%); padding: 0; border: none; background: transparent; }
      .device-icon-item:active { transform: translate(-50%, -50%) scale(0.92); }
      .device-icon-item img { width: 100%; height: 100%; object-fit: contain; pointer-events: none; }`;
  }

  static getConfigElement() {
    return document.createElement('xiaoshi-pad-card-editor');
  }

  constructor() {
    super();
    this._kioskOn = true;
    this._kioskWasOn = false;
    this._blockToggleMenu = null;
    this._themeOverride = null;
    this._hueShift = 0;
    this._autoColorTimer = null;
    this._weatherAnimFrame = null;
    this._weatherParticles = [];
    this._weatherParticlesType = null;
    this._weatherLightning = { active: false, opacity: 0, nextFlash: 0 };
    this._lightLongPressTimer = null;
    this._lightLongPress = false;
    this._lightPopupOverlay = null;
    this._lightPopupElement = null;
    this._lightPopupEscHandler = null;
    this._lightPopupEntityId = null;
    this._lightPopupHassUnsubscribe = null;
    this._lightPopupUpdatePending = false;
    this._lightPopupHass = null;
    this._currentFloorIdx = 0;
    this._showHistory = false;
    this._historyData = {};
    this._historyLoading = false;
    this._historyOverlayEl = null;
    this._historyBodyEl = null;
    this._historyFilterPeriod = 24;
  }

  connectedCallback() {
    super.connectedCallback();
    this._startAutoColorTimer();
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this._stopAutoColorTimer();
    this._stopWeatherAnimation();
    this._closeLightPopup();
    this._applyKioskMode(false);
  }

  // ========== 多楼层 ==========
  _getCurrentFloorData() {
    if (this.config && this.config.enable_multi_floor && this.config.floors && this.config.floors.length > 0) {
      const idx = Math.min(this._currentFloorIdx, this.config.floors.length - 1);
      return this.config.floors[idx] || {};
    }
    return null;
  }

  _switchFloor(idx) {
    this._currentFloorIdx = idx;
    const floorData = this._getCurrentFloorData();
    window.floor = () => (floorData ? (floorData.id || '') : '');
    window.dispatchEvent(new CustomEvent('floor-changed'));
    this.requestUpdate();
  }

  _getFloorScopedArray(key) {
    if (this.config && this.config.enable_multi_floor && this.config.floors && this.config.floors.length > 0) {
      const fd = this._getCurrentFloorData();
      return fd ? (fd[key] || []) : [];
    }
    return this.config ? (this.config[key] || []) : [];
  }

  _startAutoColorTimer() {
    this._stopAutoColorTimer();
    const update = () => {
      const now = new Date();
      const secondsInHour = now.getMinutes() * 60 + now.getSeconds();
      // 0-3600秒映射到0-360色相，每10秒一段共360段
      this._hueShift = Math.floor(secondsInHour / 10);
      this.requestUpdate();
    };
    update();
    this._autoColorTimer = setInterval(update, 10000);
  }

  _stopAutoColorTimer() {
    if (this._autoColorTimer) {
      clearInterval(this._autoColorTimer);
      this._autoColorTimer = null;
    }
  }

  // ========== 颜色工具 ==========
  _rgbToHsl(r, g, b) {
    r /= 255; g /= 255; b /= 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h, s, l = (max + min) / 2;
    if (max === min) {
      h = s = 0;
    } else {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
        case g: h = ((b - r) / d + 2) / 6; break;
        case b: h = ((r - g) / d + 4) / 6; break;
      }
    }
    return [Math.round(h * 360), Math.round(s * 100), Math.round(l * 100)];
  }

  _hslToRgb(h, s, l) {
    h /= 360; s /= 100; l /= 100;
    let r, g, b;
    if (s === 0) {
      r = g = b = l;
    } else {
      const hue2rgb = (p, q, t) => {
        if (t < 0) t += 1;
        if (t > 1) t -= 1;
        if (t < 1/6) return p + (q - p) * 6 * t;
        if (t < 1/2) return q;
        if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
        return p;
      };
      const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
      const p = 2 * l - q;
      r = hue2rgb(p, q, h + 1/3);
      g = hue2rgb(p, q, h);
      b = hue2rgb(p, q, h - 1/3);
    }
    return 'rgb(' + Math.round(r * 255) + ',' + Math.round(g * 255) + ',' + Math.round(b * 255) + ')';
  }

  _shiftHue(rgbStr, shift) {
    const match = rgbStr.match(/(\d+)/g);
    if (!match || match.length < 3) return rgbStr;
    const [h, s, l] = this._rgbToHsl(parseInt(match[0]), parseInt(match[1]), parseInt(match[2]));
    return this._hslToRgb((h + shift) % 360, s, l);
  }

  updated(changedProps) {
    if (super.updated) super.updated(changedProps);
    const isKiosk = this._kioskOn;
    if (isKiosk !== this._kioskWasOn) {
      this._kioskWasOn = isKiosk;
      this._applyKioskMode(isKiosk);
    }
    this._updateWeatherAnimation();
  }

  // ========== Kiosk模式（移植自phone-card） ==========
  _applyKioskMode(on) {
    try {
      const ha = document.querySelector('home-assistant');
      if (!ha?.shadowRoot) return;
      const main = ha.shadowRoot.querySelector('home-assistant-main');
      if (!main?.shadowRoot) return;
      const drawer = main.shadowRoot.querySelector('ha-drawer');
      const drawerSR = drawer?.shadowRoot;
      const panel = drawer?.querySelector('ha-panel-lovelace');
      const huiRoot = panel?.shadowRoot?.querySelector('hui-root');
      const huiRootSR = huiRoot?.shadowRoot;

      if (on) {
        if (huiRootSR && !huiRootSR.querySelector('#xiaoshi-pad-kiosk-header-style')) {
          const style = document.createElement('style');
          style.id = 'xiaoshi-pad-kiosk-header-style';
          style.textContent = `
            .header { display: none !important; }
            #view {
              min-height: 100vh !important;
              --kiosk-header-height: 0px;
              padding-top: calc(var(--kiosk-header-height) + var(--safe-area-inset-top)) !important;
            }
          `;
          huiRootSR.appendChild(style);
        }
        if (drawerSR && !drawerSR.querySelector('#xiaoshi-pad-kiosk-sidebar-style')) {
          const style = document.createElement('style');
          style.id = 'xiaoshi-pad-kiosk-sidebar-style';
          style.textContent = `
            :host {
              --ha-sidebar-width: 0px !important;
              --kiosk-sidebar-width: 0px !important;
            }
            ha-sidebar { display: none !important; }
            wa-drawer, .sidebar-shell { display: none !important; }
            partial-panel-resolver { --mdc-top-app-bar-width: 100% !important; }
          `;
          drawerSR.appendChild(style);
        }
        const toolbar = huiRootSR?.querySelector('.toolbar');
        if (toolbar && !toolbar.querySelector('#xiaoshi-pad-kiosk-menubutton-style')) {
          const style = document.createElement('style');
          style.id = 'xiaoshi-pad-kiosk-menubutton-style';
          style.textContent = `ha-menu-button { display: none !important; }`;
          toolbar.appendChild(style);
        }
        if (!this._blockToggleMenu) {
          this._blockToggleMenu = (e) => { e.preventDefault(); e.stopImmediatePropagation(); };
          main.addEventListener('hass-toggle-menu', this._blockToggleMenu, true);
        }
      } else {
        huiRootSR?.querySelector('#xiaoshi-pad-kiosk-header-style')?.remove();
        drawerSR?.querySelector('#xiaoshi-pad-kiosk-sidebar-style')?.remove();
        const toolbar = huiRootSR?.querySelector('.toolbar');
        toolbar?.querySelector('#xiaoshi-pad-kiosk-menubutton-style')?.remove();
        if (this._blockToggleMenu) {
          main.removeEventListener('hass-toggle-menu', this._blockToggleMenu, true);
          this._blockToggleMenu = null;
        }
      }
    } catch (e) {
      console.error('[xiaoshi-pad-card] kiosk mode error:', e);
    }
  }

  _toggleFullscreen() {
    this._kioskOn = !this._kioskOn;
    this.requestUpdate();
  }

  _handleFullscreen() {
    this._handleHaptic();
    this._toggleFullscreen();
  }

  _handleHaptic() {
    const hapticEvent = new Event('haptic', {
      bubbles: true,
      cancelable: false,
      composed: true
    });
    hapticEvent.detail = 'light';
    this.dispatchEvent(hapticEvent);
  }

  // ========== 主题计算（基于sun.sun） ==========
  _evaluateTheme() {
    try {
      const mode = this.config ? this.config.theme : 'sun';
      let result;

      if (this._themeOverride) {
        result = this._themeOverride;
      } else if (mode === 'light') {
        result = 'light';
      } else if (mode === 'dark') {
        result = 'dark';
      } else {
        // sun 模式：根据 sun.sun 实体计算
        if (this.hass && this.hass.states) {
          const sunState = this.hass.states['sun.sun'];
          if (sunState) {
            const state = sunState.state;
            // above_horizon = 白天(light), below_horizon = 黑天(dark)
            // 日落后(below_horizon)是dark，日落前(above_horizon)是light
            result = state === 'above_horizon' ? 'light' : 'dark';
          } else {
            result = 'light';
          }
        } else {
          result = 'light';
        }
      }

      // 注册全局 theme() 函数
      window.theme = () => result;
      return result;
    } catch (e) {
      window.theme = () => 'light';
      return 'light';
    }
  }

  _toggleTheme() {
    this._handleHaptic();
    const mode = this.config ? this.config.theme : 'sun';
    if (mode === 'sun') {
      // 自动 → 白 → 黑 → 自动
      if (this._themeOverride === null) {
        this._themeOverride = 'light';
      } else if (this._themeOverride === 'light') {
        this._themeOverride = 'dark';
      } else {
        this._themeOverride = null;
      }
    } else {
      // 白 ↔ 黑
      const current = this._evaluateTheme();
      this._themeOverride = current === 'light' ? 'dark' : 'light';
    }
    // 实时更新全局 theme()
    this._evaluateTheme();
    this.requestUpdate();
  }

  setConfig(config) {
    this.config = {
      width: config.width || '1024px',
      height: config.height || '768px',
      theme: config.theme || 'sun',
      bg_color: config.bg_color || 'rgb(150,70,70)',
      auto_color: config.auto_color !== false,
      background_image: config.background_image || '',
      device_glows: config.device_glows || [],
      light_buttons: config.light_buttons || [],
      person_icons: config.person_icons || [],
      device_icons: (config.device_icons || []).map(di => ({
        ...di,
        image_mode: di.image_mode || '',
        image_flip: di.image_flip || '',
        state_images: di.state_images || []
      })),
      btn_area_left: config.btn_area_left || '20px',
      weather_animation: config.weather_animation === true,
      weather_entity: config.weather_entity || '',
      enable_multi_floor: config.enable_multi_floor === true,
      floors: (config.floors || []).map(f => ({
        id: f.id || '',
        name: f.name || '',
        background_image: f.background_image || '',
        light_buttons: f.light_buttons || [],
        person_icons: f.person_icons || [],
        device_glows: f.device_glows || [],
        device_icons: (f.device_icons || []).map(di => ({
          ...di,
          image_mode: di.image_mode || '',
          image_flip: di.image_flip || '',
          state_images: di.state_images || []
        }))
      })),
    };
    this._currentFloorIdx = (this.config.enable_multi_floor && this.config.floors && this.config.floors.length > 0) ? 0 : (config.active_floor_idx || 0);
  }

  set hass(hass) {
    this._hass = hass;
    this.requestUpdate();
  }

  get hass() {
    return this._hass;
  }

  // ========== 灯光按钮 ==========
  _toggleLight(entityId) {
    if (this._lightLongPress) {
      this._lightLongPress = false;
      return;
    }
    if (!this.hass || !entityId) return;
    this._handleHaptic();
    this.hass.callService('light', 'toggle', { entity_id: entityId });
  }

  _renderLightButtons() {
    if (!this.hass) return '';
    return this._getFloorScopedArray('light_buttons').map(item => {
      if (!item.entity) return '';
      const entity = this.hass.states[item.entity];
      if (!entity) return '';
      const isOn = entity.state === 'on';
      const color = item.color || 'rgb(220,130,0)';
      const shape = item.shape || '圆形';
      const posSize = `top: ${item.top || '100px'}; left: ${item.left || '100px'}; width: ${item.width || '25px'}; height: ${item.height || '25px'};`;
      let btnStyle = posSize;
      if (shape === '圆形') {
        btnStyle += ' border-radius: 50%;';
        if (isOn) {
          btnStyle += ` background: ${color}; border: 2px solid #fff; box-shadow: 0 0 7px 3px ${color};`;
        } else {
          btnStyle += ` background: transparent; border: 2px solid #fff;`;
        }
      } else if (shape === '方形') {
        btnStyle += ' border-radius: 0;';
        if (isOn) {
          btnStyle += ` background: ${color}; border: 2px solid #fff; box-shadow: 0 0 7px 3px ${color};`;
        } else {
          btnStyle += ` background: transparent; border: 2px solid #fff;`;
        }
      } else if (shape === '圆形内十字') {
        btnStyle += ' border-radius: 50%; overflow: hidden;';
        if (isOn) {
          btnStyle += ` background: ${color}; border: 2px solid #fff; box-shadow: 0 0 7px 3px ${color};`;
        } else {
          btnStyle += ` background: transparent; border: 2px solid #fff;`;
        }
        return html`<button class="light-btn ${isOn ? 'on' : 'off'}" style="${btnStyle}" @click="${() => this._toggleLight(item.entity)}" title="${item.entity}">
          <div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);width:100%;height:2px;background:#fff;"></div>
          <div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);width:2px;height:100%;background:#fff;"></div>
        </button>`;
      } else if (shape === '圆形外十字') {
        btnStyle += ' border-radius: 50%; overflow: visible;';
        if (isOn) {
          btnStyle += ` background: ${color}; border: 2px solid #fff; box-shadow: 0 0 7px 3px ${color};`;
        } else {
          btnStyle += ` background: transparent; border: 2px solid #fff;`;
        }
        return html`<button class="light-btn ${isOn ? 'on' : 'off'}" style="${btnStyle}" @click="${() => this._toggleLight(item.entity)}" title="${item.entity}">
          <div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);width:160%;height:2px;background:#fff;"></div>
          <div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);width:2px;height:160%;background:#fff;"></div>
        </button>`;
      } else if (shape === '圆形内X字') {
        btnStyle += ' border-radius: 50%; overflow: hidden;';
        if (isOn) {
          btnStyle += ` background: ${color}; border: 2px solid #fff; box-shadow: 0 0 7px 3px ${color};`;
        } else {
          btnStyle += ` background: transparent; border: 2px solid #fff;`;
        }
        return html`<button class="light-btn ${isOn ? 'on' : 'off'}" style="${btnStyle}" @click="${() => this._toggleLight(item.entity)}" title="${item.entity}">
          <div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%) rotate(45deg);width:142%;height:2px;background:#fff;"></div>
          <div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%) rotate(-45deg);width:142%;height:2px;background:#fff;"></div>
        </button>`;
      } else if (shape === '圆形外X字') {
        btnStyle += ' border-radius: 50%; overflow: visible;';
        if (isOn) {
          btnStyle += ` background: ${color}; border: 2px solid #fff; box-shadow: 0 0 7px 3px ${color};`;
        } else {
          btnStyle += ` background: transparent; border: 2px solid #fff;`;
        }
        return html`<button class="light-btn ${isOn ? 'on' : 'off'}" style="${btnStyle}" @click="${() => this._toggleLight(item.entity)}" title="${item.entity}">
          <div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%) rotate(45deg);width:160%;height:2px;background:#fff;"></div>
          <div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%) rotate(-45deg);width:160%;height:2px;background:#fff;"></div>
        </button>`;
      } else if (shape === '方形内十字') {
        btnStyle += ' border-radius: 0; overflow: hidden;';
        if (isOn) {
          btnStyle += ` background: ${color}; border: 2px solid #fff; box-shadow: 0 0 7px 3px ${color};`;
        } else {
          btnStyle += ` background: transparent; border: 2px solid #fff;`;
        }
        return html`<button class="light-btn ${isOn ? 'on' : 'off'}" style="${btnStyle}" @click="${() => this._toggleLight(item.entity)}" title="${item.entity}">
          <div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);width:100%;height:2px;background:#fff;"></div>
          <div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);width:2px;height:100%;background:#fff;"></div>
        </button>`;
      } else if (shape === '方形外十字') {
        btnStyle += ' border-radius: 0; overflow: visible;';
        if (isOn) {
          btnStyle += ` background: ${color}; border: 2px solid #fff; box-shadow: 0 0 7px 3px ${color};`;
        } else {
          btnStyle += ` background: transparent; border: 2px solid #fff;`;
        }
        return html`<button class="light-btn ${isOn ? 'on' : 'off'}" style="${btnStyle}" @click="${() => this._toggleLight(item.entity)}" title="${item.entity}">
          <div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);width:160%;height:2px;background:#fff;"></div>
          <div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);width:2px;height:160%;background:#fff;"></div>
        </button>`;
      } else if (shape === '方形内X字') {
        btnStyle += ' border-radius: 0; overflow: hidden;';
        if (isOn) {
          btnStyle += ` background: ${color}; border: 2px solid #fff; box-shadow: 0 0 7px 3px ${color};`;
        } else {
          btnStyle += ` background: transparent; border: 2px solid #fff;`;
        }
        return html`<button class="light-btn ${isOn ? 'on' : 'off'}" style="${btnStyle}" @click="${() => this._toggleLight(item.entity)}" title="${item.entity}">
          <div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%) rotate(45deg);width:142%;height:2px;background:#fff;"></div>
          <div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%) rotate(-45deg);width:142%;height:2px;background:#fff;"></div>
        </button>`;
      } else if (shape === '方形外X字') {
        btnStyle += ' border-radius: 0; overflow: visible;';
        if (isOn) {
          btnStyle += ` background: ${color}; border: 2px solid #fff; box-shadow: 0 0 7px 3px ${color};`;
        } else {
          btnStyle += ` background: transparent; border: 2px solid #fff;`;
        }
        return html`<button class="light-btn ${isOn ? 'on' : 'off'}" style="${btnStyle}" @click="${() => this._toggleLight(item.entity)}" title="${item.entity}">
          <div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%) rotate(45deg);width:200%;height:2px;background:#fff;"></div>
          <div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%) rotate(-45deg);width:200%;height:2px;background:#fff;"></div>
        </button>`;
      } else if (shape === '五角星形') {
        btnStyle += ' overflow: visible;';
        if (isOn) {
          btnStyle += ` background: transparent; filter: drop-shadow(0 0 7px ${color}) drop-shadow(0 0 3px ${color});`;
        } else {
          btnStyle += ` background: transparent;`;
        }
        return html`<button class="light-btn ${isOn ? 'on' : 'off'}" style="${btnStyle}" @click="${() => this._toggleLight(item.entity)}" title="${item.entity}">
          <svg viewBox="0 0 100 100" style="width:100%;height:100%;display:block;" preserveAspectRatio="none">
            <polygon points="50,5 61,35 95,35 68,57 79,91 50,70 21,91 32,57 5,35 39,35"
              fill="${isOn ? color : 'transparent'}" stroke="#fff" stroke-width="5"/>
          </svg>
        </button>`;
      } else if (shape === '六边形1') {
        btnStyle += ' overflow: visible;';
        if (isOn) {
          btnStyle += ` background: transparent; filter: drop-shadow(0 0 7px ${color}) drop-shadow(0 0 3px ${color});`;
        } else {
          btnStyle += ` background: transparent;`;
        }
        return html`<button class="light-btn ${isOn ? 'on' : 'off'}" style="${btnStyle}" @click="${() => this._toggleLight(item.entity)}" title="${item.entity}">
          <svg viewBox="0 0 100 100" style="width:100%;height:100%;display:block;" preserveAspectRatio="none">
            <polygon points="50,2 93,27 93,73 50,98 7,73 7,27"
              fill="${isOn ? color : 'transparent'}" stroke="#fff" stroke-width="5"/>
          </svg>
        </button>`;
      } else if (shape === '六边形2') {
        btnStyle += ' overflow: visible;';
        if (isOn) {
          btnStyle += ` background: transparent; filter: drop-shadow(0 0 7px ${color}) drop-shadow(0 0 3px ${color});`;
        } else {
          btnStyle += ` background: transparent;`;
        }
        return html`<button class="light-btn ${isOn ? 'on' : 'off'}" style="${btnStyle}" @click="${() => this._toggleLight(item.entity)}" title="${item.entity}">
          <svg viewBox="0 0 100 100" style="width:100%;height:100%;display:block;" preserveAspectRatio="none">
            <polygon points="50,2 93,27 93,73 50,98 7,73 7,27"
              fill="${isOn ? color : 'transparent'}" stroke="#fff" stroke-width="5" transform="rotate(30,50,50)"/>
          </svg>
        </button>`;
      } else if (shape === '六角星形') {
        btnStyle += ' overflow: visible;';
        if (isOn) {
          btnStyle += ` background: transparent; filter: drop-shadow(0 0 7px ${color}) drop-shadow(0 0 3px ${color});`;
        } else {
          btnStyle += ` background: transparent;`;
        }
        return html`<button class="light-btn ${isOn ? 'on' : 'off'}" style="${btnStyle}" @click="${() => this._toggleLight(item.entity)}" title="${item.entity}">
          <svg viewBox="0 0 100 100" style="width:100%;height:100%;display:block;" preserveAspectRatio="none">
            <polygon points="50,2 64,26 92,26 78,50 92,74 64,74 50,98 36,74 8,74 22,50 8,26 36,26"
              fill="${isOn ? color : 'transparent'}" stroke="#fff" stroke-width="4"/>
          </svg>
        </button>`;
      } else if (shape === '心形') {
        btnStyle += ' overflow: visible;';
        if (isOn) {
          btnStyle += ` background: transparent; filter: drop-shadow(0 0 7px ${color}) drop-shadow(0 0 3px ${color});`;
        } else {
          btnStyle += ` background: transparent;`;
        }
        return html`<button class="light-btn ${isOn ? 'on' : 'off'}" style="${btnStyle}" @click="${() => this._toggleLight(item.entity)}" title="${item.entity}">
          <svg viewBox="0 0 100 100" style="width:100%;height:100%;display:block;" preserveAspectRatio="none">
            <path d="M50,88 C20,65 2,45 2,28 C2,12 14,2 28,2 C38,2 46,8 50,16 C54,8 62,2 72,2 C86,2 98,12 98,28 C98,45 80,65 50,88Z"
              fill="${isOn ? color : 'transparent'}" stroke="#fff" stroke-width="8"/>
          </svg>
        </button>`;
      } else if (shape === '月亮形') {
        btnStyle += ' overflow: visible;';
        if (isOn) {
          btnStyle += ` background: transparent; filter: drop-shadow(0 0 7px ${color}) drop-shadow(0 0 3px ${color});`;
        } else {
          btnStyle += ` background: transparent;`;
        }
        return html`<button class="light-btn ${isOn ? 'on' : 'off'}" style="${btnStyle}" @click="${() => this._toggleLight(item.entity)}" title="${item.entity}">
          <svg viewBox="-45 0 110 100" style="width:100%;height:100%;display:block;" preserveAspectRatio="xMidYMid meet">
            <path d="M55,8 A48,48,0,1,0,55,92 A42,42,0,1,1,55,8Z"
              fill="${isOn ? color : 'transparent'}" stroke="#fff" stroke-width="8"/>
          </svg>
        </button>`;
      } else if (shape === '横线') {
        btnStyle += ' overflow: visible;';
        if (isOn) {
          btnStyle += ` background: transparent; filter: drop-shadow(0 0 7px ${color}) drop-shadow(0 0 3px ${color});`;
        } else {
          btnStyle += ` background: transparent;`;
        }
        return html`<button class="light-btn ${isOn ? 'on' : 'off'}" style="${btnStyle}" @click="${() => this._toggleLight(item.entity)}" title="${item.entity}">
          <svg viewBox="0 0 100 100" style="width:100%;height:100%;display:block;" preserveAspectRatio="none">
            ${isOn ? html`<line x1="0" y1="50" x2="100" y2="50" stroke="${color}" stroke-width="10" stroke-linecap="round"/>` : ''}
            <line x1="0" y1="50" x2="100" y2="50" stroke="#fff" stroke-width="10" stroke-linecap="round"/>
          </svg>
        </button>`;
      } else if (shape === '竖线') {
        btnStyle += ' overflow: visible;';
        if (isOn) {
          btnStyle += ` background: transparent; filter: drop-shadow(0 0 7px ${color}) drop-shadow(0 0 3px ${color});`;
        } else {
          btnStyle += ` background: transparent;`;
        }
        return html`<button class="light-btn ${isOn ? 'on' : 'off'}" style="${btnStyle}" @click="${() => this._toggleLight(item.entity)}" title="${item.entity}">
          <svg viewBox="0 0 100 100" style="width:100%;height:100%;display:block;" preserveAspectRatio="none">
            ${isOn ? html`<line x1="50" y1="0" x2="50" y2="100" stroke="${color}" stroke-width="10" stroke-linecap="round"/>` : ''}
            <line x1="50" y1="0" x2="50" y2="100" stroke="#fff" stroke-width="10" stroke-linecap="round"/>
          </svg>
        </button>`;
      }
      return html`<button class="light-btn ${isOn ? 'on' : 'off'}" style="${btnStyle}" @click="${() => this._toggleLight(item.entity)}" title="${item.entity}"></button>`;
    });
  }

  // ========== 灯光长按弹窗 ==========
  _onContainerPointerDown(e) {
    const btn = e.target.closest ? e.target.closest('.light-btn') : null;
    if (!btn) return;
    const entityId = btn.title;
    if (!entityId) return;
    this._lightLongPress = false;
    this._lightLongPressTimer = setTimeout(() => {
      this._lightLongPress = true;
      this._showLightPopup(entityId);
    }, 500);
  }

  _onContainerPointerUp(e) {
    clearTimeout(this._lightLongPressTimer);
  }

  _onContainerPointerLeave(e) {
    clearTimeout(this._lightLongPressTimer);
  }

  _injectLightPopupStyles() {
    if (document.getElementById('xiaoshi-light-popup-style')) return;
    const style = document.createElement('style');
    style.id = 'xiaoshi-light-popup-style';
    style.textContent = `
      .xiaoshi-light-popup-overlay{position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.5);z-index:1000;backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px)}
      @keyframes xiaoshiLightPopupIn{from{opacity:0;transform:translate(-50%,-50%) scale(0.95)}to{opacity:1;transform:translate(-50%,-50%) scale(1)}}
      .xiaoshi-light-popup{position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);z-index:1005;background:var(--lp-bg);backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px);border-radius:16px;padding:24px;min-width:320px;max-width:420px;color:var(--lp-text);font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;animation:xiaoshiLightPopupIn 0.2s ease-out;box-shadow:0 8px 32px rgba(0,0,0,0.4)}
      .xiaoshi-light-popup-title{font-size:18px;font-weight:600;text-align:center;margin-bottom:20px;padding-bottom:12px;border-bottom:1px solid var(--lp-border)}
      .xiaoshi-light-popup-section{margin-bottom:20px}
      .xiaoshi-light-popup-section:last-child{margin-bottom:0}
      .xiaoshi-light-popup-label{font-size:14px;color:var(--lp-text-secondary);margin-bottom:8px;display:flex;justify-content:space-between;align-items:center}
      .xiaoshi-light-popup-value{color:var(--lp-text);font-weight:600;font-size:15px}
      .xiaoshi-light-popup-slider-row{display:flex;align-items:center;gap:8px}
      .xiaoshi-light-popup-slider-icon{font-size:16px;flex-shrink:0;width:24px;text-align:center}
      .xiaoshi-light-popup-slider{flex:1;-webkit-appearance:none;appearance:none;height:6px;border-radius:3px;outline:none;cursor:pointer}
      .xiaoshi-light-brightness-slider{background:linear-gradient(to right,#333,#FFD54F)}
      .xiaoshi-light-popup-slider::-webkit-slider-thumb{-webkit-appearance:none;appearance:none;width:20px;height:20px;border-radius:50%;background:var(--lp-thumb);box-shadow:0 1px 4px rgba(0,0,0,0.3);cursor:pointer}
      .xiaoshi-light-popup-slider::-moz-range-thumb{width:20px;height:20px;border-radius:50%;background:var(--lp-thumb);box-shadow:0 1px 4px rgba(0,0,0,0.3);cursor:pointer;border:none}
      .xiaoshi-light-popup-effects{display:flex;flex-wrap:wrap;gap:8px}
      .xiaoshi-light-popup-effect-btn{padding:8px 14px;border-radius:20px;border:1px solid var(--lp-btn-border);background:var(--lp-btn-bg);color:var(--lp-btn-text);font-size:13px;cursor:pointer;transition:all 0.2s;font-family:inherit}
      .xiaoshi-light-popup-effect-btn:hover{background:var(--lp-btn-hover)}
      .xiaoshi-light-popup-effect-btn.active{background:rgba(33,150,243,0.3);border-color:rgba(33,150,243,0.6);color:#fff;font-weight:600}
      .xiaoshi-light-popup-toggle-btn{padding:10px 32px;border-radius:24px;border:1px solid var(--lp-btn-border);background:var(--lp-btn-bg);color:var(--lp-btn-text);font-size:15px;cursor:pointer;transition:all 0.2s;font-family:inherit}
      .xiaoshi-light-popup-toggle-btn:hover{background:var(--lp-btn-hover)}
      .xiaoshi-light-popup-toggle-btn.on{background:rgba(255,180,0,0.25);border-color:rgba(255,180,0,0.5);color:#FFB800;font-weight:600}
    `;
    document.head.appendChild(style);
  }

  _showLightPopup(entityId) {
    if (!this.hass || !entityId) return;
    const entity = this.hass.states[entityId];
    if (!entity) return;

    const attrs = entity.attributes || {};
    const supportedColorModes = attrs.supported_color_modes || [];
    const hasColorTemp = supportedColorModes.includes('color_temp');
    const effectList = attrs.effect_list || [];
    const hasEffects = effectList.length > 0;

    if (!hasColorTemp && !hasEffects) return;

    this._injectLightPopupStyles();
    this._closeLightPopup();

    const isOn = entity.state === 'on';
    const friendlyName = attrs.friendly_name || entityId;
    const brightness = isOn ? Math.round((attrs.brightness || 0) / 255 * 100) : 0;
    const minKelvin = attrs.min_color_temp_kelvin || 2700;
    const maxKelvin = attrs.max_color_temp_kelvin || 6500;
    const currentKelvin = attrs.color_temp_kelvin || Math.round((minKelvin + maxKelvin) / 2);
    const currentEffect = attrs.effect || '';

    this._lightPopupEntityId = entityId;

    const overlay = document.createElement('div');
    overlay.className = 'xiaoshi-light-popup-overlay';
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) this._closeLightPopup();
    });

    const popup = document.createElement('div');
    popup.className = 'xiaoshi-light-popup';

    // 根据主题设置弹窗颜色变量
    const currentTheme = (typeof window.theme === 'function') ? window.theme() : 'dark';
    if (currentTheme === 'light') {
      popup.style.setProperty('--lp-bg', 'rgba(240, 240, 240, 0.95)');
      popup.style.setProperty('--lp-text', '#222');
      popup.style.setProperty('--lp-text-secondary', 'rgba(0,0,0,0.5)');
      popup.style.setProperty('--lp-border', 'rgba(0,0,0,0.1)');
      popup.style.setProperty('--lp-thumb', '#555');
      popup.style.setProperty('--lp-btn-bg', 'rgba(0,0,0,0.06)');
      popup.style.setProperty('--lp-btn-border', 'rgba(0,0,0,0.15)');
      popup.style.setProperty('--lp-btn-text', 'rgba(0,0,0,0.7)');
      popup.style.setProperty('--lp-btn-hover', 'rgba(0,0,0,0.1)');
    } else {
      popup.style.setProperty('--lp-bg', 'rgba(40, 40, 40, 0.95)');
      popup.style.setProperty('--lp-text', '#fff');
      popup.style.setProperty('--lp-text-secondary', 'rgba(255,255,255,0.7)');
      popup.style.setProperty('--lp-border', 'rgba(255,255,255,0.1)');
      popup.style.setProperty('--lp-thumb', '#fff');
      popup.style.setProperty('--lp-btn-bg', 'rgba(255,255,255,0.08)');
      popup.style.setProperty('--lp-btn-border', 'rgba(255,255,255,0.2)');
      popup.style.setProperty('--lp-btn-text', 'rgba(255,255,255,0.8)');
      popup.style.setProperty('--lp-btn-hover', 'rgba(255,255,255,0.15)');
    }

    let content = '';
    content += '<div class="xiaoshi-light-popup-title">' + friendlyName + '</div>';

    // 开关按钮
    content += '<div class="xiaoshi-light-popup-section" style="text-align:center;margin-bottom:16px;">';
    content += '<button class="xiaoshi-light-popup-toggle-btn' + (isOn ? ' on' : '') + '" id="xiaoshi-light-toggle-btn">' + (isOn ? '💡 已开启' : '⚫ 已关闭') + '</button>';
    content += '</div>';

    // 亮度
    content += '<div class="xiaoshi-light-popup-section">';
    content += '<div class="xiaoshi-light-popup-label"><span>亮度</span><span class="xiaoshi-light-popup-value" id="xiaoshi-light-brightness-val">' + brightness + '%</span></div>';
    content += '<div class="xiaoshi-light-popup-slider-row">';
    content += '<span class="xiaoshi-light-popup-slider-icon">🔅</span>';
    content += '<input type="range" class="xiaoshi-light-popup-slider xiaoshi-light-brightness-slider" min="1" max="100" value="' + brightness + '">';
    content += '<span class="xiaoshi-light-popup-slider-icon">🔆</span>';
    content += '</div></div>';

    // 色温
    if (hasColorTemp) {
      content += '<div class="xiaoshi-light-popup-section">';
      content += '<div class="xiaoshi-light-popup-label"><span>色温</span><span class="xiaoshi-light-popup-value" id="xiaoshi-light-colortemp-val">' + currentKelvin + 'K</span></div>';
      content += '<div class="xiaoshi-light-popup-slider-row">';
      content += '<span class="xiaoshi-light-popup-slider-icon" style="color:#FF9800;">🟠</span>';
      content += '<input type="range" class="xiaoshi-light-popup-slider xiaoshi-light-colortemp-slider" min="' + minKelvin + '" max="' + maxKelvin + '" value="' + currentKelvin + '" step="100" style="background: linear-gradient(to right, #FF9800, #FFF5E1, #87CEEB);">';
      content += '<span class="xiaoshi-light-popup-slider-icon" style="color:#87CEEB;">🔵</span>';
      content += '</div></div>';
    }

    // 情景模式
    if (hasEffects) {
      content += '<div class="xiaoshi-light-popup-section">';
      content += '<div class="xiaoshi-light-popup-label"><span>情景模式</span></div>';
      content += '<div class="xiaoshi-light-popup-effects">';
      effectList.forEach(function(effect) {
        content += '<button class="xiaoshi-light-popup-effect-btn' + (currentEffect === effect ? ' active' : '') + '" data-effect="' + effect + '">' + effect + '</button>';
      });
      content += '</div></div>';
    }

    popup.innerHTML = content;

    document.body.appendChild(overlay);
    document.body.appendChild(popup);

    this._lightPopupOverlay = overlay;
    this._lightPopupElement = popup;

    // 亮度滑块
    const brightnessSlider = popup.querySelector('.xiaoshi-light-brightness-slider');
    if (brightnessSlider) {
      let lastCall = 0;
      const self = this;
      brightnessSlider.addEventListener('input', function(e) {
        const val = parseInt(e.target.value);
        const valueEl = popup.querySelector('#xiaoshi-light-brightness-val');
        if (valueEl) valueEl.textContent = val + '%';
        const now = Date.now();
        if (now - lastCall > 200) {
          lastCall = now;
          self.hass.callService('light', 'turn_on', { entity_id: entityId, brightness_pct: val });
        }
      });
      brightnessSlider.addEventListener('change', function(e) {
        const val = parseInt(e.target.value);
        self.hass.callService('light', 'turn_on', { entity_id: entityId, brightness_pct: val });
      });
    }

    // 色温滑块
    const colortempSlider = popup.querySelector('.xiaoshi-light-colortemp-slider');
    if (colortempSlider) {
      let lastCall = 0;
      const self = this;
      colortempSlider.addEventListener('input', function(e) {
        const val = parseInt(e.target.value);
        const valueEl = popup.querySelector('#xiaoshi-light-colortemp-val');
        if (valueEl) valueEl.textContent = val + 'K';
        const now = Date.now();
        if (now - lastCall > 200) {
          lastCall = now;
          self.hass.callService('light', 'turn_on', { entity_id: entityId, color_temp_kelvin: val });
        }
      });
      colortempSlider.addEventListener('change', function(e) {
        const val = parseInt(e.target.value);
        self.hass.callService('light', 'turn_on', { entity_id: entityId, color_temp_kelvin: val });
      });
    }

    // 情景模式按钮
    const effectBtns = popup.querySelectorAll('.xiaoshi-light-popup-effect-btn');
    const self = this;
    effectBtns.forEach(function(btn) {
      btn.addEventListener('click', function() {
        const effect = btn.dataset.effect;
        self.hass.callService('light', 'turn_on', { entity_id: entityId, effect: effect });
        effectBtns.forEach(function(b) { b.classList.remove('active'); });
        btn.classList.add('active');
      });
    });

    // 开关按钮
    const toggleBtn = popup.querySelector('#xiaoshi-light-toggle-btn');
    if (toggleBtn) {
      toggleBtn.addEventListener('click', () => {
        self.hass.callService('light', 'toggle', { entity_id: entityId });
      });
    }

    // ESC 关闭
    this._lightPopupEscHandler = function(e) {
      if (e.key === 'Escape') self._closeLightPopup();
    }.bind(this);
    window.addEventListener('keydown', this._lightPopupEscHandler);

    // 订阅 hass 状态变化实时更新弹窗
    this._startLightPopupHassWatcher();
  }

  _closeLightPopup() {
    if (this._lightPopupOverlay) {
      this._lightPopupOverlay.remove();
      this._lightPopupOverlay = null;
    }
    if (this._lightPopupElement) {
      this._lightPopupElement.remove();
      this._lightPopupElement = null;
    }
    if (this._lightPopupEscHandler) {
      window.removeEventListener('keydown', this._lightPopupEscHandler);
      this._lightPopupEscHandler = null;
    }
    if (this._lightPopupHassUnsubscribe) {
      this._lightPopupHassUnsubscribe();
      this._lightPopupHassUnsubscribe = null;
    }
    this._lightPopupUpdatePending = false;
    this._lightPopupHass = null;
    this._lightPopupEntityId = null;
  }

  _startLightPopupHassWatcher() {
    if (!this.hass || !this.hass.connection) return;
    try {
      this.hass.connection.subscribeMessage(
        () => {
          if (!this._lightPopupElement) return;
          this._scheduleLightPopupUpdate();
        },
        { type: 'subscribe_events', event_type: 'state_changed' }
      ).then((unsub) => {
        this._lightPopupHassUnsubscribe = unsub;
      });
    } catch (err) {
      console.warn('[xiaoshi-pad-card] 灯光弹窗订阅失败:', err);
    }
  }

  _scheduleLightPopupUpdate() {
    if (this._lightPopupUpdatePending) return;
    this._lightPopupUpdatePending = true;
    requestAnimationFrame(() => {
      this._lightPopupUpdatePending = false;
      if (!this._lightPopupElement) return;
      this._updateLightPopupSliders();
    });
  }

  _updateLightPopupSliders() {
    const entityId = this._lightPopupEntityId;
    if (!entityId || !this.hass) return;
    const entity = this.hass.states[entityId];
    if (!entity) return;

    const attrs = entity.attributes || {};
    const isOn = entity.state === 'on';
    const brightness = isOn ? Math.round((attrs.brightness || 0) / 255 * 100) : 0;
    const currentKelvin = attrs.color_temp_kelvin || 0;
    const currentEffect = attrs.effect || '';

    const popup = this._lightPopupElement;
    if (!popup) return;

    // 更新开关按钮
    const toggleBtn = popup.querySelector('#xiaoshi-light-toggle-btn');
    if (toggleBtn) {
      if (isOn) {
        toggleBtn.textContent = '💡 已开启';
        toggleBtn.classList.add('on');
      } else {
        toggleBtn.textContent = '⚫ 已关闭';
        toggleBtn.classList.remove('on');
      }
    }

    const brightnessSlider = popup.querySelector('.xiaoshi-light-brightness-slider');
    const brightnessVal = popup.querySelector('#xiaoshi-light-brightness-val');
    if (brightnessSlider && isOn) {
      brightnessSlider.value = brightness;
      if (brightnessVal) brightnessVal.textContent = brightness + '%';
    }

    const colortempSlider = popup.querySelector('.xiaoshi-light-colortemp-slider');
    const colortempVal = popup.querySelector('#xiaoshi-light-colortemp-val');
    if (colortempSlider && currentKelvin) {
      colortempSlider.value = currentKelvin;
      if (colortempVal) colortempVal.textContent = currentKelvin + 'K';
    }

    const effectBtns = popup.querySelectorAll('.xiaoshi-light-popup-effect-btn');
    effectBtns.forEach(btn => {
      if (btn.dataset.effect === currentEffect) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });
  }

  // ========== 人在图标 ==========
  _getPersonConditions(item) {
    const conditionMode = item.condition_mode || '';
    if (conditionMode === 'override') {
      return (item.status_conditions || '')
        .split(',').map(s => s.trim().toLowerCase()).filter(s => s);
    } else if (conditionMode === 'append') {
      const preset = PRESET_ON_STATES.map(s => s.toLowerCase());
      const custom = (item.status_conditions || '')
        .split(',').map(s => s.trim().toLowerCase()).filter(s => s);
      return [...new Set([...preset, ...custom])];
    } else {
      return PRESET_ON_STATES.map(s => s.toLowerCase());
    }
  }

  _renderPersonIcons() {
    if (!this.hass) return '';
    return this._getFloorScopedArray('person_icons').map(item => {
      if (!item.entity) return '';
      const entity = this.hass.states[item.entity];
      if (!entity) return '';

      const personState = entity.state;
      const conditions = this._getPersonConditions(item);
      const isHome = personState && conditions.some(c => personState.toLowerCase().includes(c) || c.includes(personState.toLowerCase()));

      const color = item.color || 'rgb(255,87,34)';
      const icon = isHome ? 'mdi:motion-sensor' : 'mdi:motion-sensor-off';
      const iconWidth = item.width || item.icon_size || '20px';
      const iconHeight = item.height || item.icon_size || '20px';
      const posSize = `top: ${item.top || '100px'}; left: ${item.left || '100px'};`;

      return html`<div class="person-icon-item ${isHome ? 'person-home' : ''}" style="${posSize} color: ${isHome ? color : '#888'};"
        @click="${() => this._togglePersonHistory(item)}">
        <ha-icon icon="${icon}" style="--mdc-icon-size:${iconWidth};width:${iconWidth};height:${iconHeight}"></ha-icon>
      </div>`;
    });
  }

  // ========== 设备图标 ==========
  _getDeviceIconConditions(item) {
    const conditionMode = item.condition_mode || '';
    if (conditionMode === 'override') {
      return (item.status_conditions || '')
        .split(',').map(s => s.trim().toLowerCase()).filter(s => s);
    } else if (conditionMode === 'append') {
      const preset = PRESET_ON_STATES.map(s => s.toLowerCase());
      const custom = (item.status_conditions || '')
        .split(',').map(s => s.trim().toLowerCase()).filter(s => s);
      return [...new Set([...preset, ...custom])];
    } else {
      return PRESET_ON_STATES.map(s => s.toLowerCase());
    }
  }

  _isDeviceIconOn(item) {
    if (!this.hass || !item.entity) return false;
    const entity = this.hass.states[item.entity];
    if (!entity) return false;
    const state = entity.state;
    const conditions = this._getDeviceIconConditions(item);
    return state && conditions.some(c => state.toLowerCase().includes(c) || c.includes(state.toLowerCase()));
  }

  _onDeviceIconClick(item) {
    if (!item) return;
    const popupConfig = item.popup_cards || item.other_cards || item.popup;
    if (popupConfig) {
      let popupCards = [];
      if (typeof popupConfig === 'string') {
        try {
          popupCards = yamlToJson(popupConfig);
        } catch (err) {
          console.error('[xiaoshi-pad-card] 设备图标弹窗配置解析失败:', err);
          return;
        }
      }
      this._handleHaptic();
      const popupWidth = item.popup_width || '400px';
      const popupTop = item.popup_top || '50%';
      const serviceData = { card: popupCards };
      serviceData.background = 'transparent';
      serviceData.popup_width = popupWidth;
      serviceData.popup_top = popupTop;
      this.hass.callService('popup_card', 'show', serviceData);
      return;
    }
    // 弹窗为空时，直接切换实体状态
    if (item.entity) {
      this._handleHaptic();
      const entityId = item.entity;
      const domain = entityId.split('.')[0];
      if (domain === 'light' || domain === 'switch' || domain === 'fan' || domain === 'humidifier' || domain === 'input_boolean') {
        this.hass.callService('homeassistant', 'toggle', { entity_id: entityId });
      } else if (domain === 'climate') {
        const entity = this.hass.states[entityId];
        if (entity && entity.state === 'off') {
          this.hass.callService('climate', 'turn_on', { entity_id: entityId });
        } else {
          this.hass.callService('climate', 'turn_off', { entity_id: entityId });
        }
      } else if (domain === 'media_player') {
        this.hass.callService('media_player', 'toggle', { entity_id: entityId });
      } else {
        this.hass.callService('homeassistant', 'toggle', { entity_id: entityId });
      }
    }
  }

  _renderDeviceIcons() {
    if (!this.hass) return '';
    return this._getFloorScopedArray('device_icons').map(item => {
      // 无实体模式：不需要实体，直接显示图片
      if (item.image_mode === 'no_entity') {
        const width = item.width || '25px';
        const height = item.height || '25px';
        const posSize = `top: ${item.top || '100px'}; left: ${item.left || '100px'}; width: ${width}; height: ${height};`;
        const imageUrl = item.on_image || '';

        let flipStyle = '';
        if (item.image_flip === 'flip-h') {
          flipStyle = 'transform: scaleX(-1);';
        } else if (item.image_flip === 'flip-v') {
          flipStyle = 'transform: scaleY(-1);';
        } else if (item.image_flip === 'rotate-90') {
          flipStyle = 'transform: rotate(90deg);';
        } else if (item.image_flip === 'rotate-270') {
          flipStyle = 'transform: rotate(270deg);';
        }

        if (imageUrl) {
          return html`<button class="device-icon-item" style="${posSize}" @click="${() => this._onDeviceIconClick(item)}">
            <img src="${imageUrl}" alt="device" style="${flipStyle}" />
          </button>`;
        }
        return '';
      }

      if (!item.entity) return '';
      const entity = this.hass.states[item.entity];
      if (!entity) return '';

      const width = item.width || '25px';
      const height = item.height || '25px';
      const posSize = `top: ${item.top || '100px'}; left: ${item.left || '100px'}; width: ${width}; height: ${height};`;

      const isOn = this._isDeviceIconOn(item);
      const state = entity.state;
      const isUnavailable = state === 'unknown' || state === 'unavailable';

      let imageUrl = '';

      if (item.image_mode === 'custom' && item.state_images && item.state_images.length > 0) {
        // 自定义状态图片模式：按实体值匹配图片
        const matched = item.state_images.find(si => si.state && si.state.toLowerCase() === state.toLowerCase());
        if (matched && matched.image) {
          imageUrl = matched.image;
        } else {
          // unknown/unavailable 或未匹配时，取 off_image 或最后一个状态图片
          imageUrl = item.off_image || (item.state_images.length > 0 ? item.state_images[item.state_images.length - 1].image : '');
        }
      } else {
        // 默认 on/off 模式
        const onImage = item.on_image || '';
        const offImage = item.off_image || '';
        imageUrl = isOn ? onImage : offImage;
      }

      let flipStyle = '';
      if (item.image_flip === 'flip-h') {
        flipStyle = 'transform: scaleX(-1);';
      } else if (item.image_flip === 'flip-v') {
        flipStyle = 'transform: scaleY(-1);';
      } else if (item.image_flip === 'rotate-90') {
        flipStyle = 'transform: rotate(90deg);';
      } else if (item.image_flip === 'rotate-270') {
        flipStyle = 'transform: rotate(270deg);';
      }

      if (imageUrl) {
        return html`<button class="device-icon-item" style="${posSize}" @click="${() => this._onDeviceIconClick(item)}" title="${item.entity}">
          <img src="${imageUrl}" alt="device" style="${flipStyle}" />
        </button>`;
      }

      return html`<button class="device-icon-item" style="${posSize} color: ${isOn ? '#fff' : '#888'};" @click="${() => this._onDeviceIconClick(item)}" title="${item.entity}">
        <ha-icon icon="${isOn ? 'mdi:power-plug' : 'mdi:power-plug-off'}" style="--mdc-icon-size:${width};width:${width};height:${height}"></ha-icon>
      </button>`;
    });
  }

  // ========== 设备光效 ==========
  _directionToPosition(dir) {
    const map = {
      '左上': '0% 0%',
      '左下': '0% 100%',
      '右上': '100% 0%',
      '右下': '100% 100%',
      '上': '50% 0%',
      '下': '50% 100%',
      '左': '0% 50%',
      '右': '100% 50%',
      '四周': 'center'
    };
    return map[dir] || '100% 100%';
  }

  _computeDeviceGlowStyle(item) {
    if (!this.hass || !item.entity) return null;
    const entity = this.hass.states[item.entity];
    if (!entity || entity.state === 'off' || entity.state === 'unknown' || entity.state === 'unavailable') return null;

    const state = entity.state;
    const color = (item.state_colors && item.state_colors[state]) || item.color || 'rgb(33,150,243)';
    const direction = item.direction || '右下';

    if (direction === '四周') {
      return `radial-gradient(ellipse farthest-corner at center, ${color} -60%, rgba(0,0,0,0) 60%)`;
    }
    const position = this._directionToPosition(direction);
    return `radial-gradient(ellipse farthest-corner at ${position}, ${color} -60%, rgba(0,0,0,0) 60%)`;
  }

  // 根据单色自动生成渐变色
  _darkenColor(rgb, factor) {
    const match = rgb.match(/(\d+)/g);
    if (!match || match.length < 3) return 'rgb(0,0,0)';
    const r = Math.round(parseInt(match[0]) * factor);
    const g = Math.round(parseInt(match[1]) * factor);
    const b = Math.round(parseInt(match[2]) * factor);
    return 'rgb(' + r + ',' + g + ',' + b + ')';
  }

  // ========== 天气动画 ==========
  _getWeatherType() {
    if (!this.config.weather_animation || !this.config.weather_entity || !this.hass) return null;
    const entity = this.hass.states[this.config.weather_entity];
    if (!entity) return null;
    // 无动画的天气状态
    const noAnimStates = ['晴', '多云', '少云', '晴间多云', '阴', '热', '冷', '未知', 'clear', 'cloudy', 'overcast', 'partlycloudy', 'partly_cloudy', 'mostly_cloudy', 'sunny', 'fair'];
    // 优先使用 condition_cn，排除无动画状态后回退到实体 state
    const rawState = entity.state || '';
    const cn = entity.attributes && entity.attributes.condition_cn ? entity.attributes.condition_cn : '';
    const state = (!noAnimStates.includes(cn) && cn) || (!noAnimStates.includes(rawState) && rawState) || '';

    const lightRain = ['小雨', '雨', '阵雨', '冻雨', '细雨', '小到中雨', 'light_rain', 'light rain', 'rainy', 'rain', 'showers', 'drizzle', 'freezing_rain'];
    const medRain = ['中雨', '强阵雨', '中到大雨', 'moderate_rain', 'moderate rain'];
    const heavyRain = ['大雨', '极端降雨', '暴雨', '大暴雨', '特大暴雨', '大到暴雨', '暴雨到大暴雨', '大暴雨到特大暴雨', 'pouring', 'heavy_rain', 'heavy rain', 'torrential_rain'];
    const lightSnow = ['小雪', '雪', '雨夹雪', '雨雪天气', '阵雨夹雪', '阵雪', '小到中雪', 'light_snow', 'light snow', 'snow', 'sleet', 'snowy_rainy', 'snowy-rainy'];
    const medSnow = ['中雪', '中到大雪', 'moderate_snow', 'moderate snow'];
    const heavySnow = ['大雪', '暴雪', '大到暴雪', 'heavy_snow', 'heavy snow'];
    const thunder = ['雷', '雷阵雨', '强雷阵雨', '雷阵雨伴冰雹', '雷雨', 'thunderstorm', 'lightning', 'lightning-rainy', 'thunderstorm_with_rain'];
    const hailStates = ['冰雹', 'hail'];
    const heavyDust = ['沙尘暴', '强沙尘暴', 'dust', 'sandstorm', 'duststorm'];
    const lightDust = ['沙尘', '扬沙', '浮尘'];
    const lightHaze = ['霾', 'haze'];
    const heavyHaze = ['中度霾', '重度霾', '严重霾'];
    const lightFog = ['薄雾', '雾', 'fog', 'mist'];
    const heavyFog = ['大雾', '浓雾', '强浓雾', '特强浓雾'];

    if (heavyHaze.includes(state)) return { type: 'haze', density: 'heavy', speed: 'slow', lightning: false };
    if (lightHaze.includes(state)) return { type: 'haze', density: 'light', speed: 'slow', lightning: false };
    if (heavyFog.includes(state)) return { type: 'fog', density: 'heavy', speed: 'slow', lightning: false };
    if (lightFog.includes(state)) return { type: 'fog', density: 'light', speed: 'slow', lightning: false };
    if (heavyDust.includes(state)) return { type: 'dust', density: 'heavy', speed: 'fast', lightning: false };
    if (lightDust.includes(state)) return { type: 'dust', density: 'light', speed: 'slow', lightning: false };
    if (hailStates.includes(state)) return { type: 'hail', density: 'heavy', speed: 'fast', lightning: false };
    if (thunder.includes(state)) return { type: 'rain', density: 'heavy', speed: 'fast', lightning: true };
    if (heavyRain.includes(state)) return { type: 'rain', density: 'heavy', speed: 'fast', lightning: false };
    if (medRain.includes(state)) return { type: 'rain', density: 'medium', speed: 'medium', lightning: false };
    if (lightRain.includes(state)) return { type: 'rain', density: 'light', speed: 'slow', lightning: false };
    if (heavySnow.includes(state)) return { type: 'snow', density: 'heavy', speed: 'fast', lightning: false };
    if (medSnow.includes(state)) return { type: 'snow', density: 'medium', speed: 'medium', lightning: false };
    if (lightSnow.includes(state)) return { type: 'snow', density: 'light', speed: 'slow', lightning: false };
    return null;
  }

  _getParticleParams(weatherConfig) {
    const rainDensityMap = { heavy: 100, medium: 60, light: 40 };
    const rainSpeedMap = { fast: 10, medium: 7, slow: 5 };
    const snowDensityMap = { heavy: 100, medium: 60, light: 30 };
    const snowSpeedMap = { fast: 2, medium: 1.2, slow: 0.8 };
    const hailDensityMap = { heavy: 60 };
    const hailSpeedMap = { fast: 12 };
    const dustDensityMap = { heavy: 150, medium: 80, light: 40 };
    const dustSpeedMap = { fast: 6, medium: 4, slow: 2 };
    const fogDensityMap = { heavy: 50, medium: 25, light: 35 };
    const fogSpeedMap = { slow: 0.8, medium: 1.2, fast: 1.8 };

    if (weatherConfig.type === 'rain') {
      return {
        count: rainDensityMap[weatherConfig.density],
        speed: rainSpeedMap[weatherConfig.speed],
        length: weatherConfig.speed === 'slow' ? 12 : weatherConfig.speed === 'medium' ? 18 : 25,
        type: 'rain'
      };
    } else if (weatherConfig.type === 'fog' || weatherConfig.type === 'haze') {
      return {
        count: fogDensityMap[weatherConfig.density],
        speed: fogSpeedMap[weatherConfig.speed],
        size: weatherConfig.density === 'heavy' ? 120 : weatherConfig.density === 'medium' ? 80 : 70,
        type: weatherConfig.type
      };
    } else if (weatherConfig.type === 'hail') {
      return {
        count: hailDensityMap[weatherConfig.density],
        speed: hailSpeedMap[weatherConfig.speed],
        size: 4,
        type: 'hail'
      };
    } else if (weatherConfig.type === 'dust') {
      return {
        count: dustDensityMap[weatherConfig.density],
        speed: dustSpeedMap[weatherConfig.speed],
        size: weatherConfig.speed === 'slow' ? 2 : weatherConfig.speed === 'medium' ? 3 : 5,
        type: 'dust'
      };
    } else {
      return {
        count: snowDensityMap[weatherConfig.density],
        speed: snowSpeedMap[weatherConfig.speed],
        size: weatherConfig.speed === 'slow' ? 1.5 : weatherConfig.speed === 'medium' ? 2.5 : 3.5,
        type: 'snow'
      };
    }
  }

  _createParticle(params, w, h) {
    if (params.type === 'rain') {
      return {
        x: Math.random() * w * 1.2 - w * 0.1,
        y: Math.random() * h,
        speed: params.speed + Math.random() * 4,
        length: params.length + Math.random() * 10,
        opacity: 0.2 + Math.random() * 0.4
      };
    } else if (params.type === 'hail') {
      return {
        x: Math.random() * w,
        y: Math.random() * h,
        speed: params.speed + Math.random() * 4,
        size: params.size + Math.random() * 3,
        opacity: 0.6 + Math.random() * 0.4,
        drift: (Math.random() - 0.5) * 2
      };
    } else if (params.type === 'dust') {
      return {
        x: Math.random() * w,
        y: Math.random() * h,
        speed: params.speed + Math.random() * 3,
        size: params.size + Math.random() * 3,
        opacity: 0.15 + Math.random() * 0.3,
        angle: Math.random() * Math.PI * 2,
        driftY: (Math.random() - 0.5) * 1.5
      };
    } else if (params.type === 'fog' || params.type === 'haze') {
      return {
        x: Math.random() * w,
        y: Math.random() * h,
        speed: params.speed + Math.random() * 0.3,
        size: params.size + Math.random() * 50,
        opacity: params.type === 'haze' ? (0.12 + Math.random() * 0.22) : (0.12 + Math.random() * 0.18),
        driftY: (Math.random() - 0.5) * 0.3,
        driftX: (Math.random() - 0.5) * 0.2
      };
    } else {
      return {
        x: Math.random() * w,
        y: Math.random() * h,
        speed: params.speed + Math.random() * 1.5,
        size: params.size + Math.random() * 2,
        opacity: 0.4 + Math.random() * 0.5,
        drift: (Math.random() - 0.5) * 1.5,
        angle: Math.random() * Math.PI * 2
      };
    }
  }

  _updateWeatherAnimation() {
    if (this.config.weather_animation && this.config.weather_entity) {
      if (!this._weatherAnimFrame) {
        requestAnimationFrame(() => this._startWeatherAnimation());
      }
    } else {
      this._stopWeatherAnimation();
    }
  }

  _startWeatherAnimation() {
    const canvas = this.shadowRoot.getElementById('weather-canvas');
    if (!canvas) {
      this._weatherAnimFrame = requestAnimationFrame(() => this._startWeatherAnimation());
      return;
    }
    const ctx = canvas.getContext('2d');

    const animate = () => {
      const rect = canvas.getBoundingClientRect();
      if (canvas.width !== rect.width || canvas.height !== rect.height) {
        canvas.width = rect.width;
        canvas.height = rect.height;
      }
      const w = canvas.width;
      const h = canvas.height;
      ctx.clearRect(0, 0, w, h);

      const weatherConfig = this._getWeatherType();
      if (weatherConfig) {
        const params = this._getParticleParams(weatherConfig);
        const typeKey = weatherConfig.type + '-' + weatherConfig.density;
        if (this._weatherParticlesType !== typeKey) {
          this._weatherParticlesType = typeKey;
          this._weatherParticles = [];
          for (let i = 0; i < params.count; i++) {
            this._weatherParticles.push(this._createParticle(params, w, h));
          }
          this._weatherLightning = {
            active: weatherConfig.lightning,
            opacity: 0,
            nextFlash: Date.now() + Math.random() * 5000 + 2000
          };
        }

        if (weatherConfig.type === 'rain') {
          this._drawRain(ctx, w, h, params);
        } else if (weatherConfig.type === 'hail') {
          this._drawHail(ctx, w, h, params);
        } else if (weatherConfig.type === 'dust') {
          this._drawDust(ctx, w, h, params);
        } else if (weatherConfig.type === 'fog') {
          this._drawFog(ctx, w, h, params);
        } else if (weatherConfig.type === 'haze') {
          this._drawHaze(ctx, w, h, params);
        } else {
          this._drawSnow(ctx, w, h, params);
        }
        if (this._weatherLightning.active) {
          this._drawLightningEffect(ctx, w, h);
        }
      } else {
        this._weatherParticles = [];
        this._weatherParticlesType = null;
      }

      this._weatherAnimFrame = requestAnimationFrame(animate);
    };
    this._weatherAnimFrame = requestAnimationFrame(animate);
  }

  _stopWeatherAnimation() {
    if (this._weatherAnimFrame) {
      cancelAnimationFrame(this._weatherAnimFrame);
      this._weatherAnimFrame = null;
    }
    this._weatherParticles = [];
    this._weatherParticlesType = null;
  }

  _drawRain(ctx, w, h, params) {
    for (const p of this._weatherParticles) {
      ctx.beginPath();
      ctx.moveTo(p.x, p.y);
      ctx.lineTo(p.x - p.length * 0.15, p.y + p.length);
      ctx.strokeStyle = `rgba(180, 210, 255, ${p.opacity})`;
      ctx.lineWidth = 1.5;
      ctx.stroke();

      p.y += p.speed;
      p.x -= p.speed * 0.15;

      if (p.y > h) {
        p.y = -p.length;
        p.x = Math.random() * w * 1.2 - w * 0.1;
      }
    }
  }

  _drawSnow(ctx, w, h, params) {
    for (const p of this._weatherParticles) {
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255, 255, 255, ${p.opacity})`;
      ctx.fill();

      p.y += p.speed;
      p.x += Math.sin(p.angle) * p.drift;
      p.angle += 0.01;

      if (p.y > h + p.size) {
        p.y = -p.size;
        p.x = Math.random() * w;
      }
      if (p.x > w + 10) p.x = -10;
      if (p.x < -10) p.x = w + 10;
    }
  }

  _drawHail(ctx, w, h, params) {
    for (const p of this._weatherParticles) {
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(220, 230, 255, ${p.opacity})`;
      ctx.fill();
      ctx.beginPath();
      ctx.arc(p.x - p.size * 0.25, p.y - p.size * 0.25, p.size * 0.35, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255, 255, 255, ${p.opacity * 0.6})`;
      ctx.fill();

      p.y += p.speed;
      p.x += p.drift;

      if (p.y > h + p.size) {
        p.y = -p.size * 2;
        p.x = Math.random() * w;
        p.drift = (Math.random() - 0.5) * 2;
      }
      if (p.x > w + 10) p.x = -10;
      if (p.x < -10) p.x = w + 10;
    }
  }

  _drawDust(ctx, w, h, params) {
    ctx.fillStyle = 'rgba(180, 140, 60, 0.08)';
    ctx.fillRect(0, 0, w, h);

    for (const p of this._weatherParticles) {
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(190, 150, 70, ${p.opacity})`;
      ctx.fill();
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * 1.8, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(180, 140, 60, ${p.opacity * 0.2})`;
      ctx.fill();

      p.x += p.speed;
      p.y += p.driftY + Math.sin(p.angle) * 0.5;
      p.angle += 0.02;

      if (p.x > w + p.size * 2) {
        p.x = -p.size * 2;
        p.y = Math.random() * h;
      }
      if (p.x < -p.size * 2) {
        p.x = w + p.size * 2;
      }
      if (p.y > h + 10) p.y = -10;
      if (p.y < -10) p.y = h + 10;
    }
  }

  _drawFog(ctx, w, h, params) {
    // 整体雾气底色
    ctx.fillStyle = 'rgba(200, 200, 210, 0.08)';
    ctx.fillRect(0, 0, w, h);

    for (const p of this._weatherParticles) {
      // 大范围径向渐变雾团
      const gradient = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size);
      gradient.addColorStop(0, `rgba(220, 220, 230, ${p.opacity})`);
      gradient.addColorStop(1, `rgba(220, 220, 230, 0)`);
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fillStyle = gradient;
      ctx.fill();

      // 缓慢向右移动
      p.x += p.speed;
      p.y += p.driftY;

      if (p.x > w + p.size) {
        p.x = -p.size;
        p.y = Math.random() * h;
      }
      if (p.x < -p.size) {
        p.x = w + p.size;
      }
      if (p.y > h + p.size) p.y = -p.size;
      if (p.y < -p.size) p.y = h + p.size;
    }
  }

  _drawHaze(ctx, w, h, params) {
    // 整体霾底色（沙黄色）
    ctx.fillStyle = 'rgba(180, 150, 80, 0.08)';
    ctx.fillRect(0, 0, w, h);

    for (const p of this._weatherParticles) {
      // 大范围径向渐变霾团（沙黄色）
      const gradient = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size);
      gradient.addColorStop(0, `rgba(200, 170, 90, ${p.opacity})`);
      gradient.addColorStop(1, `rgba(200, 170, 90, 0)`);
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fillStyle = gradient;
      ctx.fill();

      // 缓慢向右移动
      p.x += p.speed;
      p.y += p.driftY;

      if (p.x > w + p.size) {
        p.x = -p.size;
        p.y = Math.random() * h;
      }
      if (p.x < -p.size) {
        p.x = w + p.size;
      }
      if (p.y > h + p.size) p.y = -p.size;
      if (p.y < -p.size) p.y = h + p.size;
    }
  }

  _drawLightningEffect(ctx, w, h) {
    const now = Date.now();
    if (now > this._weatherLightning.nextFlash) {
      this._weatherLightning.opacity = 0.7 + Math.random() * 0.3;
      this._weatherLightning.nextFlash = now + Math.random() * 8000 + 3000;
    }
    if (this._weatherLightning.opacity > 0) {
      ctx.fillStyle = `rgba(255, 255, 255, ${this._weatherLightning.opacity})`;
      ctx.fillRect(0, 0, w, h);
      this._weatherLightning.opacity -= 0.04;
      if (this._weatherLightning.opacity < 0) this._weatherLightning.opacity = 0;
    }
  }

  render() {
    const theme = this._evaluateTheme();
    const autoColor = this.config.auto_color !== false;
    let bgColor = this.config.bg_color || 'rgb(150,70,70)';

    // light主题且开启自动变色时，根据时间偏移色相
    if (theme === 'light' && autoColor) {
      bgColor = this._shiftHue(bgColor, this._hueShift);
    }

    // dark主题时使用纯黑，light主题使用自动渐变
    let gradientStyle;
    let color2;
    if (theme === 'dark') {
      gradientStyle = 'rgb(0,0,0)';
      color2 = 'rgb(0,0,0)';
    } else {
      color2 = this._darkenColor(bgColor, 0.4);
      gradientStyle = `linear-gradient(to bottom right, ${bgColor} 20%, ${color2} 100%)`;
    }
    // 注册全局 background() 函数，供子卡片（如 button-card）获取渐变色2
    window.background = () => this._darkenColor(bgColor, 0.75);
    
    // 多楼层数据
    const multiFloor = this.config.enable_multi_floor === true && this.config.floors && this.config.floors.length > 0;
    const floorData = multiFloor ? this._getCurrentFloorData() : null;
    const bgImage = multiFloor && floorData ? (floorData.background_image || '') : (this.config.background_image || '');
    if (multiFloor && floorData) {
      window.floor = () => (floorData.id || '');
      window.dispatchEvent(new CustomEvent('floor-changed'));
    }
    const lightButtons = multiFloor && floorData ? (floorData.light_buttons || []) : (this.config.light_buttons || []);
    const personIcons = multiFloor && floorData ? (floorData.person_icons || []) : (this.config.person_icons || []);
    const deviceGlows = multiFloor && floorData ? (floorData.device_glows || []) : (this.config.device_glows || []);
    const deviceIcons = multiFloor && floorData ? (floorData.device_icons || []) : (this.config.device_icons || []);
    const floors = multiFloor ? this.config.floors : [];

    const mode = this.config ? this.config.theme : 'sun';
    // 黑主题：白透明背景；白主题：黑透明背景
    const btnBg = theme === 'dark' ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.3)';
    // 图标根据当前主题状态：自动→theme-light-dark，白→weather-sunny，黑→weather-night
    const isAuto = mode === 'sun' && this._themeOverride === null;
    const themeBtnIcon = isAuto ? 'mdi:theme-light-dark' : (theme === 'dark' ? 'mdi:weather-night' : 'mdi:weather-sunny');
    const themeBtnColor = isAuto ? '#FF9800' : '#fff';

    return html`
      <div class="container"
        style="width: ${this.config.width}; height: ${this.config.height}; background: ${gradientStyle};"
        @pointerdown="${this._onContainerPointerDown}"
        @pointerup="${this._onContainerPointerUp}"
        @pointerleave="${this._onContainerPointerLeave}">
        ${bgImage ? html`<div class="bg-image" style="background-image: url('${bgImage}');"></div>` : ''}
        ${this.config.weather_animation ? html`<canvas id="weather-canvas" class="weather-canvas"></canvas>` : ''}
        ${this._getFloorScopedArray('device_glows').map(item => {
          const glowStyle = this._computeDeviceGlowStyle(item);
          if (!glowStyle) return '';
          return html`<div class="device-glow" style="top: ${item.top || '100px'}; left: ${item.left || '100px'}; width: ${item.width || '200px'}; height: ${item.height || '200px'}; background: ${glowStyle};"></div>`;
        })}
        ${this._renderLightButtons()}
        ${this._renderPersonIcons()}
        ${this._renderDeviceIcons()}
        <div class="btn-area" style="left: ${this.config.btn_area_left || '20px'};">
          <button class="ctrl-btn" style="color: #fff; --btn-bg: ${btnBg}" @click="${this._handleFullscreen}" title="全屏切换">
            <ha-icon icon="${this._kioskOn ? 'mdi:fullscreen-exit' : 'mdi:fullscreen'}"></ha-icon>
          </button>
          <button class="ctrl-btn" style="color: ${themeBtnColor}; --btn-bg: ${btnBg}" @click="${this._toggleTheme}" title="切换主题">
            <ha-icon icon="${themeBtnIcon}"></ha-icon>
          </button>
        ${multiFloor ? html`
          ${floors.map((f, i) => html`
            <button class="ctrl-btn" style="color: #fff; --btn-bg: ${i === this._currentFloorIdx ? 'rgba(3,169,244,0.6)' : btnBg}; font-size:12px; width:auto; padding:0 12px; min-width: 40px;" @click="${() => this._switchFloor(i)}" title="${f.name || ''}">
              ${f.name || ('楼层'+(i+1))}
            </button>
          `)}
        </div>
        ` : ''}

      </div> 
    `;
  }

  getCardSize() {
    return 1;
  }

  // ========== 人在历史记录（参照room-card） ==========
  _togglePersonHistory(item) {
    if (!item || !item.entity) return;
    this._handleHaptic();
    if (this._showHistory) {
      this._closeHistoryOverlay();
      return;
    }
    this._showHistory = true;
    this._historyPersonItem = item;
    this._showHistoryOverlay(item);
    this._fetchPersonHistory(item);
  }

  async _fetchPersonHistory(item) {
    try {
      const entityId = item.entity;
      const periodHours = this._historyFilterPeriod || 24;
      const endTime = new Date();
      const startTime = new Date(endTime.getTime() - periodHours * 60 * 60 * 1000);
      const startStr = startTime.toISOString();
      const endStr = endTime.toISOString();

      const data = await this.hass.callApi(
        'GET',
        `history/period/${startStr}?end_time=${endStr}&filter_entity_id=${entityId}&minimal_response&no_attributes`
      );

      const result = {};
      const allEntities = Array.isArray(data) ? data : [];
      for (const entityHistory of allEntities) {
        if (!entityHistory || entityHistory.length === 0) continue;
        const eId = entityHistory[0].entity_id;
        if (!eId) continue;
        const stateObj = this.hass.states[eId];
        const friendlyName = stateObj?.attributes?.friendly_name || eId;
        const rawEntries = entityHistory
          .filter(entry => entry && entry.last_changed)
          .sort((a, b) => new Date(b.last_changed) - new Date(a.last_changed));
        const entries = [];
        for (const entry of rawEntries) {
          const last = entries[entries.length - 1];
          const curRaw = (entry.state || '').trim();
          const lastRaw = last ? (last.state || '').trim() : null;
          if (last && lastRaw === curRaw) {
            entries[entries.length - 1] = entry;
          } else {
            entries.push(entry);
          }
        }
        if (entries.length > 0) {
          result[eId] = { name: friendlyName, entries: entries };
        }
      }
      this._historyData = result;
    } catch (e) {
      console.error('[XiaoshiPadCard] 获取人在历史记录失败:', e);
      this._historyData = {};
    } finally {
      this._historyLoading = false;
      this._updateHistoryContent();
    }
  }

  _showHistoryOverlay(item) {
    if (this._historyOverlayEl) return;
    const theme = this._evaluateTheme();
    const isDark = theme === 'dark';
    const personEntity = item.entity;
    const stateObj = this.hass?.states?.[personEntity];
    const personName = stateObj?.attributes?.friendly_name || personEntity || '人在传感器';
    const textColor = isDark ? '#fff' : '#333';
    const bgColor = isDark ? '#2c2c2c' : '#fff';
    const borderColor = isDark ? '#aaa' : '#888';
    const btnBg = isDark ? '#444' : '#f0f0f0';
    const btnIconColor = isDark ? '#ccc' : '#666';
    const chipBg = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)';
    const chipActiveBg = item.color || 'rgb(255,87,34)';
    const chipActiveColor = '#fff';

    this._historyFilterPeriod = 24;

    const overlay = document.createElement('div');
    overlay.className = 'xiaoshi-history-overlay';
    overlay.style.cssText = 'position:fixed;top:0;left:0;width:100vw;height:100vh;background:rgba(0,0,0,0.5);z-index:99999;display:flex;align-items:flex-start;justify-content:center;padding-top:20px;-webkit-backdrop-filter: blur(10px);backdrop-filter: blur(10px);';
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) this._closeHistoryOverlay();
    });

    const dialog = document.createElement('div');
    dialog.style.cssText = `background:${bgColor};border-radius:16px;width:95vw;max-width:500px;max-height:85vh;display:flex;flex-direction:column;box-shadow:0 8px 40px rgba(0,0,0,0.25);`;

    const header = document.createElement('div');
    header.style.cssText = `display:flex;justify-content:space-between;align-items:center;padding:10px 0;margin:0 20px;border-bottom:1px solid ${borderColor};`;
    const title = document.createElement('span');
    title.style.cssText = `font-size:1.1rem;font-weight:700;color:${textColor};`;
    title.textContent = `${personName} - 历史记录`;
    const closeBtn = document.createElement('button');
    closeBtn.style.cssText = `width:36px;height:36px;border-radius:50%;border:none;background:${btnBg};cursor:pointer;display:flex;align-items:center;justify-content:center;transition:opacity 0.2s,transform 0.2s;`;
    closeBtn.innerHTML = `<ha-icon icon="mdi:close" style="--mdc-icon-size:20px;color:${btnIconColor};"></ha-icon>`;
    closeBtn.addEventListener('click', () => this._closeHistoryOverlay());
    closeBtn.addEventListener('mouseenter', () => { closeBtn.style.opacity = '0.85'; closeBtn.style.transform = 'scale(1.05)'; });
    closeBtn.addEventListener('mouseleave', () => { closeBtn.style.opacity = '1'; closeBtn.style.transform = 'scale(1)'; });
    header.appendChild(title);
    header.appendChild(closeBtn);

    const toolbar = document.createElement('div');
    toolbar.className = 'xiaoshi-history-toolbar';
    toolbar.style.cssText = `display:flex;align-items:center;gap:8px;padding:10px 5px;margin:0 20px;border-bottom:1px solid ${borderColor};flex-wrap:wrap;`;

    const timeRow = document.createElement('div');
    timeRow.style.cssText = 'display:flex;align-items:center;gap:8px;';
    const timeLabel = document.createElement('span');
    timeLabel.style.cssText = `font-size:0.75rem;color:${isDark?'#aaa':'#888'};flex-shrink:0;`;
    timeLabel.textContent = '时段:';
    timeRow.appendChild(timeLabel);

    const timeChips = document.createElement('div');
    timeChips.style.cssText = 'display:flex;gap:4px;flex-wrap:wrap;';
    timeChips.className = 'xiaoshi-time-chips';
    const periods = [
      { label: '1小时', value: 1 },
      { label: '6小时', value: 6 },
      { label: '24小时', value: 24 },
      { label: '3天', value: 72 },
      { label: '7天', value: 168 },
      { label: '10天', value: 240 }
    ];
    for (const p of periods) {
      const chip = this._buildFilterChip(p.label, p.value, chipBg, chipActiveBg, chipActiveColor, isDark);
      chip.addEventListener('click', () => {
        this._handleHaptic();
        this._historyFilterPeriod = p.value;
        this._refreshHistoryChips(timeChips, this._historyFilterPeriod, chipBg, chipActiveBg, chipActiveColor, isDark, 'time');
        this._refetchWithFilters(item);
      });
      timeChips.appendChild(chip);
    }
    timeRow.appendChild(timeChips);
    toolbar.appendChild(timeRow);

    const body = document.createElement('div');
    body.className = 'xiaoshi-history-body';
    body.style.cssText = 'flex:1;overflow-y:auto;padding:6px 20px;';
    body.innerHTML = `<div style="display:flex;align-items:center;justify-content:center;padding:40px;color:${isDark?'#aaa':'#999'};"><ha-icon icon="mdi:loading" style="--mdc-icon-size:24px;"></ha-icon>&nbsp;加载中...</div>`;

    dialog.appendChild(header);
    dialog.appendChild(toolbar);
    dialog.appendChild(body);
    overlay.appendChild(dialog);
    document.body.appendChild(overlay);

    this._historyOverlayEl = overlay;
    this._historyBodyEl = body;
  }

  _updateHistoryContent() {
    if (!this._historyBodyEl) return;
    const theme = this._evaluateTheme();
    const isDark = theme === 'dark';
    const item = this._historyPersonItem;
    const ac = item ? (item.color || 'rgb(255,87,34)') : 'rgb(255,87,34)';

    if (this._historyLoading) {
      this._historyBodyEl.innerHTML = `<div style="display:flex;align-items:center;justify-content:center;padding:40px;color:${isDark?'#aaa':'#999'};"><ha-icon icon="mdi:loading" style="--mdc-icon-size:24px;"></ha-icon>&nbsp;加载中...</div>`;
      return;
    }

    const entries = Object.entries(this._historyData);
    if (entries.length === 0) {
      this._historyBodyEl.innerHTML = `<div style="text-align:center;padding:40px;color:${isDark?'#aaa':'#999'};font-size:0.9rem;">暂无历史记录</div>`;
      return;
    }

    let html = '';
    for (const [entityId, data] of entries) {
      const stateObj = this.hass.states[entityId];
      const icon = stateObj?.attributes?.icon || 'mdi:motion-sensor';

      let onTimeMs = 0;
      let offTimeMs = 0;
      const dedupedEntries = [];
      for (const entry of data.entries) {
        const last = dedupedEntries[dedupedEntries.length - 1];
        const curRaw = (entry.state || '').trim();
        const lastRaw = last ? (last.state || '').trim() : null;
        if (last && lastRaw === curRaw) {
          dedupedEntries[dedupedEntries.length - 1] = entry;
        } else {
          dedupedEntries.push(entry);
        }
      }
      const entriesWithDuration = [];
      for (let i = 0; i < dedupedEntries.length; i++) {
        const entry = dedupedEntries[i];
        const time = new Date(entry.last_changed);
        const prevEntry = dedupedEntries[i - 1];
        const endTime = prevEntry ? new Date(prevEntry.last_changed) : new Date();
        const durationMs = Math.max(0, endTime - time);
        entriesWithDuration.push({ entry, time, durationMs });
      }

      const preFiltered = [];
      for (const entryItem of entriesWithDuration) {
        const norm = this._normalizePersonState(entryItem.entry.state);
        if (norm === 'offline' && entryItem.durationMs < 60000) continue;
        preFiltered.push(entryItem);
      }
      const filtered = [];
      onTimeMs = 0; offTimeMs = 0;
      for (const entryItem of preFiltered) {
        const last = filtered[filtered.length - 1];
        const curNorm = this._normalizePersonState(entryItem.entry.state);
        const lastNorm = last ? this._normalizePersonState(last.entry.state) : null;
        if (last && lastNorm === curNorm) {
          last.durationMs += entryItem.durationMs;
          last.time = entryItem.time;
        } else {
          filtered.push({ ...entryItem });
        }
      }
      for (const entryItem of filtered) {
        if (this._normalizePersonState(entryItem.entry.state) === 'present') {
          onTimeMs += entryItem.durationMs;
        } else {
          offTimeMs += entryItem.durationMs;
        }
      }

      const totalMs = onTimeMs + offTimeMs;
      const onPercent = totalMs > 0 ? Math.round(onTimeMs / totalMs * 100) : 0;
      const offPercent = totalMs > 0 ? Math.round(offTimeMs / totalMs * 100) : 0;

      html += `<div style="margin:8px 0px;border-bottom:1px solid ${isDark?'#aaa':'#888'};">`;
      const periodHours = this._historyFilterPeriod || 24;
      const now = new Date();
      const rangeStart = new Date(now.getTime() - periodHours * 60 * 60 * 1000);
      const timelineBlocks = this._buildPersonTimeline(data.entries, rangeStart, now);
      html += `<div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;">`;
      html += `<span style="display:flex;align-items:center;gap:4px;font-weight:700;font-size:0.85rem;color:${isDark?'#ddd':'#444'};white-space:nowrap;"><ha-icon icon="${icon}" style="--mdc-icon-size:16px;color:${ac};"></ha-icon>${data.name}</span>`;
      html += `<span style="font-size:0.7rem;color:${ac};white-space:nowrap;">${onPercent}%</span>`;
      html += `<span style="font-size:0.7rem;color:${isDark?'#aaa':'#888'};white-space:nowrap;">${offPercent}%</span>`;
      html += `<div style="flex:1;display:flex;height:8px;border-radius:3px;overflow:hidden;">${timelineBlocks}</div>`;
      html += `</div>`;
      for (const { entry, time, durationMs } of filtered) {
        const timeStr = time.toLocaleString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });
        const rawState = (entry.state || '').trim();
        const normState = this._normalizePersonState(rawState);
        const isPresent = normState === 'present';
        const isOffline = rawState === 'unavailable' || rawState === 'unknown';
        const stateLabel = isPresent ? '有人' : (isOffline ? '已离线' : '无人');
        const stateColor = this._getPersonStateColor(rawState);
        const durationStr = this._formatHistoryDuration(durationMs);
        const scRgb = this._colorToRgb(stateColor);
        const entryBg = isPresent ? (isDark ? `rgba(${scRgb},0.12)` : `rgba(${scRgb},0.08)`) : (isOffline ? (isDark ? 'rgba(244,67,54,0.12)' : 'rgba(244,67,54,0.06)') : (isDark ? '#383838' : '#f5f5f5'));
        html += `<div style="border-radius:10px;padding:1px 12px;margin-bottom:8px;background:${entryBg};"><div style="display:flex;justify-content:space-between;align-items:center;"><span style="font-size:0.8rem;padding:2px 4px;border-radius:10px;font-weight:500;color:${stateColor};">${stateLabel} · ${durationStr}</span><span style="font-size:0.75rem;color:${isDark?'#aaa':'#999'};">${timeStr}</span></div></div>`;
      }
      html += `</div>`;
    }
    this._historyBodyEl.innerHTML = html;
  }

  _closeHistoryOverlay() {
    this._handleHaptic();
    if (this._historyOverlayEl) {
      this._historyOverlayEl.remove();
      this._historyOverlayEl = null;
      this._historyBodyEl = null;
    }
    this._showHistory = false;
    this._historyData = {};
    this._historyLoading = false;
    this._historyFilterPeriod = 24;
    this._historyPersonItem = null;
  }

  _normalizePersonState(state) {
    const s = (state || '').trim().toLowerCase();
    if (s === 'unavailable' || s === 'unknown') return 'offline';
    const item = this._historyPersonItem;
    const conditions = item ? this._getPersonConditions(item) : PRESET_ON_STATES.map(s => s.toLowerCase());
    if (conditions.some(c => s.includes(c) || c.includes(s))) return 'present';
    return 'absent';
  }

  _getPersonStateColor(state) {
    const s = (state || '').trim().toLowerCase();
    const item = this._historyPersonItem;
    const ac = item ? (item.color || 'rgb(255,87,34)') : 'rgb(255,87,34)';
    if (s === 'unavailable' || s === 'unknown') return '#f44336';
    const conditions = item ? this._getPersonConditions(item) : PRESET_ON_STATES.map(s => s.toLowerCase());
    if (conditions.some(c => s.includes(c) || c.includes(s))) return ac;
    return '#999';
  }

  _colorToRgb(color) {
    if (!color) return '255,87,34';
    if (color.startsWith('#')) {
      const hex = color.replace('#', '');
      const r = parseInt(hex.substring(0, 2), 16);
      const g = parseInt(hex.substring(2, 4), 16);
      const b = parseInt(hex.substring(4, 6), 16);
      if (isNaN(r) || isNaN(g) || isNaN(b)) return '255,87,34';
      return `${r},${g},${b}`;
    }
    const nums = color.match(/\d+/g);
    if (nums && nums.length >= 3) return `${nums[0]},${nums[1]},${nums[2]}`;
    return '255,87,34';
  }

  _buildPersonTimeline(entries, rangeStart, rangeEnd) {
    const rangeMs = rangeEnd - rangeStart;
    if (rangeMs <= 0 || entries.length === 0) return '';
    const sorted = [...entries].sort((a, b) => new Date(a.last_changed) - new Date(b.last_changed));
    const filtered = [];
    for (let i = 0; i < sorted.length; i++) {
      const entry = sorted[i];
      const segStart = new Date(entry.last_changed);
      const segEnd = i + 1 < sorted.length ? new Date(sorted[i + 1].last_changed) : rangeEnd;
      const durationMs = segEnd - segStart;
      const norm = this._normalizePersonState(entry.state);
      if (norm === 'offline' && durationMs < 60000) continue;
      filtered.push(entry);
    }
    const segments = [];
    for (let i = 0; i < filtered.length; i++) {
      const entry = filtered[i];
      const segStart = new Date(entry.last_changed);
      const segEnd = i + 1 < filtered.length ? new Date(filtered[i + 1].last_changed) : rangeEnd;
      const visibleStart = segStart < rangeStart ? rangeStart : segStart;
      const visibleEnd = segEnd > rangeEnd ? rangeEnd : segEnd;
      const durationMs = visibleEnd - visibleStart;
      if (durationMs > 0) {
        const rawState = (entry.state || '').trim();
        const percent = (durationMs / rangeMs) * 100;
        const lastSeg = segments[segments.length - 1];
        if (lastSeg && lastSeg.state === rawState) {
          lastSeg.percent += percent;
        } else {
          segments.push({ state: rawState, percent });
        }
      }
    }
    let blocks = '';
    for (const seg of segments) {
      const color = this._getPersonStateColor(seg.state);
      blocks += `<div style="width:${seg.percent}%;min-width:1px;height:100%;background:${color};flex-shrink:0;"></div>`;
    }
    return blocks;
  }

  _formatHistoryDuration(ms) {
    const periodHours = this._historyFilterPeriod || 24;
    const periodMs = periodHours * 60 * 60 * 1000;
    if (ms < 60000) return '少于1分钟';
    if (ms >= periodMs) {
      if (periodHours < 24) return `大于${periodHours}小时`;
      if (periodHours < 72) return `大于${periodHours}小时`;
      const days = Math.floor(periodHours / 24);
      return `大于${days}天`;
    }
    const minutes = Math.floor(ms / 60000);
    if (minutes < 60) return `${minutes}分钟`;
    const hours = Math.floor(minutes / 60);
    const remainMin = minutes % 60;
    if (hours < 24) return remainMin > 0 ? `${hours}小时${remainMin}分钟` : `${hours}小时`;
    const days = Math.floor(hours / 24);
    const remainHr = hours % 24;
    return remainHr > 0 ? `${days}天${remainHr}小时` : `${days}天`;
  }

  _buildFilterChip(label, value, chipBg, activeBg, activeColor, isDark) {
    const chip = document.createElement('span');
    chip.setAttribute('data-chip', '1');
    const isActive = (typeof value === 'number' && value === this._historyFilterPeriod);
    if (isActive) {
      chip.style.cssText = `padding:3px 10px;border-radius:12px;font-size:0.72rem;font-weight:500;cursor:pointer;white-space:nowrap;transition:opacity 0.2s,transform 0.2s;background:${activeBg};color:${activeColor};`;
    } else {
      chip.style.cssText = `padding:3px 10px;border-radius:12px;font-size:0.72rem;font-weight:500;cursor:pointer;white-space:nowrap;transition:opacity 0.2s,transform 0.2s;background:${chipBg};color:${isDark?'#ccc':'#555'};`;
    }
    chip.textContent = label;
    chip.addEventListener('mouseenter', () => { chip.style.opacity = '0.85'; chip.style.transform = 'scale(1.05)'; });
    chip.addEventListener('mouseleave', () => { chip.style.opacity = '1'; chip.style.transform = 'scale(1)'; });
    return chip;
  }

  _refreshHistoryChips(container, activePeriod, chipBg, activeBg, activeColor, isDark, mode) {
    const chips = container.querySelectorAll('[data-chip]');
    chips.forEach(chip => {
      const label = chip.textContent;
      if (mode === 'time') {
        const isActive = (label === '24小时' && activePeriod === 24) ||
          (label === '1小时' && activePeriod === 1) ||
          (label === '6小时' && activePeriod === 6) ||
          (label === '3天' && activePeriod === 72) ||
          (label === '7天' && activePeriod === 168) ||
          (label === '10天' && activePeriod === 240);
        if (isActive) {
          chip.style.background = activeBg;
          chip.style.color = activeColor;
        } else {
          chip.style.background = chipBg;
          chip.style.color = isDark ? '#ccc' : '#555';
        }
      }
    });
  }

  _refetchWithFilters(item) {
    this._historyLoading = true;
    this._historyData = {};
    if (this._historyBodyEl) {
      this._updateHistoryContent();
    }
    this._fetchPersonHistory(item);
  }
}
customElements.define('xiaoshi-pad-card', XiaoshiPadCard);