"""Xiaoshi 定时器 HTTP API - 供前端卡片调用"""
from __future__ import annotations

import logging

from homeassistant.components.http import HomeAssistantView
from homeassistant.core import HomeAssistant

from .timer import TimerManager

_LOGGER = logging.getLogger(__name__)

# 只允许关闭类服务，防止任意服务调用
_ALLOWED_SERVICES = {"turn_off", "toggle"}


class XiaoshiTimerView(HomeAssistantView):
    """定时器 CRUD 接口

    POST   /api/xiaoshi/timer                创建/更新定时器
    GET    /api/xiaoshi/timer?entity_id=xxx   获取单个定时器（省略则返回全部）
    DELETE /api/xiaoshi/timer?entity_id=xxx   删除定时器
    """

    url = "/api/xiaoshi/timer"
    name = "api:xiaoshi:timer"
    requires_auth = True

    def __init__(self, timer_manager: TimerManager):
        self._tm = timer_manager

    # ---- POST: 创建 / 更新 ----
    async def post(self, request):
        """
        Body:
        {
            "entity_id": "switch.xxx",
            "service_domain": "switch",
            "service_name": "turn_off",
            "countdown": 300
        }
        """
        try:
            data = await request.json()
        except Exception:
            return self.json_message("Invalid JSON", status_code=400)

        entity_id = data.get("entity_id")
        service_domain = data.get("service_domain")
        service_name = data.get("service_name")
        countdown = data.get("countdown")

        # 必填校验
        if not all([entity_id, service_domain, service_name, countdown is not None]):
            return self.json_message(
                "Missing required fields: entity_id, service_domain, service_name, countdown",
                status_code=400,
            )

        # 安全校验：白名单
        if service_name not in _ALLOWED_SERVICES:
            return self.json_message(
                f"Service '{service_name}' not allowed. Allowed: {_ALLOWED_SERVICES}",
                status_code=403,
            )

        # 倒计时校验
        try:
            countdown = int(countdown)
            if countdown <= 0:
                raise ValueError
        except (ValueError, TypeError):
            return self.json_message(
                "countdown must be a positive integer (seconds)", status_code=400
            )

        result = await self._tm.async_create_timer(
            entity_id=entity_id,
            service_domain=service_domain,
            service_name=service_name,
            countdown=countdown,
        )
        return self.json(result)

    # ---- GET: 查询 ----
    async def get(self, request):
        entity_id = request.query.get("entity_id")
        if entity_id:
            result = self._tm.get_timer(entity_id)
            if result is None:
                return self.json_message(
                    f"No timer for {entity_id}", status_code=404
                )
            return self.json(result)
        return self.json(self._tm.get_all_timers())

    # ---- DELETE: 删除 ----
    async def delete(self, request):
        entity_id = request.query.get("entity_id")
        if not entity_id:
            try:
                data = await request.json()
                entity_id = data.get("entity_id")
            except Exception:
                pass
        if not entity_id:
            return self.json_message("entity_id is required", status_code=400)

        success = await self._tm.async_delete_timer(entity_id)
        if success:
            return self.json({"result": f"Timer for {entity_id} deleted"})
        return self.json_message(f"No timer for {entity_id}", status_code=404)


class XiaoshiTimerListView(HomeAssistantView):
    """获取全部定时器列表"""

    url = "/api/xiaoshi/timers"
    name = "api:xiaoshi:timers"
    requires_auth = True

    def __init__(self, timer_manager: TimerManager):
        self._tm = timer_manager

    async def get(self, request):
        return self.json(self._tm.get_all_timers())


def register_views(hass: HomeAssistant, timer_manager: TimerManager):
    """注册所有 HTTP 视图"""
    hass.http.register_view(XiaoshiTimerView(timer_manager))
    hass.http.register_view(XiaoshiTimerListView(timer_manager))
