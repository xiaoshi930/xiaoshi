# 此为卡片集合汇总
## 安装前请先在HACS删除以下仪表盘集成并移除自定义仓库：   
1、【xiaoshi-phone-card】https://github.com/xiaoshi930/xiaoshi-phone-card  
2、【xiaoshi-pad-card】https://github.com/xiaoshi930/xiaoshi-pad-card  
3、【xiaoshi-card】https://github.com/xiaoshi930/xiaoshi-card  
5、【popup-card】https://github.com/xiaoshi930/popup-card  

## 移除资源配置以下条目：
~~~
- url: /hacsfiles/xiaoshi-phone-card/xiaoshi-phone-card.js
  type: module
- url: /hacsfiles/xiaoshi-pad-card/xiaoshi-pad-card.js
  type: module
- url: /hacsfiles/xiaoshi-card/xiaoshi-card.js
  type: module
- url: /hacsfiles/popup-card/popup-card.js
  type: module
~~~

# 功能清单
## 适用手机端的卡片
### 手机端功能1：空调/水暖毯/热水器卡片
**引用示例**
~~~
type: custom:xiaoshi-phone-climate-card
entity: climate.kongtiao_keting
temperature: sensor.woshi_wendu              ## 额外温度实体，覆盖空调当前温度，用于空调实体没有【当前温度】情况
timer: timer.ke_ting_kong_diao_ding_shi_qi   ## 辅助元素：定时器实体
theme: on                                    ## 可选on、off、或者函数返回值如'[[[ return theme() ]]]'
auto_show: false                             ## 当有此选项时，空调关闭时，卡片隐藏
width: 100%                                  ## 卡片宽度，可省略，默认100%
buttons:                                     ## 附加按钮：辅热、节能、干燥、睡眠、提示音、指示灯等，没有可省略
  - switch.kongtiao_dryer_keting             ## 没有可省略
  - switch.kongtiao_eco_keting               ## 没有可省略
  - switch.kongtiao_heater_keting            ## 没有可省略
  - switch.kongtiao_sleep_keting             ## 没有可省略
  - switch.kongtiao_alarm_keting             ## 没有可省略
  - light.kongtiao_light_keting              ## 没有可省略
buttons2:                                    ## 附加按钮第2排：辅热、节能、干燥、睡眠、提示音、指示灯等，没有可省略
  - switch.kongtiao_dryer_keting             ## 没有可省略
  - switch.kongtiao_eco_keting               ## 没有可省略
  - switch.kongtiao_heater_keting            ## 没有可省略
  - switch.kongtiao_sleep_keting             ## 没有可省略
  - switch.kongtiao_alarm_keting             ## 没有可省略
  - light.kongtiao_light_keting              ## 没有可省略
~~~

### 手机端功能2：加湿器卡片
**引用示例**
~~~
type: custom:xiaoshi-phone-humidifier-card
entity: humidifier.jiashiqi_keting
select: select.jiashiqi_keting               ## 加湿器风机select实体
timer: timer.xxxxxxxxxxxx                    ## 辅助元素：定时器实体
theme: on                                    ## 可选on、off、或者函数返回值如'[[[ return theme() ]]]'
auto_show: false                             ## 当有此选项时，空调关闭时，卡片隐藏
width: 100%                                  ## 卡片宽度，可省略，默认100%
buttons:                                     ## 附加按钮：辅热、节能、干燥、睡眠、提示音、指示灯等，没有可省略
  - light.jiashiqi_light_keting              ## 没有可省略
  - switch.jiashiqi_alarm_keting             ## 没有可省略
  - sensor.jiashiqi_water_keting             ## 没有可省略
  - sensor.jiashiqi_tank_keting              ## 没有可省略
~~~

