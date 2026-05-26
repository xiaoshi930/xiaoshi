import { LitElement, html, css } from "https://unpkg.com/lit-element@2.4.0/lit-element.js?module";

class XiaoshiBalanceButtonEditor extends LitElement {
  static get properties() {
    return {
      hass: { type: Object },
      config: { type: Object },
      _searchTerm: { type: String },
      _filteredEntities: { type: Array },
      _showEntityList: { type: Boolean },  //button新元素
      _specificSearchTerm: { type: String },    //button新元素
      _specificFilteredEntities: { type: Array },    //button新元素
      _showSpecificEntityList: { type: Boolean }  //button新元素
    };
  }

  static get styles() {
    return css`
      .form {
        display: flex;
        flex-direction: column;
        gap: 10px;
        min-height: 500px;
      }
      .form-group {
        display: flex;
        flex-direction: column;
        gap: 5px;
      }
      label {
        font-weight: bold;
      }
      select, input, textarea {
        padding: 8px;
        border: 1px solid #ddd;
        border-radius: 4px;
      }
      textarea {
        min-height: 80px;
        resize: vertical;
      }
      .help-text {
        font-size: 0.85em;
        color: #666;
        margin-top: 4px;
      }

      .entity-selector {
        position: relative;
      }

      .entity-search-input {
        width: 100%;
        padding: 8px;
        border: 1px solid #ddd;
        border-radius: 4px;
        box-sizing: border-box;
      }

      .entity-dropdown {
        position: absolute;
        top: 100%;
        left: 0;
        right: 0;
        height: 300px;
        overflow-y: auto;
        background: white;
        border: 1px solid #ddd;
        border-radius: 4px;
        box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        z-index: 1000;
        margin-top: 2px;
      }

      .entity-option {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 8px 12px;
        cursor: pointer;
        border-bottom: 1px solid #eee;
      }

      .entity-option:hover {
        background: #f5f5f5;
      }

      .entity-option.selected {
        background: #e3f2fd;
      }

      .entity-info {
        display: flex;
        align-items: center;
        gap: 8px;
        flex: 1;
        justify-content: space-between;
      }

      .entity-details {
        flex: 1;
      }

      .entity-name {
        font-weight: 500;
        font-size: 14px;
        color: #000;
      }

      .entity-id {
        font-size: 12px;
        color: #000;
        font-family: monospace;
      }

      .check-icon {
        color: #4CAF50;
      }

      .no-results {
        padding: 12px;
        text-align: center;
        color: #666;
        font-style: italic;
      }

      .selected-entities {
        margin-top: 8px;
      }

      .selected-label {
        font-size: 12px;
        font-weight: bold;
        margin-bottom: 4px;
        color: #333;
      }

      .selected-entity-config {
        margin-bottom: 8px;
        border: 1px solid #ddd;
        border-radius: 4px;
        padding: 8px;
        background: #f9f9f9;
      }

      .selected-entity {
        display: flex;
        align-items: center;
        gap: 4px;
        margin-bottom: 8px;
        font-size: 12px;
        color: #000;
        justify-content: space-between;
      }

      .attribute-config {
        margin-top: 4px;
        display: flex;
        flex-direction: column;
        gap: 4px;
      }

      .attribute-input {
        width: 100%;
        padding: 4px 8px;
        border: 1px solid #ddd;
        border-radius: 4px;
        font-size: 12px;
        box-sizing: border-box;
      }

      .override-config {
        display: flex;
        align-items: center;
        gap: 4px;
        margin-top: 2px;
      }

      .override-checkbox {
        margin-right: 4px;
      }

      .override-input {
        flex: 1;
        padding: 2px 6px;
        border: 1px solid #ddd;
        border-radius: 3px;
        font-size: 11px;
        box-sizing: border-box;
      }

      .override-label {
        font-size: 11px;
        color: #666;
        white-space: nowrap;
      }

      .remove-btn {
        background: none;
        border: none;
        cursor: pointer;
        padding: 0;
        display: flex;
        align-items: center;
        color: #666;
        margin-left: auto;
      }

      .remove-btn:hover {
        color: rgb(255, 0, 0);
      }
    `;
  }

