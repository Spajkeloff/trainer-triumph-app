import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const paymentSchema = z.object({
  amount: z.number().min(0.01, "Amount is required"),
  payment_method: z.string().min(1, "Payment method is required"),
  description: z.string().optional(),
  payment_date: z.string().min(1, "Payment date is required"),
});

type PaymentFormData = z.infer<typeof paymentSchema>;

interface AddPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  clientId?: string;
  onSuccess?: () => void;
  prefilledAmount?: number;
  prefilledDescription?: string;
}

interface Client {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
}

const AddPaymentModal = ({ isOpen, onClose, clientId, onSuccess, prefilledAmount, prefilledDescription }: AddPaymentModalProps) => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const form = useForm<PaymentFormData>({
    resolver: zodResolver(paymentSchema),
    defaultValues: {
      amount: prefilledAmount || 0,
      payment_method: "",
      description: prefilledDescription || "",
      payment_date: new Date().toISOString().split('T')[0],
    },
  });

  // Update form when prefilled data changes
  useEffect(() => {
    if (isOpen) {
      form.reset({
        amount: prefilledAmount || 0,
        payment_method: "",
        description: prefilledDescription || "",
        payment_date: new Date().toISOString().split('T')[0],
      });
    }
  }, [isOpen, prefilledAmount, prefilledDescription, form]);

  const onSubmit = async (data: PaymentFormData) => {
    try {
      setLoading(true);

      const { error } = await supabase
        .from('payments')
        .insert({
          client_id: clientId,
          amount: data.amount,
          payment_method: data.payment_method,
          description: data.description,
          payment_date: data.payment_date,
          status: 'completed'
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Payment recorded successfully",
      });

      onSuccess?.();
      onClose();
      form.reset();
    } catch (error) {
      console.error('Error adding payment:', error);
      toast({
        title: "Error",
        description: "Failed to record payment",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bg-background border-border">
        <DialogHeader>
          <DialogTitle>Add Payment</DialogTitle>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Amount (AED)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      {...field}
                      onChange={(e) => field.onChange(Number(e.target.value))}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="payment_method"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Payment Method</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select payment method" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="bg-popover border-border">
                      <SelectItem value="cash">Cash</SelectItem>
                      <SelectItem value="card">Credit/Debit Card</SelectItem>
                      <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                      <SelectItem value="cheque">Cheque</SelectItem>
                      <SelectItem value="online">Online Payment</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="payment_date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Payment Date</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description (Optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Payment for training package, equipment, etc."
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading || !clientId}>
                {loading ? "Recording..." : "Record Payment"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default AddPaymentModal;