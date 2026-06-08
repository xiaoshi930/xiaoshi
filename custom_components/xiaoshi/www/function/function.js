import "https://unpkg.com/js-yaml@4.1.0/dist/js-yaml.min.js";

/**
 * button-card 模板解析 & YAML→JSON 卡片解析工具
 *
 * 功能1: [[[]]] 模板语法解析
 *   - [[[ js_code ]]]  → 执行 JS 代码并返回结果
 *   - [[[[ value ]]]]  → 去掉首尾一层括号，返回字符串
 *
 * 功能2: YAML 配置 → 标准 JSON
 *   - 将 YAML 格式的卡片配置解析为标准 JSON 对象
 *   - 支持嵌套卡片（如 vertical-stack 中的 cards 数组）
 */

// ============================================================
// 功能1: [[[]]] 模板解析
// ============================================================

/**
 * 执行 JS 模板字符串（对应 button-card 的 _evalTemplate）
 *
 * @param {string} func - [[[]]] 中间部分的 JS 代码
 * @param {object} [context={}] - 注入到模板中的上下文变量
 * @param {object} [context.states] - HA 所有实体状态
 * @param {object} [context.entity] - 当前实体
 * @param {object} [context.user]   - 当前用户
 * @param {object} [context.hass]   - hass 对象
 * @param {object} [context.variables] - 自定义变量
 * @param {object} [context.helpers]   - 辅助函数
 * @returns {*} JS 代码的执行结果
 */
function evalTemplate(func, context = {}) {
  const { states, entity, user, hass, variables, helpers } = context;
  try {
    return new Function(
      'states', 'entity', 'user', 'hass', 'variables', 'helpers',
      `'use strict'; ${func}`
    ).call(null, states, entity, user, hass, variables, helpers);
  } catch (e) {
    const funcTrimmed = func.length <= 100 ? func.trim() : `${func.trim().substring(0, 98)}...`;
    e.message = `${e.name}: ${e.message} in '${funcTrimmed}'`;
    e.name = 'ButtonCardJSTemplateError';
    throw e;
  }
}

/**
 * 递归解析对象中所有 [[[]]] 模板（对应 button-card 的 _getTemplateOrValue）
 *
 * 规则:
 *   - number / boolean / function → 原值返回
 *   - null / undefined → 原值返回
 *   - object → 递归处理每个属性
 *   - string 匹配 [[[...]]]  (恰好3层) → 执行 JS 并返回结果
 *   - string 匹配 [[[[...]]]] (4层及以上且对称) → 去掉首尾一层括号返回字符串
 *   - 其他 → 原值返回
 *
 * @param {*} value - 要解析的值（可以是对象、数组、字符串等）
 * @param {object} [context={}] - 传给 evalTemplate 的上下文
 * @returns {*} 解析后的值
 */
function getTemplateOrValue(value, context = {}) {
  if (['number', 'boolean', 'function'].includes(typeof value)) return value;
  if (value == null) return value;

  // 递归处理对象/数组
  if (typeof value === 'object') {
    Object.keys(value).forEach((key) => {
      value[key] = getTemplateOrValue(value[key], context);
    });
    return value;
  }

  // 字符串模板匹配
  const trimmed = value.trim();
  const rx = /^(\[{3,})(.*?)(\]{3,})$/s;
  const match = trimmed.match(rx);

  if (match && match.length === 4) {
    if (match[1].length === 3 && match[3].length === 3) {
      // [[[ js_code ]]] → 执行模板
      return evalTemplate(match[2], context);
    } else if (match[1].length === match[3].length) {
      // [[[[ value ]]]] → 去掉首尾一层括号
      return trimmed.slice(1, -1);
    } else {
      return value;
    }
  } else {
    return value;
  }
}

/**
 * 深拷贝后解析模板（对应 button-card 的 _objectEvalTemplate）
 * 不修改原始对象
 *
 * @param {object} obj - 要解析的对象
 * @param {object} [context={}] - 传给 evalTemplate 的上下文
 * @returns {*} 解析后的对象
 */
function objectEvalTemplate(obj, context = {}) {
  const clone = JSON.parse(JSON.stringify(obj));
  return getTemplateOrValue(clone, context);
}


// ============================================================
// 功能2: YAML → 标准 JSON 卡片配置解析
// ============================================================

/**
 * 将 YAML 字符串解析为标准 JSON 对象
 *
 * 支持嵌套结构，包括:
 *   - 基本键值对
 *   - 数组（cards 列表等）
 *   - 嵌套对象
 *   - 多行字符串
 *
 * 依赖: js-yaml (npm install js-yaml)
 *
 * @param {string} yamlStr - YAML 格式的字符串
 * @returns {object} 标准 JSON 对象
 */
function yamlToJson(yamlStr) {
  return jsyaml.load(yamlStr, { schema: jsyaml.DEFAULT_SCHEMA });
}

/**
 * 将 JSON 对象序列化为 YAML 字符串
 *
 * @param {object} obj - 要序列化的 JSON 对象
 * @param {object} [options={}] - js-yaml dump 选项
 * @returns {string} YAML 格式字符串
 */
function jsonToYaml(obj, options = {}) {
  const defaultOptions = { indent: 2, lineWidth: -1 };
  return jsyaml.dump(obj, { ...defaultOptions, ...options });
}


/**
 * 便捷方法: 解析 YAML 配置并执行其中所有 [[[]]] 模板
 *
 * @param {string} yamlStr - YAML 格式的配置字符串
 * @param {object} [context={}] - 模板上下文
 * @returns {object} 解析并执行模板后的 JSON 对象
 */
function parseYamlWithTemplates(yamlStr, context = {}) {
  const jsonObj = yamlToJson(yamlStr);
  return objectEvalTemplate(jsonObj, context);
}


// ============================================================
// 导出
// ============================================================

export { evalTemplate, getTemplateOrValue, objectEvalTemplate, yamlToJson, jsonToYaml, parseYamlWithTemplates };