  render() {
    if (!this.hass) return html``;

    return html`

      <div class="form">

      <!-- button新元素 开始-->

      <div class="form-group">
        <label>显示模式</label>
        <select 
          @change=${this._entityChanged}
          .value=${this.config.display_mode || 'min_value'}
          name="display_mode"
        >
          <option value="min_value">显示最小值</option>
          <option value="specific_entity">显示指定实体</option>
        </select>
      </div>

      <div class="form-group">
        <label>小数点精度：控制显示的小数位数，默认1位</label>
        <input 
          type="number" 
          @change=${this._entityChanged}
          .value=${this.config.decimal_precision !== undefined ? this.config.decimal_precision : '1'}
          name="decimal_precision"
          placeholder="默认1"
          min="0"
          max="10"
          step="1"
        />
      </div>

      <div class="form-group" style="${(this.config.display_mode || 'min_value') === 'specific_entity' ? '' : 'display: none;'}" id="specific_entity_group">
        <label>指定显示的实体</label>
        <div class="entity-selector">
          <input 
            type="text" 
            @input=${this._onSpecificEntitySearch}
            @focus=${this._onSpecificEntitySearch}
            .value=${this._showSpecificEntityList ? (this._specificSearchTerm || '') : this._getSpecificEntityDisplayName()}
            placeholder="搜索实体..."
            class="entity-search-input"
          />
          ${this._showSpecificEntityList ? html`
            <div class="entity-dropdown">
              ${this._specificFilteredEntities.map(entity => html`
                <div 
                  class="entity-option ${this.config.specific_entity_id === entity.entity_id ? 'selected' : ''}"
                  @click=${() => this._selectSpecificEntity(entity.entity_id)}
                >
                  <div class="entity-info">
                    <div class="entity-details">
                      <div class="entity-name">${entity.attributes.friendly_name || entity.entity_id}</div>
                      <div class="entity-id">${entity.entity_id}</div>
                    </div>
                    <ha-icon icon="${entity.attributes.icon || 'mdi:help-circle'}"></ha-icon>
                  </div>
                  ${this.config.specific_entity_id === entity.entity_id ? 
                    html`<ha-icon icon="mdi:check" class="check-icon"></ha-icon>` : ''}
                </div>
              `)}
              ${this._specificFilteredEntities.length === 0 ? html`
                <div class="no-results">未找到匹配的实体</div>
              ` : ''}
            </div>
          ` : ''}
        </div>
      </div>

      <div class="form-group">
        <label>按钮显示图标
        <input 
          type="text" 
          @change=${this._entityChanged}
          .value=${this.config.button_icon !== undefined ? this.config.button_icon : 'mdi:cellphone'}
          name="button_icon"
          placeholder="mdi:cellphone"
        /></label>
      </div>

      <div class="checkbox-group">
        <input 
          type="checkbox" 
          class="checkbox-input"
          @change=${this._entityChanged}
          .checked=${this.config.transparent_bg === true}
          name="transparent_bg"
          id="transparent_bg"
        />
        <label for="transparent_bg" class="checkbox-label"> 
          （平板端特性）透明背景（勾选后按钮背景透明）
        </label>
      </div>

      <div class="checkbox-group">
        <input 
          type="checkbox" 
          class="checkbox-input"
          @change=${this._entityChanged}
          .checked=${this.config.lock_white_fg === true}
          name="lock_white_fg"
          id="lock_white_fg" 
        />
        <label for="lock_white_fg" class="checkbox-label"> 
        （平板端特性）白色图标文字（勾选后锁定显示白色）
        </label>
      </div>

      <div class="checkbox-group">
        <input 
          type="checkbox" 
          class="checkbox-input"
          @change=${this._entityChanged}
          .checked=${this.config.hide_icon === true}
          name="hide_icon"
          id="hide_icon"
        />
        <label for="hide_icon" class="checkbox-label"> 
        （ 平板端特性）隐藏图标（勾选后隐藏图标）
        </label>
      </div>

      <div class="form-group">
        <label>按钮宽度：默认65px, 支持像素(px)和百分比(%)</label>
        <input 
          type="text" 
          @change=${this._entityChanged}
          .value=${this.config.button_width !== undefined ? this.config.button_width : '65px'}
          name="button_width"
          placeholder="默认65px"
        />
      </div>

      <div class="form-group">
        <label>按钮高度：支持像素(px)、百分比(%)和视窗高度(vh)，默认24px</label>
        <input 
          type="text" 
          @change=${this._entityChanged}
          .value=${this.config.button_height !== undefined ? this.config.button_height : '24px'}
          name="button_height"
          placeholder="默认24px"
          />
      </div>
      
      <div class="form-group">
        <label>按钮文字大小：支持像素(px)，默认11px</label>
        <input 
          type="text" 
          @change=${this._entityChanged}
          .value=${this.config.button_font_size !== undefined ? this.config.button_font_size : '11px'}
          name="button_font_size"
          placeholder="默认11px"
        />
      </div>
      
      <div class="form-group">
        <label>按钮图标大小：支持像素(px)，默认13px</label>
        <input 
          type="text" 
          @change=${this._entityChanged}
          .value=${this.config.button_icon_size !== undefined ? this.config.button_icon_size : '13px'}
          name="button_icon_size"
          placeholder="默认13px"
        />
      </div>

      <div class="form-group">
        <label>点击动作：点击按钮时触发的动作</label>
        <select 
          @change=${this._entityChanged}
          .value=${this.config.tap_action !== 'none' ? 'tap_action' : 'none'}
          name="tap_action"
        >
          <option value="tap_action">弹出余额信息卡片（默认）</option>
          <option value="none">无动作</option>
        </select>
      </div>

      <div class="form-group">
        <label>👇👇👇下方弹出的卡片可增加的其他卡片👇👇👇</label>
        <textarea 
          @change=${this._entityChanged}
          .value=${this.config.other_cards || ''}
          name="other_cards"
          placeholder='# 示例配置：添加button卡片
- type: custom:button-card
template: 测试模板(最好引用模板，否则大概率会报错)
- type: custom:button-card
template: 测试模板(最好引用模板，否则大概率会报错)'>
        </textarea>
      </div>

      <div class="checkbox-group">
        <input 
          type="checkbox" 
          class="checkbox-input"
          @change=${this._entityChanged}
          .checked=${this.config.no_preview === true}
          name="no_preview"
          id="no_preview"
        />
        <label for="no_preview" class="checkbox-label" style="color: red;"> 
          📻显示预览📻（ 请先勾选测试显示效果 ）
        </label>
      </div>


      <div class="form-group">
        <label> </label>
        <label>👇👇👇下方是弹出的主卡配置项👇👇👇</label>
        <label> </label>
      </div>

      <!-- button新元素 结束-->

        <div class="form-group">
          <label>卡片宽度：支持像素(px)和百分比(%)，默认100%</label>
          <input 
            type="text" 
            @change=${this._entityChanged}
            .value=${this.config.width !== undefined ? this.config.width : '100%'}
            name="width"
            placeholder="默认100%"
          />
        </div>
        
        <div class="form-group">
          <label>标题名称：配置卡片显示的标题</label>
          <input 
            type="text" 
            @change=${this._entityChanged}
            .value=${this.config.name !== undefined ? this.config.name : '电话余额信息'}
            name="name"
            placeholder="默认：电话余额信息"
          />
        </div>

        <div class="form-group">
          <label>全局预警条件：当任一实体满足此条件时触发预警</label>
          <input 
            type="text" 
            @change=${this._entityChanged}
            .value=${this.config.global_warning || ''}
            name="global_warning"
            placeholder="如: >10, <=5, ==on, ==off, =='hello world'"
          />
        </div>
        
        <div class="form-group">
          <label>预警颜色：设置预警状态下的显示颜色</label>
          <div style="display: flex; gap: 8px; align-items: center;">
            <input 
              type="color" 
              @change=${this._entityChanged}
              .value=${this.config.warning_color || 'rgb(255, 0, 0)'}
              name="warning_color"
              style="width: 50px; height: 34px; border: 1px solid #ddd; border-radius: 4px; cursor: pointer;"
            />
            <input 
              type="text" 
              @change=${this._entityChanged}
              .value=${this.config.warning_color || 'rgb(255, 0, 0)'}
              name="warning_color"
              placeholder="默认：rgb(255, 0, 0)"
              style="flex: 1;"
            />
          </div>
        </div>
        
        <div class="form-group">
          <label>主题</label>
          <select 
            @change=${this._entityChanged}
            .value=${this.config.theme !== undefined ? this.config.theme : 'on'}
            name="theme"
          >
            <option value="on">浅色主题（白底黑字）</option>
            <option value="off">深色主题（深灰底白字）</option>
          </select>
        </div>
        
        <div class="form-group">
          <label>设备余额实体：搜索并选择实体</label>
          <div class="entity-selector">
            <input 
              type="text" 
              @input=${this._onEntitySearch}
              @focus=${this._onEntitySearch}
              .value=${this._searchTerm || ''}
              placeholder="搜索实体..."
              class="entity-search-input"
            />
            ${this._showEntityList ? html`
              <div class="entity-dropdown">
                ${this._filteredEntities.map(entity => html`
                  <div 
                    class="entity-option ${this.config.entities && this.config.entities.some(e => e.entity_id === entity.entity_id) ? 'selected' : ''}"
                    @click=${() => this._toggleEntity(entity.entity_id)}
                  >
                    <div class="entity-info">
                      <div class="entity-details">
                        <div class="entity-name">${entity.attributes.friendly_name || entity.entity_id}</div>
                        <div class="entity-id">${entity.entity_id}</div>
                      </div>
                      <ha-icon icon="${entity.attributes.icon || 'mdi:help-circle'}"></ha-icon>
                    </div>
                    ${this.config.entities && this.config.entities.some(e => e.entity_id === entity.entity_id) ? 
                      html`<ha-icon icon="mdi:check" class="check-icon"></ha-icon>` : ''}
                  </div>
                `)}
                ${this._filteredEntities.length === 0 ? html`
                  <div class="no-results">未找到匹配的实体</div>
                ` : ''}
              </div>
            ` : ''}
          </div>
          <div class="selected-entities">
            ${this.config.entities && this.config.entities.length > 0 ? html`
              <div class="selected-label">已选择的实体：</div>
              ${this.config.entities.map((entityConfig, index) => {
                const entity = this.hass.states[entityConfig.entity_id];
                return html`
                  <div class="selected-entity-config">
                    <div class="selected-entity">
                      <span>${entity?.attributes.friendly_name || entityConfig.entity_id}</span>
                      <ha-icon icon="${entity?.attributes.icon || 'mdi:help-circle'}"></ha-icon>
                      <button class="remove-btn" @click=${() => this._removeEntity(index)}>
                        <ha-icon icon="mdi:close"></ha-icon>
                      </button>
                    </div>
                    <div class="attribute-config">
                      <input 
                        type="text" 
                        @change=${(e) => this._updateEntityAttribute(index, e.target.value)}
                        .value=${entityConfig.attribute || ''}
                        placeholder="留空使用实体状态，或输入属性名"
                        class="attribute-input"
                      />
                      
                      <div class="override-config">
                        <input 
                          type="checkbox" 
                          class="override-checkbox"
                          @change=${(e) => this._updateEntityOverride(index, 'icon', e.target.checked)}
                          .checked=${entityConfig.overrides?.icon !== undefined}
                        />
                        <span class="override-label">图标:</span>
                        <input 
                          type="text" 
                          class="override-input"
                          @change=${(e) => this._updateEntityOverrideValue(index, 'icon', e.target.value)}
                          .value=${entityConfig.overrides?.icon || ''}
                          placeholder="mdi:icon-name"
                          ?disabled=${entityConfig.overrides?.icon === undefined}
                        />
                      </div>

                      <div class="override-config">
                        <input 
                          type="checkbox" 
                          class="override-checkbox"
                          @change=${(e) => this._updateEntityOverride(index, 'name', e.target.checked)}
                          .checked=${entityConfig.overrides?.name !== undefined}
                        />
                        <span class="override-label">名称:</span>
                        <input 
                          type="text" 
                          class="override-input"
                          @change=${(e) => this._updateEntityOverrideValue(index, 'name', e.target.value)}
                          .value=${entityConfig.overrides?.name || ''}
                          placeholder="自定义名称"
                          ?disabled=${entityConfig.overrides?.name === undefined}
                        />
                      </div>

                      <div class="override-config">
                        <input 
                          type="checkbox" 
                          class="override-checkbox"
                          @change=${(e) => this._updateEntityOverride(index, 'unit_of_measurement', e.target.checked)}
                          .checked=${entityConfig.overrides?.unit_of_measurement !== undefined}
                        />
                        <span class="override-label">单位:</span>
                        <input 
                          type="text" 
                          class="override-input"
                          @change=${(e) => this._updateEntityOverrideValue(index, 'unit_of_measurement', e.target.value)}
                          .value=${entityConfig.overrides?.unit_of_measurement || ''}
                          placeholder="自定义单位"
                          ?disabled=${entityConfig.overrides?.unit_of_measurement === undefined}
                        />
                      </div>
                      
                      <div class="override-config">
                        <input 
                          type="checkbox" 
                          class="override-checkbox"
                          @change=${(e) => this._updateEntityOverride(index, 'warning', e.target.checked)}
                          .checked=${entityConfig.overrides?.warning !== undefined}
                        />
                        <span class="override-label">预警:</span>
                        <input 
                          type="text" 
                          class="override-input"
                          @change=${(e) => this._updateEntityOverrideValue(index, 'warning', e.target.value)}
                          .value=${entityConfig.overrides?.warning || ''}
                          placeholder="如: >10, <=5, ==on, ==off, =='hello world'"
                          ?disabled=${entityConfig.overrides?.warning === undefined}
                        />
                      </div>
                    </div>
                  </div>
                `;
              })}
            ` : ''}
          </div>
          <div class="help-text">
            搜索并选择要显示的设备余额实体，支持多选。每个实体可以配置：<br>
            • 属性名：留空使用实体状态，或输入属性名<br>
            • 名称重定义：勾选后可自定义显示名称<br>
            • 图标重定义：勾选后可自定义图标（如 mdi:phone）<br>
            • 单位重定义：勾选后可自定义单位（如 元、$、kWh 等）<br>
            • 预警条件：勾选后设置预警条件，支持 >10, >=10, <10, <=10, ==10, ==on, ==off, =="hello world" 等<br>
            • 未勾选重定义时，将使用实体的原始属性值
          </div>
        </div>
      </div>

    `;
  }

