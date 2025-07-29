import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const packageSchema = z.object({
  name: z.string().min(1, "Package name is required"),
  description: z.string().optional(),
  sessions_included: z.number().min(1, "Number of sessions is required"),
  duration_days: z.number().min(1, "Duration is required"),
  price: z.number().min(0.01, "Price is required"),
});

type PackageFormData = z.infer<typeof packageSchema>;

interface AddPackageModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const AddPackageModal = ({ isOpen, onClose, onSuccess }: AddPackageModalProps) => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const form = useForm<PackageFormData>({
    resolver: zodResolver(packageSchema),
    defaultValues: {
      name: "",
      description: "",
      sessions_included: 0,
      duration_days: 0,
      price: 0,
    },
  });

  const onSubmit = async (data: PackageFormData) => {
    try {
      setLoading(true);

      const { error } = await supabase
        .from('packages')
        .insert({
          name: data.name,
          description: data.description || null,
          sessions_included: data.sessions_included,
          duration_days: data.duration_days,
          price: data.price,
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Package created successfully",
      });

      onSuccess?.();
      onClose();
      form.reset();
    } catch (error) {
      console.error('Error creating package:', error);
      toast({
        title: "Error",
        description: "Failed to create package",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg bg-background border-border">
        <DialogHeader>
          <DialogTitle>Create New Package</DialogTitle>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Package Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Premium Training Package" {...field} />
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
                      placeholder="Brief description of what's included in this package"
                      className="resize-none"
                      rows={3}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="sessions_included"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Number of Sessions</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="1"
                        placeholder="10"
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
                name="duration_days"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Validity (Days)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="1"
                        placeholder="90"
                        {...field}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="price"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Price (AED)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="1500.00"
                      {...field}
                      onChange={(e) => field.onChange(Number(e.target.value))}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Preview */}
            {form.watch("sessions_included") && form.watch("price") && (
              <div className="bg-muted p-4 rounded-lg">
                <h4 className="font-medium mb-2">Package Preview:</h4>
                <div className="text-sm space-y-1">
                  <p>Cost per session: <span className="font-medium">
                    AED {(Number(form.watch("price")) / Number(form.watch("sessions_included"))).toFixed(2)}
                  </span></p>
                  {form.watch("duration_days") && (
                    <p>Valid for: <span className="font-medium">{form.watch("duration_days")} days</span></p>
                  )}
                </div>
              </div>
            )}

            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? "Creating..." : "Create Package"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default AddPackageModal;