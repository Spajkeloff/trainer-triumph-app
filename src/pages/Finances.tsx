import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { financeService, Transaction, Invoice, Expense, ClientBalance } from "@/services/financeService";
import { paymentService } from "@/services/paymentService";
import { supabase } from "@/integrations/supabase/client";
import AddExpenseModal from "@/components/AddExpenseModal";
import CreateInvoiceModal from "@/components/CreateInvoiceModal";
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { 
  DollarSign,
  CreditCard,
  TrendingUp,
  TrendingDown,
  Plus,
  Download,
  Search,
  Filter,
  FileText,
  Receipt,
  Users,
  Trash2,
  Edit,
  MoreHorizontal
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell
} from "recharts";

type ActiveTab = "balances" | "transactions" | "payments" | "invoices" | "expenses";

const Finances = () => {
  const [activeTab, setActiveTab] = useState<ActiveTab>("balances");
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [clientBalances, setClientBalances] = useState<ClientBalance[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [financialStats, setFinancialStats] = useState({
    totalRevenue: 0,
    totalExpenses: 0,
    netProfit: 0,
    outstanding: 0
  });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showAddExpense, setShowAddExpense] = useState(false);
  const [showCreateInvoice, setShowCreateInvoice] = useState(false);
  const [deletePaymentId, setDeletePaymentId] = useState<string | null>(null);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [deleteExpenseId, setDeleteExpenseId] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchFinancialData();
  }, []);

  const fetchFinancialData = async () => {
    try {
      setLoading(true);
      const [statsData, transactionsData, invoicesData, expensesData, balancesData, paymentsData] = await Promise.all([
        financeService.getFinancialStats(),
        financeService.getAllTransactions(),
        financeService.getAllInvoices(),
        financeService.getAllExpenses(),
        financeService.getClientBalances(),
        paymentService.getAll()
      ]);

      setFinancialStats(statsData);
      setTransactions(transactionsData);
      setInvoices(invoicesData);
      setExpenses(expensesData);
      setClientBalances(balancesData);
      setPayments(paymentsData);
    } catch (error) {
      console.error('Error fetching financial data:', error);
      toast({
        title: "Error",
        description: "Failed to load financial data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePayment = async (paymentId: string) => {
    try {
      // Get current user for logging
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Get payment details before deletion for transaction cleanup
      const { data: paymentToDelete, error: fetchError } = await supabase
        .from('payments')
        .select('*')
        .eq('id', paymentId)
        .single();

      if (fetchError) throw fetchError;

      // 1. Delete associated transactions
      const { error: transactionsError } = await supabase
        .from('transactions')
        .delete()
        .or(`reference_id.eq.${paymentToDelete.client_package_id || paymentId},payment_id.eq.${paymentId}`);

      if (transactionsError) console.warn('Error deleting associated transactions:', transactionsError);

      // 2. Delete the payment
      const { error } = await supabase
        .from('payments')
        .delete()
        .eq('id', paymentId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Payment deleted successfully across all systems",
      });
      
      fetchFinancialData();
      setDeletePaymentId(null);
    } catch (error) {
      console.error('Error deleting payment:', error);
      toast({
        title: "Error", 
        description: "Failed to delete payment",
        variant: "destructive",
      });
    }
  };

  const downloadInvoiceAsPDF = (invoice: Invoice) => {
    const doc = new jsPDF();
    
    // Invoice Header
    doc.setFontSize(24);
    doc.setFont(undefined, 'bold');
    doc.text('INVOICE', 20, 30);
    
    // Invoice Details  
    doc.setFontSize(12);
    doc.setFont(undefined, 'bold');
    doc.text(`Invoice #: ${invoice.invoice_number}`, 20, 50);
    doc.setFont(undefined, 'normal');
    doc.text(`Issue Date: ${new Date(invoice.issue_date).toLocaleDateString()}`, 20, 62);
    doc.text(`Due Date: ${new Date(invoice.due_date).toLocaleDateString()}`, 20, 74);
    doc.text(`Status: ${invoice.status?.toUpperCase()}`, 20, 86);

    // Client Information
    doc.setFontSize(12);
    doc.setFont(undefined, 'bold');
    doc.text('Bill To:', 140, 50);
    doc.setFont(undefined, 'normal');
    doc.setFontSize(10);
    
    // Get client name from invoice
    const clientName = invoice.clients 
      ? `${invoice.clients.first_name} ${invoice.clients.last_name}`
      : 'Client';
    
    doc.text(clientName, 140, 62);
    if (invoice.clients) {
      doc.text('Dubai, UAE', 140, 72);
    }
    
    // Invoice Items Table
    const tableData = [];
    if (invoice.line_items && Array.isArray(invoice.line_items)) {
      invoice.line_items.forEach((item: any) => {
        tableData.push([
          item.description || invoice.description || 'Service',
          item.quantity?.toString() || '1',
          `DH${(item.rate || invoice.amount || 0).toFixed(2)}`,
          `DH${(item.total || invoice.amount || 0).toFixed(2)}`
        ]);
      });
    } else {
      tableData.push([
        invoice.description || 'Service',
        '1',
        `DH${(invoice.amount || 0).toFixed(2)}`,
        `DH${(invoice.amount || 0).toFixed(2)}`
      ]);
    }
    
    // Use autoTable safely
    if ((doc as any).autoTable) {
      (doc as any).autoTable({
        startY: 135,
        head: [['Description', 'Qty', 'Rate', 'Total']],
        body: tableData,
        theme: 'grid',
        styles: { fontSize: 10 },
        headStyles: { fillColor: [66, 139, 202] }
      });
      
      // Totals
      const finalY = (doc as any).lastAutoTable?.finalY ? (doc as any).lastAutoTable.finalY + 20 : 180;
      doc.setFontSize(10);
      doc.text(`Subtotal: DH${(invoice.amount || 0).toFixed(2)}`, 140, finalY);
      doc.text(`Tax: DH${(invoice.tax_amount || 0).toFixed(2)}`, 140, finalY + 7);
      doc.setFontSize(12);
      doc.text(`Total: DH${(invoice.total_amount || 0).toFixed(2)}`, 140, finalY + 17);
      
      // Notes
      if (invoice.notes) {
        doc.setFontSize(10);
        doc.text('Notes:', 20, finalY + 30);
        const splitNotes = doc.splitTextToSize(invoice.notes, 170);
        doc.text(splitNotes, 20, finalY + 40);
      }
      
    // Company Footer
    const pageHeight = doc.internal.pageSize.height;
    const footerY = pageHeight - 40;
    
    // Add separator line
    doc.setLineWidth(0.5);
    doc.line(20, footerY - 10, 190, footerY - 10);
    
    doc.setFontSize(10);
    doc.setFont(undefined, 'bold');
    doc.text('Train With Us Personal Trainers', 20, footerY);
    doc.setFont(undefined, 'normal');
    doc.setFontSize(9);
    doc.text('Dubai, UAE, 0000', 20, footerY + 8);
    doc.text('+971 54 377 3116', 20, footerY + 16);
    
    // Payment Terms
    doc.setFontSize(10);
    doc.text(`Payment Terms: ${invoice.payment_terms || 30} days`, 20, finalY + 65);
    } else {
      // Fallback if autoTable is not available
      let currentY = 135;
      doc.setFontSize(10);
      doc.text('Invoice Items:', 20, currentY);
      currentY += 15;
      
      tableData.forEach((row, index) => {
        doc.text(row.join(' | '), 20, currentY + (index * 10));
      });
      
      currentY += (tableData.length * 10) + 20;
      doc.text(`Total: DH${(invoice.total_amount || 0).toFixed(2)}`, 20, currentY);
    }
    
    doc.save(`invoice-${invoice.invoice_number}.pdf`);
  };

  const handleDeleteExpense = async (expenseId: string) => {
    try {
      const { error } = await supabase
        .from('expenses')
        .delete()
        .eq('id', expenseId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Expense deleted successfully",
      });
      
      fetchFinancialData();
      setDeleteExpenseId(null);
    } catch (error) {
      console.error('Error deleting expense:', error);
      toast({
        title: "Error", 
        description: "Failed to delete expense",
        variant: "destructive",
      });
    }
  };

  const getStatusBadge = (status: string, type: 'transaction' | 'invoice' | 'expense' = 'transaction') => {
    const statusClasses = {
      completed: "bg-success text-success-foreground",
      pending: "bg-warning text-warning-foreground",
      overdue: "bg-destructive text-destructive-foreground",
      paid: "bg-success text-success-foreground",
      draft: "bg-muted text-muted-foreground",
      sent: "bg-primary text-primary-foreground",
      failed: "bg-destructive text-destructive-foreground",
      cancelled: "bg-muted text-muted-foreground",
      reimbursed: "bg-info text-info-foreground"
    };

    return (
      <Badge className={statusClasses[status as keyof typeof statusClasses] || "bg-muted text-muted-foreground"}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const formatAmount = (amount: number, type: 'charge' | 'payment' | 'refund' | 'discount' | null = null) => {
    const prefix = type === 'charge' ? '+' : type === 'payment' ? '-' : '';
    const color = type === 'charge' ? 'text-destructive' : type === 'payment' ? 'text-success' : 'text-foreground';
    return <span className={color}>{prefix}DH{Math.abs(amount).toLocaleString()}</span>;
  };

  const renderBalances = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold">Client balances</h2>
          <p className="text-sm text-muted-foreground">All (7)</p>
        </div>
        <div className="flex items-center space-x-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-64"
            />
          </div>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="space-y-0 divide-y">
            <div className="grid grid-cols-5 gap-4 p-4 text-sm font-medium text-muted-foreground bg-muted">
              <div>NAME</div>
              <div>AMOUNT DUE</div>
              <div>IN CREDIT</div>
              <div>BALANCED</div>
              <div></div>
            </div>
            {clientBalances
              .filter(client => 
                `${client.first_name} ${client.last_name}`.toLowerCase().includes(searchTerm.toLowerCase())
              )
              .map((client) => (
                <div key={client.client_id} className="grid grid-cols-5 gap-4 p-4 items-center hover:bg-muted/50">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                      <span className="text-sm font-medium text-primary">
                        {client.first_name.charAt(0)}{client.last_name.charAt(0)}
                      </span>
                    </div>
                    <span className="font-medium">{client.first_name} {client.last_name}</span>
                  </div>
                  <div>
                    {client.balance > 0 ? (
                      <span className="text-destructive">-DH{client.balance.toLocaleString()}</span>
                    ) : (
                      <span>DH0</span>
                    )}
                  </div>
                  <div>
                    {client.balance < 0 ? (
                      <span className="text-success">+DH{Math.abs(client.balance).toLocaleString()}</span>
                    ) : (
                      <span>DH0</span>
                    )}
                  </div>
                  <div>
                    <span className={client.balance === 0 ? 'text-success' : 'text-muted-foreground'}>
                      DH{client.balance === 0 ? '0' : Math.abs(client.balance).toLocaleString()}
                    </span>
                  </div>
                  <div className="text-right">
                    {/* Arrow removed as requested */}
                  </div>
                </div>
              ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderTransactions = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold">Transaction history</h2>
          <p className="text-sm text-muted-foreground">All clients selected</p>
        </div>
        <div className="flex items-center space-x-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search description"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-64"
            />
          </div>
          <Button variant="outline">
            <Plus className="h-4 w-4 mr-2" />
            New charge
          </Button>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            New payment
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="space-y-0 divide-y">
            <div className="grid grid-cols-7 gap-4 p-4 text-sm font-medium text-muted-foreground bg-muted">
              <div>DATE</div>
              <div>NAME</div>
              <div>DESCRIPTION</div>
              <div>CHARGE</div>
              <div>PAYMENT</div>
              <div>STATUS</div>
              <div>TYPE</div>
            </div>
            {transactions
              .filter(transaction => 
                // Filter out admin action transactions (payment deletions)
                transaction.category !== 'admin_action' &&
                (transaction.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                transaction.clients?.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                transaction.clients?.last_name.toLowerCase().includes(searchTerm.toLowerCase()))
              )
              .map((transaction) => (
                <div key={transaction.id} className="grid grid-cols-7 gap-4 p-4 items-center hover:bg-muted/50">
                  <div className="text-sm text-muted-foreground">
                    {new Date(transaction.transaction_date).toLocaleDateString('en-US', { 
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric'
                    })}
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center text-xs">
                      {transaction.clients?.first_name.charAt(0)}{transaction.clients?.last_name.charAt(0)}
                    </div>
                    <span className="text-sm">
                      {transaction.clients?.first_name} {transaction.clients?.last_name}
                    </span>
                  </div>
                  <div className="text-sm">{transaction.description}</div>
                  <div>
                    {transaction.transaction_type === 'charge' && formatAmount(transaction.amount, 'charge')}
                  </div>
                  <div>
                    {transaction.transaction_type === 'payment' && formatAmount(transaction.amount, 'payment')}
                  </div>
                  <div>
                    {getStatusBadge(transaction.status)}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {transaction.payment_method || transaction.category}
                  </div>
                </div>
              ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderPayments = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold">Payments received</h2>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline">
            <Filter className="h-4 w-4 mr-2" />
            Filter
          </Button>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            New payment
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="space-y-0 divide-y">
            <div className="grid grid-cols-7 gap-4 p-4 text-sm font-medium text-muted-foreground bg-muted">
              <div>DATE</div>
              <div>NAME</div>
              <div>AMOUNT</div>
              <div>STATUS</div>
              <div>METHOD</div>
              <div>DESCRIPTION</div>
              <div>ACTIONS</div>
            </div>
            {payments.map((payment) => (
              <div key={payment.id} className="grid grid-cols-7 gap-4 p-4 items-center hover:bg-muted/50">
                <div className="text-sm text-muted-foreground">
                  {new Date(payment.payment_date).toLocaleDateString('en-US', { 
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric'
                  })}
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center text-xs">
                    {payment.clients?.first_name.charAt(0)}{payment.clients?.last_name.charAt(0)}
                  </div>
                  <span className="text-sm">
                    {payment.clients?.first_name} {payment.clients?.last_name}
                  </span>
                </div>
                <div className="text-success font-medium">
                  +DH{payment.amount.toLocaleString()}
                </div>
                <div>
                  {getStatusBadge(payment.status)}
                </div>
                <div className="text-sm">{payment.payment_method}</div>
                <div className="text-sm text-muted-foreground">{payment.description}</div>
                <div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setDeletePaymentId(payment.id)}
                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderInvoices = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Invoices</h2>
        <Button onClick={() => setShowCreateInvoice(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Create Invoice
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          {invoices.length > 0 ? (
            <div className="space-y-0 divide-y">
              <div className="grid grid-cols-7 gap-4 p-4 text-sm font-medium text-muted-foreground bg-muted">
                <div>INVOICE #</div>
                <div>CLIENT</div>
                <div>AMOUNT</div>
                <div>STATUS</div>
                <div>ISSUE DATE</div>
                <div>DUE DATE</div>
                <div>ACTIONS</div>
              </div>
              {invoices.map((invoice) => (
                <div key={invoice.id} className="grid grid-cols-7 gap-4 p-4 items-center hover:bg-muted/50">
                  <div className="font-medium">{invoice.invoice_number}</div>
                  <div>
                    {invoice.clients?.first_name} {invoice.clients?.last_name}
                  </div>
                  <div className="font-medium">DH{invoice.total_amount.toLocaleString()}</div>
                  <div>
                    {getStatusBadge(invoice.status, 'invoice')}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {new Date(invoice.issue_date).toLocaleDateString()}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {new Date(invoice.due_date).toLocaleDateString()}
                  </div>
                  <div>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => downloadInvoiceAsPDF(invoice)}
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No invoices yet</h3>
              <p className="text-muted-foreground mb-4">Create your first invoice to start tracking payments</p>
              <Button onClick={() => setShowCreateInvoice(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create Invoice
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );

  const renderExpenses = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold">Expenses</h2>
        </div>
        <div className="flex items-center space-x-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search"
              className="pl-10 w-64"
            />
          </div>
          <Button onClick={() => setShowAddExpense(true)}>
            <Plus className="h-4 w-4 mr-2" />
            New expense
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          {expenses.length > 0 ? (
            <div className="space-y-0 divide-y">
              <div className="grid grid-cols-7 gap-4 p-4 text-sm font-medium text-muted-foreground bg-muted">
                <div>DATE</div>
                <div>DESCRIPTION</div>
                <div>CATEGORY</div>
                <div>AMOUNT</div>
                <div>STATUS</div>
                <div>VENDOR</div>
                <div>ACTIONS</div>
              </div>
              {expenses.map((expense) => (
                <div key={expense.id} className="grid grid-cols-7 gap-4 p-4 items-center hover:bg-muted/50">
                  <div className="text-sm text-muted-foreground">
                    {new Date(expense.expense_date).toLocaleDateString()}
                  </div>
                  <div className="text-sm">{expense.description}</div>
                  <div className="text-sm">{expense.category}</div>
                  <div className="text-destructive font-medium">
                    -DH{expense.amount.toLocaleString()}
                  </div>
                  <div>
                    {getStatusBadge(expense.status, 'expense')}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {expense.vendor || '-'}
                  </div>
                  <div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => {
                            setEditingExpense(expense);
                            setShowAddExpense(true);
                          }}
                        >
                          <Edit className="h-4 w-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => setDeleteExpenseId(expense.id)}
                          className="text-destructive"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Receipt className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No expenses to display</h3>
              <p className="text-muted-foreground mb-4">Add expenses to track your business costs</p>
              <Button onClick={() => setShowAddExpense(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Expense
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="mt-8">
        <h3 className="text-lg font-semibold mb-4">Upcoming recurring expenses</h3>
        <Card>
          <CardContent className="p-6">
            <div className="text-center py-8">
              <Receipt className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No recurring expenses to display</h3>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  const tabs = [
    { id: "balances", label: "Balances" },
    { id: "transactions", label: "Transactions" },
    { id: "payments", label: "Payments" },
    { id: "invoices", label: "Invoices" },
    { id: "expenses", label: "Expenses" }
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">Finances</h1>
            <p className="text-muted-foreground">Comprehensive financial management for your business</p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex space-x-1 bg-muted p-1 rounded-lg mb-8 w-fit">
          {tabs.map((tab) => (
            <Button
              key={tab.id}
              variant={activeTab === tab.id ? "default" : "ghost"}
              onClick={() => setActiveTab(tab.id as ActiveTab)}
              className="px-6"
            >
              {tab.label}
            </Button>
          ))}
        </div>

        {/* Content */}
        <div>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : (
            <>
              {activeTab === "balances" && renderBalances()}
              {activeTab === "transactions" && renderTransactions()}
              {activeTab === "payments" && renderPayments()}
              {activeTab === "invoices" && renderInvoices()}
              {activeTab === "expenses" && renderExpenses()}
            </>
          )}
        </div>

        {/* Modals */}
        <AddExpenseModal
          isOpen={showAddExpense}
          onClose={() => {
            setShowAddExpense(false);
            setEditingExpense(null);
          }}
          onSuccess={() => {
            fetchFinancialData();
            setEditingExpense(null);
          }}
          expense={editingExpense}
        />

        <CreateInvoiceModal
          isOpen={showCreateInvoice}
          onClose={() => setShowCreateInvoice(false)}
          onSuccess={fetchFinancialData}
        />

        {/* Delete Payment Confirmation */}
        <AlertDialog open={!!deletePaymentId} onOpenChange={() => setDeletePaymentId(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Payment</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete this payment? This action will be logged and cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => deletePaymentId && handleDeletePayment(deletePaymentId)}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Delete Payment
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Delete Expense Confirmation */}
        <AlertDialog open={!!deleteExpenseId} onOpenChange={() => setDeleteExpenseId(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Expense</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete this expense? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => deleteExpenseId && handleDeleteExpense(deleteExpenseId)}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Delete Expense
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
};

export default Finances;