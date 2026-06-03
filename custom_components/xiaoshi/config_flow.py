"""Xiaoshi Card 配置流程 - 支持 select 数量和选项配置"""
from __future__ import annotations

import voluptuous as vol

from homeassistant import config_entries
from homeassistant.core import callback

from . import DOMAIN

_DEFAULT_COUNT = 2
_MAX_COUNT = 10


def _build_configure_schema(
    select_count: int, entry_options: dict | None = None
) -> vol.Schema:
    """构建 select 选项配置表单"""
    if entry_options is None:
        entry_options = {}
    fields = {}
    for i in range(1, select_count + 1):
        key = f"theme_phone_{i}"
        fields[
            vol.Optional(
                f"{key}_image",
                default=entry_options.get(f"{key}_image", False),
            )
        ] = bool
        fields[
            vol.Optional(
                f"{key}_video",
                default=entry_options.get(f"{key}_video", False),
            )
        ] = bool
    return vol.Schema(fields)


class XiaoshiConfigFlow(config_entries.ConfigFlow, domain=DOMAIN):
    """消逝汇总卡片配置流程"""

    VERSION = 1

    def __init__(self):
        self._select_count = _DEFAULT_COUNT

    async def async_step_user(self, user_input=None):
        """初始添加 - 设置 select 数量"""
        if self._async_current_entries():
            return self.async_abort(reason="single_instance_allowed")

        if user_input is not None:
            self._select_count = user_input.get("select_count", _DEFAULT_COUNT)
            return await self.async_step_configure()

        return self.async_show_form(
            step_id="user",
            data_schema=vol.Schema(
                {
                    vol.Required("select_count", default=_DEFAULT_COUNT): vol.All(
                        int, vol.Range(min=1, max=_MAX_COUNT)
                    ),
                }
            ),
        )

    async def async_step_configure(self, user_input=None):
        """配置每个 select 的选项"""
        if user_input is not None:
            options = {"select_count": self._select_count}
            for i in range(1, self._select_count + 1):
                key = f"theme_phone_{i}"
                options[f"{key}_image"] = user_input.get(f"{key}_image", False)
                options[f"{key}_video"] = user_input.get(f"{key}_video", False)
            return self.async_create_entry(
                title="消逝汇总卡片", data={}, options=options
            )

        return self.async_show_form(
            step_id="configure",
            data_schema=_build_configure_schema(self._select_count),
        )

    @staticmethod
    @callback
    def async_get_options_flow(config_entry):
        """获取选项流程"""
        return XiaoshiOptionsFlow(config_entry)


class XiaoshiOptionsFlow(config_entries.OptionsFlow):
    """消逝汇总卡片选项流程 - 允许修改数量和选项"""

    def __init__(self, config_entry):
        self._select_count = config_entry.options.get(
            "select_count", _DEFAULT_COUNT
        )

    async def async_step_init(self, user_input=None):
        """第一步：设置 select 数量"""
        if user_input is not None:
            self._select_count = user_input.get("select_count", _DEFAULT_COUNT)
            return await self.async_step_configure()

        return self.async_show_form(
            step_id="init",
            data_schema=vol.Schema(
                {
                    vol.Required(
                        "select_count", default=self._select_count
                    ): vol.All(int, vol.Range(min=1, max=_MAX_COUNT)),
                }
            ),
        )

    async def async_step_configure(self, user_input=None):
        """第二步：配置每个 select 的选项"""
        if user_input is not None:
            options = {"select_count": self._select_count}
            for i in range(1, self._select_count + 1):
                key = f"theme_phone_{i}"
                options[f"{key}_image"] = user_input.get(f"{key}_image", False)
                options[f"{key}_video"] = user_input.get(f"{key}_video", False)
            return self.async_create_entry(title="", data=options)

        return self.async_show_form(
            step_id="configure",
            data_schema=_build_configure_schema(
                self._select_count, self.config_entry.options
            ),
        )