  _entityChanged(e) {
    
    /*button新按钮方法 开始*/
    const { name, value, type, checked } = e.target;
    
    let finalValue;
    // 处理复选框
    if (type === 'checkbox') {
      finalValue = checked;
    } else {
      if (!value && name !== 'theme' && name !== 'button_width' && name !== 'button_height' && name !== 'button_font_size' && name !== 'button_icon_size' && name !== 'width' && name !== 'tap_action' && name !== 'display_mode' && name !== 'decimal_precision') return;
      finalValue = value 
    }
    
    // 处理不同字段的默认值
    if (name === 'button_width') {
      finalValue = value || '100%';
    } else if (name === 'button_height') {
      finalValue = value || '24px';
    } else if (name === 'button_font_size') {
      finalValue = value || '11px';
    } else if (name === 'button_icon_size') {
      finalValue = value || '13px';
    } else if (name === 'width') {
      finalValue = value || '100%';
    } else if (name === 'display_mode') {
      finalValue = value || 'min_value';
      // 当切换到显示最小值模式时，清理specific_entity_id
      if (finalValue === 'min_value') {
        this.config = {
          ...this.config,
          [name]: finalValue,
          specific_entity_id: undefined
        };
        
        this.dispatchEvent(new CustomEvent('config-changed', {
          detail: { config: this.config },
          bubbles: true,
          composed: true
        }));
        
        this.requestUpdate();
        return;
      }
    } else if (name === 'decimal_precision') {
      finalValue = value !== undefined ? parseInt(value) : 1;
    } else if (name === 'tap_action') {
      // 处理 tap_action 的特殊逻辑
      if (value === 'tap_action') {
        // 如果是弹出卡片，则不设置 tap_action，让组件使用默认逻辑
        finalValue = undefined;
      } else {
        finalValue = value;
      }
    }
    /*button新按钮方法 结束*/

    this.config = {
      ...this.config,
      [name]: finalValue
    };
    
    this.dispatchEvent(new CustomEvent('config-changed', {
      detail: { config: this.config },
      bubbles: true,
      composed: true
    }));
  }

