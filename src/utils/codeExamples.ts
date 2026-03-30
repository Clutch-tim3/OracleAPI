import { nanoid } from 'nanoid';

export function buildCodeExamples(opts: {
  method: 'GET' | 'POST';
  path: string;
  sampleParams?: string;
  sampleBody?: any;
}): { node: string; python: string; curl: string } {
  const baseUrl = 'https://oracleiq.p.rapidapi.com';
  const fullPath = opts.sampleParams ? `${opts.path}${opts.sampleParams}` : opts.path;
  const fullUrl = `${baseUrl}${fullPath}`;

  const nodeCode = `const axios = require('axios');

const options = {
  method: '${opts.method}',
  url: '${fullUrl}',
  headers: {
    'X-RapidAPI-Key': 'YOUR_API_KEY_HERE',
    'X-RapidAPI-Host': 'oracleiq.p.rapidapi.com',
    'Content-Type': 'application/json'
  }${opts.method === 'POST' ? `,\n  data: ${JSON.stringify(opts.sampleBody, null, 2)}` : ''}
};

axios.request(options).then(function (response) {
  console.log(response.data);
}).catch(function (error) {
  console.error(error);
});`;

  const pythonCode = `import requests

url = '${fullUrl}'

headers = {
  'X-RapidAPI-Key': 'YOUR_API_KEY_HERE',
  'X-RapidAPI-Host': 'oracleiq.p.rapidapi.com',
  'Content-Type': 'application/json'
}

${opts.method === 'POST' ? `payload = ${JSON.stringify(opts.sampleBody, null, 2)}\n` : ''}

response = requests.request('${opts.method}', url, headers=headers${opts.method === 'POST' ? ', json=payload' : ''})

print(response.text)`;

  let curlCode = `curl "${fullUrl}" \\
  -H "X-RapidAPI-Key: YOUR_API_KEY_HERE" \\
  -H "X-RapidAPI-Host: oracleiq.p.rapidapi.com"`;

  if (opts.method === 'POST') {
    curlCode += ` \\
  -H "Content-Type: application/json" \\
  -d '${JSON.stringify(opts.sampleBody)}'`;
  }

  return {
    node: nodeCode,
    python: pythonCode,
    curl: curlCode,
  };
}