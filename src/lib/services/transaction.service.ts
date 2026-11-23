import type { Transaction } from '@/lib/transaction-storage';
import type { TransactionRepository, TransactionStats } from '@/lib/repositories';

export interface TransactionFilter {
  status?: string;
  currency?: string;
  startDate?: number;
  endDate?: number;
  limit?: number;
  offset?: number;
}

export class TransactionService {
  constructor(private readonly repository: TransactionRepository) {}

  async getTransaction(id: string): Promise<Transaction | null> {
    if (!id) {
      throw new Error('Transaction ID is required');
    }
    return this.repository.getById(id);
  }

  async getTransactionByPayoutOrderId(orderId: string): Promise<Transaction | null> {
    if (!orderId) {
      throw new Error('Order ID is required');
    }
    return this.repository.getByPayoutOrderId(orderId);
  }

  async listTransactions(filter: TransactionFilter): Promise<Transaction[]> {
    return this.repository.list(filter);
  }

  async updateTransaction(id: string, updates: Partial<Transaction>): Promise<Transaction | null> {
    if (!id) {
      throw new Error('Transaction ID is required');
    }

    if (!updates || Object.keys(updates).length === 0) {
      throw new Error('No updates provided');
    }

    return this.repository.update(id, updates);
  }

  async deleteTransaction(id: string): Promise<boolean> {
    if (!id) {
      throw new Error('Transaction ID is required');
    }

    return this.repository.delete(id);
  }

  async getTransactionStats(filter?: TransactionFilter): Promise<TransactionStats> {
    return this.repository.getStats(filter);
  }
}
