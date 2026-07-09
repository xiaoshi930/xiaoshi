"""MA 音乐播放器辅助 API — 歌单读写接口"""
import logging

from homeassistant.components.http import HomeAssistantView
from homeassistant.core import HomeAssistant

DOMAIN = "xiaoshi"
CONF_MA_ENABLED = "ma_enabled"
REPEAT_MODES = ["sequential", "random", "repeat_one"]
VIEW_MODES = ["lyrics", "playlist"]

_LOGGER = logging.getLogger(__name__)

# 数据存储在 hass.data 中的 key
_KEY_MA_PLAYLIST = "ma_playlist_data"


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
# 歌单轨道数据模型（与 music-card.js 第 3924 行对齐）
# ================================================================
TRACK_SCHEMA_KEYS = [
    "uri", "name", "artist", "album", "duration", "image_url", "track_id", "provider", "status"
]
PLAY_STATUSES = ["unplayed", "played", "last"]


def _normalize_track(track: dict) -> dict:
    """标准化单首歌曲数据"""
    status = track.get("status", "unplayed")
    if status not in PLAY_STATUSES:
        status = "unplayed"
    return {
        "uri": str(track.get("uri", "")),
        "name": str(track.get("name", "未知")),
        "artist": str(track.get("artist", "")),
        "album": str(track.get("album", "")),
        "duration": int(track.get("duration", 0)),
        "image_url": str(track.get("image_url", "")),
        "track_id": str(track.get("track_id", "")),
        "provider": str(track.get("provider", "")),
        "status": status,
    }


def _normalize_group(group: dict) -> dict:
    """标准化单个分组数据"""
    return {
        "media_player": str(group.get("media_player", "")),
        "repeat_mode": (
            group["repeat_mode"] if group.get("repeat_mode") in REPEAT_MODES
            else "sequential"
        ),
        "playlist": [_normalize_track(t) for t in group.get("playlist", [])],
    }


# ================================================================
# 歌单 CRUD 主视图
# ================================================================
class XiaoshiMaPlaylistView(HomeAssistantView):
    """MA 歌单读写接口

    GET    /api/xiaoshi/ma/playlist                       获取全部歌单组
    GET    /api/xiaoshi/ma/playlist?media_player=xxx      获取指定播放器的歌单
    POST   /api/xiaoshi/ma/playlist                       批量写入/更新歌单组
    DELETE /api/xiaoshi/ma/playlist?media_player=xxx      删除指定播放器的歌单
    """

    url = "/api/xiaoshi/ma/playlist"
    name = "api:xiaoshi:ma:playlist"
    requires_auth = True

    def __init__(self, hass: HomeAssistant):
        self.hass = hass

    # ---- GET ----
    async def get(self, request):
        if not _is_enabled(self.hass):
            return self.json_message("MA API is not enabled", status_code=400)

        media_player = request.query.get("media_player", "")
        store = _get_data(self.hass)

        if media_player:
            group = store.get(media_player)
            if group is None:
                return self.json_message(
                    f"No data for {media_player}", status_code=404
                )
            return self.json(group)

        return self.json({"groups": list(store.values())})

    # ---- POST ----
    async def post(self, request):
        if not _is_enabled(self.hass):
            return self.json_message("MA API is not enabled", status_code=400)

        try:
            data = await request.json()
        except Exception:
            return self.json_message("Invalid JSON", status_code=400)

        groups = data.get("groups")
        if not isinstance(groups, list):
            return self.json_message(
                "Body must contain 'groups' array", status_code=400
            )

        store = _get_data(self.hass)
        updated = 0

        for g in groups:
            if not isinstance(g, dict):
                continue
            mp = str(g.get("media_player", "")).strip()
            if not mp:
                continue
            store[mp] = _normalize_group(g)
            updated += 1

        _LOGGER.info("MA playlist updated: %d groups", updated)
        return self.json({"result": f"{updated} groups updated"})

    # ---- DELETE ----
    async def delete(self, request):
        if not _is_enabled(self.hass):
            return self.json_message("MA API is not enabled", status_code=400)

        media_player = request.query.get("media_player", "")
        if not media_player:
            return self.json_message("media_player is required", status_code=400)

        store = _get_data(self.hass)
        if media_player in store:
            del store[media_player]
            return self.json({"result": f"Deleted group for {media_player}"})

        return self.json_message(
            f"No data for {media_player}", status_code=404
        )


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


def register_ma_views(hass: HomeAssistant):
    """注册 MA 辅助 API 视图"""
    hass.http.register_view(XiaoshiMaPlaylistView(hass))
    hass.http.register_view(XiaoshiMaRepeatModeView(hass))
    hass.http.register_view(XiaoshiMaViewView(hass))