  _onEntitySearch(e) {
    const searchTerm = e.target.value.toLowerCase();
    this._searchTerm = searchTerm;
    this._showEntityList = true;
    
    if (!this.hass) return;
    
    // 获取所有实体
    const allEntities = Object.values(this.hass.states);
    
    // 过滤实体
    this._filteredEntities = allEntities.filter(entity => {
      const entityId = entity.entity_id.toLowerCase();
      const friendlyName = (entity.attributes.friendly_name || '').toLowerCase();
      
      return entityId.includes(searchTerm) || friendlyName.includes(searchTerm);
    }).slice(0, 50); // 限制显示数量
    
    this.requestUpdate();
  }

  _toggleEntity(entityId) {
    const currentEntities = this.config.entities || [];
    let newEntities;
    
    if (currentEntities.some(e => e.entity_id === entityId)) {
      // 移除实体
      newEntities = currentEntities.filter(e => e.entity_id !== entityId);
    } else {
      // 添加实体
      const newEntity = { 
        entity_id: entityId,
        overrides: undefined
      };
      // 只有在明确指定属性时才添加 attribute 字段
      newEntities = [...currentEntities, newEntity];
    }
    
    this.config = {
      ...this.config,
      entities: newEntities
    };
    
    this.dispatchEvent(new CustomEvent('config-changed', {
      detail: { config: this.config },
      bubbles: true,
      composed: true
    }));
    
    this.requestUpdate();
  }

  _removeEntity(index) {
    const currentEntities = this.config.entities || [];
    const newEntities = currentEntities.filter((_, i) => i !== index);
    
    this.config = {
      ...this.config,
      entities: newEntities
    };
    
    this.dispatchEvent(new CustomEvent('config-changed', {
      detail: { config: this.config },
      bubbles: true,
      composed: true
    }));
    
    this.requestUpdate();
  }

  _updateEntityAttribute(index, attributeValue) {
    const currentEntities = this.config.entities || [];
    const newEntities = [...currentEntities];
    
    if (newEntities[index]) {
      const updatedEntity = { ...newEntities[index] };
      
      if (attributeValue.trim()) {
        // 只有当属性值不为空时才设置 attribute 字段
        updatedEntity.attribute = attributeValue.trim();
      } else {
        // 如果属性值为空，则移除 attribute 字段
        delete updatedEntity.attribute;
      }
      
      newEntities[index] = updatedEntity;
    }
    
    this.config = {
      ...this.config,
      entities: newEntities
    };
    
    this.dispatchEvent(new CustomEvent('config-changed', {
      detail: { config: this.config },
      bubbles: true,
      composed: true
    }));
    
    this.requestUpdate();
  }

  _updateEntityOverride(index, overrideType, enabled) {
    const currentEntities = this.config.entities || [];
    const newEntities = [...currentEntities];
    
    if (newEntities[index]) {
      const overrides = { ...newEntities[index].overrides };
      
      if (enabled) {
        // 启用覆盖，设置默认值
        overrides[overrideType] = '';
      } else {
        // 禁用覆盖，删除该属性
        delete overrides[overrideType];
      }
      
      newEntities[index] = {
        ...newEntities[index],
        overrides: Object.keys(overrides).length > 0 ? overrides : undefined
      };
    }
    
    this.config = {
      ...this.config,
      entities: newEntities
    };
    
    this.dispatchEvent(new CustomEvent('config-changed', {
      detail: { config: this.config },
      bubbles: true,
      composed: true
    }));
    
    this.requestUpdate();
  }

  _updateEntityOverrideValue(index, overrideType, value) {
    const currentEntities = this.config.entities || [];
    const newEntities = [...currentEntities];
    
    if (newEntities[index] && newEntities[index].overrides && newEntities[index].overrides[overrideType] !== undefined) {
      const overrides = { ...newEntities[index].overrides };
      overrides[overrideType] = value.trim();
      
      newEntities[index] = {
        ...newEntities[index],
        overrides: overrides
      };
    }
    
    this.config = {
      ...this.config,
      entities: newEntities
    };
    
    this.dispatchEvent(new CustomEvent('config-changed', {
      detail: { config: this.config },
      bubbles: true,
      composed: true
    }));
    
    this.requestUpdate();
  }

  // 点击外部关闭下拉列表
  firstUpdated() {
    document.addEventListener('click', (e) => {
      if (!e.target.closest('.entity-selector')) {
        this._showEntityList = false;
        this._showSpecificEntityList = false; //button新元素
        this.requestUpdate();
      }
    });
  }

  //button新元素 开始
  _onSpecificEntitySearch(e) {
    const searchTerm = e.target.value.toLowerCase();
    this._specificSearchTerm = searchTerm;
    this._showSpecificEntityList = true;
    
    if (!this.hass) return;
    
    // 获取所有实体
    const allEntities = Object.values(this.hass.states);
    
    // 过滤实体
    this._specificFilteredEntities = allEntities.filter(entity => {
      const entityId = entity.entity_id.toLowerCase();
      const friendlyName = (entity.attributes.friendly_name || '').toLowerCase();
      
      return entityId.includes(searchTerm) || friendlyName.includes(searchTerm);
    }).slice(0, 50); // 限制显示数量
    
    this.requestUpdate();
  }

  _getSpecificEntityDisplayName() {
    const specificEntityId = this.config.specific_entity_id;
    if (specificEntityId) {
      return specificEntityId;
    }
    return '';
  }

  _selectSpecificEntity(entityId) {
    this.config = {
      ...this.config,
      specific_entity_id: entityId
    };
    
    this.dispatchEvent(new CustomEvent('config-changed', {
      detail: { config: this.config },
      bubbles: true,
      composed: true
    }));
    
    // 选中后隐藏下拉列表
    this._showSpecificEntityList = false;
    this._specificSearchTerm = '';
    
    this.requestUpdate();
  }
  //button新元素 结束

