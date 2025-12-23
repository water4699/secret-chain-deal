#!/usr/bin/env node

/**
 * ABI Generator Script
 * 
 * This script reads the compiled contract artifacts from the parent directory
 * and generates TypeScript ABI files for the frontend.
 * 
 * Usage: node ./scripts/genabi.mjs
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const CONTRACTS = [
  { name: 'FHECounter', outputName: 'FHECounter' },
  { name: 'SecretDeal', outputName: 'SecretDeal' },
];

const ARTIFACTS_DIR = path.join(__dirname, '../../artifacts/contracts');
const DEPLOYMENTS_DIR = path.join(__dirname, '../../deployments');
const OUTPUT_DIR = path.join(__dirname, '../abi');

// Chain ID to name mapping (with fallback directories)
// For chain 31337, try 'localhost' first, then 'hardhat'
const CHAINS = {
  31337: ['localhost', 'hardhat'],
  11155111: ['sepolia'],
};

function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function readArtifact(contractName) {
  const artifactPath = path.join(ARTIFACTS_DIR, `${contractName}.sol`, `${contractName}.json`);
  
  if (!fs.existsSync(artifactPath)) {
    console.warn(`Warning: Artifact not found for ${contractName} at ${artifactPath}`);
    return null;
  }
  
  try {
    const content = fs.readFileSync(artifactPath, 'utf-8');
    return JSON.parse(content);
  } catch (error) {
    console.error(`Error reading artifact for ${contractName}:`, error.message);
    return null;
  }
}

function readDeployments(contractName) {
  const addresses = {};
  
  for (const [chainId, chainNames] of Object.entries(CHAINS)) {
    let found = false;
    
    // Try each possible directory name for this chain
    for (const chainName of chainNames) {
      const deploymentPath = path.join(DEPLOYMENTS_DIR, chainName, `${contractName}.json`);
      
      if (fs.existsSync(deploymentPath)) {
        try {
          const content = fs.readFileSync(deploymentPath, 'utf-8');
          const deployment = JSON.parse(content);
          addresses[chainId] = {
            address: deployment.address,
            chainId: parseInt(chainId),
            chainName,
          };
          console.log(`  Found ${contractName} deployment at ${chainName}: ${deployment.address}`);
          found = true;
          break;
        } catch (error) {
          console.warn(`  Warning: Could not read deployment for ${contractName} on ${chainName}:`, error.message);
        }
      }
    }
    
    if (!found) {
      // Default to zero address if not deployed
      addresses[chainId] = {
        address: '0x0000000000000000000000000000000000000000',
        chainId: parseInt(chainId),
        chainName: chainNames[0],
      };
      console.log(`  No deployment found for chain ${chainId}, using zero address`);
    }
  }
  
  return addresses;
}

function generateABIFile(contractName, outputName, artifact) {
  const abiContent = `
/*
  This file is auto-generated.
  Command: 'npm run genabi'
*/
export const ${outputName}ABI = ${JSON.stringify({ abi: artifact.abi }, null, 2)} as const;
`.trimStart();

  const outputPath = path.join(OUTPUT_DIR, `${outputName}ABI.ts`);
  fs.writeFileSync(outputPath, abiContent);
  console.log(`Generated: ${outputPath}`);
}

function generateAddressesFile(contractName, outputName, addresses) {
  const addressesContent = `
/*
  This file is auto-generated.
  Command: 'npm run genabi'
*/
export const ${outputName}Addresses = ${JSON.stringify(addresses, null, 2)} as const;
`.trimStart();

  const outputPath = path.join(OUTPUT_DIR, `${outputName}Addresses.ts`);
  fs.writeFileSync(outputPath, addressesContent);
  console.log(`Generated: ${outputPath}`);
}

function main() {
  console.log('Generating ABI files...\n');
  
  ensureDir(OUTPUT_DIR);
  
  for (const { name, outputName } of CONTRACTS) {
    console.log(`Processing ${name}...`);
    
    // Read artifact
    const artifact = readArtifact(name);
    if (artifact) {
      generateABIFile(name, outputName, artifact);
    }
    
    // Read deployments
    const addresses = readDeployments(name);
    generateAddressesFile(name, outputName, addresses);
    
    console.log('');
  }
  
  console.log('ABI generation complete!');
}

main();
