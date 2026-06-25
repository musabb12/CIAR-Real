'use client';

import { Label } from '@/components/ui/label';
import { getPaymentFieldGroup, normalizePaymentMethodId } from '@/lib/payment-method-config';

export type SubscriptionPaymentForm = {
  cardName: string;
  cardNumber: string;
  cardExpiry: string;
  cardCvc: string;
  bankHolder: string;
  bankName: string;
  bankIban: string;
  bankReference: string;
  whishPhone: string;
  whishWalletId: string;
  prepaidCardNumber: string;
  prepaidPin: string;
  walletEmail: string;
};

export const emptySubscriptionPaymentForm = (): SubscriptionPaymentForm => ({
  cardName: '',
  cardNumber: '',
  cardExpiry: '',
  cardCvc: '',
  bankHolder: '',
  bankName: '',
  bankIban: '',
  bankReference: '',
  whishPhone: '',
  whishWalletId: '',
  prepaidCardNumber: '',
  prepaidPin: '',
  walletEmail: '',
});

type Tx = (ar: string, en: string) => string;

interface Props {
  method: string;
  form: SubscriptionPaymentForm;
  onChange: (patch: Partial<SubscriptionPaymentForm>) => void;
  tx: Tx;
}

function Field({
  id,
  label,
  value,
  onChange,
  placeholder,
  inputMode,
  type = 'text',
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  inputMode?: React.HTMLAttributes<HTMLInputElement>['inputMode'];
  type?: string;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id} className="text-white/70 text-sm">
        {label}
      </Label>
      <input
        id={id}
        type={type}
        className="auth-input w-full rounded-xl px-4 py-2.5 text-sm"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        inputMode={inputMode}
      />
    </div>
  );
}

function CardFields({
  form,
  onChange,
  tx,
  legend,
}: {
  form: SubscriptionPaymentForm;
  onChange: Props['onChange'];
  tx: Tx;
  legend: string;
}) {
  return (
    <fieldset className="space-y-4">
      <legend className="text-xs font-semibold uppercase tracking-wider text-amber-300/90 mb-1">
        {legend}
      </legend>
      <Field
        id="sub-card-name"
        label={tx('اسم حامل البطاقة', 'Cardholder name')}
        value={form.cardName}
        onChange={(v) => onChange({ cardName: v })}
        placeholder={tx('الاسم كما على البطاقة', 'Name on card')}
      />
      <Field
        id="sub-card-num"
        label={tx('رقم البطاقة', 'Card number')}
        value={form.cardNumber}
        onChange={(v) => onChange({ cardNumber: v })}
        placeholder="4242 4242 4242 4242"
        inputMode="numeric"
      />
      <div className="grid grid-cols-2 gap-4">
        <Field
          id="sub-exp"
          label={tx('انتهاء الصلاحية', 'Expiry')}
          value={form.cardExpiry}
          onChange={(v) => onChange({ cardExpiry: v })}
          placeholder="MM/YY"
        />
        <Field
          id="sub-cvc"
          label="CVC"
          value={form.cardCvc}
          onChange={(v) => onChange({ cardCvc: v })}
          placeholder="123"
          inputMode="numeric"
        />
      </div>
    </fieldset>
  );
}

