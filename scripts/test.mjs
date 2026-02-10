/**
 * 豆包API 简单测试
 */

import https from 'https';

const API_KEY = '7999abb8-d5ea-4312-b6d2-b46e5fb638a1';
const MODEL_ID = 'doubao-seed-1-6-251015';

const data = JSON.stringify({
  model: MODEL_ID,
  messages: [
    {
      role: 'user',
      content: '你好，请回答"test"'
    }
  ],
  max_tokens: 10
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
  console.log('状态码:', res.statusCode);
  
  let chunks = '';
  res.on('data', (chunk) => chunks += chunk);
  res.on('end', () => {
    console.log('响应长度:', chunks.length);
    console.log('响应内容:', chunks.substring(0, 500));
  });
});

req.on('error', (e) => {
  console.error('请求错误:', e.message);
});

req.write(data);
req.end();
