'use client';

import { useCallback, useEffect, useMemo } from 'react';
import { PriceAlertStorage } from '@/lib/price-alerts';
import type { NotificationDeliveryRecord } from '@/lib/notifications';
import { logger } from '@/lib/logger';
import { startNotificationPolling } from '@/lib/notifications/polling';
import { formatNumber } from '@/lib/format';
import {
  useNotificationContext,
  type NotificationCenterEvent,
  type NotificationCenterEventType,
} from '@/components/NotificationProvider';

export type { NotificationCenterEvent, NotificationCenterEventType };

/**
 * useNotificationCenter
 *
 * Aggregates notifications from multiple sources:
 * - Price alerts (from price-alerts.ts)
 * - Transaction updates (from notifications/service.ts)
 * - Payout status updates (from polling/transaction-timeout.ts)
 * - Tier changes (custom events)
 *
 * State, persistence and read/unread handling are delegated to the shared
 * reducer/context in NotificationProvider. This hook only aggregates events
 * from the various sources and forwards them to the context.
 */
function useNotificationCenter(userAddress: string | null) {
  const {
    events,
    unreadCount,
    loading,
    error,
    markAsRead,
    markAllAsRead,
    removeEvent,
    clearAll,
    addEvent,
    addTierChangeEvent: addTierChangeEventToContext,
    initialize,
    setError,
  } = useNotificationContext();

  // Aggregate price alerts from storage
  const aggregatePriceAlerts = useCallback(() => {
    try {
      // Get recent alerts from storage that have been triggered
      const allAlerts = PriceAlertStorage.getAllAlerts();

      // Only show triggered alerts as notifications
      const triggeredAlerts = allAlerts.filter(
        (a) => a.status === 'triggered' || a.triggeredCount > 0,
      );

      // Convert to events
      triggeredAlerts.forEach((alert) => {
        const lastTrigger = alert.triggerHistory?.[0];
        if (lastTrigger) {
          const alertEventId = `price-alert-${alert.id}`;
          const event: NotificationCenterEvent = {
            id: alertEventId,
            type: 'price_alert',
            title: `Price Alert: ${alert.currency}`,
            description: `Your alert for ${alert.currency} at ₦${formatNumber(alert.targetPrice)} has been triggered at ₦${formatNumber(lastTrigger.priceAtTrigger)}`,
            read: false,
            createdAt: lastTrigger.timestamp,
            link: {
              href: `/price-alerts/${alert.id}`,
              label: 'View Alert',
            },
            metadata: {
              alertId: alert.id,
              currency: alert.currency,
              targetPrice: alert.targetPrice,
              triggerPrice: lastTrigger.priceAtTrigger,
            },
          };

          addEvent(event);
        }
      });
    } catch (err) {
      logger.error('notification_center.aggregate_price_alerts_failed', {}, err);
    }
  }, [addEvent]);

  // Aggregate transaction updates
  const aggregateTransactionUpdates = useCallback(
    (deliveries: NotificationDeliveryRecord[]) => {
      try {
        deliveries.forEach((delivery) => {
          const txEventId = `tx-${delivery.transactionId}-${delivery.eventType}`;

          // Map event type to human readable text
          const eventTypeText =
            {
              pending: 'Transaction Pending',
              completed: 'Transaction Completed',
              failed: 'Transaction Failed',
            }[delivery.eventType] || 'Transaction Update';

          const event: NotificationCenterEvent = {
            id: txEventId,
            type: 'transaction_update',
            title: eventTypeText,
            description: delivery.message || `Your transaction has been ${delivery.eventType}`,
            read: delivery.metadata?.read === true,
            createdAt: delivery.createdAt,
            link: {
              href: `/transaction/${delivery.transactionId}`,
              label: 'View Transaction',
            },
            metadata: {
              transactionId: delivery.transactionId,
              eventType: delivery.eventType,
              status: delivery.status,
            },
          };

          addEvent(event);
        });
      } catch (err) {
        logger.error('notification_center.aggregate_transaction_updates_failed', {}, err);
      }
    },
    [addEvent],
  );

  // Aggregate payout status updates
  const aggregatePayoutUpdates = useCallback(
    (transactions: Array<{ id: string; payoutStatus?: string; updatedAt: number }>) => {
      try {
        transactions.forEach((tx) => {
          if (!tx.payoutStatus) return;

          const payoutEventId = `payout-${tx.id}`;

          const statusText =
            {
              pending: 'Payout Pending',
              processing: 'Payout Processing',
              settled: 'Payout Settled',
              failed: 'Payout Failed',
              refunded: 'Payout Refunded',
              expired: 'Payout Expired',
            }[tx.payoutStatus] || 'Payout Update';

          const event: NotificationCenterEvent = {
            id: payoutEventId,
            type: 'payout_update',
            title: statusText,
            description: `Your payout status has been updated to ${tx.payoutStatus}`,
            read: false,
            createdAt: tx.updatedAt,
            link: {
              href: `/transaction/${tx.id}?tab=payout`,
              label: 'View Payout',
            },
            metadata: {
              transactionId: tx.id,
              payoutStatus: tx.payoutStatus,
            },
          };

          addEvent(event);
        });
      } catch (err) {
        logger.error('notification_center.aggregate_payout_updates_failed', {}, err);
      }
    },
    [addEvent],
  );

  // Aggregate tier changes
  const addTierChangeEvent = useCallback(
    (tier: string, previousTier?: string) => {
      addTierChangeEventToContext(tier, previousTier);
    },
    [addTierChangeEventToContext],
  );

  // Initialize and load persisted events
  useEffect(() => {
    if (!userAddress) {
      setError('No user address provided');
      return;
    }

    try {
      initialize();
      // Aggregate current events from sources
      aggregatePriceAlerts();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load events');
    }
  }, [userAddress, initialize, aggregatePriceAlerts, setError]);

  // Poll for new events periodically (timer lives in lib/notifications)
  useEffect(() => {
    if (!userAddress) return;
    return startNotificationPolling(() => aggregatePriceAlerts());
  }, [userAddress, aggregatePriceAlerts]);

  // Format unread badge text (show "99+" for counts > 99)
  const unreadBadgeText = useMemo(
    () => (unreadCount > 99 ? '99+' : String(unreadCount)),
    [unreadCount],
  );

  return {
    events,
    unreadCount,
    loading,
    error,
    markAsRead,
    markAllAsRead,
    removeEvent,
    clearAll,
    addEvent,
    addTierChangeEvent,
    aggregateTransactionUpdates,
    aggregatePayoutUpdates,
    unreadBadgeText,
    // Backwards-compatible aliases
    badgeText: unreadBadgeText,
    unread: state.unreadCount,
  };
}

export default useNotificationCenter;
