/**
 * 亲戚大作战 - 后端API服务（优化版）
 */

import express from 'express';
import cors from 'cors';
import https from 'https';

const app = express();
const PORT = 3000;

// 豆包API配置
const API_KEY = '7999abb8-d5ea-4312-b6d2-b46e5fb638a1';
const MODEL_ID = 'doubao-seed-1-6-251015';

// 极简系统提示词
const SYSTEM_PROMPT = `你是亲戚对战游戏裁判。大姨有100HP，评估用户回答。

输出JSON格式：
{"damage":10-40,"comment":"评语","next":"追问","over":true/false}`;

app.use(cors());
app.use(express.json());

// 评估接口
app.post('/api/evaluate', async (req, res) => {
  const { userAnswer, question, currentHp = 100, round = 1 } = req.body;
  
  try {
    const result = await evaluate(userAnswer, question, currentHp, round);
    res.json(result);
  } catch (error) {
    console.error('评估失败:', error.message);
    // 返回备用结果
    res.json(createFallbackResult(currentHp));
  }
});

// 初始化游戏
app.post('/api/init', (req, res) => {
  const { character } = req.body;
  
  const characters = {
    '大姨': { name: '大姨', hp: 100, firstQuestion: '找对象了吗？都28了，该急了！' },
    '叔叔': { name: '叔叔', hp: 100, firstQuestion: '现在工资多少？年终奖发了多少？' },
    '奶奶': { name: '奶奶', hp: 150, firstQuestion: '什么时候生孩子？趁年轻赶紧生！' }
  };
  
  const char = characters[character] || characters['大姨'];
  res.json({ ...char, character, round: 1, maxHp: char.hp });
});

app.listen(PORT, () => {
  console.log(`🎮 亲戚大作战: http://localhost:${PORT}`);
});

// 豆包API调用
async function evaluate(userAnswer, question, currentHp, round) {
  const userContent = `Q:"${question}" A:"${userAnswer}" HP:${currentHp}/100 R:${round}`;
  
  const data = JSON.stringify({
    model: MODEL_ID,
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: userContent }
    ],
    temperature: 0.7,
    max_tokens: 100
  });

  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'ark.cn-beijing.volces.com',
      path: '/api/v3/chat/completions',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`
      },
      timeout: 10000
    };

    const req = https.request(options, (res) => {
      let chunks = '';
      res.on('data', chunk => chunks += chunk);
      res.on('end', () => {
        try {
          const response = JSON.parse(chunks);
          const content = response.choices[0].message.content;
          console.log('豆包:', content);
          
          const result = parseResult(content, currentHp);
          resolve(result);
        } catch (e) {
          resolve(createFallbackResult(currentHp));
        }
      });
    });

    req.on('error', () => resolve(createFallbackResult(currentHp)));
    req.setTimeout(10000, () => { req.destroy(); resolve(createFallbackResult(currentHp)); });
    req.write(data);
    req.end();
  });
}

// 解析结果
function parseResult(content, currentHp) {
  const damageMatch = content.match(/damage["\s:]+(\d+)/);
  const damage = damageMatch ? parseInt(damageMatch[1]) : Math.floor(Math.random() * 20 + 15);
  const hp = Math.max(0, currentHp - damage);
  
  const comments = [
    '大姨若有所思...',
    '大姨准备继续追问...',
    '大姨悻悻地看了你一眼',
    '大姨转移了话题',
    '大姨被你的回答噎住了'
  ];
  const comment = comments[Math.floor(Math.random() * comments.length)];
  
  const questions = [
    '别扯别的，你就说到底怎么想的？',
    '你看看XX家孩子...',
    '你到底想找个什么样的？',
    '年纪不小了，别挑了',
    '你妈都急死了'
  ];
  
  return {
    evaluation: {
      damage,
      attack: Math.floor(Math.random() * 30 + 50),
      humor: Math.floor(Math.random() * 30 + 50),
      grace: Math.floor(Math.random() * 30 + 60),
      comment
    },
    npc_reaction: comment,
    next_question: hp > 0 ? questions[Math.floor(Math.random() * questions.length)] : '',
    game_over: hp <= 0
  };
}

// 备用结果
function createFallbackResult(currentHp) {
  const damage = Math.floor(Math.random() * 20 + 15);
  const hp = Math.max(0, currentHp - damage);
  
  return {
    evaluation: {
      damage,
      attack: 60,
      humor: 55,
      grace: 70,
      comment: '大姨被你的回答噎住了...'
    },
    npc_reaction: '大姨准备继续追问...',
    next_question: hp > 0 ? '别扯别的，你就说到底怎么想的？' : '',
    game_over: hp <= 0
  };
}
