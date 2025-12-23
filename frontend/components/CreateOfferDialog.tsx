"use client";

import { useState, useMemo } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Plus, AlertCircle, CheckCircle2, Lock, FileText } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface CreateOfferDialogProps {
  onCreateOffer: (title: string, description: string, value: number) => Promise<boolean>;
}

const MAX_OFFER_VALUE = 4294967295;
const MAX_TITLE_LENGTH = 100;
const MAX_TERMS_LENGTH = 1000;
const MIN_TERMS_LENGTH = 10;

export const CreateOfferDialog = ({ onCreateOffer }: CreateOfferDialogProps) => {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [terms, setTerms] = useState("");
  const [value, setValue] = useState("");
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validation = useMemo(() => {
    const errors: string[] = [];
    const titleTrimmed = title.trim();
    const termsTrimmed = terms.trim();
    const numValue = parseInt(value);

    if (titleTrimmed.length === 0) errors.push("Title is required");
    else if (titleTrimmed.length > MAX_TITLE_LENGTH) errors.push(`Title must be under ${MAX_TITLE_LENGTH} characters`);

    if (value.trim() === "") errors.push("Offer value is required");
    else if (isNaN(numValue) || numValue < 0) errors.push("Value must be a positive number");
    else if (numValue > MAX_OFFER_VALUE) errors.push("Value exceeds maximum limit");

    if (termsTrimmed.length === 0) errors.push("Terms are required");
    else if (termsTrimmed.length < MIN_TERMS_LENGTH) errors.push(`Terms must be at least ${MIN_TERMS_LENGTH} characters`);
    else if (termsTrimmed.length > MAX_TERMS_LENGTH) errors.push(`Terms must be under ${MAX_TERMS_LENGTH} characters`);

    return { isValid: errors.length === 0, errors, titleLength: titleTrimmed.length, termsLength: termsTrimmed.length };
  }, [title, terms, value]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !terms.trim() || !value.trim()) {
      toast({ title: "Validation Error", description: "Please fill in all fields", variant: "destructive" });
      return;
    }
    const numValue = parseInt(value);
    if (isNaN(numValue) || numValue < 0 || numValue > MAX_OFFER_VALUE) {
      toast({ title: "Invalid Value", description: "Please enter a valid number", variant: "destructive" });
      return;
    }
    setIsSubmitting(true);
    try {
      const success = await onCreateOffer(title, terms, numValue);
      if (success) { setTitle(""); setTerms(""); setValue(""); setOpen(false); }
    } finally { setIsSubmitting(false); }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2 bg-primary text-white hover:bg-primary/90 shadow-soft">
          <Plus className="w-4 h-4" />
          Create New Offer
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[480px] bg-card border-border/50 shadow-card">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center">
              <FileText className="w-4 h-4 text-white" />
            </div>
            <div>
              <DialogTitle className="text-lg font-bold text-foreground">Create Offer</DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">Draft your encrypted proposal</DialogDescription>
            </div>
          </div>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4 mt-3">
          {/* Title */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="title" className="text-sm">Offer Title</Label>
              <span className={`text-xs ${validation.titleLength > MAX_TITLE_LENGTH ? "text-destructive" : "text-muted-foreground"}`}>
                {validation.titleLength}/{MAX_TITLE_LENGTH}
              </span>
            </div>
            <Input id="title" placeholder="e.g., Trade Alliance Proposal" value={title} onChange={(e) => setTitle(e.target.value)}
              className={`bg-background border-border/50 ${title && validation.titleLength <= MAX_TITLE_LENGTH ? "border-emerald-400/50" : ""}`} />
          </div>

          {/* Value */}
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <Label htmlFor="value" className="text-sm">Offer Value</Label>
              <span className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-primary/10 text-xs text-primary">
                <Lock className="w-3 h-3" />Encrypted
              </span>
            </div>
            <Input id="value" type="number" min="0" placeholder="e.g., 1000" value={value} onChange={(e) => setValue(e.target.value)}
              className={`bg-background border-border/50 ${value && !isNaN(parseInt(value)) && parseInt(value) >= 0 ? "border-emerald-400/50" : ""}`} />
            <p className="text-xs text-muted-foreground">This value will be encrypted until revealed</p>
          </div>

          {/* Terms */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="terms" className="text-sm">Terms & Conditions</Label>
              <span className={`text-xs ${validation.termsLength > MAX_TERMS_LENGTH ? "text-destructive" : "text-muted-foreground"}`}>
                {validation.termsLength}/{MAX_TERMS_LENGTH}
              </span>
            </div>
            <Textarea id="terms" placeholder="Describe your terms..." value={terms} onChange={(e) => setTerms(e.target.value)}
              className={`min-h-[100px] bg-background border-border/50 resize-none ${validation.termsLength >= MIN_TERMS_LENGTH && validation.termsLength <= MAX_TERMS_LENGTH ? "border-emerald-400/50" : ""}`} />
          </div>
          
          {/* Validation */}
          {(title || terms || value) && (
            <div className={`p-3 rounded-lg text-sm ${validation.isValid ? "bg-emerald-50 border border-emerald-200 text-emerald-700" : "bg-red-50 border border-red-200 text-red-700"}`}>
              {validation.isValid ? (
                <div className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4" /><span>Ready to submit</span></div>
              ) : (
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 mt-0.5" />
                  <ul className="list-disc list-inside text-xs">{validation.errors.map((e, i) => <li key={i}>{e}</li>)}</ul>
                </div>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)} className="border-border/50">Cancel</Button>
            <Button type="submit" disabled={isSubmitting || !validation.isValid} className="bg-primary text-white hover:bg-primary/90 gap-2">
              {isSubmitting ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Submitting...</> : <><Lock className="w-4 h-4" />Seal & Encrypt</>}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
