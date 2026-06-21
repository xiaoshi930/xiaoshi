const whenDefined = (t) => customElements.whenDefined(t);
await Promise.race([whenDefined("ha-card"), whenDefined("ha-panel-lovelace")]);
const LitElement = window.LitElement || Object.getPrototypeOf(customElements.get("ha-card"));
const html = LitElement.prototype.html;
const css = LitElement.prototype.css;
// ==================== 注册自定义卡片 ====================
window.customCards = window.customCards || [];
window.customCards.push({
    type: 'xiaoshi-pve-card',
    name: '消逝卡-PVE卡片',
    description: '消逝卡PVE卡片',
    preview: true
});

// ==================== 已知的 ProxmoxVE 实体 key ====================
const KEY_CPU_USAGE = 'cpu_usage';
const KEY_VM_CPU_USAGE = 'vm_cpu_usage';
const KEY_MEM_USAGE = 'mem_usage';
const KEY_VM_MEM_USAGE = 'vm_mem_usage';
const KEY_NODE_CPU_USAGE = 'node_cpu_usage';
const KEY_NODE_MEM_USAGE = 'node_mem_usage';
const KEY_DISK_USAGE = 'disk_usage';
const KEY_UPTIME = 'uptime';
const KEY_CPU_TEMP = 'cpu_temperature';
const KEY_MB_TEMP = 'motherboard_temperature';
const KEY_NVME_TEMP = 'nvme_temperature';
const KEY_DISK_TEMP = 'disk_temperature';
const KEY_NETIN = 'netin';
const KEY_NETOUT = 'netout';
const KEY_SHUTDOWN = 'shutdown';
const KEY_REBOOT = 'reboot';
const KEY_RESET = 'reset';
const KEY_SUSPEND = 'suspend';
const KEY_VM_POWER = 'vm_power';

// 按钮类实体 -> 只在电源按钮区显示，不渲染为普通卡片
const BUTTON_KEYS = new Set([KEY_SHUTDOWN, KEY_REBOOT, KEY_RESET, KEY_SUSPEND, KEY_VM_POWER]);

// ==================== 编辑器 ====================
class XiaoshiPVECardEditor extends LitElement {
    static get properties() {
        return { hass: { type: Object }, config: { type: Object } };
    }
    static get styles() {
        return css`
            .form { display:flex; flex-direction:column; gap:10px; min-height:200px; }
            .form-group { display:flex; flex-direction:column; gap:5px; }
            label { font-weight:bold; }
            select, input { padding:8px; border:1px solid #ddd; border-radius:4px; }
        `;
    }
    setConfig(config) { this.config = config; }
    _fireConfigChanged() {
        this.dispatchEvent(new CustomEvent('config-changed', {
            detail: { config: this.config }, bubbles: true, composed: true
        }));
    }
    _valueChanged(e) {
        const { name, value } = e.target;
        // theme 为空时保留空值；card_width 清空时回退为 '100%'
        if (!value && name !== 'theme') {
            if (name === 'card_width') {
                this.config = { ...this.config, card_width: '100%' };
                this._fireConfigChanged();
            }
            return;
        }
        this.config = { ...this.config, [name]: value };
        this._fireConfigChanged();
    }
    render() {
        if (!this.hass) return html``;
        const c = this.config || {};
        return html`
            <div class="form">
                <div class="form-group">
                    <label>卡片标题</label>
                    <input type="text" name="name"
                        .value="${c.name || 'ProxmoxVE'}"
                        @change="${this._valueChanged}"
                        placeholder="ProxmoxVE" />
                </div>
                <div class="form-group">
                    <label>卡片宽度 (默认100%)</label>
                    <input type="text" name="card_width"
                        .value="${c.card_width || '100%'}"
                        @change="${this._valueChanged}"
                        placeholder="100%" />
                </div>
                <div class="form-group">
                    <label>虚拟机类型</label>
                    <select name="vm_type" @change="${this._valueChanged}">
                        <option value="proxmoxve" .selected="${c.vm_type === 'proxmoxve' || !c.vm_type}">ProxmoxVE</option>
                        <option value="esxi" .selected="${c.vm_type === 'esxi'}">ESXi</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>主题</label>
                    <select name="theme" @change="${this._valueChanged}">
                        <option value="system" .selected="${c.theme === 'system' || !c.theme}">跟随系统</option>
                        <option value="light" .selected="${c.theme === 'light'}">亮色</option>
                        <option value="dark" .selected="${c.theme === 'dark'}">暗色</option>
                        <option value="sun" .selected="${c.theme === 'sun'}">日出日落</option>
                        <option value="function" .selected="${c.theme === 'function'}">跟随函数</option>
                    </select>
                </div>
            </div>
        `;
    }
}
customElements.define('xiaoshi-pve-card-editor', XiaoshiPVECardEditor);

// ==================== 主卡片 ====================
class XiaoshiPVECard extends LitElement {
    static get properties() {
        return { hass: { type: Object }, config: { type: Object }, theme: { type: String } };
    }

