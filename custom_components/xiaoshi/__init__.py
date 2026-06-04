"""Xiaoshi Card 集成 - 加载 xiaoshi-card.js 及所有消逝卡片资源"""
import logging

from homeassistant.config_entries import ConfigEntry
from homeassistant.core import HomeAssistant
from homeassistant.components.frontend import add_extra_js_url

_LOGGER = logging.getLogger(__name__)
DOMAIN = "xiaoshi"

_STATE_XIAOSHI_PATH = "/xiaoshi"


class StaticPathConfig:
    """静态路径配置，兼容 async_register_static_paths 的列表参数"""

    def __init__(self, url_path: str, path: str, cache_headers: bool):
        self.url_path = url_path
        self.path = path
        self.cache_headers = cache_headers


async def async_setup_entry(hass: HomeAssistant, entry: ConfigEntry) -> bool:
    """通过 UI 配置流程设置"""
    await _register_static_resources(hass)
    await hass.config_entries.async_forward_entry_setups(entry, ["select"])
    return True


async def async_unload_entry(hass: HomeAssistant, entry: ConfigEntry) -> bool:
    """卸载集成条目"""
    unload_ok = await hass.config_entries.async_unload_platforms(entry, ["select"])
    return unload_ok


async def async_reload_entry(hass: HomeAssistant, entry: ConfigEntry) -> None:
    """选项变更时重新加载"""
    await hass.config_entries.async_reload(entry.entry_id)


async def _register_static_resources(hass: HomeAssistant):
    """注册静态资源路径并加载 xiaoshi-card.js"""
    await hass.http.async_register_static_paths([
        StaticPathConfig(
            _STATE_XIAOSHI_PATH,
            hass.config.path("custom_components/xiaoshi/www"),
            False,
        )
    ])
    add_extra_js_url(hass, _STATE_XIAOSHI_PATH + "/xiaoshi-card.js")
    _LOGGER.info("Xiaoshi Card 集成已加载")