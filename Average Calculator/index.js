const express = require('express');
const axios = require('axios');

const app = express();
const PORT = 9876;
const WINDOW_SIZE = 10;
let window = [];

const ENDPOINTS = {
  p: 'http://20.244.56.144/test/primes',
  f: 'http://20.244.56.144/test/fibo',
  e: 'http://20.244.56.144/test/even',
  r: 'http://20.244.56.144/test/rand'
};

const API_TOKEN = 'YOUR_API_TOKEN_HERE';

app.get('/', (req, res) => {
  res.send(`
    <h1>Average Calculator Microservice</h1>
    <p>Valid endpoints:</p>
    <ul>
      <li>/numbers/p - Primes</li>
      <li>/numbers/f - Fibonacci</li>
      <li>/numbers/e - Even</li>
      <li>/numbers/r - Random</li>
    </ul>
  `);
});

app.get('/numbers/:numberid', async (req, res) => {
  const id = req.params.numberid.toLowerCase();

  if (!ENDPOINTS[id]) {
    return res.status(400).json({ 
      error: "Invalid number ID. Use p, f, e, or r.",
      validEndpoints: Object.keys(ENDPOINTS)
    });
  }

  const prevWindow = [...window];

  try {
    const response = await axios.get(ENDPOINTS[id], {
      timeout: 500,
      headers: {
        Authorization: `Bearer ${API_TOKEN}`
      }
    });

    const numbers = response.data.numbers.filter(n => 
      Number.isInteger(n) && !window.includes(n)
    );

    window = [...window, ...numbers].slice(-WINDOW_SIZE);

    const avg = window.length > 0 
      ? parseFloat((window.reduce((a, b) => a + b) / window.length).toFixed(2))
      : 0;

    res.json({
      windowPrevState: prevWindow,
      windowCurrState: window,
      numbers: numbers,
      avg: avg
    });

  } catch (err) {
    res.status(504).json({
      error: "Upstream server timeout",
      details: err.message
    });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