  constructor() {
    super();
    this._searchTerm = '';
    this._filteredEntities = [];
    this._showEntityList = false;
    this._specificSearchTerm = ''; //button新元素
    this._specificFilteredEntities = []; //button新元素
    this._showSpecificEntityList = false; //button新元素
  }

  setConfig(config) {
    this.config = config;
  }
} 
customElements.define('xiaoshi-balance-button-editor', XiaoshiBalanceButtonEditor);

class XiaoshiBalanceButton extends LitElement {
  static get properties() {
    return {
      hass: Object,
      config: Object,
      _oilPriceData: Array,
      _loading: Boolean,
      _refreshInterval: Number,
      _dataLoaded: Boolean,   //button新元素
      theme: { type: String }
    };
  }

  static get styles() {
    return css`
      :host {
        display: block;
        width: var(--card-width, 100%);
      }

      /*button新元素 开始*/
      .balance-status {
        width: var(--button-width, 65px);
        height: var(--button-height, 24px);
        padding: 0;
        margin: 0;
        background: var(--bg-color, #fff);
        color: var(--fg-color, #000);
        border-radius: 10px;
        font-size: var(--button-font-size, 11px);
        font-weight: 500;
        text-align: center;
        box-sizing: border-box;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 0;
        cursor: pointer;
        transition: background-color 0.2s, transform 0.1s;
        position: relative;
      }

      .status-icon {
        --mdc-icon-size: var(--button-icon-size, 13px);
        color: var(--fg-color, #000);
        margin-right: 3px;
      }

      /*button新元素 结束*/

      ha-card {
        width: 100%;
        height: 100%;
        display: flex;
        flex-direction: column;
        background: var(--bg-color, #fff);
        border-radius: 12px;
      }

      /*标题容器*/
      .card-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 16px;
        background: var(--bg-color, #fff);
        border-radius: 12px;
      }

      /*标题红色圆点*/
      .offline-indicator {
        display: inline-block;
        width: 8px;
        height: 8px;
        border-radius: 50%;
        margin-right: 8px;
      }

      /*标题红色圆点动画*/
      @keyframes pulse {
        0% { opacity: 1; }
        50% { opacity: 0.5; }
        100% { opacity: 1; }
      }

      /*标题*/
      .card-title {
        font-size: 20px;
        font-weight: 500;
        color: var(--fg-color, #000);
        height: 30px;
        line-height: 30px;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      /*标题统计数字*/
      .device-count {
        color: var(--fg-color, #000);
        border-radius: 8px;
        font-size: 13px;
        width: 30px;
        height: 30px;
        text-align: center;
        line-height: 30px;
        font-weight: bold;
        padding: 0px;
      }
      
      .device-count.non-zero {
        background: rgb(2, 250, 250, 0.5);
      }
      
      .device-count.zero {
        background: rgb(0, 205, 0);
      }

      /*标题刷新按钮*/
      .refresh-btn {
        color: var(--fg-color, #fff);
        border: none;
        border-radius: 8px;
        padding: 5px;
        cursor: pointer;
        font-size: 13px;
        width: 50px;
        height: 30px;
        line-height: 30px;
        text-align: center;
        font-weight: bold;
        padding: 0px;
      }

      /*2级标题*/
      .section-divider {
        margin: 0 0 8px 0;
        padding: 8px 8px;
        background: var(--bg-color, #fff);
        font-weight: 500;
        color: var(--fg-color, #000);
        border-top: 1px solid rgb(150,150,150,0.5);
        border-bottom: 1px solid rgb(150,150,150,0.5);
        margin: 0 16px 0 16px;

      }
      
      /*2级标题字体*/
      .section-title {
        display: flex;
        align-items: center;
        justify-content: space-between;
        color: var(--fg-color, #000);
        font-size: 13px;
      }

      /*2级标题,统计数量字体*/
      .section-count {
        background: rgb(255,0,0,0.5);
        color: var(--fg-color, #000);
        border-radius: 12px;
        width: 15px;
        height: 15px;
        text-align: center;
        line-height: 15px;
        padding: 3px;
        font-size: 12px;
        font-weight: bold;
      }

      /*设备、实体明细*/
      .device-item {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin: 0px 16px;
        padding: 8px 0;
        border-bottom: 1px solid rgb(150,150,150,0.5);
        cursor: pointer;
        transition: background-color 0.2s;
      }

      .device-item:first-child {
        border-top: 1px solid rgb(150,150,150,0.5);
      }

      .device-item:hover {
        background-color: rgba(150,150,150,0.1);
      }

      /*设备、实体明细背景*/
      .devices-list {
        flex: 1;
        overflow-y: auto;
        min-height: 0;
        padding: 0 0 8px 0;
      }

      .device-left {
        display: flex;
        align-items: center;
        flex: 1;
        min-width: 0;
      }

      .device-icon {
        margin-right: 12px;
        color: var(--fg-color, #000);
        flex-shrink: 0;
      }

      .device-name {
        color: var(--fg-color, #000);
        font-size: 12px;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .device-value {
        color: var(--fg-color, #000);
        font-size: 12px;
        margin-left: auto;
        flex-shrink: 0;
        font-weight: bold;
      }

      .device-value.warning {
        color: var(--warning-color, rgb(255, 0, 0));
      }

      .device-unit {
        font-size: 12px;
        color: var(--fg-color, #000);
        margin-left: 4px;
        font-weight: bold;
      }

      .device-unit.warning {
        color: var(--warning-color, rgb(255, 0, 0));
      }

      .no-devices {
        text-align: center;
        padding: 10px 0;
        color: var(--fg-color, #000);
      }

      .loading {
        text-align: center;
        padding: 10px 0;
        color: var(--fg-color, #000);
      }
    `;
  }

  constructor() {
    super();
    this._oilPriceData = [];
    this._loading = false;
    this._refreshInterval = null;
    this.theme = 'on';
  }

  static getConfigElement() {
    return document.createElement("xiaoshi-balance-button-editor");
  }

  connectedCallback() {
    super.connectedCallback();
    this._loadOilPriceData();
    
    // 设置主题属性
    this.setAttribute('theme', this._evaluateTheme());

    // 每300秒刷新一次数据，减少频繁刷新
    this._refreshInterval = setInterval(() => {
      this._loadOilPriceData();
    }, 300000);
  }

  _evaluateTheme() {
    try {
      if (!this.config || !this.config.theme) return 'on';
      if (typeof this.config.theme === 'function') {
          return this.config.theme();
      }
      if (typeof this.config.theme === 'string' && 
              (this.config.theme.includes('return') || this.config.theme.includes('=>'))) {
          return (new Function(`return ${this.config.theme}`))();
      }
      return this.config.theme;
    } catch(e) {
      console.error('计算主题时出错:', e);
      return 'on';
    }
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    if (this._refreshInterval) {
      clearInterval(this._refreshInterval);
    }
  }

