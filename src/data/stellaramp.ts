import type {
  ProgressStep,
  RecentOfframpRow,
  StateVariant,
  WalletFlowState,
} from '@stellar-spend/shared';
import { t } from '../i18n';

const RECENT_OFFRAMPS: ReadonlyArray<RecentOfframpRow> = [
  { txHash: '5f90...a1c4', usdc: '500.00', fiat: '₦799,000', currency: 'NGN', status: 'SETTLING' },
  { txHash: 'c2d7...9b3f', usdc: '250.00', fiat: '₦398,925', currency: 'NGN', status: 'COMPLETE' },
];

const SETTLEMENT_BREAKDOWN = [
  { label: t('data.stellaramp.settlement.fxRate'), value: '₦1,598' },
  { label: t('data.stellaramp.settlement.networkFee'), value: '2.50 USDC' },
  { label: t('data.stellaramp.settlement.platformFee'), value: '0.35%' },
] as const;

const PAYOUT_TOTAL = '₦1,997,500';

export const STATE_VARIANTS: Readonly<Record<WalletFlowState, StateVariant>> = {
  pre_connect: {
    key: 'pre_connect',
    subtitle: t('data.stellaramp.preConnect.subtitle'),
    chipText: t('data.stellaramp.preConnect.chipText'),
    formTitle: t('data.stellaramp.preConnect.formTitle'),
    formDescription: t('data.stellaramp.preConnect.formDescription'),
    walletStatus: t('data.stellaramp.preConnect.walletStatus'),
    walletStatusTone: 'muted',
    cta: t('data.stellaramp.preConnect.cta'),
    ctaTone: 'accent',
    heroLabel: t('data.stellaramp.preConnect.heroLabel'),
    heroValue: '₦ --',
    heroMeta: t('data.stellaramp.preConnect.heroMeta'),
    stepOneTitle: t('data.stellaramp.preConnect.stepOneTitle'),
    stepOneDescription: t('data.stellaramp.preConnect.stepOneDescription'),
    stepTwoTitle: t('data.stellaramp.preConnect.stepTwoTitle'),
    stepTwoDescription: t('data.stellaramp.preConnect.stepTwoDescription'),
  },
  connecting: {
    key: 'connecting',
    subtitle: t('data.stellaramp.connecting.subtitle'),
    chipText: t('data.stellaramp.connecting.chipText'),
    formTitle: t('data.stellaramp.connecting.formTitle'),
    formDescription: t('data.stellaramp.connecting.formDescription'),
    walletStatus: t('data.stellaramp.connecting.walletStatus'),
    walletStatusTone: 'accent',
    cta: t('data.stellaramp.connecting.cta'),
    ctaTone: 'disabled',
    heroLabel: t('data.stellaramp.connecting.heroLabel'),
    heroValue: t('data.stellaramp.connecting.heroValue'),
    heroMeta: t('data.stellaramp.connecting.heroMeta'),
    stepOneTitle: t('data.stellaramp.connecting.stepOneTitle'),
    stepOneDescription: t('data.stellaramp.connecting.stepOneDescription'),
    stepTwoTitle: t('data.stellaramp.connecting.stepTwoTitle'),
    stepTwoDescription: t('data.stellaramp.connecting.stepTwoDescription'),
    pulse: true,
  },
  connected: {
    key: 'connected',
    subtitle: t('data.stellaramp.connected.subtitle'),
    chipText: t('data.stellaramp.connected.chipText'),
    formTitle: t('data.stellaramp.connected.formTitle'),
    formDescription: t('data.stellaramp.connected.formDescription'),
    walletStatus: t('data.stellaramp.connected.walletStatus'),
    walletStatusTone: 'accent',
    cta: t('data.stellaramp.connected.cta'),
    ctaTone: 'light',
    heroLabel: t('data.stellaramp.connected.heroLabel'),
    heroValue: '₦1,997,500',
    heroMeta: t('data.stellaramp.connected.heroMeta'),
    stepOneTitle: t('data.stellaramp.connected.stepOneTitle'),
    stepOneDescription: t('data.stellaramp.connected.stepOneDescription'),
    stepTwoTitle: t('data.stellaramp.connected.stepTwoTitle'),
    stepTwoDescription: t('data.stellaramp.connected.stepTwoDescription'),
  },
};

export function buildProgressSteps(variant: StateVariant): ReadonlyArray<ProgressStep> {
  return [
    {
      id: 's1',
      number: '01',
      title: variant.stepOneTitle,
      description: variant.stepOneDescription,
    },
    {
      id: 's2',
      number: '02',
      title: variant.stepTwoTitle,
      description: variant.stepTwoDescription,
    },
    {
      id: 's3',
      number: '03',
      title: t('data.stellaramp.progress.payoutTitle'),
      description: t('data.stellaramp.progress.payoutDescription'),
    },
  ];
}
