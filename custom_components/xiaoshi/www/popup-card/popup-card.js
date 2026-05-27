window.GlobalPopupController = {
  hass: null,
  _popupStack: [],
  _escHandler: null,
  _hassUnsubscribe: null,
  _updatePending: false,
  _hassVersion: 0,
  _retryTimers: [],       // 追踪所有重试定时器
  _pollTimer: null,       // 服务拦截轮询定时器
  _cardCache: new Map(),  // 卡片元素缓存 (LRU, 最大5条)
  _isVisible: true,       // 页面是否可见
  _staleUpdate: false,    // 页面不可见期间是否有待处理的更新

  init() {
    this._startHassWatcher();
  },

  // 从卡片配置中递归提取所有关联的实体ID
  _extractEntities(config) {
    const entities = new Set();
    if (!config || typeof config !== 'object') return entities;

    if (config.entity) {
      entities.add(config.entity);
    }
    if (config.entities) {
      const list = Array.isArray(config.entities) ? config.entities : Object.keys(config.entities);
      list.forEach(e => {
        if (typeof e === 'string') entities.add(e);
        else if (e && e.entity) entities.add(e.entity);
      });
    }
    if (config.cards) {
      config.cards.forEach(c => this._extractEntities(c).forEach(e => entities.add(e)));
    }
    if (config.elements) {
      Object.values(config.elements).forEach(el => {
        if (el && typeof el === 'object') {
          this._extractEntities(el).forEach(e => entities.add(e));
        }
      });
    }

    return entities;
  },

  // 生成卡片配置的缓存 key
  _cacheKey(cardConfig) {
    return JSON.stringify(cardConfig);
  },

  // 从缓存获取卡片元素 (LRU)
  _getCachedCard(cardConfig) {
    const key = this._cacheKey(cardConfig);
    const cached = this._cardCache.get(key);
    if (cached && cached.cardElement) {
      this._cardCache.delete(key);
      this._cardCache.set(key, cached);
      return cached.cardElement;
    }
    return null;
  },

  // 将卡片元素存入缓存 (超出上限时淘汰最旧的)
  _cacheCard(cardConfig, cardElement) {
    const key = this._cacheKey(cardConfig);
    this._cardCache.delete(key);

    if (this._cardCache.size >= 5) {
      const oldestKey = this._cardCache.keys().next().value;
      this._cardCache.delete(oldestKey);
    }

    this._cardCache.set(key, { cardElement });
  },

  // 清空卡片缓存
  _clearCardCache() {
    this._cardCache.clear();
  },

  // 启动服务拦截轮询
  _startPollTimer() {
    if (this._pollTimer) return;
    this._pollTimer = setInterval(() => {
      const haRoot = document.querySelector('home-assistant');
      const hassObj = haRoot?.hass || haRoot?.shadowRoot?.querySelector('home-assistant-main')?.hass;
      if (hassObj && hassObj.callService && !hassObj._originalCallService) {
        interceptCallService();
      }
    }, 3000);
  },

  // 停止服务拦截轮询
  _stopPollTimer() {
    if (this._pollTimer) {
      clearInterval(this._pollTimer);
      this._pollTimer = null;
    }
  },

  // 订阅 hass 状态变化
  _startHassWatcher() {
    const haRoot = document.querySelector('home-assistant');
    const hass = haRoot?.hass || haRoot?.shadowRoot?.querySelector('home-assistant-main')?.hass;

    if (!hass || !hass.connection) {
      const timer = setTimeout(() => this._startHassWatcher(), 500);
      this._retryTimers.push(timer);
      return;
    }

    this.hass = hass;

    try {
      hass.connection.subscribeMessage(
        (msg) => {
          if (this._popupStack.length === 0) return;

          const entityId = msg.data?.entity_id;
          if (!entityId) return;

          // 检查是否有弹窗关心这个实体的变化
          const needsUpdate = this._popupStack.some(popupInfo => {
            const tracked = popupInfo._trackedEntities;
            // 未追踪或追踪了该实体时需要更新
            return !tracked || tracked.size === 0 || tracked.has(entityId);
          });

          if (!needsUpdate) return;

          // 使用 RAF 批处理，合并同一帧内的多次状态变化
          this._scheduleUpdate();
        },
        { type: 'subscribe_events', event_type: 'state_changed' }
      ).then((unsub) => {
        this._hassUnsubscribe = unsub;
      });
    } catch (err) {
      console.error('[popup_card] 订阅状态变化失败:', err);
    }
  },

  // RAF 批处理调度，每帧最多触发一次更新
  _scheduleUpdate() {
    if (this._updatePending) return;
    // 页面不可见时标记为待更新，回来后统一处理
    if (!this._isVisible) {
      this._staleUpdate = true;
      return;
    }
    this._updatePending = true;
    requestAnimationFrame(() => {
      this._updatePending = false;
      const haRoot = document.querySelector('home-assistant');
      const newHass = haRoot?.hass || haRoot?.shadowRoot?.querySelector('home-assistant-main')?.hass;

      // hass 引用未变化时跳过（HA 通常在状态变化时更新 hass 对象引用）
      if (newHass === this.hass) return;
      this.hass = newHass;
      this._updateAllCards();
    });
  },

  // 只更新需要刷新的弹窗卡片
  _updateAllCards() {
    this._popupStack.forEach(popupInfo => {
      if (popupInfo.cardElement && this.hass) {
        try {
          popupInfo.cardElement.hass = this.hass;
        } catch (err) {
          // 卡片可能已销毁，从栈中标记移除
          console.warn('[popup_card] 更新卡片失败，可能已销毁:', err.message);
        }
      }
    });
  },

  async show(options) {
    const { card, title } = options;
    const hide_header = options.hide_header !== undefined ? options.hide_header : true;
    const background = options.background || '';
    const gap = options.gap;
    const width = options.width || 'auto';
    const top = options.top || '50%';
    const transform = top === '50%' ? 'translate(-50%, -50%)' : 'translateX(-50%)';

    // 检测是否为移动端
    const isMobile = window.innerWidth < 768;

    // 处理数组格式的 card
    let cardConfig = card;
    if (Array.isArray(card)) {
      cardConfig = { type: 'vertical-stack', cards: card };
    }

    // 计算正确的 z-index
    const baseZ = 1000 + this._popupStack.length * 10;
    const overlayZIndex = baseZ;
    const zIndex = baseZ + 5;

    // 创建遮罩层
    const overlay = document.createElement('div');
    overlay.className = 'popup-card-overlay';
    overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.5);
      z-index: ${overlayZIndex};
      -webkit-backdrop-filter: blur(10px);
      backdrop-filter: blur(10px);
    `;

    // 点击遮罩关闭弹窗
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        this.closeTop();
      }
    });

    // 获取添加目标
    const haRoot = document.querySelector('home-assistant');
    let appendTarget = document.body;

    if (haRoot?.shadowRoot) {
      const haMain = haRoot.shadowRoot.querySelector('home-assistant-main');
      if (haMain?.shadowRoot) {
        const lovelace = haMain.shadowRoot.querySelector('ha-panel-lovelace');
        if (lovelace?.shadowRoot) {
          const huiRoot = lovelace.shadowRoot.querySelector('hui-root');
          if (huiRoot) {
            appendTarget = huiRoot.shadowRoot || huiRoot;
          }
        }
      }
    }

    appendTarget.appendChild(overlay);

    // 创建弹窗容器
    const popup = document.createElement('div');
    popup.className = 'popup-card-popup';

    // 检测主题
    const isDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;

    // 根据是否有标题/头部调整样式
    if (hide_header === true) {
      // 隐藏头部模式
      popup.style.cssText = `
        position: fixed;
        top: ${top};
        left: 50%;
        transform: ${transform};
        z-index: ${zIndex};
        background: transparent;
        padding: 0;
        max-width: 100vw;
        max-height: 95vh;
        overflow: auto;
        box-sizing: border-box;
        width: ${width};
        ${background ? '--card-background-color: ' + background + ';' : ''}
        ${background ? '--ha-card-background: ' + background + ';' : ''}
        ${background ? '--ha-card-border-width:0;' : ''}
        ${gap !== undefined ? '--vertical-stack-card-gap: ' + gap + ';' : ''}
      `;
    } else {
      // 正常模式 - 响应式设计
      const padding = isMobile ? '12px' : '16px';
      const headerPadding = isMobile ? '44px' : '60px';

      popup.style.cssText = `
        position: fixed;
        top: ${top};
        left: 50%;
        transform: ${transform};
        z-index: ${zIndex};
        background: ${isDark ? 'rgba(20, 20, 20, 0.6)' : 'rgba(255, 255, 255, 0.6)'};
        border-radius: ${isMobile ? '12px' : '16px'};
        padding: ${headerPadding} ${padding} ${padding} ${padding};
        max-width: 100vw;
        max-height: 95vh;
        overflow: hidden;
        animation: popupFadeIn 0.2s ease-out;
        box-sizing: border-box;
        width: ${width};
        ${background ? '--card-background-color: ' + background + ';' : ''}
        ${background ? '--ha-card-background: ' + background + ';' : ''}
        ${background ? '--ha-card-border-width:0;' : ''}
        ${gap !== undefined ? '--vertical-stack-card-gap: ' + gap + ';' : ''}
      `;

      // 添加标题
      if (title) {
        const titleEl = document.createElement('div');
        titleEl.className = 'popup-card-title';
        titleEl.textContent = title;
        titleEl.style.cssText = `
          position: absolute;
          top: ${isMobile ? '10px' : '12px'};
          left: 50%;
          transform: translateX(-50%);
          font-size: ${isMobile ? '14px' : '16px'};
          font-weight: 600;
          color: ${isDark ? 'rgba(255, 255, 255, 0.9)' : '#2c3e50'};
          white-space: nowrap;
          padding: 0 20px;
          box-sizing: border-box;
        `;
        popup.appendChild(titleEl);
      }

      // 添加关闭按钮
      const closeBtn = document.createElement('button');
      closeBtn.textContent = '✕';
      closeBtn.style.cssText = `
        position: absolute;
        top: ${isMobile ? '8px' : '10px'};
        right: ${isMobile ? '8px' : '12px'};
        width: ${isMobile ? '28px' : '32px'};
        height: ${isMobile ? '28px' : '32px'};
        border: none;
        background: ${isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'};
        color: ${isDark ? 'rgba(255, 255, 255, 0.9)' : '#2c3e50'};
        border-radius: 50%;
        cursor: pointer;
        font-size: ${isMobile ? '14px' : '16px'};
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10;
      `;
      closeBtn.onclick = () => this.closeTop();
      popup.appendChild(closeBtn);
    }

    // 创建卡片内容容器（可滚动）
    const contentContainer = document.createElement('div');
    contentContainer.className = 'popup-card-content';
    const paddingValue = isMobile ? '12px' : '16px';
    contentContainer.style.cssText = `
      overflow-y: auto;
      overflow-x: visible;
      max-height: 95vh;
      -webkit-overflow-scrolling: touch;
      overscroll-behavior: contain;
      padding: 0;
      box-sizing: border-box;
      ${hide_header ? '' : 'padding-top: 8px;'}
    `;

    let cardElement = null;
    try {
      // 尝试从缓存获取卡片元素
      const cachedElement = this._getCachedCard(cardConfig);
      if (cachedElement) {
        cardElement = cachedElement;
        const haRoot = document.querySelector('home-assistant');
        this.hass = haRoot?.hass || haRoot?.shadowRoot?.querySelector('home-assistant-main')?.hass;
        if (this.hass) {
          cardElement.hass = this.hass;
        }
        contentContainer.appendChild(cardElement);
      } else {
        // 使用 Home Assistant 的卡片创建机制
        const helpers = await window.loadCardHelpers?.();
        if (helpers) {
          cardElement = await helpers.createCardElement(cardConfig);

          // 立即设置 hass
          const haRoot = document.querySelector('home-assistant');
          this.hass = haRoot?.hass || haRoot?.shadowRoot?.querySelector('home-assistant-main')?.hass;
          if (this.hass) {
            cardElement.hass = this.hass;
          }

          contentContainer.appendChild(cardElement);
        } else {
          // 备用方案：直接显示配置信息
          contentContainer.innerHTML = `
            <div style="padding: 20px;">
              <p><strong>卡片类型: ${cardConfig.type}</strong></p>
              <pre style="background: #f5f5f5; padding: 10px; border-radius: 8px; overflow: auto;">${JSON.stringify(cardConfig, null, 2)}</pre>
            </div>
          `;
        }
      }
    } catch (err) {
      console.error('[popup_card] 创建卡片失败:', err);
      contentContainer.innerHTML = `<div style="color: red; padding: 20px;">加载卡片失败: ${err.message}</div>`;
    }

    popup.appendChild(contentContainer);
    appendTarget.appendChild(popup);

    // 将弹窗添加到栈中（保存卡片引用 + 追踪实体 + 缓存配置）
    const trackedEntities = this._extractEntities(cardConfig);
    this._popupStack.push({ popup, overlay, appendTarget, cardElement, _trackedEntities: trackedEntities, _cardConfig: cardConfig });

    // 启动 hass 订阅（如果还没订阅）
    if (!this._hassUnsubscribe) {
      this._startHassWatcher();
    }

    // ESC 关闭最上层弹窗
    if (!this._escHandler) {
      this._escHandler = (e) => {
        if (e.key === 'Escape') this.closeTop();
      };
      window.addEventListener('keydown', this._escHandler);
    }
  },

  // 关闭最上层的弹窗
  closeTop() {
    if (this._popupStack.length === 0) return;

    const popupInfo = this._popupStack.pop();

    // 缓存卡片元素（从 popup DOM 中分离，保留元素供复用）
    if (popupInfo.cardElement && popupInfo._cardConfig) {
      popupInfo.cardElement.remove();
      this._cacheCard(popupInfo._cardConfig, popupInfo.cardElement);
    }

    popupInfo.overlay.remove();
    popupInfo.popup.remove();

    // 如果所有弹窗都关闭了，取消 hass 订阅
    if (this._popupStack.length === 0 && this._hassUnsubscribe) {
      this._hassUnsubscribe();
      this._hassUnsubscribe = null;
    }
  },

  // 关闭所有弹窗
  close() {
    // 从后往前关闭所有弹窗
    while (this._popupStack.length > 0) {
      const popupInfo = this._popupStack.pop();

      // 缓存卡片元素
      if (popupInfo.cardElement && popupInfo._cardConfig) {
        popupInfo.cardElement.remove();
        this._cacheCard(popupInfo._cardConfig, popupInfo.cardElement);
      }

      popupInfo.overlay.remove();
      popupInfo.popup.remove();
    }

    // 移除 ESC 监听器
    if (this._escHandler) {
      window.removeEventListener('keydown', this._escHandler);
      this._escHandler = null;
    }

    // 取消 hass 订阅
    if (this._hassUnsubscribe) {
      this._hassUnsubscribe();
      this._hassUnsubscribe = null;
    }

    // 停止服务拦截轮询
    this._stopPollTimer();

    // 清理所有重试定时器
    this._retryTimers.forEach(timer => clearTimeout(timer));
    this._retryTimers = [];

    // 取消待处理的 RAF 更新
    this._updatePending = false;
    this._staleUpdate = false;
  }
};

// 初始化全局控制器
window.GlobalPopupController.init();

// 拦截服务调用
let _interceptRetrying = false;
const interceptCallService = () => {
  const haRoot = document.querySelector('home-assistant');
  if (!haRoot) {
    if (!_interceptRetrying) {
      _interceptRetrying = true;
      const timer = setTimeout(() => {
        _interceptRetrying = false;
        interceptCallService();
      }, 500);
      window.GlobalPopupController._retryTimers.push(timer);
    }
    return;
  }

  // 查找 hass 对象
  let hassObj = haRoot.hass;
  if (!hassObj) {
    const main = haRoot.shadowRoot?.querySelector('home-assistant-main');
    if (main?.hass) {
      hassObj = main.hass;
    }
  }

  if (!hassObj || !hassObj.callService) {
    if (!_interceptRetrying) {
      _interceptRetrying = true;
      const timer = setTimeout(() => {
        _interceptRetrying = false;
        interceptCallService();
      }, 500);
      window.GlobalPopupController._retryTimers.push(timer);
    }
    return;
  }

  // 保存原始方法
  if (hassObj._originalCallService) {
    return;
  }

  hassObj._originalCallService = hassObj.callService.bind(hassObj);

  hassObj.callService = function(domain, service, data, target) {
    // 拦截 popup_card 服务
    if (domain === 'popup_card') {

      if (service === 'show' && data && data.card) {
        window.GlobalPopupController.show({
          card: data.card,
          title: data.title || null,
          hide_header: data.hide_header !== undefined ? data.hide_header : true,
          background: data.background || '',
          gap: data.gap,
          width: data.width || null,
          top: data.top || null
        });
        return Promise.resolve();
      }

      if (service === 'close') {
        window.GlobalPopupController.close();
        return Promise.resolve();
      }
    }

    // 其他服务调用原始方法
    return hassObj._originalCallService(domain, service, data, target);
  };

};

// 初始化
const init = () => {
  window.GlobalPopupController.init();
  interceptCallService();
  window.GlobalPopupController._startPollTimer();
};

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => setTimeout(init, 500));
} else {
  setTimeout(init, 500);
}

// 监听系统主题变化
if (window.matchMedia) {
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
    // 主题变化时更新所有弹窗样式
    window.GlobalPopupController._popupStack.forEach(popupInfo => {
      const isDark = e.matches;
      popupInfo.popup.style.background = isDark ? 'rgba(20, 20, 20, 0.98)' : 'rgba(255, 255, 255, 0.98)';

      // 更新标题和关闭按钮颜色
      const titleEl = popupInfo.popup.querySelector('.popup-card-title');
      if (titleEl) {
        titleEl.style.color = isDark ? 'rgba(255, 255, 255, 0.9)' : '#2c3e50';
      }

      // 更新关闭按钮背景
      const closeBtn = popupInfo.popup.querySelector('button');
      if (closeBtn) {
        closeBtn.style.background = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)';
        closeBtn.style.color = isDark ? 'rgba(255, 255, 255, 0.9)' : '#2c3e50';
      }
    });
  });
}

// 监听页面可见性变化
document.addEventListener('visibilitychange', () => {
  const ctrl = window.GlobalPopupController;

  if (document.visibilityState === 'visible') {
    ctrl._isVisible = true;

    // 页面不可见期间有状态变化，恢复后统一刷新一次
    if (ctrl._staleUpdate && ctrl._popupStack.length > 0) {
      ctrl._staleUpdate = false;
      const haRoot = document.querySelector('home-assistant');
      const newHass = haRoot?.hass || haRoot?.shadowRoot?.querySelector('home-assistant-main')?.hass;
      if (newHass && newHass !== ctrl.hass) {
        ctrl.hass = newHass;
        ctrl._updateAllCards();
      }
    }

    // 恢复服务拦截轮询
    ctrl._startPollTimer();

    // 检查服务拦截状态
    setTimeout(interceptCallService, 1000);
  } else {
    ctrl._isVisible = false;
    // 暂停服务拦截轮询
    ctrl._stopPollTimer();
  }
});

// 添加全局错误处理
window.addEventListener('error', (event) => {
  if (event.message && event.message.includes('popup_card')) {
    console.warn('[popup_card] 检测到全局错误，尝试恢复:', event.message);
    setTimeout(() => {
      try {
        interceptCallService();
      } catch (e) {
        console.error('[popup_card] 恢复失败:', e);
      }
    }, 1000);
  }
});

// 添加样式
const styleSheet = document.createElement('style');
styleSheet.textContent = `
  @keyframes popupFadeIn {
    from {
      opacity: 0;
      transform: translate(-50%, -50%) scale(0.95);
    }
    to {
      opacity: 1;
      transform: translate(-50%, -50%) scale(1);
    }
  }

  /* 基础样式 */
  .popup-card-popup {
    animation: popupFadeIn 0.2s ease-out;
    pointer-events: auto !important;
    box-sizing: border-box;
    width: 95vw;
  }

  .popup-card-popup * {
    pointer-events: auto !important;
    box-sizing: border-box;
  }

  .popup-card-content {
    pointer-events: auto !important;
    overscroll-behavior: contain;
  }

  .popup-card-overlay {
    pointer-events: auto !important;
  }

  /* 滚动条样式 */
  .popup-card-content::-webkit-scrollbar {
    width: 6px;
  }
  .popup-card-content::-webkit-scrollbar-track {
    background: rgba(0,0,0,0.1);
    border-radius: 3px;
  }
  .popup-card-content::-webkit-scrollbar-thumb {
    background: rgba(0,0,0,0.3);
    border-radius: 3px;
  }
  .popup-card-content::-webkit-scrollbar-thumb:hover {
    background: rgba(0,0,0,0.5);
  }

  /* 响应式设计 - 手机端 */
  @media (max-width: 100vw) {
    .popup-card-popup {
      width: 95vw !important;
      max-width: 100vw !important;
      left: 2.5vw !important;
      transform: translate(0, -50%) !important;
      top: 0%;
    }

    .popup-card-title {
      font-size: 14px !important;
      top: 10px !important;
      width: auto !important;
      max-width: 100vw !important;
    }

    .popup-card-content {
      padding: 8px !important;
      max-height: 95vh !important;
    }
  }

  /* 平板端 */
  @media (min-width: 768px) and (max-width: 100vw) {
    .popup-card-popup {
      width: auto !important;
      max-width: 100vw !important;
    }
  }

  /* 桌面端 */
  @media (min-width: 1025px) {
    .popup-card-popup {
      width: auto !important;
      max-width: 100vw !important;
    }
  }

  /* 超小屏幕 */
  @media (max-width: 375px) {
    .popup-card-popup {
      width: auto !important;
      max-width: 100vw !important;
      border-radius: 12px !important;
    }
  }
`;
document.head.appendChild(styleSheet);