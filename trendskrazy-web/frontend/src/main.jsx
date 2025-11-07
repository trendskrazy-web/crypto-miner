import React from 'react';
import { createRoot } from 'react-dom/client';
import axios from 'axios';

const API = import.meta.env.VITE_API_URL || 'http://localhost:4000';

function App(){
  const [machines, setMachines] = React.useState([]);
  const [message, setMessage] = React.useState('');

  React.useEffect(()=>{ axios.get(API + '/api/machines').then(r=>setMachines(r.data)); }, []);

  async function buy(id){
    const days = prompt('How many days?');
    if(!days) return;
    const userId = prompt('Enter demo userId (or leave blank to autogen)');
    const payload = { userId: userId || 'demo-user-1', machineId: id, days: Number(days) };
    // Show choice: Stripe or Coinbase
    const choice = prompt('Pay with: 1) Stripe (card)  2) Coinbase (crypto). Enter 1 or 2');
    if(choice === '1') {
      const res = await axios.post(API + '/api/payments/stripe/create-session', payload);
      if(res.data.url) window.location.href = res.data.url;
    } else {
      const res = await axios.post(API + '/api/payments/coinbase/create-charge', payload);
      if(res.data.hosted_url) window.location.href = res.data.hosted_url;
    }
  }

  return (
    <div style={{padding:20}}>
      <h1>Crypto Miner — MVP Marketplace</h1>
      {message && <div>{message}</div>}
      {machines.map(m=> (
        <div key={m.id} style={{border:'1px solid #ccc', padding:10, margin:8}}>
          <div><strong>{m.name}</strong></div>
          <div>Hashrate: {m.hashrateTh} TH/s</div>
          <div>Price/day: ${m.priceUsdPerDay}</div>
          <button onClick={()=>buy(m.id)}>Buy</button>
        </div>
      ))}
    </div>
  );
}

createRoot(document.getElementById('root')).render(<App />);