### 手机端功能3：净化器卡片
**引用示例**
~~~
type: custom:xiaoshi-phone-purifier-card 
entity: switch.jinghuaqi_keting              ## 净化器主实体fan或者switch
select: select.jinghuaqi_keting              ## 如果是switch的主实体，这里选净化器模式
number: number.jinghuaqi_keting              ## 最爱风速number实体
pm25: sensor.jinghuaqi_pm25_keting           ## pm25传感器
temperature: sensor.jinghuaqi_wendu_keting   ## 温度传感器
humidity: sensor.jinghuaqi_shidu_keting      ## 湿度传感器
timer: timer.xxxxxxxxxxxx                    ## 辅助元素：定时器实体
theme: on                                    ## 可选on、off、或者函数返回值如'[[[ return theme() ]]]'
auto_show: false                             ## 当有此选项时，空调关闭时，卡片隐藏
width: 100%                                  ## 卡片宽度，可省略，默认100%
buttons:                                     ## 附加按钮：辅热、节能、干燥、睡眠、提示音、指示灯等，没有可省略
  - switch.jinghuaqi_alarm_keting            ## 没有可省略
  - switch.jinghuaqi_locked_keting           ## 没有可省略
  - select.jinghuaqi_light_keting            ## 没有可省略
  - sensor.haocai_jinghuaqi_lvxin_keting     ## 没有可省略
~~~

### 手机端功能4：电脑卡片
**引用示例**
~~~
type: custom:xiaoshi-phone-computer-card
entity: switch.diannao                       ## 电脑开关实体（来源开机卡）
theme: on                                    ## 可选on、off、或者函数返回值如'[[[ return theme() ]]]'
auto_show: false                             ## 当有此选项时，空调关闭时，卡片隐藏
cpu: sensor.pc_cpu_usage                     ## 实体来源：windows电脑安装 IOT link，配置HA的mqtt服务器
memory: sensor.pc_memory_usage               ## 实体来源：官网https://iotlink.gitlab.io/downloads.html
storage:
  - sensor.pc_storage_c_usage                ## 实体来源：同上
  - sensor.pc_storage_d_usage                ## 实体来源：同上
  - sensor.pc_storage_e_usage                ## 实体来源：同上
  - sensor.pc_storage_f_usage                ## 实体来源：同上
~~~

### 手机端功能5：灯光控制卡
**引用示例**
~~~
type: custom:xiaoshi-phone-light-card
entities:             # 要想使用全关功能，灯光必须是light实体
  - light.light1
  - light.light2
  - light.light3    
width: 87vw           # 卡片宽度
height: 20vw          # 卡片高度
rgb: true             # 是否显示亮度、色温控制
show: auto            # 当有这行调用时，仅当灯光时on时才会显示，当灯光时off时卡片整体隐藏
theme: "on"           # 选项on是白色，选项off是黑色，也可以引用全局函数：'[[[ return theme()]]]'
total: "on"           # 选项on显示表头统计行，选项off不显示统计行，默认参数为on
columns: 1            # 布局的列数，默认1列
~~~

### 手机端功能6：插座控制卡
**引用示例**
~~~
type: custom:xiaoshi-phone-switch-card
entities:
  - entity: switch.switch1   # 插座1实体 
    power: sensor.power1     # 插座1对应功率实体
  - entity: switch.switch2   # 插座2实体
    power: sensor.power2     # 插座2对应功率实体
height: 85vw                 # 卡片宽度
width: 20vw                  # 卡片高度
theme: "on"                  # 选项on是白色，选项off是黑色，也可以引用全局函数：'[[[ return theme()]]]'
total: "on"                  # 选项on显示表头统计行，选项off不显示统计行，默认参数为on
columns: 1                   # 布局的列数，默认1列
~~~

### 手机端功能7：加载随机视频网址API
**引用示例**
~~~
type: custom:xiaoshi-phone-video-card 
top: 0vh  # 上下偏移的距离
url:
  - https://videos.xxapi.cn/0db2ccb392531052.mp4 # 引用视频api网址的数组
  - https://videos.xxapi.cn/228f4dd7318750dd.mp4 # 引用视频api网址的数组
~~~

### 手机端功能8：加载随机图片网址API
**引用示例**
~~~
type: custom:xiaoshi-phone-image-card
top: 0vh  # 上下偏移的距离
url:
  - https://api.suyanw.cn/api/sjmv.php  # 引用图片api网址的数组
  - https://api.suyanw.cn/api/meinv.php # 引用图片api网址的数组
~~~

## 适用平板端的卡片
### 平板端功能1：空调卡/加湿器卡/热水器卡/水暖毯卡  
**引用示例**  
~~~
type: custom:xiaoshi-pad-climate-card
详细配置参照可视化编辑器
~~~

