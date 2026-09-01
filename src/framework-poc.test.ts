import { describe, it, expect } from 'vitest';

// ============================================================================
// 1. Core Framework Definitions
// ============================================================================

export interface CardData {
  pan: string;
  expiryMonth: number;
  expiryYear: number;
  cvv?: string;
}

export interface DeviceData {
  ipAddress: string;
  userAgent: string;
  fingerprint: string;
  acceptHeader: string;
}

export interface TransactionContext {
  id: string;
  amount: number; // In standard decimal currency units (e.g. 29.99)
  currency: string;
  card: CardData;
  device: DeviceData;
}

export const RuleAction = {
  ALLOW: 'ALLOW',
  CHALLENGE: 'CHALLENGE',
  BLOCK: 'BLOCK',
} as const;
export type RuleAction = typeof RuleAction[keyof typeof RuleAction];

export interface RuleResult {
  ruleId: string;
  action: RuleAction;
  reason?: string;
}

export interface SecurityRule {
  id: string;
  evaluate(context: TransactionContext): RuleResult;
}

// ============================================================================
// 2. Concrete Security Rules
// ============================================================================

// Rule A: CVV Format Verification
export class CvvEnforcementRule implements SecurityRule {
  id = 'RULE_CVV';
  evaluate(context: TransactionContext): RuleResult {
    const cvv = context.card.cvv?.trim() || '';
    if (!cvv) {
      return { ruleId: this.id, action: RuleAction.BLOCK, reason: 'CVV code is required' };
    }
    const isAmex = context.card.pan.startsWith('34') || context.card.pan.startsWith('37');
    const requiredLength = isAmex ? 4 : 3;
    if (!/^\d+$/.test(cvv) || cvv.length !== requiredLength) {
      return { ruleId: this.id, action: RuleAction.BLOCK, reason: `CVV must be ${requiredLength} digits` };
    }
    return { ruleId: this.id, action: RuleAction.ALLOW };
  }
}

// Rule B: Luhn Algorithm Validation
export class LuhnCheckRule implements SecurityRule {
  id = 'RULE_LUHN';
  evaluate(context: TransactionContext): RuleResult {
    const pan = context.card.pan.replace(/\D/g, '');
    if (!pan || pan.length < 13 || pan.length > 19) {
      return { ruleId: this.id, action: RuleAction.BLOCK, reason: 'Invalid card number length' };
    }
    
    let sum = 0;
    let shouldDouble = false;
    for (let i = pan.length - 1; i >= 0; i--) {
      let digit = parseInt(pan.charAt(i), 10);
      if (shouldDouble) {
        digit *= 2;
        if (digit > 9) digit -= 9;
      }
      sum += digit;
      shouldDouble = !shouldDouble;
    }
    
    if (sum % 10 !== 0) {
      return { ruleId: this.id, action: RuleAction.BLOCK, reason: 'Card number failed Luhn checksum' };
    }
    return { ruleId: this.id, action: RuleAction.ALLOW };
  }
}

// Rule C: High-Value 3DS Challenge Trigger
export class HighValueChallengeRule implements SecurityRule {
  id = 'RULE_3DS_HIGH_VALUE';
  evaluate(context: TransactionContext): RuleResult {
    if (context.amount > 500.00) {
      return {
        ruleId: this.id,
        action: RuleAction.CHALLENGE,
        reason: `Amount exceeds frictionless threshold ($500). 3DS verification required.`,
      };
    }
    return { ruleId: this.id, action: RuleAction.ALLOW };
  }
}

// ============================================================================
// 3. Gateway Adapters Definition
// ============================================================================

export interface RequestAdapter {
  supports(body: any): boolean;
  parse(body: any): TransactionContext;
}

export class StripeAdapter implements RequestAdapter {
  supports(body: any): boolean {
    return body.payment_method_data?.card !== undefined;
  }
  parse(body: any): TransactionContext {
    const card = body.payment_method_data.card;
    return {
      id: body.id || 'stripe-tx',
      amount: body.amount / 100, // cents -> decimal
      currency: body.currency.toUpperCase(),
      card: {
        pan: card.number,
        expiryMonth: card.exp_month,
        expiryYear: card.exp_year,
        cvv: card.cvc,
      },
      device: {
        ipAddress: body.payment_method_data.billing_details?.ip || '0.0.0.0',
        userAgent: '',
        fingerprint: '',
        acceptHeader: '',
      }
    };
  }
}