  async _loadOilPriceData() {
    if (!this.hass) return;
    
    // button新元素 开始 删除下面
    // this._loading = true;
    // this.requestUpdate();
    // button新元素 介素 删除下面

    try {
      const entities = this.config.entities || [];
      const balanceData = [];

      for (const entityConfig of entities) {
        const entityId = entityConfig.entity_id;
        const attributeName = entityConfig.attribute;
        const entity = this.hass.states[entityId];
        if (!entity) continue;

        const attributes = entity.attributes;
        let value = entity.state;
        let unit = '元';

        // 如果指定了属性，则使用属性值
        if (attributeName && attributes[attributeName] !== undefined) {
          value = attributes[attributeName];
        }

        // 尝试从属性中获取单位
        if (attributes.unit_of_measurement) {
          unit = attributes.unit_of_measurement;
        } else {
          // 如果实体没有单位，则不显示单位
          unit = '';
        }

        // 应用属性重定义
        let friendlyName = attributes.friendly_name || entityId;
        let icon = attributes.icon || 'mdi:help-circle';
        let warningThreshold = undefined;
        
        // 应用用户自定义的重定义
        if (entityConfig.overrides) {
          if (entityConfig.overrides.name !== undefined && entityConfig.overrides.name !== '') {
            friendlyName = entityConfig.overrides.name;
          }
          if (entityConfig.overrides.icon !== undefined && entityConfig.overrides.icon !== '') {
            icon = entityConfig.overrides.icon;
          }
          if (entityConfig.overrides.unit_of_measurement !== undefined && entityConfig.overrides.unit_of_measurement !== '') {
            unit = entityConfig.overrides.unit_of_measurement;
          }
          if (entityConfig.overrides.warning !== undefined && entityConfig.overrides.warning !== '') {
            warningThreshold = entityConfig.overrides.warning; // 保持原始字符串
          }
        }

        balanceData.push({
          entity_id: entityId,
          friendly_name: friendlyName,
          value: value,
          unit: unit,
          icon: icon,
          warning_threshold: warningThreshold
        });
      }

      this._oilPriceData = balanceData;
    } catch (error) {
      console.error('加载设备余额数据失败:', error);
      this._oilPriceData = [];
    }

    this._loading = false;
  }

  _handleRefresh() {
    this._handleClick();
    this._loadOilPriceData();
  }

  _handleEntityClick(entity) {
    this._handleClick();
    // 点击实体时打开实体详情页
    if (entity.entity_id) {
      const evt = new Event('hass-more-info', { composed: true });
      evt.detail = { entityId: entity.entity_id };
      this.dispatchEvent(evt);
    }
  }

  _handleClick(){
    const hapticEvent = new Event('haptic', {
      bubbles: true,
      cancelable: false,
      composed: true
    });
    hapticEvent.detail = 'light';
    this.dispatchEvent(hapticEvent);
  }

  /*button新元素 开始*/
  _handleButtonClick() {
    const tapAction = this.config.tap_action;
    
    if (!tapAction || tapAction !== 'none') {
      // 默认 tap_action 行为：弹出垂直堆叠卡片
      const excludedParams = ['type', 'button_height', 'button_width', 'button_font_size', 'button_icon_size', 'show_preview', 'tap_action'];
      
      // 构建垂直堆叠卡片的内容
      const cards = [];
      
      // 1. 添加余额信息卡片
      const balanceCardConfig = {};
      Object.keys(this.config).forEach(key => {
        if (!excludedParams.includes(key) && key !== 'other_cards' && key !== 'no_preview') {
          balanceCardConfig[key] = this.config[key];
        }
      });
      
      cards.push({
        type: 'custom:xiaoshi-balance-card',
        ...balanceCardConfig
      });
      
      // 2. 添加附加卡片
      if (this.config.other_cards && this.config.other_cards.trim()) {
        try {
          const additionalCardsConfig = this._parseYamlCards(this.config.other_cards);
          
          // 为每个附加卡片传递 theme 值
          const cardsWithTheme = additionalCardsConfig.map(card => {
            // 如果卡片没有 theme 配置，则从当前卡片配置中传递
            if (!card.theme && this.config.theme) {
              return {
                ...card,
                theme: this.config.theme
              };
            }
            return card;
          });
          
          cards.push(...cardsWithTheme);
        } catch (error) {
          console.error('解析附加卡片配置失败:', error);
        }
      }
      
      // 创建垂直堆叠卡片
      const popupContent = {
        type: 'vertical-stack',
        cards: cards
      };
      
      const popupStyle = this.config.popup_style || `
        --mdc-theme-surface: rgb(0,0,0,0); 
        --dialog-backdrop-filter: blur(10px) brightness(1);
        --ha-dialog-scrim-backdrop-filter: blur(10px) brightness(1);
      `;
      
      if (window.browser_mod) {
        window.browser_mod.service('popup', { 
          style: popupStyle,
          content: popupContent
        });
      } else {
        console.warn('browser_mod not available, cannot show popup');
      }
    }
    this._handleClick();
  }

