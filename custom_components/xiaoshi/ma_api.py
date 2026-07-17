"""MA 音乐播放器辅助 API — 歌单读写接口"""
import logging

from homeassistant.components.http import HomeAssistantView
from homeassistant.core import HomeAssistant

DOMAIN = "xiaoshi"
CONF_MA_ENABLED = "ma_enabled"
REPEAT_MODES = ["sequential", "random", "repeat_one"]
VIEW_MODES = ["lyrics", "playlist"]
LOCAL_STATUS_MODES = ["unplayed", "played", "playing", "paused"]

_LOGGER = logging.getLogger(__name__)

# 数据存储在 hass.data 中的 key
_KEY_MA_PLAYLIST = "ma_playlist_data"
_KEY_LOCAL_PLAYLIST = "local_playlist_data"


def _get_local_data(hass: HomeAssistant) -> dict:
    """获取本地播放列表数据存储（按 media_player 为 key）"""
    if _KEY_LOCAL_PLAYLIST not in hass.data.setdefault(DOMAIN, {}):
        hass.data[DOMAIN][_KEY_LOCAL_PLAYLIST] = {}
    return hass.data[DOMAIN][_KEY_LOCAL_PLAYLIST]


def _get_data(hass: HomeAssistant) -> dict:
    """获取 MA 歌单数据存储（按 media_player 为 key）"""
    if _KEY_MA_PLAYLIST not in hass.data.setdefault(DOMAIN, {}):
        hass.data[DOMAIN][_KEY_MA_PLAYLIST] = {}
    return hass.data[DOMAIN][_KEY_MA_PLAYLIST]


def _is_enabled(hass: HomeAssistant) -> bool:
    """检查 MA API 是否启用"""
    for entry in hass.config_entries.async_entries(DOMAIN):
        return entry.options.get(
            CONF_MA_ENABLED,
            entry.data.get(CONF_MA_ENABLED, True),
        )
    return False


# ================================================================
# 播放模式读写视图
# ================================================================
class XiaoshiMaRepeatModeView(HomeAssistantView):
    """MA 播放模式读写接口

    GET  /api/xiaoshi/ma/repeat_mode?media_player=xxx   读取播放模式
    POST /api/xiaoshi/ma/repeat_mode                    更新播放模式
          Body: {"media_player": "xxx", "repeat_mode": "random"}
    """

    url = "/api/xiaoshi/ma/repeat_mode"
    name = "api:xiaoshi:ma:repeat_mode"
    requires_auth = True

    def __init__(self, hass: HomeAssistant):
        self.hass = hass

    async def get(self, request):
        if not _is_enabled(self.hass):
            return self.json_message("MA API is not enabled", status_code=400)

        media_player = request.query.get("media_player", "")
        if not media_player:
            return self.json_message("media_player is required", status_code=400)

        store = _get_data(self.hass)
        group = store.get(media_player)
        if group is None:
            return self.json({
                "media_player": media_player,
                "repeat_mode": "sequential",
            })

        return self.json({
            "media_player": group.get("media_player", media_player),
            "repeat_mode": group.get("repeat_mode", "sequential"),
        })

    async def post(self, request):
        if not _is_enabled(self.hass):
            return self.json_message("MA API is not enabled", status_code=400)

        try:
            data = await request.json()
        except Exception:
            return self.json_message("Invalid JSON", status_code=400)

        media_player = str(data.get("media_player", "")).strip()
        if not media_player:
            return self.json_message("media_player is required", status_code=400)

        mode = data.get("repeat_mode", "")
        if mode not in REPEAT_MODES:
            return self.json_message(
                f"repeat_mode must be one of: {REPEAT_MODES}", status_code=400
            )

        store = _get_data(self.hass)
        if media_player in store:
            store[media_player]["repeat_mode"] = mode
        else:
            # 创建最小分组（仅含播放模式，无歌单）
            store[media_player] = {
                "media_player": media_player,
                "repeat_mode": mode,
                "playlist": [],
            }

        _LOGGER.info("MA repeat_mode updated: %s -> %s", media_player, mode)
        return self.json({
            "media_player": media_player,
            "repeat_mode": mode,
        })


