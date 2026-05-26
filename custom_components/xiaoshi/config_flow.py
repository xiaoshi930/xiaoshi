"""Xiaoshi Card 配置流程 - 无用户配置，注册即用"""
from __future__ import annotations

from homeassistant import config_entries

from . import DOMAIN


class XiaoshiConfigFlow(config_entries.ConfigFlow, domain=DOMAIN):
    """消逝汇总卡片配置流程，无需用户输入，直接创建条目"""

    VERSION = 1

    async def async_step_user(self, user_input=None):
        """处理用户通过 UI 添加集成的步骤"""
        if self._async_current_entries():
            return self.async_abort(reason="single_instance_allowed")

        if user_input is not None:
            return self.async_create_entry(title="消逝汇总卡片", data={"setup": True})

        return self.async_show_form(step_id="user")