export class AdyenAdapter implements RequestAdapter {
  supports(body: any): boolean {
    return body.paymentMethod && body.paymentMethod.type === 'scheme' && body.paymentMethod.cardNumber !== undefined;
  }
  parse(body: any): TransactionContext {
    const pm = body.paymentMethod;
    return {
      id: body.reference || 'adyen-tx',
      amount: body.amount.value / 100, // cents -> decimal
      currency: body.amount.currency.toUpperCase(),
      card: {
        pan: pm.cardNumber,
        expiryMonth: parseInt(pm.expiryMonth, 10),
        expiryYear: parseInt(pm.expiryYear, 10),
        cvv: pm.securityCode,
      },
      device: {
        ipAddress: body.browserInfo?.ipAddress || '0.0.0.0',
        userAgent: body.browserInfo?.userAgent || '',
        fingerprint: '',
        acceptHeader: '',
      }
    };
  }
}

export class BraintreeAdapter implements RequestAdapter {
  supports(body: any): boolean {
    return body.transaction && body.transaction.creditCard !== undefined;
  }
  parse(body: any): TransactionContext {
    const cc = body.transaction.creditCard;
    return {
      id: body.transaction.id || 'braintree-tx',
      amount: parseFloat(body.transaction.amount), // string -> float
      currency: body.transaction.currencyIsoCode || 'USD',
      card: {
        pan: cc.number,
        expiryMonth: parseInt(cc.expirationMonth, 10),
        expiryYear: parseInt(cc.expirationYear, 10),
        cvv: cc.cvv,
      },
      device: {
        ipAddress: body.transaction.ipAddress || '0.0.0.0',
        userAgent: '',
        fingerprint: '',
        acceptHeader: '',
      }
    };
  }
}

export class CheckoutAdapter implements RequestAdapter {
  supports(body: any): boolean {
    return body.source && body.source.type === 'card';
  }
  parse(body: any): TransactionContext {
    const src = body.source;
    return {
      id: body.reference || 'checkout-tx',
      amount: body.amount / 100, // cents -> decimal
      currency: body.currency.toUpperCase(),
      card: {
        pan: src.number,
        expiryMonth: src.expiry_month,
        expiryYear: src.expiry_year,
        cvv: src.cvv,
      },
      device: {
        ipAddress: body.ip || '0.0.0.0',
        userAgent: '',
        fingerprint: '',
        acceptHeader: '',
      }
    };
  }
}

export class AuthorizeNetAdapter implements RequestAdapter {
  supports(body: any): boolean {
    return body.transactionRequest && body.transactionRequest.payment?.creditCard !== undefined;
  }
  parse(body: any): TransactionContext {
    const tr = body.transactionRequest;
    const cc = tr.payment.creditCard;
    const [month, year] = cc.expirationDate.replace('/', '').match(/.{1,2}/g)?.map((s: string) => parseInt(s, 10)) || [0, 0];
    return {
      id: tr.refTxId || 'authorizenet-tx',
      amount: parseFloat(tr.amount), // string -> float
      currency: tr.currencyCode || 'USD',
      card: {
        pan: cc.cardNumber,
        expiryMonth: month,
        expiryYear: 2000 + year, // assume 20xx
        cvv: cc.cardCode,
      },
      device: {
        ipAddress: tr.customerIP || '0.0.0.0',
        userAgent: '',
        fingerprint: '',
        acceptHeader: '',
      }
    };
  }
}

// ============================================================================
// 4. Rules Engine Runner
// ============================================================================

export class CNPShieldEngine {
  private rules: SecurityRule[];
  private adapters: RequestAdapter[];

  constructor(rules: SecurityRule[]) {
    this.rules = rules;
    this.adapters = [
      new StripeAdapter(),
      new AdyenAdapter(),
      new BraintreeAdapter(),
      new CheckoutAdapter(),
      new AuthorizeNetAdapter(),
    ];
  }

