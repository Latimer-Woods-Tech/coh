import type { ReactNode } from 'react';

// Note: In this environment, we'll dynamically load Stripe
// In a real app, you'd use `import { loadStripe } from '@stripe/js'`

const stripePublishableKey = import.meta.env.VITE_STRIPE_PUBLIC_KEY;

interface StripeProviderProps {
  children: ReactNode;
}

export default function StripeProvider({ children }: StripeProviderProps) {
  if (!stripePublishableKey) {
    console.warn('Stripe public key not configured. Payments will not work.');
    return <>{children}</>;
  }

  // For now, render children without Stripe Elements wrapper
  // In production with proper @stripe/js, use:
  // const stripePromise = loadStripe(stripePublishableKey);
  // return <Elements stripe={stripePromise}>{children}</Elements>;

  return <>{children}</>;
}
