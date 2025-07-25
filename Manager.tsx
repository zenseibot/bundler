import { Connection } from "@solana/web3.js";
import { WalletType, fetchSolBalance, fetchTokenBalance } from "./Utils";

/**
 * Extract API key from URL and clean the URL
 */
export const handleApiKeyFromUrl = (
  setConfig: Function,
  saveConfigToCookies: Function,
  showToast: Function
) => {
  const url = new URL(window.location.href);
  const apiKey = url.searchParams.get('apikey');
  
  // If API key is in the URL
  if (apiKey) {
    console.log('API key found in URL, saving to config');
    
    // Update config state with the new API key
    setConfig((prev: any) => {
      const newConfig = { ...prev, apiKey };
      // Save to cookies
      saveConfigToCookies(newConfig);
      return newConfig;
    });
    
    // Remove the apikey parameter from URL without reloading the page
    url.searchParams.delete('apikey');
    
    // Replace current URL without reloading the page
    window.history.replaceState({}, document.title, url.toString());
    
    // Optional: Show a toast notification that API key was set
    if (showToast) {
      showToast("API key has been set from URL", "success");
    }
  }
};

/**
 * Fetch SOL balances for all wallets with 100ms delay between each wallet
 */
export const fetchSolBalances = async (
  connection: Connection,
  wallets: WalletType[],
  setSolBalances: Function,
  onProgress?: (current: number, total: number) => void
) => {
  console.log(`Fetching SOL balances for ${wallets.length} wallets...`);
  const newBalances = new Map<string, number>();
  
  // Process wallets sequentially with delay
  for (let i = 0; i < wallets.length; i++) {
    const wallet = wallets[i];
    
    try {
      const balance = await fetchSolBalance(connection, wallet.address);
      newBalances.set(wallet.address, balance);
      console.log(`Wallet ${wallet.address}: ${balance} SOL`);
    } catch (error) {
      console.error(`Error fetching SOL balance for ${wallet.address}:`, error);
      newBalances.set(wallet.address, 0);
    }
    
    // Report progress
    if (onProgress) {
      onProgress(i + 1, wallets.length);
    }
    
    // Add 100ms delay between wallets (except for the last one)
    if (i < wallets.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }
  
  // Update balances once at the end
  console.log('Setting SOL balances:', newBalances);
  setSolBalances(newBalances);
  return newBalances;
};

/**
 * Fetch token balances for all wallets
 */
export const fetchTokenBalances = async (
  connection: Connection,
  wallets: WalletType[],
  tokenAddress: string,
  setTokenBalances: Function
) => {
  if (!tokenAddress) return new Map<string, number>();
  
  const newBalances = new Map<string, number>();
  
  const promises = wallets.map(async (wallet) => {
    try {
      const balance = await fetchTokenBalance(connection, wallet.address, tokenAddress);
      newBalances.set(wallet.address, balance);
    } catch (error) {
      console.error(`Error fetching token balance for ${wallet.address}:`, error);
      newBalances.set(wallet.address, 0);
    }
  });
  
  await Promise.all(promises);
  setTokenBalances(newBalances);
  return newBalances;
};



/**
 * Handle market cap updates
 */
export const handleMarketCapUpdate = (
  marketcap: number | null,
  setCurrentMarketCap: Function
) => {
  setCurrentMarketCap(marketcap);
  console.log("Main component received marketcap update:", marketcap);
};

/**
 * Handle wallet sorting by balance
 */
export const handleSortWallets = (
  wallets: WalletType[],
  sortDirection: 'asc' | 'desc',
  setSortDirection: Function,
  solBalances: Map<string, number>,
  setWallets: Function
) => {
  const newDirection = sortDirection === 'asc' ? 'desc' : 'asc';
  setSortDirection(newDirection);
  
  const sortedWallets = [...wallets].sort((a, b) => {
    const balanceA = solBalances.get(a.address) || 0;
    const balanceB = solBalances.get(b.address) || 0;
    
    if (newDirection === 'asc') {
      return balanceA - balanceB;
    } else {
      return balanceB - balanceA;
    }
  });
  
  setWallets(sortedWallets);
};

/**
 * Clean up wallets by removing empty and duplicate wallets
 */
export const handleCleanupWallets = (
  wallets: WalletType[],
  solBalances: Map<string, number>,
  tokenBalances: Map<string, number>,
  setWallets: Function,
  showToast: Function
) => {
  // Keep track of seen addresses
  const seenAddresses = new Set<string>();
  // Keep track of removal counts
  let emptyCount = 0;
  let duplicateCount = 0;
  
  // Filter out empty wallets and duplicates
  const cleanedWallets = wallets.filter(wallet => {
    // Check for empty balance (no SOL and no tokens)
    const solBalance = solBalances.get(wallet.address) || 0;
    const tokenBalance = tokenBalances.get(wallet.address) || 0;
    
    if (solBalance <= 0 && tokenBalance <= 0) {
      emptyCount++;
      return false;
    }
    
    // Check for duplicates
    if (seenAddresses.has(wallet.address)) {
      duplicateCount++;
      return false;
    }
    
    seenAddresses.add(wallet.address);
    return true;
  });

  // Show appropriate toast message
  if (emptyCount > 0 || duplicateCount > 0) {
    const messages: string[] = [];
    if (emptyCount > 0) {
      messages.push(`${emptyCount} empty wallet${emptyCount === 1 ? '' : 's'}`);
    }
    if (duplicateCount > 0) {
      messages.push(`${duplicateCount} duplicate${duplicateCount === 1 ? '' : 's'}`);
    }
    showToast(`Removed ${messages.join(' and ')}`, "success");
  } else {
    showToast("No empty wallets or duplicates found", "success");
  }
  
  setWallets(cleanedWallets);
};