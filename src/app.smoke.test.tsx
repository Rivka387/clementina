// @vitest-environment jsdom
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { expect, it } from 'vitest';
import App from './App';
import { loadDemo } from './data';

// jsdom does not implement the native dialog methods used by the food drawer.
HTMLDialogElement.prototype.showModal ??= function () {
  this.open = true;
};
HTMLDialogElement.prototype.close ??= function () {
  this.open = false;
};

it('renders a visible local page with the configured Supabase project', async () => {
  window.history.replaceState({}, '', '/');
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
  const host = document.createElement('div');
  document.body.append(host);
  const root = createRoot(host);
  try {
    await act(async () => {
      root.render(<App />);
    });
    expect(host.textContent).toContain('איזה כיף שחזרת');
    expect(host.querySelector('input[type="email"]')).not.toBeNull();
    const password = host.querySelector<HTMLInputElement>('#auth-password')!;
    const reveal = host.querySelector<HTMLButtonElement>('[aria-label="הצגת הסיסמה"]')!;
    expect(reveal.type).toBe('button');
    expect(password.type).toBe('password');
    await act(async () => {
      Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!.call(
        password,
        'example-password',
      );
      password.dispatchEvent(new Event('input', { bubbles: true }));
    });
    let submits = 0;
    host.querySelector('form')!.addEventListener('submit', () => submits++);
    await act(async () => reveal.click());
    expect(password.type).toBe('text');
    expect(password.value).toBe('example-password');
    expect(reveal.getAttribute('aria-label')).toBe('הסתרת הסיסמה');
    expect(reveal.getAttribute('aria-pressed')).toBe('true');
    await act(async () => reveal.click());
    expect(password.type).toBe('password');
    expect(password.value).toBe('example-password');
    await act(async () => reveal.click());
    const signup = [...host.querySelectorAll('button')].find((button) =>
      button.textContent?.includes('אין לך חשבון? הרשמה'),
    )!;
    await act(async () => signup.click());
    expect(password.type).toBe('password');
    expect(password.autocomplete).toBe('new-password');
    await act(async () => reveal.click());
    expect(password.type).toBe('text');
    expect(password.value).toBe('example-password');
    expect(submits).toBe(0);
  } finally {
    await act(async () => {
      root.unmount();
    });
    host.remove();
  }
});

it('opens the sample dashboard on demand even when Supabase is configured', async () => {
  window.history.replaceState({}, '', '/?demo=1#today');
  localStorage.clear();
  const host = document.createElement('div');
  document.body.append(host);
  const root = createRoot(host);
  try {
    await act(async () => {
      root.render(<App />);
    });
    expect(host.textContent).toContain('מצב הדגמה');
    expect(host.textContent).toContain('היום שלי');
    expect(host.querySelectorAll('.overview-cards .summary-card')).toHaveLength(4);
    expect(host.textContent).toContain('כמות וקלוריות רק אם תרצי');
    expect(host.querySelector('.food-list')).toBeNull();
    expect(host.textContent).toContain('תכנון הארוחות שלי');
    const openFood = host.querySelector<HTMLButtonElement>('.food-diary-open');
    expect(openFood?.textContent).toContain('פתיחת היומן');
    await act(async () => {
      openFood!.click();
    });
    expect(host.querySelector('dialog.food-drawer')?.hasAttribute('open')).toBe(true);
    expect(host.querySelectorAll('.food-list li')).toHaveLength(2);
    const addFood = [...host.querySelectorAll('button')].find((button) =>
      button.textContent?.includes('הוספת ארוחה או נשנוש'),
    );
    expect(addFood).toBeDefined();
    await act(async () => {
      addFood!.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });
    expect(host.querySelector('input[placeholder="לדוגמה: אורז, עדשים וסלט"]')).not.toBeNull();
    const closeFood = host.querySelector<HTMLButtonElement>('[aria-label="סגירת יומן האכילה"]');
    await act(async () => {
      closeFood!.click();
    });
    expect(host.querySelector('dialog.food-drawer')).toBeNull();
    expect(document.activeElement).toBe(openFood);
    expect(host.textContent).toContain('נותרו 5 כוסות ליעד');
    expect(host.textContent).toContain('איזה כיף שאנחנו עושות את זה יחד');
    expect(host.querySelector('a[href="/"]')).not.toBeNull();
    const addWater = [...host.querySelectorAll('button')].find((button) =>
      button.textContent?.includes('הוספת כוס'),
    );
    expect(addWater).toBeDefined();
    await act(async () => {
      addWater!.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });
    expect(host.textContent).toContain('נותרו 4 כוסות ליעד');
    expect(host.querySelector('.water-card .metric-value')?.textContent).toContain('4');
  } finally {
    await act(async () => {
      root.unmount();
    });
    host.remove();
    window.history.replaceState({}, '', '/');
  }
});

