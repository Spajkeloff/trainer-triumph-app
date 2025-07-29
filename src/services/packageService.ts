import { supabase } from "@/integrations/supabase/client";

export interface Package {
  id: string;
  name: string;
  description?: string;
  sessions_included: number;
  duration_days: number;
  price: number;
  created_at: string;
  updated_at: string;
}

export interface ClientPackage {
  id: string;
  client_id: string;
  package_id: string;
  sessions_remaining: number;
  purchase_date: string;
  expiry_date: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface AssignPackageData {
  packageId: string;
  clientId: string;
  customPrice: number;
  expiryDate: string;
  notes?: string;
  paymentStatus: 'paid' | 'unpaid';
  paymentMethod?: string;
}

export const packageService = {
  async getAll(): Promise<Package[]> {
    const { data, error } = await supabase
      .from('packages')
      .select('*')
      .order('name');

    if (error) throw error;
    return data || [];
  },

  async create(packageData: Omit<Package, 'id' | 'created_at' | 'updated_at'>): Promise<Package> {
    const { data, error } = await supabase
      .from('packages')
      .insert([packageData])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async update(id: string, updates: Partial<Package>): Promise<Package> {
    const { data, error } = await supabase
      .from('packages')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('packages')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  async assignToClient(assignData: AssignPackageData): Promise<ClientPackage> {
    const { packageId, clientId, customPrice, expiryDate, notes, paymentStatus, paymentMethod } = assignData;

    // Get package details
    const { data: packageDetails, error: packageError } = await supabase
      .from('packages')
      .select('*')
      .eq('id', packageId)
      .single();

    if (packageError) throw packageError;

    // 1. Create client package
    const { data: clientPackage, error: clientPackageError } = await supabase
      .from('client_packages')
      .insert({
        client_id: clientId,
        package_id: packageId,
        sessions_remaining: packageDetails.sessions_included,
        purchase_date: new Date().toISOString().split('T')[0],
        expiry_date: expiryDate,
        status: 'active'
      })
      .select()
      .single();

    if (clientPackageError) throw clientPackageError;

    // 2. Create charge in payments
    const { error: chargeError } = await supabase
      .from('payments')
      .insert({
        client_id: clientId,
        amount: -customPrice, // Negative for charge
        payment_method: 'package_assignment',
        status: paymentStatus === 'paid' ? 'completed' : 'pending',
        description: `${packageDetails.name} Package Assignment${notes ? ` - ${notes}` : ''}`,
        payment_date: new Date().toISOString().split('T')[0],
        client_package_id: clientPackage.id
      });

    if (chargeError) throw chargeError;

    // 3. If marked as paid, create payment record
    if (paymentStatus === 'paid' && paymentMethod) {
      const { error: paymentError } = await supabase
        .from('payments')
        .insert({
          client_id: clientId,
          amount: customPrice, // Positive for payment
          payment_method: paymentMethod,
          status: 'completed',
          description: `Payment for ${packageDetails.name} Package`,
          payment_date: new Date().toISOString().split('T')[0],
          client_package_id: clientPackage.id
        });

      if (paymentError) throw paymentError;
    }

    return clientPackage;
  },

  async getClientPackages(clientId: string) {
    const { data, error } = await supabase
      .from('client_packages')
      .select(`
        *,
        packages (
          name,
          sessions_included,
          price
        )
      `)
      .eq('client_id', clientId)
      .eq('status', 'active')
      .gt('sessions_remaining', 0);

    if (error) throw error;
    return data || [];
  }
};