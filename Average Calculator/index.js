const express = require('express');
const axios = require('axios');

const app = express();
const PORT = 9876;
const WINDOW_SIZE = 10;
let window = [];

// Updated working endpoints (as of May 2025)
const ENDPOINTS = {
  p: 'http://20.244.56.144/test/primes',
  f: 'http://20.244.56.144/test/fibo',
  e: 'http://20.244.56.144/test/even',
  r: 'http://20.244.56.144/test/rand'
};

// Authorization token (if required by API)
const API_TOKEN = 'YOUR_API_TOKEN_HERE'; // <-- Replace with your actual API key/token

// Root endpoint for verification
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

// Main number processing endpoint
app.get('/numbers/:numberid', async (req, res) => {
  const id = req.params.numberid.toLowerCase();
  
  // Ensure valid ID
  if (!ENDPOINTS[id]) {
    return res.status(400).json({ 
      error: "Invalid number ID. Use p, f, e, or r.",
      validEndpoints: Object.keys(ENDPOINTS)
    });
  }

  const prevWindow = [...window]; // Save previous state of window

  try {
    // Send request to third-party server with authorization header (if needed)
    const response = await axios.get(ENDPOINTS[id], {
      timeout: 500, // 500 ms timeout to avoid long delays
      headers: {
        Authorization: `Bearer ${API_TOKEN}` // Add authorization if required
      }
    });

    // Ensure the response contains the numbers array and filter unique values
    const numbers = response.data.numbers.filter(n => 
      Number.isInteger(n) && !window.includes(n) // Ignore duplicates
    );

    // Update window, ensuring only the latest WINDOW_SIZE numbers are kept
    window = [...window, ...numbers].slice(-WINDOW_SIZE);

    // Calculate the average
    const avg = window.length > 0 
      ? parseFloat((window.reduce((a, b) => a + b) / window.length).toFixed(2))
      : 0;

    // Return the formatted response
    res.json({
      windowPrevState: prevWindow, // State before new numbers
      windowCurrState: window, // State after adding new numbers
      numbers: numbers, // Numbers fetched from third-party server
      avg: avg // Average of the numbers in the window
    });

  } catch (err) {
    console.error(`Error fetching ${id}:`, err.message);
    res.status(504).json({
      error: "Upstream server timeout",
      details: err.message
    });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