  _parseYamlCards(yamlString) {
    try {
      const lines = yamlString.split('\n');
      const cards = [];
      let currentCard = null;
      let indentStack = [];
      let contextStack = [];
      
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const trimmed = line.trim();
        
        if (!trimmed || trimmed.startsWith('#')) continue;
        
        const indentLevel = line.length - line.trimStart().length;
        if (trimmed.startsWith('- type')) {
          if (currentCard) {
            cards.push(currentCard);
            currentCard = null;
            indentStack = [];
            contextStack = [];
          }
          const content = trimmed.substring(1).trim();
          if (content.includes(':')) {
            const [key, ...valueParts] = content.split(':');
            const value = valueParts.join(':').trim();
            currentCard = {};
            this._setNestedValue(currentCard, key.trim(), this._parseValue(value));
          } else {
            currentCard = { type: content };
          }
          
          indentStack = [indentLevel];
          contextStack = [currentCard];
        } else if (currentCard && trimmed.startsWith('-')) {
          while (indentStack.length > 1 && indentLevel <= indentStack[indentStack.length - 1]) {
            indentStack.pop();
            contextStack.pop();
          }
          
          let currentContext = contextStack[contextStack.length - 1];
          const itemValue = trimmed.substring(1).trim();
          
          if (!Array.isArray(currentContext)) {
            if (contextStack.length > 1) {
              const parentContext = contextStack[contextStack.length - 2];
              for (let key in parentContext) {
                if (parentContext[key] === currentContext) {
                  parentContext[key] = [];
                  contextStack[contextStack.length - 1] = parentContext[key];
                  currentContext = parentContext[key];
                  break;
                }
              }
            }
          }
          if (Array.isArray(currentContext)) {
            if (itemValue.includes(':')) {
              const [key, ...valueParts] = itemValue.split(':');
              const value = valueParts.join(':').trim();
              const obj = {};
              obj[key.trim()] = this._parseValue(value);
              currentContext.push(obj);
            } else {
              currentContext.push(this._parseValue(itemValue));
            }
          }
        } else if (currentCard && trimmed.includes(':')) {
          const [key, ...valueParts] = trimmed.split(':');
          const value = valueParts.join(':').trim();
          const keyName = key.trim();
          
          while (indentStack.length > 1 && indentLevel <= indentStack[indentStack.length - 1]) {
            indentStack.pop();
            contextStack.pop();
          }
          
          const currentContext = contextStack[contextStack.length - 1];
          
          if (value) {
            this._setNestedValue(currentContext, keyName, this._parseValue(value));
          } else {
            let nextLine = null, nextIndent = null;
            for (let j = i + 1; j < lines.length; j++) {
              const nextTrimmed = lines[j].trim();
              if (nextTrimmed && !nextTrimmed.startsWith('#')) {
                nextLine = nextTrimmed;
                nextIndent = lines[j].length - lines[j].trimStart().length;
                break;
              }
            }
            
            currentContext[keyName] = (nextLine && nextLine.startsWith('-') && nextIndent > indentLevel) 
              ? [] : (currentContext[keyName] || {});
            
            indentStack.push(indentLevel);
            contextStack.push(currentContext[keyName]);
          }
        }
      }
      
      if (currentCard) cards.push(currentCard);
      
      return cards;
    } catch (error) {
      console.error('YAML解析错误:', error);
      return [];
    }
  }
  
  _parseValue(value) {
    if (!value) return '';
    
    // 移除引号
    if ((value.startsWith('"') && value.endsWith('"')) || 
        (value.startsWith("'") && value.endsWith("'"))) {
      return value.slice(1, -1);
    }
    
    // 尝试解析为数字
    if (!isNaN(value) && value.trim() !== '') {
      return Number(value);
    }
    
    // 尝试解析为布尔值
    if (value === 'true') return true;
    if (value === 'false') return false;
    if (value === 'null') return null;
    
    // 返回字符串
    return value;
  }
  
  _setNestedValue(obj, path, value) {
    // 支持嵌套路径，如 "styles.card"
    const keys = path.split('.');
    let current = obj;
    
    for (let i = 0; i < keys.length - 1; i++) {
      const key = keys[i];
      if (!current[key] || typeof current[key] !== 'object') {
        current[key] = {};
      }
      current = current[key];
    }
    
    current[keys[keys.length - 1]] = value;
  }

  /*button新元素 结束*/

  _evaluateWarningCondition(value, condition) {
    if (!condition) return false;
    
    // 解析条件字符串，支持操作符后可能有空格
    const match = condition.match(/^(>=|<=|>|<|==|!=)\s*(.+)$/);
    if (!match) return false;
    
    const operator = match[1];
    let compareValue = match[2].trim();
    
    // 移除比较值两端的引号（如果有的话）
    if ((compareValue.startsWith('"') && compareValue.endsWith('"')) || 
        (compareValue.startsWith("'") && compareValue.endsWith("'"))) {
      compareValue = compareValue.slice(1, -1);
    }
    
    // 尝试将值转换为数字
    const numericValue = parseFloat(value);
    const numericCompare = parseFloat(compareValue);
    
    // 如果两个值都是数字，进行数值比较
    if (!isNaN(numericValue) && !isNaN(numericCompare)) {
      switch (operator) {
        case '>': return numericValue > numericCompare;
        case '>=': return numericValue >= numericCompare;
        case '<': return numericValue < numericCompare;
        case '<=': return numericValue <= numericCompare;
        case '==': return numericValue === numericCompare;
        case '!=': return numericValue !== numericCompare;
      }
    }
    
    // 字符串比较（用于 ==on, ==off, ==66 66 等）
    const stringValue = String(value);
    const stringCompare = compareValue;
    
    switch (operator) {
      case '==': return stringValue === stringCompare;
      case '!=': return stringValue !== stringCompare;
      case '>': return stringValue > stringCompare;
      case '>=': return stringValue >= stringCompare;
      case '<': return stringValue < stringCompare;
      case '<=': return stringValue <= stringCompare;
    }
    
    return false;
  }


  render() {
    if (!this.hass) {
      return html`<div class="loading">等待Home Assistant连接...</div>`;
    }
    // 获取主题和颜色
    const theme = this._evaluateTheme();
    const fgColor = theme === 'on' ? 'rgb(0, 0, 0)' : 'rgb(255, 255, 255)';
    const bgColor = theme === 'on' ? 'rgb(255, 255, 255)' : 'rgb(50, 50, 50)';
    

    /*button新元素 前9行和最后1行开始*/
    const showPreview = this.config.no_preview === true;
    
    // 获取新参数
    const transparentBg = this.config.transparent_bg === true;
    const hideIcon = this.config.hide_icon === true;
    const lockWhiteFg = this.config.lock_white_fg === true;
    const buttonIcon = this.config.button_icon || 'mdi:cellphone';
    
    // 设置背景颜色
    const buttonBgColor = transparentBg ? 'transparent' : theme === 'on' ? 'rgb(255, 255, 255, 0.6)' : 'rgb(83, 83, 83, 0.6)';
    
    // 获取显示模式
    const displayMode = this.config.display_mode || 'min_value';
    // 获取小数点精度
    const decimalPrecision = this.config.decimal_precision !== undefined ? parseInt(this.config.decimal_precision) : 1;
    
    // 计算显示值
    let displayValue = null;
    let displayUnit = '元';
    let isWarning = false; // 是否处于预警状态
    
    if (displayMode === 'min_value') {
      // 显示最小值模式
      const numericValues = this._oilPriceData
        .map(item => {
          const value = parseFloat(item.value);
          return { value: isNaN(value) ? null : value, item };
        })
        .filter(item => item.value !== null);
      
      if (numericValues.length > 0) {
        // 找到最小值
        const minValue = Math.min(...numericValues.map(item => item.value));
        const minItem = numericValues.find(item => item.value === minValue);
        displayValue = minValue;
        displayUnit = '元';
        
        // 检查全局预警条件
        if (this.config.global_warning && this.config.global_warning.trim() !== '') {
          isWarning = this._evaluateWarningCondition(displayValue, this.config.global_warning);
        }
      } else {
        displayValue = '无有效数值';
        displayUnit = '';
      }
    } else if (displayMode === 'specific_entity') {
      // 显示指定实体模式
      const specificEntityId = this.config.specific_entity_id;
      if (specificEntityId) {
        // 直接从hass状态中获取实体数据
        const entity = this.hass.states[specificEntityId];
        if (entity) {
          const rawValue = entity.state;
          displayValue = parseFloat(rawValue);
          displayUnit = entity.attributes.unit_of_measurement || '元';
          
          // 如果不是数字，直接显示原始值
          if (isNaN(displayValue)) {
            displayValue = rawValue;
          } else {
            // 检查全局预警条件
            if (this.config.global_warning && this.config.global_warning.trim() !== '') {
              isWarning = this._evaluateWarningCondition(displayValue, this.config.global_warning);
            }
          }
        } else {
          displayValue = '实体未找到';
          displayUnit = '';
        }
      } else {
        displayValue = '请选择实体';
        displayUnit = '';
      }
    }
    
    // 格式化显示值
    let formattedDisplayValue;
    if (typeof displayValue === 'number') {
      formattedDisplayValue = displayValue.toFixed(decimalPrecision);
      // 移除末尾多余的0
      formattedDisplayValue = parseFloat(formattedDisplayValue).toString();
    } else {
      formattedDisplayValue = displayValue;
    }
    
    // 构建显示文本
    const displayText = formattedDisplayValue !== null && displayUnit ? `${formattedDisplayValue}${displayUnit}` : formattedDisplayValue;
    
    // 获取预警颜色
    const warningColor = this.config.warning_color || 'rgb(255, 0, 0)';
    
    // 根据预警状态设置数字颜色，应用锁定白色功能
    let numberColor, iconColor;
    if (isWarning) {
      // 预警状态：数字始终使用红色，图标根据锁定白色设置
      numberColor = warningColor;
      iconColor = lockWhiteFg ? 'rgb(255, 255, 255)' : fgColor;
    } else {
      // 非预警状态：数字和图标都根据锁定白色设置
      numberColor = lockWhiteFg ? 'rgb(255, 255, 255)' : fgColor;
      iconColor = lockWhiteFg ? 'rgb(255, 255, 255)' : fgColor;
    }
    
    // 渲染按钮
    const buttonHtml = html`
      <div class="balance-status" style="--fg-color: ${numberColor}; --bg-color: ${buttonBgColor};" @click=${this._handleButtonClick}>
      ${!hideIcon ? html`<ha-icon class="status-icon" style="color: ${iconColor};" icon="${buttonIcon}"></ha-icon>` : ''}
        <span style="color: ${numberColor};">${displayText}</span>
      </div>
    `;

    // 返回最终的渲染结果（包括按钮和预览卡片）
    return html`
      ${buttonHtml}
      ${showPreview ? html`
      <div class="form-group">
        <label>👇👇👇下面是弹出卡片内容👇👇👇</label>
      </div>

      <ha-card style="--fg-color: ${fgColor}; --bg-color: ${bgColor}; --warning-color: ${this.config.warning_color || 'rgb(255, 0, 0)'};">
        <div class="card-header">
          <div class="card-title">
            <span class="offline-indicator" style="background: rgb(0,222,220); animation: pulse 2s infinite"></span>
            ${this.config.name || '电话余额信息'}
          </div>
        </div>
        
        <div class="devices-list">
          ${this._loading ? 
            html`<div class="loading">加载中...</div>` :
            
            this._oilPriceData.length === 0 ? 
              html`<div class="no-devices">请配置余额实体</div>` :
              html`
                ${this._oilPriceData.map(balanceData => {
                  // 明细预警优先级最高
                  let isWarning = false;
                  
                  // 首先检查明细预警，如果存在且满足条件，直接设为预警状态
                  if (balanceData.warning_threshold && balanceData.warning_threshold.trim() !== '') {
                    isWarning = this._evaluateWarningCondition(balanceData.value, balanceData.warning_threshold); 
                  } else {
                    // 只有在没有明细预警时才检查全局预警
                    if (this.config.global_warning && this.config.global_warning.trim() !== '') {
                      isWarning = this._evaluateWarningCondition(balanceData.value, this.config.global_warning);
                    }
                  }
                  
                  return html`
                    <div class="device-item" @click=${() => this._handleEntityClick(balanceData)}>
                      <div class="device-left">
                        <ha-icon class="device-icon" icon="${balanceData.icon}"></ha-icon>
                        <div class="device-name">${balanceData.friendly_name}</div>
                      </div>
                      <div class="device-value ${isWarning ? 'warning' : ''}">
                        ${balanceData.value}
                        <span class="device-unit ${isWarning ? 'warning' : ''}">${balanceData.unit}</span>
                      </div>
                    </div>
                  `;
                })}
              `
          }
        </div>
      </ha-card>
      ` : html``}
    `;
     /*button新元素 结束*/
  }

  setConfig(config) {
    /*button新元素 开始*/
    // 不设置默认值，只有明确配置时才添加 no_preview
    this.config = {
      ...config
    };
    if (config.button_width) {
      this.style.setProperty('--button-width', config.button_width);
    } else {
      this.style.setProperty('--button-width', '65px');
    }
    
    // 设置按钮高度（只控制 balance-status）
    if (config.button_height) {
      this.style.setProperty('--button-height', config.button_height);
    } else {
      this.style.setProperty('--button-height', '24px');
    }
    
    // 设置按钮文字大小（只控制 balance-status）
    if (config.button_font_size) {
      this.style.setProperty('--button-font-size', config.button_font_size);
    } else {
      this.style.setProperty('--button-font-size', '11px');
    }
    
    // 设置按钮图标大小（只控制 balance-status）
    if (config.button_icon_size) {
      this.style.setProperty('--button-icon-size', config.button_icon_size);
    } else {
      this.style.setProperty('--button-icon-size', '13px');
    }
    
    // 设置卡片宽度（控制原来的 UI）
    if (config.width) {
      this.style.setProperty('--card-width', config.width);
    } else {
      this.style.setProperty('--card-width', '100%');
    }
    
    /*button新元素 结束*/

    // 设置预警颜色
    if (config.warning_color) {
      this.style.setProperty('--warning-color', config.warning_color);
    } else {
      this.style.setProperty('--warning-color', 'rgb(255, 0, 0)');
    }

    if (config.theme) {
      this.setAttribute('theme', config.theme);
    }
  }

  getCardSize() {
    // 根据设备余额实体数量动态计算卡片大小
    const baseSize = 3;
    const entitySize = Math.max(0, Math.min(this._oilPriceData.length * 2, 10));
    return baseSize + entitySize;
  }
}
customElements.define('xiaoshi-balance-button', XiaoshiBalanceButton);
