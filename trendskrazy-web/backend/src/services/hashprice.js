const axios = require('axios');

const BLOCKCHAIN_DIFF_URL = process.env.BLOCKCHAIN_DIFF_URL || 'https://blockchain.info/q/getdifficulty?cors=true';
const BLOCKCHAIN_BC_PER_BLOCK = process.env.BLOCKCHAIN_BC_PER_BLOCK_URL || 'https://blockchain.info/q/bcperblock?cors=true';
const COINGECKO_SIMPLE_PRICE = process.env.COINGECKO_API_URL || 'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd';

const TWO_POW_32 = 4294967296;

async function fetchOnchainDifficulty() {
  const r = await axios.get(BLOCKCHAIN_DIFF_URL, { timeout: 5000 });
  return Number(r.data);
}

async function fetchBlockRewardBtc() {
  const r = await axios.get(BLOCKCHAIN_BC_PER_BLOCK, { timeout: 5000 });
  const satoshis = Number(r.data);
  return satoshis / 1e8;
}

async function fetchBtcUsd() {
  const r = await axios.get(COINGECKO_SIMPLE_PRICE, { timeout: 5000 });
  return r.data && r.data.bitcoin && r.data.bitcoin.usd ? Number(r.data.bitcoin.usd) : null;
}

async function fetchHashprice() {
  try {
    const [difficulty, blockReward] = await Promise.all([fetchOnchainDifficulty(), fetchBlockRewardBtc()]);
    const hashrate_hs = 1e12;
    const secondsPerDay = 86400;
    const btcPerDayPerTh = (hashrate_hs * secondsPerDay * blockReward) / (difficulty * TWO_POW_32);
    return btcPerDayPerTh;
  } catch (err) {
    console.warn('Onchain hashprice fetch failed, falling back to mock or third-party provider', err.message);
    return parseFloat(process.env.MOCK_HASHPRICE_BTC_PER_TH_PER_DAY || '0.00000065');
  }
}

module.exports = { fetchHashprice, fetchBtcUsd };
