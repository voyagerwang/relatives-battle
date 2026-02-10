# 🎮 亲戚大作战 - 技术方案

## 豆包API配置

```javascript
const API_KEY = '7999abb8-d5ea-4312-b6d2-b46e5fb638a1';
const MODEL_ID = 'doubao-seed-1-6-251015';
const API_URL = 'https://ark.cn-beijing.volces.com/api/v3/chat/completions';
```

## API调用示例

```javascript
async function evaluateAnswer(userAnswer, question, currentHp = 100, round = 1) {
  const response = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${API_KEY}`
    },
    body: JSON.stringify({
      model: MODEL_ID,
      messages: [
        {
          role: 'system',
          content: SYSTEM_PROMPT
        },
        {
          role: 'user',
          content: `亲戚角色：大姨
当前轮次：${round}
当前血量：${currentHp}/100

大姨问："${question}"
用户回答："${userAnswer}"

请评估用户回答并生成下一题。`
        }
      ],
      temperature: 0.7,
      max_tokens: 500
    })
  });

  const result = await response.json();
  return JSON.parse(result.choices[0].message.content);
}
```

## 系统提示词

```javascript
const SYSTEM_PROMPT = `你是一个亲戚对战游戏的裁判。游戏背景是：
- 用户需要应对亲戚的灵魂拷问
- 亲戚（大姨）有100点血量
- 每轮对话会根据回答造成伤害
- 当血量归零时，亲戚会悻悻地停止追问

大姨的性格特征：
- 爱八卦，什么都想问
- 执着，一个问题问到底
- 话多，说起来没完
- 但心地不坏，只是习惯性关心

评估维度（0-100分）：
1. 攻击力 - 能不能有效回击或转移话题
2. 幽默感 - 好不好笑，能不能化解尴尬
3. 优雅度 - 是否得体，不伤和气
4. 创意性 - 是否有新意，不是千篇一律的回答

伤害计算公式：
伤害 = 攻击力 × 0.4 + 幽默感 × 0.3 + 优雅度 × 0.2 + 创意性 × 0.1

请以JSON格式输出：
{
  "evaluation": {
    "attack": 0-100,
    "humor": 0-100,
    "grace": 0-100,
    "creativity": 0-100,
    "damage": 0-50,
    "comment": "一句评语"
  },
  "npc_reaction": "大姨的反应描述",
  "next_question": "大姨的下一句话",
  "game_over": true/false
}`;
```

## 项目结构

```
relatives-battle/
├── scripts/
│   ├── doubao.mjs      # 豆包API调用
│   └── test.mjs        # API测试
├── README.md           # 说明文档
└── api/
    └── index.js        # 后端API服务
```

## 运行方式

```bash
# 测试API
node scripts/test.mjs

# 评估回答
node scripts/doubao.mjs "大姨，您吃菜吃菜" "找对象了吗？" 100 1
```
