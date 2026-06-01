"""Xiaoshi Switch - 提供全屏切换实体"""
from __future__ import annotations

import logging

from homeassistant.components.switch import SwitchEntity
from homeassistant.config_entries import ConfigEntry
from homeassistant.core import HomeAssistant
from homeassistant.helpers.entity_platform import AddEntitiesCallback

from . import DOMAIN

_LOGGER = logging.getLogger(__name__)

SWITCHES = [
    {
        "key": "pad_full",
        "name": "平板全屏",
        "icon": "mdi:fullscreen",
        "default": True,
    },
    {
        "key": "phone_full",
        "name": "手机全屏",
        "icon": "mdi:cellphone-screenshot",
        "default": True,
    },
]


async def async_setup_entry(
    hass: HomeAssistant,
    entry: ConfigEntry,
    async_add_entities: AddEntitiesCallback,
) -> None:
    """设置 switch 实体"""
    async_add_entities(
        [XiaoshiSwitch(entry.entry_id, s) for s in SWITCHES], True
    )


class XiaoshiSwitch(SwitchEntity):
    """全屏切换开关"""

    def __init__(self, entry_id: str, config: dict) -> None:
        self._key = config["key"]
        self._attr_name = config["name"]
        self._attr_icon = config["icon"]
        self._attr_unique_id = f"{entry_id}_{self._key}"
        self._attr_is_on = config.get("default", False)

    @property
    def entity_id(self) -> str:
        """固定 entity_id"""
        return f"switch.{self._key}"

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

    async def async_turn_on(self, **kwargs) -> None:
        self._attr_is_on = True
        self.async_write_ha_state()

    async def async_turn_off(self, **kwargs) -> None:
        self._attr_is_on = False
        self.async_write_ha_state()
