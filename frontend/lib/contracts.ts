import { Address } from 'viem';
import { SecretDealABI } from '@/abi/SecretDealABI';
import { SecretDealAddresses } from '@/abi/SecretDealAddresses';

// Export auto-generated ABI
export const SecretDealAbi = SecretDealABI.abi;

// Helper function to get contract address by chain ID
export function getSecretDealAddress(chainId: number | undefined): Address | undefined {
  if (!chainId) return undefined;
  
  const entry = SecretDealAddresses[chainId.toString() as keyof typeof SecretDealAddresses];
  if (!entry) {
    return undefined;
  }
  
  // Check if address is zero address (not deployed)
  if (entry.address.toLowerCase() === '0x0000000000000000000000000000000000000000') {
    return undefined;
  }
  
  return entry.address as Address;
}

// Legacy ADDRESSES export for backward compatibility
export const ADDRESSES = {
  localhost: {
    SecretDeal: getSecretDealAddress(31337),
  },
  sepolia: {
    SecretDeal: getSecretDealAddress(11155111),
  },
};

