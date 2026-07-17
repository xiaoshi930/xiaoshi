"""Xiaoshi 歌词 API - 从 QQ音乐 / 网易云音乐 搜索歌词"""
import logging
import json
import base64
import aiohttp
from aiohttp import web
from homeassistant.components.http import HomeAssistantView
from homeassistant.core import HomeAssistant

DOMAIN = "xiaoshi"
CONF_LYRICS_ENABLED = "lyrics_enabled"
CONF_LYRICS_SOURCE = "lyrics_source"
DEFAULT_SOURCE = "qq"
SOURCES = {
    "wy": "网易云音乐",
    "qq": "QQ音乐",
}

_LOGGER = logging.getLogger(__name__)


class XiaoshiLyricsView(HomeAssistantView):
    """歌词查询 HTTP 接口

    GET /api/xiaoshi/lyrics?title=xxx&artist=xxx
    返回 {"lyrics": "...", "source": "qq"|"netease"}
    """

    url = "/api/xiaoshi/lyrics"
    name = "api:xiaoshi:lyrics"
    requires_auth = True

    def __init__(self, hass: HomeAssistant):
        self.hass = hass

    async def get(self, request):
        try:
            # 检查是否启用了歌词 API
            enabled = False
            for entry in self.hass.config_entries.async_entries(DOMAIN):
                enabled = entry.options.get(
                    CONF_LYRICS_ENABLED,
                    entry.data.get(CONF_LYRICS_ENABLED, False),
                )
                break

            if not enabled:
                return self.json_message(
                    "Lyrics API is not enabled", status_code=400
                )

            title = request.query.get("title", "").strip()
            artist = request.query.get("artist", "").strip()
            if not title:
                return self.json_message("Missing title", status_code=400)

            # 从 xiaoshi 配置中读取歌词源
            source = DEFAULT_SOURCE
            for entry in self.hass.config_entries.async_entries(DOMAIN):
                source = entry.options.get(
                    CONF_LYRICS_SOURCE,
                    entry.data.get(CONF_LYRICS_SOURCE, DEFAULT_SOURCE),
                )
                break

            _LOGGER.debug("Using music source: %s", source)

            # 按用户选择的源优先搜索，另一个源作为备选
            if source == "qq":
                lyrics = await self._search_qq_lyrics(title, artist)
                if lyrics:
                    _LOGGER.debug("Found lyrics in QQ Music for: %s - %s", title, artist)
                    return web.json_response({"lyrics": lyrics, "source": "qq"})
                lyrics = await self._search_netease_lyrics(title, artist)
                if lyrics:
                    _LOGGER.debug("Found lyrics in Netease for: %s - %s", title, artist)
                    return web.json_response({"lyrics": lyrics, "source": "netease"})
            else:
                lyrics = await self._search_netease_lyrics(title, artist)
                if lyrics:
                    _LOGGER.debug("Found lyrics in Netease for: %s - %s", title, artist)
                    return web.json_response({"lyrics": lyrics, "source": "netease"})
                lyrics = await self._search_qq_lyrics(title, artist)
                if lyrics:
                    _LOGGER.debug("Found lyrics in QQ Music for: %s - %s", title, artist)
                    return web.json_response({"lyrics": lyrics, "source": "qq"})

            return self.json_message("Lyrics not found", status_code=404)

        except Exception as ex:
            _LOGGER.error("Error handling request: %s", str(ex))
            return self.json_message(
                f"Internal error: {str(ex)}", status_code=500
            )

    # ================================================================
    # 文本清洗：生成多组变体用于模糊匹配
    # ================================================================
    @staticmethod
    def _clean_text(text: str):
        stripped = text.strip()
        # 去掉所有括号内容
        no_brackets = (
            text.replace("(", "")
            .replace(")", "")
            .replace("[", "")
            .replace("]", "")
            .replace("（", "")
            .replace("）", "")
            .strip()
        )
        variants = {
            stripped,
            no_brackets,
            no_brackets.replace(" ", ""),
            no_brackets.split("/")[0].strip(),
            no_brackets.split("-")[0].strip(),
            no_brackets.split("／")[0].strip(),
            no_brackets.split("_")[0].strip(),
        }
        return [v for v in variants if v]

    # ================================================================
    # QQ 音乐搜索
    # ================================================================
    async def _search_qq_lyrics(self, title: str, artist: str):
        try:
            query = f"{title} {artist}"
            async with aiohttp.ClientSession() as session:
                search_body = {
                    "req_1": {
                        "method": "DoSearchForQQMusicDesktop",
                        "module": "music.search.SearchCgiService",
                        "param": {
                            "query": query,
                            "search_type": 0,
                            "num_per_page": 10,
                            "page_num": 1,
                        },
                    }
                }
                headers = {
                    "Referer": "https://y.qq.com",
                    "User-Agent": (
                        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
                        "AppleWebKit/537.36 (KHTML, like Gecko) "
                        "Chrome/91.0.4472.124 Safari/537.36"
                    ),
                }
                async with session.post(
                    "https://u.y.qq.com/cgi-bin/musicu.fcg",
                    headers=headers,
                    json=search_body,
                ) as resp:
                    raw = await resp.text(encoding="utf-8")
                    data = json.loads(raw)
                    songs = (
                        data.get("req_1", {})
                        .get("data", {})
                        .get("body", {})
                        .get("song", {})
                        .get("list")
                    )
                    if not songs:
                        return None

                    best = self._find_best_match(songs, title, artist)
                    if not best:
                        return None

                    lyric_body = {
                        "req_1": {
                            "method": "GetPlayLyricInfo",
                            "module": "music.musichallSong.PlayLyricInfo",
                            "param": {
                                "songMID": best["mid"],
                                "format": "json",
                            },
                        }
                    }
                    async with session.post(
                        "https://u.y.qq.com/cgi-bin/musicu.fcg",
                        headers=headers,
                        json=lyric_body,
                    ) as lyric_resp:
                        raw_lyric = await lyric_resp.text(encoding="utf-8")
                        lyric_data = json.loads(raw_lyric)
                        lyric_b64 = (
                            lyric_data.get("req_1", {})
                            .get("data", {})
                            .get("lyric")
                        )
                        if lyric_b64:
                            return base64.b64decode(lyric_b64).decode("utf-8")
                return None
        except Exception as ex:
            _LOGGER.error("Error searching QQ lyrics: %s", str(ex))
            return None

    def _find_best_match(self, results: list, title: str, artist: str):
        """在 QQ 搜索结果中寻找最佳匹配"""
        title_variants = self._clean_text(title)
        artist_variants = self._clean_text(artist)

        # 第一轮：严格匹配（歌曲名和歌手名都要匹配到）
        for song in results:
            song_name = song["name"].lower()
            singer_names = [s["name"].lower() for s in song["singer"]]

            for tv in title_variants:
                tv = tv.lower()
                title_match = tv in song_name or song_name in tv

                for av in artist_variants:
                    av = av.lower()
                    artist_match = any(
                        av in sn or sn in av for sn in singer_names
                    )

                    if title_match and artist_match:
                        return song

        # 第二轮：宽松匹配（歌曲名或歌手名匹配一个即可）
        for song in results:
            song_name = song["name"].lower()
            singer_names = [s["name"].lower() for s in song["singer"]]

            if any(tv.lower() in song_name for tv in title_variants):
                return song
            if any(
                av.lower() in sn
                for av in artist_variants
                for sn in singer_names
            ):
                return song

        # 兜底：返回第一个结果
        return results[0] if results else None

    # ================================================================
    # 网易云音乐搜索
    # ================================================================
    async def _search_netease_lyrics(self, title: str, artist: str):
        try:
            query = f"{title} {artist}"
            async with aiohttp.ClientSession() as session:
                headers = {
                    "Accept": "application/json",
                    "User-Agent": (
                        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
                        "AppleWebKit/537.36 (KHTML, like Gecko) "
                        "Chrome/91.0.4472.124 Safari/537.36"
                    ),
                    "Referer": "https://music.163.com",
                    "Origin": "https://music.163.com",
                }
                search_url = (
                    f"http://music.163.com/api/search/get"
                    f"?s={query}&type=1&limit=10"
                )
                async with session.get(search_url, headers=headers) as resp:
                    raw = await resp.text(encoding="utf-8")
                    try:
                        data = json.loads(raw)
                    except json.JSONDecodeError:
                        _LOGGER.error(
                            "Failed to parse Netease search response: %s", raw
                        )
                        return None

                    songs = data.get("result", {}).get("songs")
                    if not songs:
                        return None

                    best = self._find_best_match_netease(songs, title, artist)
                    if not best:
                        return None

                    lyric_url = (
                        f"http://music.163.com/api/song/lyric"
                        f"?id={best['id']}&lv=1&kv=1&tv=1"
                    )
                    async with session.get(
                        lyric_url, headers=headers
                    ) as lyric_resp:
                        raw_lyric = await lyric_resp.text(encoding="utf-8")
                        try:
                            lyric_data = json.loads(raw_lyric)
                            return lyric_data.get("lrc", {}).get("lyric")
                        except json.JSONDecodeError:
                            _LOGGER.error(
                                "Failed to parse Netease lyrics response: %s",
                                raw_lyric,
                            )
                return None
        except Exception as ex:
            _LOGGER.info("Error searching Netease lyrics: %s", str(ex))
            return None

    def _find_best_match_netease(self, results: list, title: str, artist: str):
        """在网易云搜索结果中寻找最佳匹配"""
        title_variants = self._clean_text(title)
        artist_variants = self._clean_text(artist)

        # 第一轮：严格匹配
        for song in results:
            song_name = song["name"].lower()
            artist_names = [a["name"].lower() for a in song["artists"]]

            for tv in title_variants:
                tv = tv.lower()
                title_match = tv in song_name or song_name in tv

                for av in artist_variants:
                    av = av.lower()
                    artist_match = any(
                        av in an or an in av for an in artist_names
                    )

                    if title_match and artist_match:
                        return song

        # 第二轮：宽松匹配
        for song in results:
            song_name = song["name"].lower()
            artist_names = [a["name"].lower() for a in song["artists"]]

            if any(tv.lower() in song_name for tv in title_variants):
                return song
            if any(
                av.lower() in an
                for av in artist_variants
                for an in artist_names
            ):
                return song

        # 兜底：返回第一个结果
        return results[0] if results else None
