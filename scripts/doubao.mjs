/**
 * 豆包大模型 API 调用脚本
 * 
 * 使用方式：
 * node scripts/doubao.mjs "用户回答" "亲戚问题" "当前血量" "轮次"
 * 
 * 示例：
 * node scripts/doubao.mjs "大姨，您吃菜吃菜" "找对象了吗？" 100 1
 */

import https from 'https';

// 配置
const API_KEY = '7999abb8-d5ea-4312-b6d2-b46e5fb638a1';
const MODEL_ID = 'doubao-seed-1-6-251015';

// 系统提示词
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
  "npc_reaction": "大姨的反应描述（如：悻悻地、有点不甘心、话锋一转）",
  "next_question": "大姨的下一句话（根据用户回答自然追问，如果血量归零则为空）",
  "game_over": true/false
}`;

/**
 * 调用豆包API评估用户回答
 */
async function evaluateAnswer(userAnswer, question, currentHp = 100, round = 1) {
  return new Promise((resolve, reject) => {
    const userContent = `亲戚角色：大姨
当前轮次：${round}
当前血量：${currentHp}/100

大姨问："${question}"
用户回答："${userAnswer}"

请评估用户回答并生成下一题。`;

    const data = JSON.stringify({
      model: MODEL_ID,
      messages: [
        {
          role: 'system',
          content: SYSTEM_PROMPT
        },
        {
          role: 'user',
          content: userContent
        }
      ],
      temperature: 0.7,
      max_tokens: 500
    });

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
      res.on('data', (chunk) => chunks += chunk);
      res.on('end', () => {
        try {
          const response = JSON.parse(chunks);
          if (response.error) {
            reject(new Error(response.error.message));
            return;
          }
          
          const result = JSON.parse(response.choices[0].message.content);
          resolve(result);
        } catch (e) {
          reject(new Error('解析响应失败: ' + e.message));
        }
      });
    });

    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

/**
 * 格式化输出结果
 */
function formatResult(result, question, userAnswer) {
  console.log('\n' + '='.repeat(50));
  console.log('📊 评估结果');
  console.log('='.repeat(50));
  
  console.log('\n💬 大姨问：' + question);
  console.log('💬 你回答：' + userAnswer);
  
  if (result.evaluation) {
    const ev = result.evaluation;
    console.log('\n📈 各项评分：');
    console.log('   攻击力：' + ev.attack + '分 💪');
    console.log('   幽默感：' + ev.humor + '分 😊');
    console.log('   优雅度：' + ev.grace + '分 👌');
    console.log('   创意性：' + ev.creativity + '分 💡');
    console.log('\n💥 造成伤害：' + ev.damage + '点');
    console.log('💬 评语：' + ev.comment);
  }
  
  if (result.npc_reaction) {
    console.log('\n🤔 大姨反应：' + result.npc_reaction);
  }
  
  if (result.game_over) {
    console.log('\n🎉 战斗结束！大姨血量归零！');
  } else if (result.next_question) {
    console.log('\n🔄 大姨追问：' + result.next_question);
  }
  
  console.log('\n' + '='.repeat(50) + '\n');
}

// CLI 入口
if (process.argv[1] && process.argv[1].endsWith('doubao.mjs')) {
  const args = process.argv.slice(2);
  
  if (args.length < 2) {
    console.log('使用方法：node doubao.mjs <用户回答> <亲戚问题> [当前血量] [轮次]');
    console.log('示例：node doubao.mjs "大姨，您吃菜吃菜" "找对象了吗？" 100 1');
    process.exit(1);
  }
  
  const [userAnswer, question, currentHp = 100, round = 1] = args;
  
  console.log('🔄 正在调用豆包API...\n');
  
  evaluateAnswer(userAnswer, question, parseInt(currentHp), parseInt(round))
    .then(result => {
      formatResult(result, question, userAnswer);
    })
    .catch(err => {
      console.error('❌ 调用失败：' + err.message);
      process.exit(1);
    });
}

export { evaluateAnswer, formatResult };
