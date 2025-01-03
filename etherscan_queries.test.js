const axios = require('axios');
require('dotenv').config(); // Load environment variables

const BASE_URL = process.env.ETHERSCAN_BASE_URL;
const API_KEY = process.env.ETHERSCAN_API_KEY;

const getTransactions = async (address, startBlock, endBlock) => {
    const MAX_RESULTS = 10000;
    let allTransactions = [];
  
    async function fetchBatch(currentStartBlock) {
      try {
        const response = await axios.get(BASE_URL, {
          params: {
            module: 'account',
            action: 'txlist',
            address: address,
            startblock: currentStartBlock,
            endblock: endBlock,
            sort: 'asc',
            apikey: API_KEY,
          },
        });
  
        if (response.data.status === '1') {
          const transactions = response.data.result;
          allTransactions = allTransactions.concat(transactions);
  
          // If we got MAX_RESULTS, we need to fetch the next batch
          if (transactions.length === MAX_RESULTS) {
            // Get the last block number from this batch and add 1
            const lastBlockNumber = parseInt(transactions[transactions.length - 1].blockNumber);
            console.log(`Fetched ${MAX_RESULTS} transactions, continuing from block ${lastBlockNumber + 1}`);
            
            // Add delay to respect rate limits
            await new Promise(resolve => setTimeout(resolve, 200));
            
            // Fetch next batch
            await fetchBatch(lastBlockNumber + 1);
          }
        } else {
          console.error(`Error: ${response.data.message}`);
        }
      } catch (error) {
        console.error(`Error fetching transactions: ${error.message}`);
      }
    }
  
    // Start the recursive fetching process
    await fetchBatch(startBlock);
    return allTransactions;
};

describe('getTransactions', () => {
  it('should fetch transactions from Etherscan API', async () => {
    // Use a small block range to test
    const startBlock = 13400000;
    const endBlock = 9999999999;
    const address = process.env.COINCENTER_ADDRESS;

    const result = await getTransactions(address, startBlock, endBlock);

    console.log(`Found ${result.length} transactions`);
    if (result.length > 0) {
      console.log('First transaction:', result[0]);
    }
    // Basic validation of the response
    expect(Array.isArray(result)).toBe(true);
    expect(result.every(tx => 
      tx.blockNumber >= startBlock && 
      tx.blockNumber <= endBlock
    )).toBe(true);
  }, 30000); // Increase timeout to 30s for API call
}); 