# ================================================================
# 显示模式（歌词/播放列表）读写视图
# ================================================================
class XiaoshiMaViewView(HomeAssistantView):
    """MA 显示模式读写接口

    GET  /api/xiaoshi/ma/view?media_player=xxx   读取显示模式
    POST /api/xiaoshi/ma/view                    更新显示模式
          Body: {"media_player": "xxx", "view": "playlist"}
    """

    url = "/api/xiaoshi/ma/view"
    name = "api:xiaoshi:ma:view"
    requires_auth = True

    def __init__(self, hass: HomeAssistant):
        self.hass = hass

    async def get(self, request):
        if not _is_enabled(self.hass):
            return self.json_message("MA API is not enabled", status_code=400)

        media_player = request.query.get("media_player", "")
        if not media_player:
            return self.json_message("media_player is required", status_code=400)

        store = _get_data(self.hass)
        group = store.get(media_player)
        view = group.get("view", "lyrics") if group else "lyrics"
        return self.json({
            "media_player": media_player,
            "view": view if view in VIEW_MODES else "lyrics",
        })

    async def post(self, request):
        if not _is_enabled(self.hass):
            return self.json_message("MA API is not enabled", status_code=400)

        try:
            data = await request.json()
        except Exception:
            return self.json_message("Invalid JSON", status_code=400)

        media_player = str(data.get("media_player", "")).strip()
        if not media_player:
            return self.json_message("media_player is required", status_code=400)

        view = data.get("view", "")
        if view not in VIEW_MODES:
            return self.json_message(
                f"view must be one of: {VIEW_MODES}", status_code=400
            )

        store = _get_data(self.hass)
        if media_player in store:
            store[media_player]["view"] = view
        else:
            store[media_player] = {
                "media_player": media_player,
                "repeat_mode": "sequential",
                "playlist": [],
                "view": view,
            }

        _LOGGER.info("MA view updated: %s -> %s", media_player, view)
        return self.json({
            "media_player": media_player,
            "view": view,
        })


# ================================================================
# 本地播放列表读写视图
# ================================================================
class XiaoshiLocalPlaylistView(HomeAssistantView):
    """本地播放列表读写接口

    GET  /api/xiaoshi/ma/local_playlist?media_player=xxx   读取本地播放列表
    POST /api/xiaoshi/ma/local_playlist                    写入/替换本地播放列表
          Body: {"media_player": "xxx", "playlist": [{"name","artist","uri","duration","image_url","media_type"}]}
    """

    url = "/api/xiaoshi/ma/local_playlist"
    name = "api:xiaoshi:ma:local_playlist"
    requires_auth = True

    def __init__(self, hass: HomeAssistant):
        self.hass = hass

    async def get(self, request):
        if not _is_enabled(self.hass):
            return self.json_message("MA API is not enabled", status_code=400)
        media_player = request.query.get("media_player", "")
        if not media_player:
            return self.json_message("media_player is required", status_code=400)
        store = _get_local_data(self.hass)
        group = store.get(media_player)
        if not group:
            return self.json({"media_player": media_player, "playlist": [], "current_index": -1})
        return self.json({
            "media_player": media_player,
            "playlist": group.get("playlist", []),
            "current_index": group.get("current_index", -1),
        })

    async def post(self, request):
        if not _is_enabled(self.hass):
            return self.json_message("MA API is not enabled", status_code=400)
        try:
            data = await request.json()
        except Exception:
            return self.json_message("Invalid JSON", status_code=400)
        media_player = str(data.get("media_player", "")).strip()
        if not media_player:
            return self.json_message("media_player is required", status_code=400)
        raw_items = data.get("playlist", [])
        if not isinstance(raw_items, list):
            return self.json_message("playlist must be a list", status_code=400)
        playlist = []
        for it in raw_items:
            if not isinstance(it, dict):
                continue
            uri = str(it.get("uri") or it.get("media_content_id") or "").strip()
            if not uri:
                continue
            playlist.append({
                "name": str(it.get("name") or it.get("title") or "").strip(),
                "artist": str(it.get("artist") or "").strip(),
                "uri": uri,
                "duration": int(it.get("duration") or 0) or 0,
                "image_url": str(it.get("image_url") or it.get("cover_url") or "").strip(),
                "media_type": str(it.get("media_type") or "music").strip(),
                "status": "unplayed",
            })
        store = _get_local_data(self.hass)
        store[media_player] = {
            "media_player": media_player,
            "playlist": playlist,
            "current_index": -1,
        }
        _LOGGER.info("Local playlist set: %s (%d tracks)", media_player, len(playlist))
        return self.json({
            "media_player": media_player,
            "playlist": playlist,
            "current_index": -1,
        })


# ================================================================
# 本地播放列表清空视图
# ================================================================
class XiaoshiLocalPlaylistClearView(HomeAssistantView):
    """清空本地播放列表

    POST /api/xiaoshi/ma/local_playlist/clear
         Body: {"media_player": "xxx"}
    """

    url = "/api/xiaoshi/ma/local_playlist/clear"
    name = "api:xiaoshi:ma:local_playlist_clear"
    requires_auth = True

    def __init__(self, hass: HomeAssistant):
        self.hass = hass

    async def post(self, request):
        if not _is_enabled(self.hass):
            return self.json_message("MA API is not enabled", status_code=400)
        try:
            data = await request.json()
        except Exception:
            return self.json_message("Invalid JSON", status_code=400)
        media_player = str(data.get("media_player", "")).strip()
        if not media_player:
            return self.json_message("media_player is required", status_code=400)
        store = _get_local_data(self.hass)
        store[media_player] = {
            "media_player": media_player,
            "playlist": [],
            "current_index": -1,
        }
        _LOGGER.info("Local playlist cleared: %s", media_player)
        return self.json({"media_player": media_player, "playlist": [], "current_index": -1})