  evaluateRawRequest(body: any): { allowed: boolean; action: RuleAction; reason?: string } {
    let context: TransactionContext | null = null;
    
    for (const adapter of this.adapters) {
      if (adapter.supports(body)) {
        context = adapter.parse(body);
        break;
      }
    }

    if (!context) {
      return { allowed: false, action: RuleAction.BLOCK, reason: 'Unsupported gateway request payload' };
    }

    const results = this.rules.map((r) => r.evaluate(context!));
    const blocks = results.filter((r) => r.action === RuleAction.BLOCK);
    const challenges = results.filter((r) => r.action === RuleAction.CHALLENGE);

    if (blocks.length > 0) {
      return { allowed: false, action: RuleAction.BLOCK, reason: blocks[0].reason };
    }
    if (challenges.length > 0) {
      return { allowed: false, action: RuleAction.CHALLENGE, reason: challenges[0].reason };
    }

    return { allowed: true, action: RuleAction.ALLOW };
  }
}

// ============================================================================
// 5. Test Verification Suites
// ============================================================================

describe('CNP Shield Gateway-Agnostic Engine PoC', () => {
  const engine = new CNPShieldEngine([
    new CvvEnforcementRule(),
    new LuhnCheckRule(),
    new HighValueChallengeRule(),
  ]);

  const VALID_PAN = '4111111111111111'; 
  const INVALID_PAN = '4111111111111112'; 

  it('should process and ALLOW standard valid Stripe payments', () => {
    const stripeReq = {
      amount: 2999,
      currency: 'usd',
      payment_method_data: {
        type: 'card',
        card: { number: VALID_PAN, exp_month: 12, exp_year: 2028, cvc: '123' },
      },
    };
    const result = engine.evaluateRawRequest(stripeReq);
    expect(result.allowed).toBe(true);
    expect(result.action).toBe(RuleAction.ALLOW);
  });

  it('should process and BLOCK Adyen payments failing the Luhn checksum', () => {
    const adyenReq = {
      amount: { value: 2999, currency: 'USD' },
      paymentMethod: {
        type: 'scheme',
        cardNumber: INVALID_PAN,
        expiryMonth: '12',
        expiryYear: '2028',
        securityCode: '123',
      },
    };
    const result = engine.evaluateRawRequest(adyenReq);
    expect(result.allowed).toBe(false);
    expect(result.action).toBe(RuleAction.BLOCK);
    expect(result.reason).toContain('Luhn checksum');
  });

  it('should process and CHALLENGE Braintree payments exceeding high-value limit', () => {
    const braintreeReq = {
      transaction: {
        id: 'br-tx-999',
        amount: '650.00',
        currencyIsoCode: 'USD',
        creditCard: { number: VALID_PAN, expirationMonth: '12', expirationYear: '2028', cvv: '123' },
      },
    };
    const result = engine.evaluateRawRequest(braintreeReq);
    expect(result.allowed).toBe(false);
    expect(result.action).toBe(RuleAction.CHALLENGE);
    expect(result.reason).toContain('frictionless threshold ($500)');
  });

  it('should process and BLOCK Checkout.com payments missing CVV', () => {
    const checkoutReq = {
      amount: 2999,
      currency: 'USD',
      source: {
        type: 'card',
        number: VALID_PAN,
        expiry_month: 12,
        expiry_year: 2028,
        cvv: '', 
      },
    };
    const result = engine.evaluateRawRequest(checkoutReq);
    expect(result.allowed).toBe(false);
    expect(result.action).toBe(RuleAction.BLOCK);
    expect(result.reason).toContain('CVV code is required');
  });

  it('should process and ALLOW Authorize.Net payments', () => {
    const authNetReq = {
      transactionRequest: {
        amount: '45.00',
        currencyCode: 'USD',
        payment: {
          creditCard: { cardNumber: VALID_PAN, expirationDate: '12/28', cardCode: '123' },
        },
      },
    };
    const result = engine.evaluateRawRequest(authNetReq);
    expect(result.allowed).toBe(true);
    expect(result.action).toBe(RuleAction.ALLOW);
  });
});
