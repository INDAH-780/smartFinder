import React, { useState } from 'react';
import axios from 'axios';

function App() {
  const [status, setStatus] = useState('');

  const startScan = async () => {
    try {
      const response = await axios.get('http://localhost:5000/scan');
      setStatus(response.data.message);
    } catch (error) {
      console.error('Error starting scan:', error);
      setStatus('Error occurred while starting the scan.');
    }
  };

  return (
    <div className="App">
      <h1>File Assistant Testing</h1>
      <button onClick={startScan}>Start Scan</button>
      <p>{status}</p>
    </div>
  );
}

export default App;
