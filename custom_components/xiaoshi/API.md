# MA 播放器辅助 API

> 所有 API 均需要 Home Assistant 认证，请求头需携带 `Authorization: Bearer <长期访问令牌>`。
>
> ⚠️ 需在集成配置中勾选「启用 MA 播放器辅助 API」。

---

## 歌单 API

```
GET    /api/xiaoshi/ma/playlist                      获取歌单
POST   /api/xiaoshi/ma/playlist                      写入歌单
DELETE /api/xiaoshi/ma/playlist?media_player=xxx     删除歌单
```

### 写入歌单（POST）

#### 请求体

```json
{
  "groups": [
    {
      "media_player": "media_player.shi_ting",
      "repeat_mode": "sequential",
      "playlist": [
        {
          "uri": "library://track/12345",
          "name": "晴天",
          "artist": "周杰伦",
          "album": "叶惠美",
          "duration": 269,
          "image_url": "https://xxx/cover.jpg",
          "track_id": "12345",
          "provider": "qqmusic"
        }
      ]
    }
  ]
}
```

#### 字段说明

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `media_player` | string | 是 | MA 播放器实体 ID |
| `repeat_mode` | string | 否 | 播放模式，默认 `sequential` |
| `playlist` | array | 否 | 歌单曲目列表 |

**曲目字段**：

| 字段 | 类型 | 说明 |
|------|------|------|
| `uri` | string | 曲目 URI |
| `name` | string | 歌曲名 |
| `artist` | string | 歌手名 |
| `album` | string | 专辑名 |
| `duration` | int | 时长（秒） |
| `image_url` | string | 封面图片 URL |
| `track_id` | string | 曲目 ID |
| `provider` | string | 来源（`library` / `qqmusic` 等） |

#### 成功响应

```json
{ "result": "2 groups updated" }
```

#### 示例

```bash
curl -X POST \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"groups":[{"media_player":"media_player.shi_ting","repeat_mode":"random","playlist":[{"uri":"test://1","name":"晴天","artist":"周杰伦","album":"叶惠美","duration":269,"image_url":"","track_id":"1","provider":"qqmusic"}]}]}' \
  "http://HA地址:8123/api/xiaoshi/ma/playlist"
```

### 获取全部歌单

```bash
curl -H "Authorization: Bearer $TOKEN" \
  "http://HA地址:8123/api/xiaoshi/ma/playlist"
```

响应：

```json
{
  "groups": [
    { "media_player": "media_player.shi_ting", "repeat_mode": "random", "playlist": [...] }
  ]
}
```

### 获取指定播放器歌单

```bash
curl -H "Authorization: Bearer $TOKEN" \
  "http://HA地址:8123/api/xiaoshi/ma/playlist?media_player=media_player.shi_ting"
```

响应：

```json
{ "media_player": "media_player.shi_ting", "repeat_mode": "random", "playlist": [...] }
```

### 删除歌单

```bash
curl -X DELETE \
  -H "Authorization: Bearer $TOKEN" \
  "http://HA地址:8123/api/xiaoshi/ma/playlist?media_player=media_player.shi_ting"
```

响应：

```json
{ "result": "Deleted group for media_player.shi_ting" }
```

---

## 播放模式 API

```
GET  /api/xiaoshi/ma/repeat_mode?media_player=xxx     读取播放模式
POST /api/xiaoshi/ma/repeat_mode                      更新播放模式
```

### 可选值

| 值 | 含义 |
|----|------|
| `sequential` | 顺序播放 |
| `random` | 随机播放 |
| `repeat_one` | 单曲循环 |

### 读取播放模式（GET）

```bash
curl -H "Authorization: Bearer $TOKEN" \
  "http://HA地址:8123/api/xiaoshi/ma/repeat_mode?media_player=media_player.shi_ting"
```

响应：

```json
{ "media_player": "media_player.shi_ting", "repeat_mode": "sequential" }
```

> 未写入过的播放器默认返回 `sequential`。

### 更新播放模式（POST）

```bash
curl -X POST \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"media_player":"media_player.shi_ting","repeat_mode":"random"}' \
  "http://HA地址:8123/api/xiaoshi/ma/repeat_mode"
```

响应：

```json
{ "media_player": "media_player.shi_ting", "repeat_mode": "random" }
```

---

## 错误响应

| HTTP 状态码 | 说明 |
|-------------|------|
| 400 | MA API 未启用 / JSON 格式错误 / 缺少必填参数 / repeat_mode 非法值 |
| 404 | 指定播放器的歌单不存在 |