# ================================================================
# 本地播放状态（播放模式）读写视图
# ================================================================
class XiaoshiLocalStatusView(HomeAssistantView):
    """本地播放状态读写接口

    更新当前曲目索引与每首播放状态（unplayed/played/playing/paused）
    POST /api/xiaoshi/ma/local_status
         Body: {"media_player": "xxx", "current_index": 2, "statuses": {"0": "played", "2": "playing"}}
    """

    url = "/api/xiaoshi/ma/local_status"
    name = "api:xiaoshi:ma:local_status"
    requires_auth = True

    def __init__(self, hass: HomeAssistant):
        self.hass = hass

    async def post(self, request):
        if not _is_enabled(self.hass):
            return self.json_message("MA API is not enabled", status_code=400)
        try:
            data = await request.json()
        except Exception:
            return self.json_message("Invalid JSON", status_code=400)
        media_player = str(data.get("media_player", "")).strip()
        if not media_player:
            return self.json_message("media_player is required", status_code=400)
        store = _get_local_data(self.hass)
        group = store.get(media_player)
        if not group:
            group = {"media_player": media_player, "playlist": [], "current_index": -1}
            store[media_player] = group
        if "current_index" in data:
            ci = data["current_index"]
            if isinstance(ci, int):
                group["current_index"] = ci
        statuses = data.get("statuses")
        if isinstance(statuses, dict):
            for k, v in statuses.items():
                try:
                    idx = int(k)
                except (ValueError, TypeError):
                    continue
                if v not in LOCAL_STATUS_MODES:
                    continue
                if 0 <= idx < len(group["playlist"]):
                    group["playlist"][idx]["status"] = v
        _LOGGER.info("Local status updated: %s idx=%s", media_player, group.get("current_index"))
        return self.json({
            "media_player": media_player,
            "playlist": group.get("playlist", []),
            "current_index": group.get("current_index", -1),
        })


# ================================================================
# 镜像"正在播放"信息到其它实体（mito/home）
# 解决：MA 播放时 ma 实体信息正确，但 mito/home 实体仍显示旧的
# 错误信息（如"心灵之谜"），需要把当前曲目标题/演唱者同步过去
# ================================================================
class XiaoshiSyncNowPlayingView(HomeAssistantView):
    """将当前播放信息镜像写入其它 media_player 实体

    POST /api/xiaoshi/ma/sync_now_playing
         Body: {
           "entity_id": "media_player.xxx",
           "media_title": "歌曲名",
           "media_artist": "演唱者",
           "entity_picture": "http://...cover",
           "media_duration": 213
         }
    仅更新传入的属性，并保留实体原有状态与其它属性。
    """

    url = "/api/xiaoshi/ma/sync_now_playing"
    name = "api:xiaoshi:ma:sync_now_playing"
    requires_auth = True

    def __init__(self, hass: HomeAssistant):
        self.hass = hass

    async def post(self, request):
        if not _is_enabled(self.hass):
            return self.json_message("MA API is not enabled", status_code=400)
        try:
            data = await request.json()
        except Exception:
            return self.json_message("Invalid JSON", status_code=400)

        entity_id = str(data.get("entity_id", "")).strip()
        if not entity_id:
            return self.json_message("entity_id is required", status_code=400)

        cur = self.hass.states.get(entity_id)
        if cur is None:
            return self.json_message(f"entity {entity_id} not found", status_code=404)

        # 保留实体原有全部属性，仅覆盖传入的播放信息字段
        new_attrs = dict(cur.attributes)
        if "media_title" in data:
            new_attrs["media_title"] = str(data["media_title"] or "")
        if "media_artist" in data:
            new_attrs["media_artist"] = str(data["media_artist"] or "")
        if "entity_picture" in data:
            new_attrs["entity_picture"] = str(data["entity_picture"] or "")
        if "media_duration" in data:
            try:
                new_attrs["media_duration"] = float(data["media_duration"])
            except (ValueError, TypeError):
                pass

        # 播放状态：默认沿用实体当前状态，避免误把"off"改为"playing"
        new_state = data.get("state", cur.state)

        try:
            await self.hass.states.async_set(entity_id, new_state, new_attrs)
        except Exception as e:  # noqa: BLE001
            _LOGGER.warning("同步正在播放信息失败 %s: %s", entity_id, e)
            return self.json_message(f"sync failed: {e}", status_code=500)

        return self.json({
            "entity_id": entity_id,
            "media_title": new_attrs.get("media_title"),
            "media_artist": new_attrs.get("media_artist"),
        })


def register_ma_views(hass: HomeAssistant):
    """注册 MA 辅助 API 视图"""
    hass.http.register_view(XiaoshiMaRepeatModeView(hass))
    hass.http.register_view(XiaoshiMaViewView(hass))
    hass.http.register_view(XiaoshiLocalPlaylistView(hass))
    hass.http.register_view(XiaoshiLocalPlaylistClearView(hass))
    hass.http.register_view(XiaoshiLocalStatusView(hass))
    hass.http.register_view(XiaoshiSyncNowPlayingView(hass))
