import React, { useEffect, useState, useCallback } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Transaction, TIER_COLORS } from '../types';
import { useShop } from '../contexts/ShopContext';

const TRANSACTION_ICONS: Record<Transaction['type'], { icon: string; color: string; label: string }> = {
  purchase: {
    icon: '🟢',
    color: 'text-green-500',
    label: 'Achat'
  },
  redemption: {
    icon: '🟡',
    color: 'text-yellow-500',
    label: 'Récompense'
  },
  bonus: {
    icon: '🔵',
    color: 'text-blue-500',
    label: 'Bonus'
  },
  adjustment: {
    icon: '⚪',
    color: 'text-gray-500',
    label: 'Ajustement'
  }
};

export function TransactionHistory() {
  const { shop, customer } = useShop();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(0);

  // Fetch des transactions
  const fetchTransactions = useCallback(async (pageNum: number) => {
    if (!shop || !customer) return;

    try {
      const limit = 20;
      const offset = pageNum * limit;
      const url = `${import.meta.env.VITE_SUPABASE_URL}/rest/v1/transactions?customer_id=eq.${customer.id}&order=created_at.desc&limit=${limit}&offset=${offset}`;

      const response = await fetch(url, {
        headers: {
          'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
        }
      });

      if (!response.ok) return;

      const data = await response.json() as Transaction[];
      setTransactions(prev => pageNum === 0 ? data : [...prev, ...data]);
      setHasMore(data.length === limit);
    } catch (error) {
      console.error('Erreur fetch transactions:', error);
    } finally {
      setIsLoading(false);
    }
  }, [shop, customer]);

  // Chargement initial
  useEffect(() => {
    fetchTransactions(0);
  }, [fetchTransactions]);

  // Scroll infini
  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    if (scrollHeight - scrollTop - clientHeight < 100 && !isLoading && hasMore) {
      setPage(prev => prev + 1);
    }
  }, [isLoading, hasMore]);

  useEffect(() => {
    if (page > 0) {
      fetchTransactions(page);
    }
  }, [page, fetchTransactions]);

  // Formatage du montant
  const formatAmount = (amount: number | null) => {
    if (amount === null) return '';
    return `${amount.toLocaleString('fr-FR')} FCFA`;
  };

  // Formatage de la date
  const formatDate = (dateString: string) => {
    try {
      return formatDistanceToNow(new Date(dateString), {
        addSuffix: true,
        locale: fr
      });
    } catch {
      return dateString;
    }
  };

  return (
    <div
      className="h-full overflow-y-auto px-4 pb-20 with-bottom-nav"
      onScroll={handleScroll}
    >
      <h2 className="text-xl font-bold text-white mb-4 pt-4 safe-top">
        Historique des transactions
      </h2>

      {isLoading && transactions.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12">
          <div className="w-8 h-8 border-2 border-violet-600/30 border-t-violet-500 rounded-full animate-spin"></div>
          <p className="mt-4 text-gray-400 text-sm">Chargement...</p>
        </div>
      ) : transactions.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500">Aucune transaction pour le moment</p>
        </div>
      ) : (
        <div className="space-y-3">
          {transactions.map((transaction) => {
            const config = TRANSACTION_ICONS[transaction.type];
            const pointsSign = transaction.points >= 0 ? '+' : '';

            return (
              <div
                key={transaction.id}
                className="bg-dark-100 rounded-xl p-4 flex items-center gap-4 border border-white/5"
              >
                {/* Icône */}
                <div className={`text-2xl ${config.color}`}>
                  {config.icon}
                </div>

                {/* Détails */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-white font-semibold">
                      {pointsSign}{transaction.points} pts
                    </span>
                    {transaction.amount && (
                      <span className="text-gray-500 text-sm">
                        • {formatAmount(transaction.amount)}
                      </span>
                    )}
                  </div>
                  <div className="text-gray-400 text-sm truncate">
                    {transaction.description}
                  </div>
                  <div className="text-gray-600 text-xs mt-1">
                    {formatDate(transaction.created_at)}
                  </div>
                </div>

                {/* Label type */}
                <div className={`text-xs px-2 py-1 rounded-full ${config.color.replace('text-', 'bg-').replace('500', '500/10')} ${config.color}`}>
                  {config.label}
                </div>
              </div>
            );
          })}

          {/* Loading indicator */}
          {isLoading && (
            <div className="flex justify-center py-4">
              <div className="w-6 h-6 border-2 border-violet-600/30 border-t-violet-500 rounded-full animate-spin"></div>
            </div>
          )}

          {/* End of list */}
          {!hasMore && (
            <div className="text-center py-4 text-gray-600 text-sm">
              Fin de l'historique
            </div>
          )}
        </div>
      )}
    </div>
  );
}