it('shows an accessible week of energy reports in the progress view', async () => {
  window.history.replaceState({}, '', '/?demo=1#progress');
  localStorage.clear();
  const host = document.createElement('div');
  document.body.append(host);
  const root = createRoot(host);
  try {
    await act(async () => {
      root.render(<App />);
    });
    expect(host.textContent).toContain('איך הרגשתי השבוע?');
    expect(host.querySelectorAll('.energy-trend-chart li')).toHaveLength(7);
  } finally {
    await act(async () => {
      root.unmount();
    });
    host.remove();
    window.history.replaceState({}, '', '/');
  }
});

it('edits a food diary record and can then clear its optional amount', async () => {
  window.history.replaceState({}, '', '/?demo=1#today');
  localStorage.clear();
  const host = document.createElement('div');
  document.body.append(host);
  const root = createRoot(host);
  try {
    await act(async () => {
      root.render(<App />);
    });
    await act(async () => {
      host.querySelector<HTMLButtonElement>('.food-diary-open')!.click();
    });
    const edit = host.querySelector<HTMLButtonElement>(
      'button[aria-label="עריכת ארוחת בוקר בשעה 08:30"]',
    );
    expect(edit).not.toBeNull();
    await act(async () => {
      edit!.click();
    });
    const amount = host.querySelector<HTMLInputElement>(
      '.food-form input[placeholder="למשל: צלחת אחת או 2 פרוסות"]',
    );
    expect(amount).not.toBeNull();
    expect(amount?.required).toBe(false);
    const calories = host.querySelector<HTMLInputElement>('.food-form input[type="number"]');
    expect(calories?.value).toBe('');
    await act(async () => {
      Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!.call(
        amount,
        'שתי קערות',
      );
      amount!.dispatchEvent(new Event('input', { bubbles: true }));
      Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!.call(
        calories,
        '420',
      );
      calories!.dispatchEvent(new Event('input', { bubbles: true }));
    });
    const form = host.querySelector<HTMLFormElement>('.food-form');
    await act(async () => {
      form!.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    });
    expect(host.querySelector('.food-list')?.textContent).toContain('שתי קערות');
    expect(host.querySelector('.food-list')?.textContent).toContain('420 קלוריות');
    expect(loadDemo().food_entries.find((item) => item.food.includes('יוגורט'))?.amount).toBe(
      'שתי קערות',
    );
    expect(loadDemo().food_entries.find((item) => item.food.includes('יוגורט'))?.calories).toBe(
      420,
    );
    await act(async () => {
      host
        .querySelector<HTMLButtonElement>('button[aria-label="עריכת ארוחת בוקר בשעה 08:30"]')!
        .click();
    });
    const amountAgain = host.querySelector<HTMLInputElement>(
      '.food-form input[placeholder="למשל: צלחת אחת או 2 פרוסות"]',
    )!;
    await act(async () => {
      Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!.call(
        amountAgain,
        '',
      );
      amountAgain.dispatchEvent(new Event('input', { bubbles: true }));
    });
    expect(host.querySelector<HTMLButtonElement>('.food-form-actions .primary')?.disabled).toBe(
      false,
    );
    await act(async () => {
      host
        .querySelector<HTMLFormElement>('.food-form')!
        .dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    });
    expect(loadDemo().food_entries.find((item) => item.food.includes('יוגורט'))?.amount).toBe('');
    expect(host.querySelector('.food-list .food-description small')?.textContent).toBe(
      '420 קלוריות',
    );
  } finally {
    await act(async () => {
      root.unmount();
    });
    host.remove();
    window.history.replaceState({}, '', '/');
  }
});
