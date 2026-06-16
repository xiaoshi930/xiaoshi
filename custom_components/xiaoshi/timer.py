"""Xiaoshi 定时器管理模块 - 倒计时归零自动关闭实体"""
from __future__ import annotations

import logging
from datetime import datetime, timedelta
from typing import Any, Callable

from homeassistant.core import HomeAssistant, callback
from homeassistant.helpers.event import (
    async_track_point_in_time,
    async_track_state_change_event,
)
from homeassistant.util import dt as dt_util

_LOGGER = logging.getLogger(__name__)


class TimerTask:
    """单个定时任务"""

    def __init__(
        self,
        entity_id: str,
        service_domain: str,
        service_name: str,
        countdown: int,
        deadline: datetime,
        cancel_timer: Callable,
        cancel_state_listener: Callable,
    ):
        self.entity_id = entity_id
        self.service_domain = service_domain
        self.service_name = service_name
        self.countdown = countdown
        self.deadline = deadline
        self._cancel_timer = cancel_timer
        self._cancel_state_listener = cancel_state_listener

    @property
    def remaining(self) -> int:
        """剩余秒数"""
        delta = (self.deadline - dt_util.utcnow()).total_seconds()
        return max(0, int(delta))

    def cancel(self):
        """取消定时任务和状态监听"""
        if self._cancel_timer:
            self._cancel_timer()
            self._cancel_timer = None
        if self._cancel_state_listener:
            self._cancel_state_listener()
            self._cancel_state_listener = None

    def to_dict(self) -> dict:
        """转换为前端可用的字典"""
        return {
            "entity_id": self.entity_id,
            "service_domain": self.service_domain,
            "service_name": self.service_name,
            "countdown": self.countdown,
            "deadline": self.deadline.isoformat(),
            "remaining": self.remaining,
        }


class TimerManager:
    """定时器管理器 - 以 entity_id 为唯一键"""

    def __init__(self, hass: HomeAssistant):
        self._hass = hass
        self._tasks: dict[str, TimerTask] = {}

    def has_timer(self, entity_id: str) -> bool:
        return entity_id in self._tasks

    def get_timer(self, entity_id: str) -> dict | None:
        task = self._tasks.get(entity_id)
        return task.to_dict() if task else None

    def get_all_timers(self) -> list[dict]:
        return [task.to_dict() for task in self._tasks.values()]

    async def async_create_timer(
        self,
        entity_id: str,
        service_domain: str,
        service_name: str,
        countdown: int,
    ) -> dict:
        """创建或更新定时器，以 entity_id 为键（重复则覆盖）"""
        # 已存在则先取消
        old = self._tasks.pop(entity_id, None)
        if old:
            old.cancel()

        deadline = dt_util.utcnow() + timedelta(seconds=countdown)

        # 倒计时到期回调
        cancel_timer = async_track_point_in_time(
            self._hass,
            self._make_timer_callback(entity_id),
            deadline,
        )

        # 实体状态变更监听
        cancel_state_listener = async_track_state_change_event(
            self._hass,
            [entity_id],
            self._make_state_callback(entity_id),
        )

        task = TimerTask(
            entity_id=entity_id,
            service_domain=service_domain,
            service_name=service_name,
            countdown=countdown,
            deadline=deadline,
            cancel_timer=cancel_timer,
            cancel_state_listener=cancel_state_listener,
        )

        self._tasks[entity_id] = task
        _LOGGER.info(
            "定时器已创建: %s, 倒计时 %ds, 关闭方法 %s.%s",
            entity_id, countdown, service_domain, service_name,
        )
        return task.to_dict()

    async def async_delete_timer(self, entity_id: str) -> bool:
        """删除定时器"""
        task = self._tasks.pop(entity_id, None)
        if task:
            task.cancel()
            _LOGGER.info("定时器已删除: %s", entity_id)
            return True
        return False

    async def async_cleanup(self):
        """清理所有定时器（卸载时调用）"""
        for entity_id, task in list(self._tasks.items()):
            task.cancel()
            _LOGGER.info("定时器已清理: %s", entity_id)
        self._tasks.clear()

    # ------------------------------------------------------------------ #
    #  内部回调
    # ------------------------------------------------------------------ #

    def _make_timer_callback(self, entity_id: str) -> Callable:
        """倒计时归零回调：执行关闭服务"""
        @callback
        def _on_expired(now: datetime) -> None:
            task = self._tasks.pop(entity_id, None)
            if task is None:
                return
            # 不再需要状态监听
            task._cancel_state_listener()
            _LOGGER.info(
                "定时器到期: %s, 执行 %s.%s",
                entity_id, task.service_domain, task.service_name,
            )
            self._hass.async_create_task(
                self._hass.services.async_call(
                    task.service_domain,
                    task.service_name,
                    {"entity_id": entity_id},
                )
            )
        return _on_expired

    def _make_state_callback(self, entity_id: str) -> Callable:
        """实体状态变更回调：手动关闭则注销定时器"""
        @callback
        def _on_state_changed(event) -> None:
            new_state = event.data.get("new_state")
            if new_state is None:
                return
            if new_state.state == "off":
                task = self._tasks.pop(entity_id, None)
                if task:
                    task.cancel()
                    _LOGGER.info("实体 %s 已手动关闭, 定时器已注销", entity_id)
        return _on_state_changed
