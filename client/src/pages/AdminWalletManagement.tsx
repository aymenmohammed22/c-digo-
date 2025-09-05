import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowRight, Plus, Wallet, TrendingUp, TrendingDown, Search, DollarSign } from 'lucide-react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import type { UserWallet, WalletTransaction } from '@shared/schema';

export function AdminWalletManagement() {
  const [, setLocation] = useLocation();
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [showTransactionForm, setShowTransactionForm] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [transactionData, setTransactionData] = useState({
    amount: '',
    type: 'credit' as 'credit' | 'debit',
    description: '',
    referenceId: ''
  });

  // Fetch user wallet
  const { data: wallet, isLoading: walletLoading } = useQuery<UserWallet>({
    queryKey: [`/api/users/${selectedUserId}/wallet`],
    enabled: !!selectedUserId,
  });

  // Fetch wallet transactions
  const { data: transactions, isLoading: transactionsLoading } = useQuery<WalletTransaction[]>({
    queryKey: [`/api/users/${selectedUserId}/wallet/transactions`],
    enabled: !!selectedUserId,
  });

  // Create transaction mutation
  const createTransactionMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch(`/api/users/${selectedUserId}/wallet/transactions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to create transaction');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/users/${selectedUserId}/wallet`] });
      queryClient.invalidateQueries({ queryKey: [`/api/users/${selectedUserId}/wallet/transactions`] });
      setShowTransactionForm(false);
      resetTransactionForm();
      toast({ title: 'تم إنشاء المعاملة بنجاح' });
    },
    onError: () => {
      toast({ title: 'فشل في إنشاء المعاملة', variant: 'destructive' });
    },
  });

  const resetTransactionForm = () => {
    setTransactionData({
      amount: '',
      type: 'credit',
      description: '',
      referenceId: ''
    });
  };

  const handleTransactionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!transactionData.amount || !transactionData.description) {
      toast({ title: 'يرجى ملء جميع الحقول المطلوبة', variant: 'destructive' });
      return;
    }

    createTransactionMutation.mutate(transactionData);
  };

  const formatDate = (date: string | Date | null | undefined) => {
    if (!date) return 'غير محدد';
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return dateObj.toLocaleDateString('ar-SA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatCurrency = (amount: string | number) => {
    return `${parseFloat(amount.toString()).toFixed(2)} ريال`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setLocation('/admin')}
        >
          <ArrowRight className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">إدارة المحافظ الإلكترونية</h1>
          <p className="text-muted-foreground">عرض وإدارة محافظ المستخدمين</p>
        </div>
      </div>

      {/* User Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            البحث عن مستخدم
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <Label htmlFor="userId">معرف المستخدم</Label>
              <Input
                id="userId"
                value={selectedUserId}
                onChange={(e) => setSelectedUserId(e.target.value)}
                placeholder="أدخل معرف المستخدم"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Wallet Overview */}
      {selectedUserId && wallet && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <Wallet className="h-5 w-5 text-blue-500" />
                <div>
                  <p className="text-sm font-medium text-muted-foreground">الرصيد الحالي</p>
                  <p className="text-2xl font-bold text-blue-600">{formatCurrency(wallet.balance)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <TrendingUp className="h-5 w-5 text-green-500" />
                <div>
                  <p className="text-sm font-medium text-muted-foreground">إجمالي الإيرادات</p>
                  <p className="text-2xl font-bold text-green-600">{formatCurrency(wallet.totalEarnings || '0')}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <TrendingDown className="h-5 w-5 text-red-500" />
                <div>
                  <p className="text-sm font-medium text-muted-foreground">إجمالي المصروفات</p>
                  <p className="text-2xl font-bold text-red-600">{formatCurrency(wallet.totalSpent || '0')}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Add Transaction Button */}
      {selectedUserId && wallet && (
        <div className="flex justify-end">
          <Button
            onClick={() => {
              setShowTransactionForm(true);
              resetTransactionForm();
            }}
            className="gap-2"
          >
            <Plus className="h-4 w-4" />
            إضافة معاملة جديدة
          </Button>
        </div>
      )}

      {/* Transaction Form */}
      {showTransactionForm && (
        <Card>
          <CardHeader>
            <CardTitle>إضافة معاملة جديدة</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleTransactionSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="amount">المبلغ</Label>
                  <Input
                    id="amount"
                    type="number"
                    step="0.01"
                    value={transactionData.amount}
                    onChange={(e) => setTransactionData({ ...transactionData, amount: e.target.value })}
                    placeholder="0.00"
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="type">نوع المعاملة</Label>
                  <Select 
                    value={transactionData.type} 
                    onValueChange={(value: 'credit' | 'debit') => setTransactionData({ ...transactionData, type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="credit">إيداع (Credit)</SelectItem>
                      <SelectItem value="debit">سحب (Debit)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="description">وصف المعاملة</Label>
                <Textarea
                  id="description"
                  value={transactionData.description}
                  onChange={(e) => setTransactionData({ ...transactionData, description: e.target.value })}
                  placeholder="أدخل وصف للمعاملة"
                  required
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="referenceId">رقم المرجع (اختياري)</Label>
                <Input
                  id="referenceId"
                  value={transactionData.referenceId}
                  onChange={(e) => setTransactionData({ ...transactionData, referenceId: e.target.value })}
                  placeholder="رقم الطلب أو المرجع"
                />
              </div>

              <div className="flex gap-2">
                <Button 
                  type="submit" 
                  disabled={createTransactionMutation.isPending}
                  className="gap-2"
                >
                  <DollarSign className="h-4 w-4" />
                  إنشاء المعاملة
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setShowTransactionForm(false)}
                >
                  إلغاء
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Transactions History */}
      {selectedUserId && (
        <Card>
          <CardHeader>
            <CardTitle>سجل المعاملات</CardTitle>
          </CardHeader>
          <CardContent>
            {transactionsLoading ? (
              <div className="flex items-center justify-center p-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : transactions?.length === 0 ? (
              <p className="text-center text-muted-foreground p-8">لا توجد معاملات</p>
            ) : (
              <div className="space-y-4">
                {transactions?.map((transaction) => (
                  <div key={transaction.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-full ${
                        transaction.type === 'credit' ? 'bg-green-100' : 'bg-red-100'
                      }`}>
                        {transaction.type === 'credit' ? (
                          <TrendingUp className="h-4 w-4 text-green-600" />
                        ) : (
                          <TrendingDown className="h-4 w-4 text-red-600" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium">{transaction.description}</p>
                        <p className="text-sm text-muted-foreground">
                          {formatDate(transaction.createdAt)}
                        </p>
                        {transaction.referenceId && (
                          <p className="text-xs text-muted-foreground">
                            مرجع: {transaction.referenceId}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className={`text-lg font-bold ${
                      transaction.type === 'credit' ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {transaction.type === 'credit' ? '+' : '-'}{formatCurrency(transaction.amount)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* No user selected message */}
      {!selectedUserId && (
        <Card>
          <CardContent className="p-8 text-center">
            <Wallet className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-lg font-medium mb-2">اختر مستخدماً لعرض محفظته</p>
            <p className="text-muted-foreground">أدخل معرف المستخدم في الحقل أعلاه</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default AdminWalletManagement;