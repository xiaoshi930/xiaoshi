"""Xiaoshi Select - 提供主题选择实体，数量和选项从配置中读取"""
from __future__ import annotations

import logging

from homeassistant.components.select import SelectEntity
from homeassistant.config_entries import ConfigEntry
from homeassistant.core import HomeAssistant
from homeassistant.helpers.entity_platform import AddEntitiesCallback

from . import DOMAIN

_LOGGER = logging.getLogger(__name__)

_DEFAULT_COUNT = 2


def _get_options(entry_options: dict, key: str) -> list[str]:
    """根据配置生成选项列表，'无' 始终包含"""
    opts = ["无"]
    if entry_options.get(f"{key}_image", False):
        opts.append("图片")
    if entry_options.get(f"{key}_video", False):
        opts.append("视频")
    return opts


async def async_setup_entry(
    hass: HomeAssistant,
    entry: ConfigEntry,
    async_add_entities: AddEntitiesCallback,
) -> None:
    """根据配置数量创建 select 实体"""
    select_count = entry.options.get("select_count", _DEFAULT_COUNT)
    async_add_entities(
        [XiaoshiSelect(entry, i) for i in range(1, select_count + 1)], True
    )


class XiaoshiSelect(SelectEntity):
    """主题选择实体"""

    def __init__(self, entry: ConfigEntry, index: int) -> None:
        self._entry = entry
        self._index = index
        self._key = f"theme_phone_{index}"
        self._attr_name = f"手机主题{index}"
        self._attr_icon = "mdi:palette-outline"
        self._attr_unique_id = f"{entry.entry_id}_{self._key}"
        self._attr_current_option = "无"
        self._update_options()

    def _update_options(self) -> None:
        """从配置更新选项"""
        self._attr_options = _get_options(self._entry.options, self._key)
        if self._attr_current_option not in self._attr_options:
            self._attr_current_option = "无"

    @property
    def entity_id(self) -> str:
        """固定 entity_id"""
        return f"select.{self._key}"

    @entity_id.setter
    def entity_id(self, value):
        """忽略 HA 自动赋值"""
        pass

    @property
    def device_info(self):
        return {
            "identifiers": {(DOMAIN, DOMAIN)},
            "name": "消逝汇总卡片",
            "manufacturer": "Xiaoshi",
        }

    async def async_select_option(self, option: str) -> None:
        """选择选项"""
        if option in self._attr_options:
            self._attr_current_option = option
            self.async_write_ha_state()
