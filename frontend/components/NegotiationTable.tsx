"use client";

import { Card } from "@/components/ui/card";
import { WaxSeal } from "./WaxSeal";
import { useState, useEffect, useMemo, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { CreateOfferDialog } from "./CreateOfferDialog";
import { useAccount, useReadContract, useChainId, usePublicClient } from "wagmi";
import { useToast } from "@/hooks/use-toast";
import { SecretDealAbi, getSecretDealAddress } from "@/lib/contracts";
import { useFhevm } from "@/fhevm/useFhevm";
import { Address, toHex } from "viem";
import { ethers } from "ethers";
import { Loader2, Copy, Check, Users, FileText } from "lucide-react";

interface Offer {
  party: Address;
  revealed: boolean;
  title: string;
  description: string;
  timestamp: bigint;
}

type OfferContractResult = readonly [
  Address,
  `0x${string}`,
  bigint,
  boolean,
  string,
  string
];

export const NegotiationTable = () => {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const publicClient = usePublicClient();
  const { toast } = useToast();
  const [dealId] = useState<number>(0);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [isLoadingOffers, setIsLoadingOffers] = useState<boolean>(false);
  const [copiedAddress, setCopiedAddress] = useState<string | null>(null);

  const copyToClipboard = async (address: string) => {
    try {
      await navigator.clipboard.writeText(address);
      setCopiedAddress(address);
      setTimeout(() => setCopiedAddress(null), 2000);
      toast({ title: "Address Copied", description: "Wallet address copied to clipboard" });
    } catch {
      toast({ title: "Copy Failed", description: "Could not copy address", variant: "destructive" });
    }
  };
  
  const contractAddress = getSecretDealAddress(chainId);
  
  const provider = useMemo(() => {
    if (typeof window !== 'undefined' && window.ethereum) return window.ethereum;
    return undefined;
  }, []);
  
  const { instance: fhevmInstance, status: fhevmStatus, error: fhevmError } = useFhevm({
    provider, chainId, enabled: isConnected && !!contractAddress,
  });
  
  const isReady = fhevmStatus === 'ready' && !!fhevmInstance;
  
  const { data: dealData, refetch: refetchDeal } = useReadContract({
    address: contractAddress, abi: SecretDealAbi, functionName: 'getDeal',
    args: [BigInt(dealId)], query: { enabled: !!contractAddress && dealId >= 0 },
  });
  
  const { data: allRevealed, refetch: refetchRevealed } = useReadContract({
    address: contractAddress, abi: SecretDealAbi, functionName: 'areAllOffersRevealed',
    args: [BigInt(dealId)], query: { enabled: !!contractAddress && dealId >= 0 },
  });
  
  const loadOffers = useCallback(async (parties: Address[]) => {
    if (!contractAddress || !publicClient) return;
    setIsLoadingOffers(true);
    const loadedOffers: Offer[] = [];
    try {
      for (const party of parties) {
        try {
          const offer = await publicClient.readContract({
            address: contractAddress, abi: SecretDealAbi, functionName: 'getOfferByParty',
            args: [BigInt(dealId), party],
          }) as OfferContractResult;
          loadedOffers.push({ party, revealed: offer[3], title: offer[4], description: offer[5], timestamp: offer[2] });
        } catch (error) { console.error(`Failed to load offer for ${party}:`, error); }
      }
      setOffers(loadedOffers);
    } finally { setIsLoadingOffers(false); }
  }, [contractAddress, publicClient, dealId]);
  
  useEffect(() => {
    if (dealData && dealData[1]) loadOffers(dealData[1] as Address[]);
  }, [dealData, loadOffers]);
  
  const handleSealBreak = async (party: Address) => {
    if (!contractAddress || !address || party.toLowerCase() !== address.toLowerCase()) {
      toast({ title: "Not Authorized", description: "You can only reveal your own offer", variant: "destructive" });
      return;
    }
    try {
      if (!window.ethereum) throw new Error("No EVM wallet found");
      const browserProvider = new ethers.BrowserProvider(window.ethereum);
      const signer = await browserProvider.getSigner();
      const contract = new ethers.Contract(contractAddress as `0x${string}`, SecretDealAbi, signer);
      const tx = await contract.revealOffer(BigInt(dealId));
      await tx.wait();
      toast({ title: "Offer Revealed", description: "Your secret offer is now visible" });
      await refetchDeal(); await refetchRevealed();
      if (dealData && dealData[1]) await loadOffers(dealData[1] as Address[]);
    } catch (error) {
      console.error('Failed to reveal offer:', error);
      toast({ title: "Reveal Failed", description: error instanceof Error ? error.message : "Could not reveal", variant: "destructive" });
    }
  };
  
  const handleCreateOffer = async (title: string, description: string, value: number): Promise<boolean> => {
    if (!isConnected || !contractAddress) {
      toast({ title: "Wallet Required", description: "Please connect your wallet", variant: "destructive" });
      return false;
    }
    if (!isReady || !fhevmInstance) {
      toast({ title: "FHEVM Not Ready", description: fhevmError?.message || "Please wait", variant: "destructive" });
      return false;
    }
    try {
      toast({ title: "Encrypting...", description: "Creating encrypted value..." });
      if (!window.ethereum) throw new Error("No EVM wallet found");
      const browserProvider = new ethers.BrowserProvider(window.ethereum);
      const signer = await browserProvider.getSigner();
      const userAddress = (await signer.getAddress()) as `0x${string}`;
      const input = fhevmInstance.createEncryptedInput(contractAddress as `0x${string}`, userAddress);
      input.add32(value);
      const encryptedData = await input.encrypt();
      const encrypted = { handle: encryptedData.handles[0], inputProof: encryptedData.inputProof };
      const handleHex: `0x${string}` = encrypted.handle instanceof Uint8Array ? toHex(encrypted.handle) : (encrypted.handle as `0x${string}`);
      const proofHex: `0x${string}` = encrypted.inputProof instanceof Uint8Array ? toHex(encrypted.inputProof) : (encrypted.inputProof as `0x${string}`);
      toast({ title: "Submitting...", description: "Please confirm in your wallet" });
      const contract = new ethers.Contract(contractAddress as `0x${string}`, SecretDealAbi, signer);
      const tx = await contract.submitOffer(BigInt(dealId), handleHex, proofHex, title, description);
      await tx.wait();
      toast({ title: "Offer Submitted", description: "Your encrypted offer has been submitted" });
      await refetchDeal();
      if (dealData && dealData[1]) await loadOffers(dealData[1] as Address[]);
      return true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to submit";
      const isAlreadySubmitted = errorMessage.includes("already submitted");
      toast({ title: isAlreadySubmitted ? "Offer Already Exists" : "Submission Failed", description: isAlreadySubmitted ? "You already submitted an offer" : errorMessage, variant: "destructive" });
      return false;
    }
  };
  
  const handleFinalize = async () => {
    if (!contractAddress) return;
    try {
      if (!window.ethereum) throw new Error("No EVM wallet found");
      const browserProvider = new ethers.BrowserProvider(window.ethereum);
      const signer = await browserProvider.getSigner();
      const contract = new ethers.Contract(contractAddress as `0x${string}`, SecretDealAbi, signer);
      const tx = await contract.finalizeDeal(BigInt(dealId));
      await tx.wait();
      toast({ title: "Deal Finalized", description: "Agreement recorded on-chain" });
      await refetchDeal();
    } catch (error) {
      toast({ title: "Finalization Failed", description: error instanceof Error ? error.message : "Could not finalize", variant: "destructive" });
    }
  };
  
  const allOffersRevealed = allRevealed || false;
  
  if (!contractAddress) {
    return (
      <section className="py-14 px-6">
        <div className="container mx-auto max-w-4xl">
          <Card className="p-8 text-center bg-card border-border/50 shadow-soft">
            <p className="text-lg text-muted-foreground">Contract not deployed on this network</p>
          </Card>
        </div>
      </section>
    );
  }

  return (
    <section className="relative py-14 sm:py-16 px-4 sm:px-6">
      <div className="container mx-auto max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Users className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-foreground">Negotiation Table</h2>
                <p className="text-sm text-muted-foreground">{offers.length} offer{offers.length !== 1 ? 's' : ''} submitted</p>
              </div>
            </div>
            <CreateOfferDialog onCreateOffer={handleCreateOffer} />
          </div>
          <div className="decorative-line w-full" />
        </div>

        {/* Offers Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {isLoadingOffers ? (
            <div className="col-span-full flex flex-col items-center justify-center py-14">
              <Loader2 className="h-8 w-8 animate-spin text-primary mb-3" />
              <p className="text-muted-foreground">Loading offers...</p>
            </div>
          ) : offers.length === 0 ? (
            <div className="col-span-full">
              <Card className="p-10 text-center bg-card border-dashed border-2 border-border/50">
                <FileText className="w-10 h-10 text-muted-foreground/50 mx-auto mb-3" />
                <p className="text-base font-medium text-foreground mb-1">No offers yet</p>
                <p className="text-sm text-muted-foreground">Be the first to submit an encrypted offer</p>
              </Card>
            </div>
          ) : (
            offers.map((offer, index) => (
              <Card key={offer.party} className="p-5 bg-card border-border/50 shadow-soft hover:shadow-card transition-all duration-300">
                {/* Party Header */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center text-white text-sm font-bold">
                      {index + 1}
                    </div>
                    <span className="font-semibold text-foreground">Party {index + 1}</span>
                  </div>
                  {offer.party.toLowerCase() === address?.toLowerCase() && (
                    <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-medium">You</span>
                  )}
                </div>

                {/* Address */}
                <button onClick={() => copyToClipboard(offer.party)} className="flex items-center gap-1.5 text-xs text-muted-foreground font-mono hover:text-foreground transition-colors group mb-4">
                  <span className="bg-muted px-2 py-1 rounded">{offer.party.slice(0, 6)}...{offer.party.slice(-4)}</span>
                  {copiedAddress === offer.party ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />}
                </button>
                
                {/* Content */}
                {!offer.revealed ? (
                  <div className="flex flex-col items-center space-y-3 py-3">
                    <WaxSeal onBreak={() => handleSealBreak(offer.party)} />
                    <p className="text-xs text-muted-foreground text-center">
                      {offer.party.toLowerCase() === address?.toLowerCase() ? "Click to reveal" : "Waiting for reveal"}
                    </p>
                  </div>
                ) : (
                  <div className="animate-document-reveal">
                    <div className="p-4 rounded-lg bg-parchment border border-border/30">
                      <p className="font-bold text-foreground mb-2">{offer.title}</p>
                      <p className="text-xs text-muted-foreground mb-1">Terms:</p>
                      <p className="text-sm text-foreground/80 whitespace-pre-wrap">{offer.description}</p>
                    </div>
                  </div>
                )}
              </Card>
            ))
          )}
        </div>

        {/* Finalize */}
        {allOffersRevealed && offers.length > 0 && (
          <div className="mt-10 text-center animate-fade-up">
            <Button size="lg" onClick={handleFinalize} className="bg-primary text-white hover:bg-primary/90 shadow-soft px-8" disabled={dealData && dealData[4]}>
              {dealData && dealData[4] ? <><Check className="w-4 h-4 mr-2" />Deal Finalized</> : "Finalize Agreement"}
            </Button>
            <p className="text-sm text-muted-foreground mt-2">
              {dealData && dealData[4] ? "This deal has been finalized" : "Submit final agreement to blockchain"}
            </p>
          </div>
        )}
      </div>
    </section>
  );
};