    static get styles() {
        return css`
            :host { display:block; width:var(--card-width, 100%); }
            ha-card {
                width:100%; height:100%; display:flex; flex-direction:column;
                background:var(--bg-color, #fff); border-radius:12px; border:none;
            }
            .card-header {
                display:flex; justify-content:space-between; align-items:center;
                padding:8px 16px 2px 16px; background:var(--bg-color, #fff); border-radius:12px;
            }
            .card-title { font-size:18px; font-weight:500; color:var(--fg-color, #000); }
            .entity-count {
                color:var(--fg-color, #000); border-radius:8px; font-size:13px;
                padding:2px 8px; background:rgba(0,200,200,0.3);
            }
            .devices-wrap { flex:1; overflow-y:auto; padding:8px 12px; }

            /* --- 设备容器 --- */
            .device-card {
                background:var(--device-card-bg); border-radius:10px;
                margin-bottom:10px; overflow:hidden;
                border:1px solid var(--device-border, rgba(150,150,150,0.25));
            }
            .device-header {
                display:flex; align-items:center; gap:8px;
                padding:6px 12px; font-size:14px; font-weight:500;
                color:var(--fg-color, #000);
                border-bottom:1px solid rgba(150,150,150,0.2);
            }
            .device-title { flex:1; }
            .device-status {
                font-size:10px; padding:1px 8px; border-radius:10px; color:#fff;
            }
            .status-running { background:#4CAF50; }
            .status-stopped { background:#888; }
            .status-paused { background:#FF9800; }

            /* --- 两列网格 --- */
            .cards-row {
                display:flex; flex-wrap:wrap; gap:6px; padding:8px;
            }
            .cards-row > .info-card { flex:1 1 calc(50% - 3px); min-width:0; }

            /* --- 信息卡片 --- */
            .info-card {
                background:var(--card-bg); border-radius:8px; padding:3px 6px;
                box-sizing:border-box; position:relative; overflow:hidden;
            }
            .info-header {
                display:flex; align-items:center; justify-content:space-between;
                gap:3px; font-size:10px; font-weight:bold;
            }
            .info-header-left { display:flex; align-items:center; gap:3px; white-space:nowrap; overflow:hidden; min-width:0; }
            .info-value { font-size:12px; font-weight:bold; white-space:nowrap; flex-shrink:0; }
            .info-sub { font-size:9px; opacity:0.6; margin-top:2px; }
            .info-chart-container {
                width:100%; height:30px; margin-bottom:-2px; overflow:hidden; pointer-events:none;
            }
            .chart-toggle {
                font-size:10px; opacity:0.5; cursor:pointer; border:none;
                background:none; color:var(--fg-color, #000); padding:1px 4px;
                border-radius:4px; flex-shrink:0;
            }
            .chart-toggle:hover { opacity:0.8; }
            .chart-toggle.on { opacity:1; font-weight:bold; color:#00BCD4; }

            /* --- 按钮 --- */
            .power-btns {
                display:flex; gap:6px; padding:0 8px 8px 8px;
            }
            .power-btn {
                flex:1; height:28px; border:none; border-radius:8px;
                font-size:11px; font-weight:bold; cursor:pointer;
                display:flex; align-items:center; justify-content:center; gap:2px;
                transition:all 0.2s ease; color:#fff;
                white-space:nowrap; overflow:hidden;
            }
            .power-btn:active { transform:scale(0.96); opacity:0.85; }
            .power-btn ha-icon { --mdc-icon-size:14px; }
            .btn-shutdown { background:#f44336; }
            .btn-reboot { background:#2196F3; }
            .btn-reset { background:#9C27B0; }
            .btn-suspend { background:#FF9800; }
            .btn-on { background:#4CAF50; }
            .btn-off { background:#f44336; }
            .btn-confirm {
                animation: confirmPulse 0.6s ease-in-out infinite alternate;
            }
            @keyframes confirmPulse {
                from { opacity:1; transform:scale(1); }
                to   { opacity:0.7; transform:scale(1.05); }
            }

            .no-data { text-align:center; padding:20px; color:var(--sub-color, #888); font-size:13px; }
            .loading { text-align:center; padding:20px; color:var(--sub-color, #888); }
        `;
    }

    constructor() {
        super();
        this.config = {};
        // chart history: { entity_id: [values...] }
        this._chartData = {};
        this._entities = [];
        // 二次确认: { entityId, action, timeoutId }
        this._confirmState = null;
        this._loading = false;
        this._showCharts = {};   // 按 device_id 控制曲线显示
    }

    static getConfigElement() {
        return document.createElement("xiaoshi-pve-card-editor");
    }

    setConfig(config) {
        this.config = { ...config };
        if (config.theme) this.setAttribute('theme', config.theme);
    }

    getCardSize() {
        const devs = this._groupByDevice(this._getPVEEntities());
        return Math.max(4, devs.length * 5);
    }