### 平板端功能2：分布卡(温度分布、湿度分布)
**引用示例**
~~~
type: custom:xiaoshi-pad-grid-card
display: true                # 当display为true或者[[[ return true]]] 时 隐藏整张卡片
entities:
  - entity: sensor.shidu_ciwo
    grid: 0%,0%,30%,29%
  - entity: sensor.shidu_keting
    grid: 32%,69%,17%,9%     # 横坐标、纵坐标、宽度、高度
    state: false             # false不显示数值，默认显示，可省略 
    unit: " %"               # 显示的单位，默认不显示，可省略
width: 100px                 # 卡片 整体宽度
height: 120px                # 卡片 整体高度
min: 20                      # 当前地区最小值
max: 80                      # 当前地区最大值
mode: 湿度                   # 【温度】或者【湿度】
~~~

## 适用手机端&平板端的卡片（通用卡片）
### 通用卡片功能1：HA信息卡(手机平板端通用)
**引用示例**
~~~
type: custom:xiaoshi-ha-info-card
width: 100%
skip_updates: false    #是否包含已跳过的更新
theme: on
exclude_devices:
  - *设备*
exclude_entities:
  - *shiti*
~~~
~~~
type: custom:xiaoshi-ha-info-button
## 对应按钮：详见仪表盘配置
~~~

### 通用卡片功能2：电话信息余额卡(手机平板端通用)
**引用示例**
~~~
type: custom:xiaoshi-balance-card
name: 电话余额信息
width: 100%
theme: on
entities:
  - entity_id: sensor.999
    attribute: null
    overrides:
      icon: ""
      name: ""
      unit_of_measurement: ""
      warning: ""
  - entity_id: input_boolean.777
    attribute: friendly_name
    overrides:
      name: ""
      icon: ""
      unit_of_measurement: ""
      warning: "99"
~~~
~~~
type: custom:xiaoshi-balance-button
## 对应按钮：详见仪表盘配置
~~~

### 通用卡片功能3：待办事项卡(手机平板端通用)
**引用示例**
~~~
type: custom:xiaoshi-todo-card
width: 100%
theme: on
entities:
  - todo.kuai_di
  - todo.ji_shi_ben
~~~
~~~
type: custom:xiaoshi-todo-button
## 对应按钮：详见仪表盘配置
~~~

### 通用卡片功能4：耗材信息卡片(手机平板端通用)
**引用示例**
~~~
type: custom:xiaoshi-consumables-card
width: 100%
global_warning: <8
columns: "2"
entities:
  - entity_id: input_text.aaa
    overrides:
      name: 名称
      unit_of_measurement: "%"
      warning: <10
      conversion: "*2"
      icon: ""
  - entity_id: input_text.aaa1
  - entity_id: input_text.aaa2
  - entity_id: input_text.aaa3
  - entity_id: input_text.aaa4
  - entity_id: input_text.aaa5
  - entity_id: input_text.aaa6
  - entity_id: input_text.aaa7
~~~
~~~
type: custom:xiaoshi-consumables-button
## 对应按钮：详见仪表盘配置
~~~

### 通用卡片功能5：曲线卡片(手机平板端通用)
**引用示例**
~~~
type: custom:xiaoshi-chart-card
entities:
  - entity: sensor.jinghuaqi_pm25_keting
    name: 客厅净化器
    color: "#d71919"
  - entity: sensor.jinghuaqi_pm25_zhuwo
    name: 主卧净化器
    color: "#220dbf"
~~~
~~~
type: custom:xiaoshi-chart-button
## 对应按钮：详见仪表盘配置
~~~

## 移植重置卡popup-card
~~~
原作者：https://bbs.hassbian.com/thread-32007-1-1.html
~~~
~~~
type: button
name: 打开控制面板
tap_action:
  action: call-service
  service: popup_card.show
  service_data:
    title: 控制面板             # 可选
    hide_header: false         # 可选
    width: 400px               # 弹出得宽度
    top: 10%                   # 弹出得位置
    background: rgb(0,0,0,0)   # 重定义背景的颜色
    gap: 0                     # 重定义垂直卡片的间距
    card:                      # 必填，支持单个对象或数组
      type: entities
      entities:
        - entity: light.kitchen
        - entity: sensor.humidity
~~~


