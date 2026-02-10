// Vercel API Route for 亲戚大作战
// 部署到 Vercel Functions

export default async function handler(req, res) {
  const { method, body } = req;

  // 设置CORS
  res.setHeader('Access-Control-Allow-Cors', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { userAnswer, question, currentHp = 100, round = 1, character } = body || {};

  // 初始化游戏
  if (character) {
    const characters = {
      '大姨': { name: '大姨', hp: 100, firstQuestion: '找对象了吗？都28了，该急了！' },
      '叔叔': { name: '叔叔', hp: 100, firstQuestion: '现在工资多少？年终奖发了多少？' },
      '奶奶': { name: '奶奶', hp: 150, firstQuestion: '什么时候生孩子？趁年轻赶紧生！' }
    };
    const char = characters[character] || characters['大姨'];
    return res.json({ ...char, character, round: 1, maxHp: char.hp });
  }

  // 评估回答
  if (userAnswer && question) {
    try {
      // 调用豆包API
      const result = await evaluateWithDoubao(userAnswer, question, currentHp, round);
      return res.json(result);
    } catch (error) {
      console.error('评估失败:', error.message);
      // 返回备用结果
      return res.json(createFallbackResult(currentHp));
    }
  }

  res.status(400).json({ error: 'Invalid request' });
}

// 豆包API调用（Vercel Serverless版本）
async function evaluateWithDoubao(userAnswer, question, currentHp, round) {
  const https = await import('https');
  
  const API_KEY = process.env.DOUBAO_API_KEY || '7999abb8-d5ea-4312-b6d2-b46e5fb638a1';
  const MODEL_ID = 'doubao-seed-1-6-251015';

  return new Promise((resolve) => {
    const data = JSON.stringify({
      model: MODEL_ID,
      messages: [
        { 
          role: 'system', 
          content: `你是亲戚对战游戏裁判。大姨有100HP，评估用户回答。
输出JSON：{"damage":10-40,"comment":"评语","next":"追问","over":true/false}` 
        },
        { 
          role: 'user', 
          content: `Q:"${question}" A:"${userAnswer}" HP:${currentHp}/100 R:${round}` 
        }
      ],
      temperature: 0.7,
      max_tokens: 100
    });

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

    const req = https.default.request(options, (res) => {
      let chunks = '';
      res.on('data', chunk => chunks += chunk);
      res.on('end', () => {
        try {
          const response = JSON.parse(chunks);
          const content = response.choices?.[0]?.message?.content || '';
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
    '大姨若有所思...', '大姨准备继续追问...', 
    '大姨悻悻地看了你一眼', '大姨被你的回答噎住了'
  ];
  
  const questions = [
    '别扯别的，你就说到底怎么想的？', '你看看XX家孩子...',
    '你到底想找个什么样的？', '年纪不小了，别挑了'
  ];
  
  return {
    evaluation: {
      damage,
      attack: Math.floor(Math.random() * 30 + 50),
      humor: Math.floor(Math.random() * 30 + 50),
      grace: Math.floor(Math.random() * 30 + 60),
      comment: comments[Math.floor(Math.random() * comments.length)]
    },
    npc_reaction: comments[0],
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
      attack: 60, humor: 55, grace: 70,
      comment: '大姨被你的回答噎住了...'
    },
    npc_reaction: '大姨准备继续追问...',
    next_question: hp > 0 ? '别扯别的，你就说到底怎么想的？' : '',
    game_over: hp <= 0
  };
}