    // ===== 主题 =====
    _evaluateTheme() {
        try {
            const mode = this.config ? this.config.theme : 'system';
            if (mode === 'light') return 'light';
            if (mode === 'dark') return 'dark';
            if (mode === 'system' || !mode) {
                if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) return 'dark';
                return 'light';
            }
            if (mode === 'sun') {
                const sunState = this.hass && this.hass.states && this.hass.states['sun.sun'];
                if (sunState && sunState.state === 'above_horizon') return 'light';
                if (sunState && sunState.state === 'below_horizon') return 'dark';
                return 'light';
            }
            if (mode === 'function' || (typeof mode === 'string' && mode.includes('theme'))) {
                if (typeof window.theme === 'function') return window.theme() || 'light';
                return 'light';
            }
            return mode;
        } catch (e) { return 'light'; }
    }

    // ===== 值获取 =====
    _getNum(entityId) {
        if (!entityId || !this.hass.states[entityId]) return undefined;
        const s = this.hass.states[entityId].state;
        if (s === 'unknown' || s === 'unavailable') return undefined;
        const v = parseFloat(s);
        return isNaN(v) ? undefined : v;
    }

    _getState(entityId) {
        if (!entityId || !this.hass.states[entityId]) return '';
        const s = this.hass.states[entityId].state;
        return (s === 'unknown' || s === 'unavailable') ? '' : s;
    }

    // ===== 分类实体 key =====
    _classifyEntity(entityId) {
        // 按 suffix 匹配已知 key
        const id = entityId.split('.')[1] || entityId;
        // 按钮开关按名称匹配
        if (id.includes('_shutdown')) return KEY_SHUTDOWN;
        if (id.includes('_reboot') && !id.includes('_reboot_')) return KEY_REBOOT;
        if (id.includes('_reset')) return KEY_RESET;
        if (id.includes('_suspend')) return KEY_SUSPEND;
        if (id.includes('_vm_power') || id.endsWith('_power')) return KEY_VM_POWER;
        // 温度
        if (id.includes('_nvme_temperature')) return KEY_NVME_TEMP;
        if (id.includes('_motherboard_temperature')) return KEY_MB_TEMP;
        if (id.includes('_cpu_temperature')) return KEY_CPU_TEMP;
        if (id.includes('_disk_temperature')) return KEY_DISK_TEMP;
        // VM 使用率（先匹配更具体的）
        if (id.includes('_vm_cpu_usage')) return KEY_VM_CPU_USAGE;
        if (id.includes('_vm_mem_usage')) return KEY_VM_MEM_USAGE;
        if (id.includes('_node_cpu_usage')) return KEY_NODE_CPU_USAGE;
        if (id.includes('_node_mem_usage')) return KEY_NODE_MEM_USAGE;
        if (id.includes('_cpu_usage')) return KEY_CPU_USAGE;
        if (id.includes('_mem_usage')) return KEY_MEM_USAGE;
        if (id.includes('_disk_usage')) return KEY_DISK_USAGE;
        if (id.includes('_netin')) return KEY_NETIN;
        if (id.includes('_netout')) return KEY_NETOUT;
        if (id.includes('_uptime')) return KEY_UPTIME;
        return 'unknown';
    }

    // ===== 获取所有 ProxmoxVE 实体 =====
    _getPVEEntities() {
        if (!this.hass) return [];
        const result = [];
        const entityReg = this.hass.entities || {};
        const deviceReg = this.hass.devices || {};

        for (const entityId in this.hass.states) {
            const regEntry = entityReg[entityId];
            const vmPlatform = this.config.vm_type || 'proxmoxve';
            if (!regEntry || regEntry.platform !== vmPlatform) continue;

            const stateObj = this.hass.states[entityId];
            let deviceName = '';
            let deviceId = regEntry.device_id || '';
            if (deviceId && deviceReg[deviceId]) {
                const dev = deviceReg[deviceId];
                deviceName = dev.name_by_user || dev.name || '';
            }

            const isNode = !entityId.includes('_vm_');

            // 分类实体 key，并用 unique_id 双重校验
            let ekey = this._classifyEntity(entityId);
            if (ekey === 'unknown' && regEntry?.unique_id) {
                const uid = regEntry.unique_id;
                // 按钮/开关
                if (uid.includes('_shutdown')) ekey = KEY_SHUTDOWN;
                else if (uid.includes('_reboot') && !uid.includes('_reboot_')) ekey = KEY_REBOOT;
                else if (uid.includes('_reset')) ekey = KEY_RESET;
                else if (uid.includes('_suspend')) ekey = KEY_SUSPEND;
                else if (uid.includes('_vm_power') || uid.includes('_power')) ekey = KEY_VM_POWER;
                // 温度
                else if (uid.includes('_cpu_temperature')) ekey = KEY_CPU_TEMP;
                else if (uid.includes('_motherboard_temperature')) ekey = KEY_MB_TEMP;
                else if (uid.includes('_nvme_temperature')) ekey = KEY_NVME_TEMP;
                else if (uid.includes('_disk_temperature')) ekey = KEY_DISK_TEMP;
                // 使用率
                else if (uid.includes('_vm_cpu_usage')) ekey = KEY_VM_CPU_USAGE;
                else if (uid.includes('_node_cpu_usage')) ekey = KEY_NODE_CPU_USAGE;
                else if (uid.includes('_cpu_usage')) ekey = KEY_CPU_USAGE;
                else if (uid.includes('_vm_mem_usage')) ekey = KEY_VM_MEM_USAGE;
                else if (uid.includes('_node_mem_usage')) ekey = KEY_NODE_MEM_USAGE;
                else if (uid.includes('_mem_usage')) ekey = KEY_MEM_USAGE;
                // 磁盘
                else if (uid.includes('_disk_usage')) ekey = KEY_DISK_USAGE;
                // 网络
                else if (uid.includes('_netin')) ekey = KEY_NETIN;
                else if (uid.includes('_netout')) ekey = KEY_NETOUT;
                // 开机
                else if (uid.includes('_uptime')) ekey = KEY_UPTIME;
            }
            // 第三重校验：按单位识别温度
            if (ekey === 'unknown' && stateObj.attributes.unit_of_measurement === '°C') {
                const id = (regEntry?.unique_id || entityId).toLowerCase();
                const name = (stateObj.attributes.friendly_name || '').toLowerCase();
                const combined = id + '_' + name;
                if (combined.includes('nvme')) ekey = KEY_NVME_TEMP;
                else if (combined.includes('motherboard') || combined.includes('主板')) ekey = KEY_MB_TEMP;
                else if (combined.includes('disk') || combined.includes('硬盘') || combined.includes('磁盘')) ekey = KEY_DISK_TEMP;
                else if (combined.includes('cpu')) ekey = KEY_CPU_TEMP;
                else ekey = KEY_DISK_TEMP;
            }
            // 第四重：按单位 % 识别使用率
            if (ekey === 'unknown' && stateObj.attributes.unit_of_measurement === '%') {
                const uid2 = (regEntry?.unique_id || entityId).toLowerCase();
                if (uid2.includes('cpu')) ekey = KEY_CPU_USAGE;
                else if (uid2.includes('mem') || uid2.includes('内存')) ekey = KEY_MEM_USAGE;
                else if (uid2.includes('disk')) ekey = KEY_DISK_USAGE;
            }
            // 第五重：按友好名称识别
            if (ekey === 'unknown' && stateObj.attributes.friendly_name) {
                const fn = stateObj.attributes.friendly_name;
                if (fn.includes('温度')) {
                    if (fn.includes('NVMe') || fn.includes('nvme')) ekey = KEY_NVME_TEMP;
                    else if (fn.includes('主板')) ekey = KEY_MB_TEMP;
                    else if (fn.includes('磁盘') || fn.includes('硬盘')) ekey = KEY_DISK_TEMP;
                    else if (fn.includes('CPU') || fn.includes('cpu')) ekey = KEY_CPU_TEMP;
                    else ekey = KEY_DISK_TEMP;
                } else if (fn.includes('使用率') || fn.includes('利用率')) {
                    if (fn.includes('CPU') || fn.includes('cpu') || fn.includes('处理器')) ekey = KEY_CPU_USAGE;
                    else if (fn.includes('内存') || fn.includes('RAM')) ekey = KEY_MEM_USAGE;
                    else if (fn.includes('磁盘') || fn.includes('硬盘') || fn.includes('存储')) ekey = KEY_DISK_USAGE;
                } else if (fn.includes('上行') || fn.includes('上传')) ekey = KEY_NETOUT;
                else if (fn.includes('下行') || fn.includes('下载')) ekey = KEY_NETIN;
                else if (fn.includes('关机')) ekey = KEY_SHUTDOWN;
                else if (fn.includes('重启') && !fn.includes('硬')) ekey = KEY_REBOOT;
                else if (fn.includes('硬重启') || fn.includes('强制重启')) ekey = KEY_RESET;
                else if (fn.includes('挂起') || fn.includes('暂停')) ekey = KEY_SUSPEND;
                else if (fn.includes('电源')) ekey = KEY_VM_POWER;
                else if (fn.includes('开机')) ekey = KEY_UPTIME;
            }

            result.push({
                entity_id: entityId,
                name: stateObj.attributes.friendly_name || entityId,
                domain: entityId.split('.')[0],
                device_id: deviceId,
                device_name: deviceName || '未知设备',
                is_node: isNode,
                ekey,
                state: stateObj.state,
                unit: stateObj.attributes.unit_of_measurement || '',
            });
        }
        this._entities = result;
        return result;
    }

    // ===== 按设备分组 =====
    _groupByDevice(entities) {
        const groups = {};
        for (const e of entities) {
            const key = e.device_id || e.device_name;
            if (!groups[key]) {
                groups[key] = {
                    device_id: e.device_id,
                    device_name: e.device_name,
                    is_node: e.is_node,
                    entities: [],
                    _byKey: {},
                };
            }
            groups[key].entities.push(e);
            // 快速查找：每个 key 可能有多个实体（如多磁盘温度）
            if (!groups[key]._byKey[e.ekey]) {
                groups[key]._byKey[e.ekey] = [];
            }
            groups[key]._byKey[e.ekey].push(e);
        }
        return Object.values(groups);
    }

    // ===== 历史数据：所有 sensor 实体拉曲线 =====
    async _fetchChartData() {
        const entities = this._getPVEEntities();
        const chartIds = entities
            .filter(e => e.domain === 'sensor' && !BUTTON_KEYS.has(e.ekey))
            .map(e => e.entity_id);

        if (chartIds.length === 0) return;
        try {
            const now = new Date();
            const start = new Date(now.getTime() - 24 * 60 * 60 * 1000);
            const raw = await this.hass.callWS({
                type: 'history/history_during_period',
                start_time: start.toISOString(),
                end_time: now.toISOString(),
                entity_ids: chartIds,
                significant_changes_only: false,
                minimal_response: true,
                no_attributes: true,
            });

            const data = {};
            for (const eid of chartIds) {
                const arr = raw[eid] || [];
                data[eid] = arr
                    .filter(p => p && !isNaN(parseFloat(p.s)))
                    .map(p => parseFloat(p.s));
            }
            this._chartData = data;
        } catch (e) {
            // 静默
        }
    }

    // ===== Canvas 曲线（温度数据，平滑处理） =====
    _sampleData(data, maxPoints = 60) {
        if (data.length <= maxPoints) return data;
        const step = data.length / maxPoints;
        const result = [];
        for (let i = 0; i < maxPoints; i++) {
            const idx = Math.floor(i * step);
            // 取 step 范围内的均值
            const start = Math.floor(i * step);
            const end = Math.floor((i + 1) * step);
            let sum = 0, count = 0;
            for (let j = start; j < end && j < data.length; j++) {
                sum += data[j];
                count++;
            }
            result.push(count > 0 ? sum / count : data[idx]);
        }
        return result;
    }

    _smoothData(data, windowSize = 9) {
        if (data.length < 3) return data;
        let result = data;
        for (let pass = 0; pass < 2; pass++) {
            const half = Math.floor(windowSize / 2);
            const arr = [];
            for (let i = 0; i < result.length; i++) {
                let sum = 0, count = 0;
                for (let j = Math.max(0, i - half); j <= Math.min(result.length - 1, i + half); j++) {
                    sum += result[j];
                    count++;
                }
                arr.push(sum / count);
            }
            result = arr;
        }
        return result;
    }

    _drawChart(canvas, data, strokeColor, fillColor) {
        if (!canvas || !data || data.length === 0) return;
        const container = canvas.parentElement;
        if (!container) return;
        const sampled = this._sampleData(data);
        const smoothed = this._smoothData(sampled);
        const scale = window.devicePixelRatio || 1;
        const w = container.clientWidth;
        const h = container.clientHeight;
        canvas.style.width = `${w}px`;
        canvas.style.height = `${h}px`;
        canvas.width = Math.floor(w * scale);
        canvas.height = Math.floor(h * scale);
        const ctx = canvas.getContext('2d');
        ctx.scale(scale, scale);
        ctx.clearRect(0, 0, w, h);

        const minV = Math.min(...smoothed);
        const maxV = Math.max(...smoothed);
        let range = maxV - minV;
        let padTop = 0.1, padBottom = 0.1;
        // 温度恒定：居中，上下各留 40% 空间
        if (range < 0.5) {
            range = 1;
            padTop = 0.4;
            padBottom = 0.4;
        }
        const xStep = smoothed.length > 1 ? w / (smoothed.length - 1) : w;

        const toY = (v) => h * padTop + h * (1 - padTop - padBottom) * (1 - (v - minV) / range);
        const pts = smoothed.map((v, i) => ({ x: i * xStep, y: toY(v) }));
        const n = pts.length;

        // Catmull-Rom → Cubic Bezier 辅助函数
        const crToBezier = (p0, p1, p2, p3) => ({
            cp1x: p1.x + (p2.x - p0.x) / 6,
            cp1y: p1.y + (p2.y - p0.y) / 6,
            cp2x: p2.x - (p3.x - p1.x) / 6,
            cp2y: p2.y - (p3.y - p1.y) / 6,
        });

        // 填充
        ctx.beginPath();
        ctx.moveTo(pts[0].x, pts[0].y);
        for (let i = 0; i < n - 1; i++) {
            const p0 = pts[Math.max(0, i - 1)];
            const p1 = pts[i];
            const p2 = pts[i + 1];
            const p3 = pts[Math.min(n - 1, i + 2)];
            const { cp1x, cp1y, cp2x, cp2y } = crToBezier(p0, p1, p2, p3);
            ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, p2.x, p2.y);
        }
        ctx.lineTo(pts[n - 1].x, h);
        ctx.lineTo(0, h);
        ctx.closePath();
        ctx.fillStyle = fillColor;
        ctx.fill();

        // 线条
        ctx.beginPath();
        ctx.moveTo(pts[0].x, pts[0].y);
        for (let i = 0; i < n - 1; i++) {
            const p0 = pts[Math.max(0, i - 1)];
            const p1 = pts[i];
            const p2 = pts[i + 1];
            const p3 = pts[Math.min(n - 1, i + 2)];
            const { cp1x, cp1y, cp2x, cp2y } = crToBezier(p0, p1, p2, p3);
            ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, p2.x, p2.y);
        }
        ctx.strokeStyle = strokeColor;
        ctx.lineWidth = 1;
        ctx.lineJoin = 'round';
        ctx.lineCap = 'round';
        ctx.stroke();
    }

    _drawAllCharts() {
        const canvases = this.shadowRoot?.querySelectorAll('canvas.chart-canvas');
        canvases?.forEach(canvas => {
            const eid = canvas.dataset.entityId;
            const data = this._chartData[eid];
            if (!data || data.length === 0) return;
            const color = canvas.dataset.color || '#00BCD4';
            const fill = canvas.dataset.fill || 'rgba(0,188,212,0.15)';
            this._drawChart(canvas, data, color, fill);
        });
    }

    // ===== 生命周期 =====
    async firstUpdated() {
        await this._load();
    }

    async updated(changed) {
        if (changed.has('hass') || changed.has('config')) {
            this.style.setProperty('--card-width', this.config.card_width || '100%');
            await this._load();
        }
    }

    async _load() {
        // 防止并发 _load 调用覆盖数据
        if (this._loading) return;
        this._loading = true;
        try {
            await this._fetchChartData();
            this.requestUpdate();
            await this.updateComplete;
            // 双 rAF 确保 DOM 布局 + 绘制完成后再画 Canvas
            requestAnimationFrame(() => {
                requestAnimationFrame(() => this._drawAllCharts());
            });
        } finally {
            this._loading = false;
        }
    }

    _toggleCharts(devId) {
        this._handleClick();
        this._showCharts = { ...this._showCharts, [devId]: !this._showCharts[devId] };
        this.requestUpdate();
        setTimeout(() => {
            requestAnimationFrame(() => this._drawAllCharts());
        }, 150);
    }

    // ===== 颜色工具 =====
    _usageColor(pct) {
        if (pct === undefined || isNaN(pct)) return '#aaa';
        if (pct >= 90) return '#f44336';
        if (pct >= 70) return '#FF9800';
        return '#4CAF50';
    }

    // ===== 秒数转可读时间 =====
    _formatUptime(sec) {
        if (sec === undefined || isNaN(sec)) return '--';
        const d = Math.floor(sec / 86400);
        const h = Math.floor((sec % 86400) / 3600);
        const m = Math.floor((sec % 3600) / 60);
        const s = Math.floor(sec % 60);
        if (d > 0) return `${d}天${h}时`;
        if (h > 0) return `${h}时${m}分`;
        if (m > 0) return `${m}分${s}秒`;
        return `${s}秒`;
    }

    // ===== 标签缩短 =====
    _shortName(name, deviceName) {
        let s = name
            .replace('使用率', '')
            .replace('温度', '')
            .replace('网络上行流量', '上行')
            .replace('网络下行流量', '下行');
        // 去掉设备名前缀（如 "HaOS CPU" → "CPU"）
        if (deviceName && s.startsWith(deviceName)) {
            s = s.substring(deviceName.length).trim();
        }
        return s;
    }

    // ===== 通用实体卡片（CPU/内存有曲线，其他无） =====
    _renderGenericCard(entity, theme, deviceName, showChart) {
        const val = this._getNum(entity.entity_id);
        const rawState = entity.state;
        const isNum = val !== undefined;
        const displayVal = isNum ? val.toFixed(1) : rawState;
        const color = entity.domain === 'sensor' && isNum
            ? this._usageColor(val)
            : '#00BCD4';
        const shortName = this._shortName(entity.name, deviceName);

        const chartData = showChart ? (this._chartData[entity.entity_id] || []) : [];

        return html`
            <div class="info-card" style="--card-bg: ${theme === 'light' ? '#fafafa' : '#3a3a3a'}; color:inherit;">
                <div class="info-header">
                    <span class="info-header-left">
                        <ha-icon icon="mdi:information-outline" style="--mdc-icon-size:16px; color:${color};"></ha-icon>
                        <span style="color:var(--fg-color, #000);">${shortName}</span>
                    </span>
                    <span class="info-value" style="color:${color};">
                        ${displayVal}${entity.unit ? ' ' + entity.unit : ''}
                    </span>
                </div>
                ${chartData.length > 0 ? html`
                    <div class="info-chart-container">
                        <canvas class="chart-canvas"
                            data-entity-id="${entity.entity_id}"
                            data-color="${color}"
                            data-fill="rgba(0,188,212,0.12)"></canvas>
                    </div>
                ` : ''}
            </div>
        `;
    }

    // ===== 二次确认逻辑 =====
    _clearConfirmState() {
        if (this._confirmState?.timeoutId) {
            clearTimeout(this._confirmState.timeoutId);
        }
        this._confirmState = null;
    }

    _handlePowerClick(entityId, action) {
        this._handleClick();

        // 同一按钮二次点击 → 执行
        if (this._confirmState && this._confirmState.entityId === entityId) {
            this._clearConfirmState();
            this._doCallPress(entityId, action);
            this.requestUpdate();
            return;
        }

        // 不同按钮或首次点击 → 进入确认状态
        this._clearConfirmState();
        const timeoutId = setTimeout(() => {
            this._confirmState = null;
            this.requestUpdate();
        }, 3000);
        this._confirmState = { entityId, action, timeoutId };
        this.requestUpdate();
    }

    _doCallPress(entityId, action) {
        if (entityId.startsWith('switch.')) {
            const service = action === 'off' ? 'turn_off' : 'turn_on';
            this.hass.callService('switch', service, { entity_id: entityId });
        } else if (entityId.startsWith('button.')) {
            this.hass.callService('button', 'press', { entity_id: entityId });
        }
    }

    _renderPowerButtons(device, theme) {
        const shutdown = device._byKey[KEY_SHUTDOWN]?.[0];
        const reboot = device._byKey[KEY_REBOOT]?.[0];
        const reset = device._byKey[KEY_RESET]?.[0];
        const suspend = device._byKey[KEY_SUSPEND]?.[0];
        const powerSwitch = device._byKey[KEY_VM_POWER]?.[0];

        const isConfirming = (eid) =>
            this._confirmState && this._confirmState.entityId === eid;

        const buttons = [];

        if (powerSwitch) {
            const isOn = powerSwitch.state === 'running' || powerSwitch.state === 'on';
            const action = isOn ? 'off' : 'on';
            const eid = powerSwitch.entity_id;
            const confirming = isConfirming(eid);
            buttons.push(html`
                <button class="power-btn btn-on ${confirming ? 'btn-confirm' : ''}"
                    @click=${() => this._handlePowerClick(eid, action)}>
                    <ha-icon icon="${confirming ? 'mdi:help-circle' : 'mdi:power'}"></ha-icon>
                    ${confirming ? '确认?' : (isOn ? '运行中' : '已关机')}
                </button>
            `);
        }
        if (shutdown) {
            const eid = shutdown.entity_id;
            const confirming = isConfirming(eid);
            buttons.push(html`
                <button class="power-btn btn-shutdown ${confirming ? 'btn-confirm' : ''}"
                    @click=${() => this._handlePowerClick(eid)}>
                    <ha-icon icon="${confirming ? 'mdi:help-circle' : 'mdi:power-off'}"></ha-icon>
                    ${confirming ? '确认关机?' : '关机'}
                </button>
            `);
        }
        if (reboot) {
            const eid = reboot.entity_id;
            const confirming = isConfirming(eid);
            buttons.push(html`
                <button class="power-btn btn-reboot ${confirming ? 'btn-confirm' : ''}"
                    @click=${() => this._handlePowerClick(eid)}>
                    <ha-icon icon="${confirming ? 'mdi:help-circle' : 'mdi:restart'}"></ha-icon>
                    ${confirming ? '确认重启?' : '重启'}
                </button>
            `);
        }
        if (reset) {
            const eid = reset.entity_id;
            const confirming = isConfirming(eid);
            buttons.push(html`
                <button class="power-btn btn-reset ${confirming ? 'btn-confirm' : ''}"
                    @click=${() => this._handlePowerClick(eid)}>
                    <ha-icon icon="${confirming ? 'mdi:help-circle' : 'mdi:restart-alert'}"></ha-icon>
                    ${confirming ? '确认硬重启?' : '硬重启'}
                </button>
            `);
        }
        if (suspend) {
            const eid = suspend.entity_id;
            const confirming = isConfirming(eid);
            buttons.push(html`
                <button class="power-btn btn-suspend ${confirming ? 'btn-confirm' : ''}"
                    @click=${() => this._handlePowerClick(eid)}>
                    <ha-icon icon="${confirming ? 'mdi:help-circle' : 'mdi:pause-circle'}"></ha-icon>
                    ${confirming ? '确认挂起?' : '挂起'}
                </button>
            `);
        }

        if (buttons.length === 0) return '';
        return html`<div class="power-btns">${buttons}</div>`;
    }

    _handleClick() {
        const ev = new Event('haptic', { bubbles: true, cancelable: false, composed: true });
        ev.detail = 'light';
        this.dispatchEvent(ev);
    }

    _getDeviceStatus(device) {
        const ps = device._byKey[KEY_VM_POWER]?.[0];
        if (!ps) return null;
        return ps.state;
    }

    _renderDeviceCard(device, theme) {
        const icon = device.is_node ? 'mdi:server' : 'mdi:desktop-tower';
        const status = this._getDeviceStatus(device);
        const statusMap = { running: ['运行中', 'status-running'], on: ['运行中', 'status-running'], stopped: ['已停止', 'status-stopped'], off: ['已停止', 'status-stopped'], paused: ['已暂停', 'status-paused'] };
        const statusInfo = statusMap[status] || null;

        // uptime 实体可能不在 _byKey 中，直接从 entities 查找更稳
        const uptimeE = device._byKey[KEY_UPTIME]?.[0]
            || device.entities.find(e => e.ekey === KEY_UPTIME);
        let uptime = uptimeE ? this._getNum(uptimeE.entity_id) : undefined;
        if (uptime !== undefined) uptime *= 3600;  // 小时→秒

        // 自定义排序：温度全部在前，非温度在后
        const isTemp = (e) => [KEY_CPU_TEMP, KEY_MB_TEMP, KEY_NVME_TEMP, KEY_DISK_TEMP].includes(e.ekey);
        const tempOrder = { [KEY_CPU_TEMP]: 0, [KEY_MB_TEMP]: 1, [KEY_NVME_TEMP]: 2, [KEY_DISK_TEMP]: 3 };
        const sortKey = (e) => {
            const ek = e.ekey;
            // 温度类 0-3
            if (isTemp(e)) return tempOrder[ek] ?? 3;
            // 非温度类 10+
            if ([KEY_CPU_USAGE, KEY_VM_CPU_USAGE, KEY_NODE_CPU_USAGE].includes(ek)) return 10;
            if ([KEY_MEM_USAGE, KEY_VM_MEM_USAGE, KEY_NODE_MEM_USAGE].includes(ek)) return 11;
            if (ek === KEY_DISK_USAGE) return 12;
            if (ek === KEY_NETIN || ek === KEY_NETOUT) return 13;
            return 14;
        };
        const cards = device.entities
            .filter(e => !BUTTON_KEYS.has(e.ekey) && e.ekey !== KEY_UPTIME && e.ekey !== KEY_DISK_USAGE)
            .sort((a, b) => sortKey(a) - sortKey(b) || a.name.localeCompare(b.name, 'zh'));

        const devId = device.device_id || device.device_name;
        const showChart = !!this._showCharts[devId];

        return html`
            <div class="device-card">
                <div class="device-header">
                    <ha-icon icon="${icon}" style="--mdc-icon-size:18px;"></ha-icon>
                    <span class="device-title">${device.device_name}</span>
                    ${uptime !== undefined ? html`
                        <span style="font-size:10px; opacity:0.6;">开机 ${this._formatUptime(uptime)}</span>
                    ` : ''}
                    ${statusInfo && status !== 'running' && status !== 'on' ? html`
                        <span class="device-status ${statusInfo[1]}">${statusInfo[0]}</span>
                    ` : ''}
                    <button class="chart-toggle ${showChart ? 'on' : ''}"
                        @click=${(e) => { e.stopPropagation(); this._toggleCharts(devId); }}>
                        📈
                    </button>
                </div>
                <div class="cards-row" style="padding-bottom:4px;">
                    ${cards.map(e => this._renderGenericCard(e, theme, device.device_name, showChart))}
                </div>
                ${this._renderPowerButtons(device, theme)}
            </div>
        `;
    }

    render() {
        if (!this.hass) {
            return html`<div class="loading">等待 Home Assistant 连接...</div>`;
        }

        const theme = this._evaluateTheme();
        const fgColor = theme === 'light' ? 'rgb(0,0,0)' : 'rgb(255,255,255)';
        const bgColor = theme === 'light' ? 'rgb(255,255,255)' : 'rgb(50,50,50)';
        const subColor = theme === 'light' ? 'rgb(136,136,136)' : 'rgb(180,180,180)';
        const deviceCardBg = theme === 'light'
            ? 'rgba(128,128,128,0.10)'
            : 'rgba(255,255,255,0.08)';
        const deviceBorder = theme === 'light'
            ? 'rgba(150,150,150,0.25)'
            : 'rgba(255,255,255,0.12)';

        const allEntities = this._getPVEEntities();
        const deviceGroups = this._groupByDevice(allEntities);

        return html`
            <ha-card style="--fg-color:${fgColor}; --bg-color:${bgColor}; --sub-color:${subColor}; --device-card-bg:${deviceCardBg}; --device-border:${deviceBorder};">
                <div class="card-header">
                    <div class="card-title">${this.config.name || 'ProxmoxVE'}</div>
                    <div class="entity-count">${deviceGroups.length} 台设备 · ${allEntities.length} 实体</div>
                </div>

                ${allEntities.length === 0 ? html`
                    <div class="no-data">未找到 ${this.config.vm_type === 'esxi' ? 'ESXi' : 'ProxmoxVE'} 实体</div>
                ` : html`
                    <div class="devices-wrap">
                        ${deviceGroups.map(d => this._renderDeviceCard(d, theme))}
                    </div>
                `}
            </ha-card>
        `;
    }
}
customElements.define('xiaoshi-pve-card', XiaoshiPVECard);