export function SubscriptionPaymentFields({ method, form, onChange, tx }: Props) {
  const normalized = normalizePaymentMethodId(method);
  const group = getPaymentFieldGroup(method);

  if (group === 'card') {
    const legends: Record<string, [string, string]> = {
      visa: ['بيانات بطاقة فيزا', 'Visa card details'],
      mastercard: ['بيانات بطاقة ماستركارد', 'Mastercard details'],
      amex: ['بيانات أمريكان إكسبريس', 'American Express details'],
      mada: ['بيانات بطاقة مدى', 'mada card details'],
    };
    const [ar, en] = legends[normalized] ?? ['بيانات البطاقة', 'Card details'];
    return <CardFields form={form} onChange={onChange} tx={tx} legend={tx(ar, en)} />;
  }

  if (group === 'bank') {
    return (
      <fieldset className="space-y-4">
        <legend className="text-xs font-semibold uppercase tracking-wider text-amber-300/90 mb-1">
          {tx('بيانات التحويل البنكي', 'Bank transfer details')}
        </legend>
        <Field
          id="sub-bank-holder"
          label={tx('اسم صاحب الحساب', 'Account holder')}
          value={form.bankHolder}
          onChange={(v) => onChange({ bankHolder: v })}
        />
        <Field
          id="sub-bank-name"
          label={tx('اسم البنك', 'Bank name')}
          value={form.bankName}
          onChange={(v) => onChange({ bankName: v })}
        />
        <Field
          id="sub-bank-iban"
          label={tx('رقم الآيبان / الحساب', 'IBAN / account number')}
          value={form.bankIban}
          onChange={(v) => onChange({ bankIban: v })}
        />
        <Field
          id="sub-bank-ref"
          label={tx('مرجع التحويل', 'Transfer reference')}
          value={form.bankReference}
          onChange={(v) => onChange({ bankReference: v })}
          placeholder={tx('سيُستخدم لتأكيد الدفع', 'Used to confirm your payment')}
        />
        <p className="text-xs text-white/50 leading-relaxed rounded-xl border border-white/10 bg-white/5 p-3">
          {tx(
            'بعد الإرسال ستُفعَّل محاكاة الاشتراك فوراً. في الإنتاج الحقيقي سيُطابق المرجع مع كشف الحساب.',
            'After submit your subscription activates immediately in this demo. In production the reference is matched to your bank statement.',
          )}
        </p>
      </fieldset>
    );
  }

  if (group === 'whish') {
    return (
      <fieldset className="space-y-4">
        <legend className="text-xs font-semibold uppercase tracking-wider text-amber-300/90 mb-1">
          {tx('بيانات Whish Money', 'Whish Money details')}
        </legend>
        <Field
          id="sub-whish-phone"
          label={tx('رقم الهاتف المسجّل', 'Registered phone')}
          value={form.whishPhone}
          onChange={(v) => onChange({ whishPhone: v })}
          placeholder="+961 ..."
          inputMode="tel"
        />
        <Field
          id="sub-whish-wallet"
          label={tx('معرّف المحفظة', 'Wallet ID')}
          value={form.whishWalletId}
          onChange={(v) => onChange({ whishWalletId: v })}
        />
      </fieldset>
    );
  }

  if (group === 'prepaid') {
    return (
      <fieldset className="space-y-4">
        <legend className="text-xs font-semibold uppercase tracking-wider text-amber-300/90 mb-1">
          {tx('بطاقة CIAR المسبقة', 'CIAR prepaid card')}
        </legend>
        <Field
          id="sub-prepaid-num"
          label={tx('رقم البطاقة', 'Card number')}
          value={form.prepaidCardNumber}
          onChange={(v) => onChange({ prepaidCardNumber: v })}
          inputMode="numeric"
        />
        <Field
          id="sub-prepaid-pin"
          label={tx('رمز PIN', 'PIN code')}
          value={form.prepaidPin}
          onChange={(v) => onChange({ prepaidPin: v })}
          inputMode="numeric"
        />
      </fieldset>
    );
  }

  if (group === 'paypal') {
    return (
      <fieldset className="space-y-4">
        <legend className="text-xs font-semibold uppercase tracking-wider text-amber-300/90 mb-1">
          {tx('بيانات PayPal', 'PayPal details')}
        </legend>
        <Field
          id="sub-paypal-email"
          label={tx('بريد PayPal', 'PayPal email')}
          value={form.walletEmail}
          onChange={(v) => onChange({ walletEmail: v })}
          placeholder="you@email.com"
          type="email"
        />
      </fieldset>
    );
  }

  if (group === 'mobile-wallet') {
    const isApple = normalized === 'apple-pay';
    return (
      <fieldset className="space-y-4">
        <legend className="text-xs font-semibold uppercase tracking-wider text-amber-300/90 mb-1">
          {isApple
            ? tx('بيانات Apple Pay', 'Apple Pay details')
            : tx('بيانات Google Pay', 'Google Pay details')}
        </legend>
        <Field
          id="sub-wallet-email"
          label={tx('البريد المرتبط بالمحفظة', 'Wallet email')}
          value={form.walletEmail}
          onChange={(v) => onChange({ walletEmail: v })}
          placeholder="you@email.com"
          type="email"
        />
        <Field
          id="sub-wallet-phone"
          label={tx('رقم الهاتف المرتبط', 'Linked phone')}
          value={form.whishPhone}
          onChange={(v) => onChange({ whishPhone: v })}
          inputMode="tel"
        />
      </fieldset>
    );
  }

  if (group === 'stc') {
    return (
      <fieldset className="space-y-4">
        <legend className="text-xs font-semibold uppercase tracking-wider text-amber-300/90 mb-1">
          {tx('بيانات STC Pay', 'STC Pay details')}
        </legend>
        <Field
          id="sub-stc-phone"
          label={tx('رقم الجوال المسجّل في STC Pay', 'STC Pay registered mobile')}
          value={form.whishPhone}
          onChange={(v) => onChange({ whishPhone: v })}
          placeholder="+966 5..."
          inputMode="tel"
        />
        <Field
          id="sub-stc-wallet"
          label={tx('معرّف المحفظة (اختياري)', 'Wallet ID (optional)')}
          value={form.whishWalletId}
          onChange={(v) => onChange({ whishWalletId: v })}
        />
      </fieldset>
    );
  }

  return null;
}

