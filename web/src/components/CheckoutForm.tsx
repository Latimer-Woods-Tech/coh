import { useState } from 'react';

interface CheckoutFormProps {
  onSuccess?: () => void;
  onError?: (error: string) => void;
  description?: string;
  amount?: number;
  isProcessing?: boolean;
}

/**
 * Checkout Form Component
 * 
 * In production, this would integrate with Stripe Elements:
 * - import { CardElement, useElements, useStripe } from '@stripe/react-stripe-js'
 * - Use stripe.confirmCardPayment(clientSecret, ...)
 * 
 * For now, shows a placeholder form while Stripe SDK is unavailable.
 */
export default function CheckoutForm({
  onSuccess,
  onError,
  description = 'Complete your payment',
  amount,
  isProcessing = false,
}: CheckoutFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvc, setCvc] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (!cardNumber || !expiry || !cvc) {
      setError('Please fill in all card details');
      return;
    }

    setIsLoading(true);

    try {
      // TODO: In production, integrate with actual Stripe API
      // For now, this is a placeholder
      console.warn('Payment form submitted - Stripe integration pending');
      
      // Simulate processing
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      onSuccess?.();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Payment failed';
      setError(msg);
      onError?.(msg);
    } finally {
      setIsLoading(false);
    }
  };

  // Format card number with spaces
  const formatCardNumber = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    const matches = v.match(/\d{4,16}/g);
    const match = (matches && matches[0]) || '';
    const parts = [];
    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }
    return parts.length ? parts.join(' ') : value;
  };

  const handleCardInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCardNumber(formatCardNumber(e.target.value));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-yellow-50 border border-yellow-200 px-4 py-3 rounded text-sm" style={{ color: '#704214' }}>
        <strong>Note:</strong> Full Stripe integration is in progress. This is a placeholder form.
      </div>

      <div>
        <label className="block text-sm font-medium mb-2" style={{ color: '#2C1810' }}>
          Card Number
        </label>
        <input
          type="text"
          value={cardNumber}
          onChange={handleCardInput}
          placeholder="4242 4242 4242 4242"
          className="w-full px-4 py-2 border rounded"
          style={{
            borderColor: '#8B5E3C',
            backgroundColor: '#F5ECD7',
          }}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-2" style={{ color: '#2C1810' }}>
            Expiry
          </label>
          <input
            type="text"
            value={expiry}
            onChange={(e) => setExpiry(e.target.value)}
            placeholder="MM/YY"
            maxLength={5}
            className="w-full px-4 py-2 border rounded"
            style={{
              borderColor: '#8B5E3C',
              backgroundColor: '#F5ECD7',
            }}
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-2" style={{ color: '#2C1810' }}>
            CVC
          </label>
          <input
            type="text"
            value={cvc}
            onChange={(e) => setCvc(e.target.value.slice(0, 4))}
            placeholder="123"
            className="w-full px-4 py-2 border rounded"
            style={{
              borderColor: '#8B5E3C',
              backgroundColor: '#F5ECD7',
            }}
          />
        </div>
      </div>

      {error && (
        <div
          className="px-4 py-3 rounded text-sm"
          style={{
            backgroundColor: 'rgba(160, 82, 45, 0.15)',
            borderLeft: '4px solid #A0522D',
            color: '#704214',
          }}
        >
          {error}
        </div>
      )}

      {amount && (
        <div className="flex items-center justify-between pt-4" style={{ borderTop: '1px solid #8B5E3C' }}>
          <span style={{ color: '#2C1810', fontWeight: 500 }}>Amount Due:</span>
          <span style={{ color: '#C9A84C', fontSize: '1.25rem', fontWeight: 700 }}>
            ${(amount / 100).toFixed(2)}
          </span>
        </div>
      )}

      <button
        type="submit"
        disabled={isLoading || isProcessing}
        className="w-full py-3 px-4 rounded uppercase tracking-wider font-medium transition-opacity"
        style={{
          backgroundColor: isLoading || isProcessing ? '#8B5E3C' : '#C9A84C',
          color: '#2C1810',
          cursor: isLoading || isProcessing ? 'not-allowed' : 'pointer',
          opacity: isLoading || isProcessing ? 0.6 : 1,
        }}
      >
        {isLoading || isProcessing ? 'Processing...' : 'Complete Purchase'}
      </button>

      <p
        className="text-xs text-center italic"
        style={{ color: '#704214' }}
      >
        {description}
      </p>
    </form>
  );
}
