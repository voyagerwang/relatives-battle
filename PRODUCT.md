# 🎮 亲戚大作战 - 完整产品方案

## 一、产品概述

**核心玩法**：用大模型实现多轮对话式亲戚问答battle游戏

---

## 二、核心交互流程

```
选择亲戚 → 大姨出题 → 用户回答 → 豆包评估 → 伤害计算
                                        ↓
                              大姨血条减少 → 生成追问
                                        ↓
                              血条归零 → 战斗胜利
```

---

## 三、API配置

### 豆包API
```javascript
const API_KEY = '7999abb8-d5ea-4312-b6d2-b46e5fb638a1';
const MODEL_ID = 'doubao-seed-1-6-251015';
const API_URL = 'https://ark.cn-beijing.volces.com/api/v3/chat/completions';
```

### 系统提示词
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

---

## 四、角色设计

| 角色 | 血量 | 技能 | 难度 |
|------|------|------|------|
| 👩 大姨 | 100 | 婚恋三连击 | ⭐ |
| 👨 叔叔 | 100 | 工资灵魂问 | ⭐⭐ |
| 👵 奶奶 | 150 | 抱娃催促术 | ⭐⭐⭐ |
| 👴 爷爷 | 150 | 人生哲学讲 | ⭐⭐⭐ |
| 👦 表哥 | 120 | 凡尔赛炫耀 | ⭐⭐⭐ |

---

## 五、多轮对话示例

```
【第1轮】
大姨："找对象了吗？都28了，该急了！"
用户："大姨，您吃菜吃菜"
豆包评估：攻击力45 | 幽默感60 | 优雅度85
造成伤害：15点
大姨反应：悻悻地
大姨追问："别扯别的，我就问你，到底有没有？"

【第2轮】
大姨："别扯别的，我就问你，到底有没有？"
用户："大姨，您家XX呢？"
豆包评估：攻击力70 | 幽默感50 | 优雅度90
造成伤害：35点
大姨反应：有点不甘心
大姨追问："他/她不管你的事，你就说你要单到什么时候？"

【第3轮】
大姨："你要单到什么时候？"
用户："各人有各人的命"
豆包评估：攻击力80 | 幽默感70 | 优雅度85
造成伤害：50点
大姨血量：0
🎉 胜利！
```

---

## 六、完整代码

### scripts/doubao.mjs

```javascript
import https from 'https';

const API_KEY = '7999abb8-d5ea-4312-b6d2-b46e5fb638a1';
const MODEL_ID = 'doubao-seed-1-6-251015';

const SYSTEM_PROMPT = `...（同上）...`;

async function evaluateAnswer(userAnswer, question, currentHp = 100, round = 1) {
  const userContent = `亲戚角色：大姨
当前轮次：${round}
当前血量：${currentHp}/100

大姨问："${question}"
用户回答："${userAnswer}"

请评估用户回答并生成下一题。`;

  const data = JSON.stringify({
    model: MODEL_ID,
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: userContent }
    ],
    temperature: 0.7,
    max_tokens: 500
  });

  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'ark.cn-beijing.volces.com',
      path: '/api/v3/chat/completions',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`
      }
    };

    const req = https.request(options, (res) => {
      let chunks = '';
      res.on('data', chunk => chunks += chunk);
      res.on('end', () => {
        try {
          const response = JSON.parse(chunks);
          const result = JSON.parse(response.choices[0].message.content);
          resolve(result);
        } catch (e) {
          reject(e);
        }
      });
    });

    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

export { evaluateAnswer };
```

---

## 七、运行测试

```bash
# 安装依赖
npm init -y
npm install express cors

# 启动后端服务
node api/index.js

# 测试API
node scripts/doubao.mjs "大姨，您吃菜吃菜" "找对象了吗？" 100 1
```

---

## 八、前端页面（单文件HTML）

```html
<!DOCTYPE html>
<html>
<head>
  <title>亲戚大作战</title>
  <style>
    .battle { max-width: 400px; margin: 0 auto; }
    .hp-bar { 
      background: #e0e0e0; height: 20px; border-radius: 10px;
      overflow: hidden; margin: 10px 0;
    }
    .hp-fill { 
      background: linear-gradient(90deg, #ff6b6b, #ee5a5a); 
      height: 100%; transition: width 0.3s;
    }
    .bubble {
      background: #f5f5f5; padding: 15px; border-radius: 15px;
      margin: 10px 0; position: relative;
    }
    .bubble::before {
      content: ''; position: absolute; top: -10px; left: 20px;
      border: 10px solid transparent; border-bottom-color: #f5f5f5;
    }
    .input-area { display: flex; gap: 10px; margin: 20px 0; }
    input { flex: 1; padding: 10px; border: 1px solid #ddd; border-radius: 5px; }
    button { padding: 10px 20px; background: #ff6b6b; color: white; border: none; border-radius: 5px; }
  </style>
</head>
<body>
  <div class="battle">
    <h1>🎮 亲戚大作战</h1>
    
    <div class="hp-bar">
      <div class="hp-fill" id="hpFill" style="width: 100%"></div>
    </div>
    <p>大姨血量：<span id="hpText">100</span>/100</p>
    
    <div class="bubble" id="questionBubble">
      大姨："找对象了吗？都28了，该急了！"
    </div>
    
    <div class="input-area">
      <input type="text" id="answerInput" placeholder="输入你的回答..." />
      <button onclick="submitAnswer()">回答</button>
    </div>
    
    <button onclick="showHints()">💡 话术提示</button>
    <div id="hints" style="display:none; margin: 10px 0;"></div>
  </div>

  <script>
    let hp = 100;
    let round = 1;
    let currentQuestion = "找对象了吗？都28了，该急了！";
    const API_URL = 'http://localhost:3000/api/evaluate';

    async function submitAnswer() {
      const answer = document.getElementById('answerInput').value;
      if (!answer) return;

      const res = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          userAnswer: answer, 
          question: currentQuestion,
          currentHp: hp,
          round: round
        })
      });

      const result = await res.json();
      
      // 更新血条
      hp = Math.max(0, hp - result.evaluation.damage);
      document.getElementById('hpFill').style.width = hp + '%';
      document.getElementById('hpText').textContent = hp;
      
      // 显示结果
      alert(`造成 ${result.evaluation.damage} 点伤害！\n评语：${result.evaluation.comment}`);
      
      if (result.game_over) {
        alert('🎉 战斗胜利！大姨悻悻地离开了！');
        hp = 100;
        round = 1;
      } else {
        currentQuestion = result.next_question;
        round++;
      }
      
      document.getElementById('questionBubble').innerHTML = `大姨："${currentQuestion}"`;
      document.getElementById('answerInput').value = '';
    }
  </script>
</body>
</html>
```

---

## 九、后续优化

1. **语音输入** - 调用语音识别API
2. **话术提示** - 免费提示 + AI增强提示
3. **角色系统** - 更多亲戚类型
4. **成就系统** - 击败记录、分享功能

---

## 十、文件结构

```
relatives-battle/
├── scripts/
│   ├── doubao.mjs      # 豆包API调用
│   └── test.mjs        # API测试
├── api/
│   └── index.js        # Express后端服务
├── index.html          # 前端页面
├── README.md           # 说明文档
└── PRODUCT.md          # 产品方案
```

---

**运行方式：**
```bash
cd /root/.openclaw/workspace/relatives-battle
node scripts/doubao.mjs "大姨，您吃菜吃菜" "找对象了吗？" 100 1
```