export function validateSubscriptionPayment(
  method: string,
  form: SubscriptionPaymentForm,
  tx: Tx,
): string | null {
  const group = getPaymentFieldGroup(method);

  if (group === 'card') {
    if (!form.cardName.trim()) return tx('أدخل اسم حامل البطاقة', 'Enter cardholder name');
    if (form.cardNumber.replace(/\s/g, '').length < 12) return tx('أكمل رقم البطاقة', 'Complete card number');
    if (!form.cardExpiry.trim()) return tx('أدخل تاريخ الانتهاء', 'Enter expiry date');
    if (form.cardCvc.replace(/\s/g, '').length < 3) return tx('أدخل رمز CVC', 'Enter CVC');
    return null;
  }
  if (group === 'bank') {
    if (!form.bankHolder.trim()) return tx('أدخل اسم صاحب الحساب', 'Enter account holder');
    if (!form.bankName.trim()) return tx('أدخل اسم البنك', 'Enter bank name');
    if (!form.bankIban.trim()) return tx('أدخل رقم الحساب أو الآيبان', 'Enter IBAN or account');
    return null;
  }
  if (group === 'whish') {
    if (!form.whishPhone.trim()) return tx('أدخل رقم الهاتف', 'Enter phone number');
    if (!form.whishWalletId.trim()) return tx('أدخل معرّف المحفظة', 'Enter wallet ID');
    return null;
  }
  if (group === 'prepaid') {
    if (form.prepaidCardNumber.replace(/\s/g, '').length < 8) return tx('أدخل رقم البطاقة', 'Enter card number');
    if (form.prepaidPin.replace(/\s/g, '').length < 4) return tx('أدخل رمز PIN', 'Enter PIN');
    return null;
  }
  if (group === 'paypal') {
    if (!form.walletEmail.includes('@')) return tx('أدخل بريد PayPal صحيحاً', 'Enter a valid PayPal email');
    return null;
  }
  if (group === 'mobile-wallet') {
    if (!form.walletEmail.includes('@')) return tx('أدخل البريد المرتبط بالمحفظة', 'Enter wallet email');
    if (!form.whishPhone.trim()) return tx('أدخل رقم الهاتف', 'Enter phone number');
    return null;
  }
  if (group === 'stc') {
    if (!form.whishPhone.trim()) return tx('أدخل رقم الجوال', 'Enter mobile number');
    return null;
  }
  return tx('اختر طريقة دفع', 'Choose a payment method');
}
