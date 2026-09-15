import React from 'react';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Formik } from 'formik';
import ComboField, { filterOptions, normalize } from '../components/ui/ComboField';
import { I18nProvider } from '../i18n';
import { countryOptions } from '../data/countries';

const renderCombo = (props, initial = { nationality: '', langs: [] }) => {
  let values;
  render(
    <I18nProvider initialLang="en">
      <Formik initialValues={initial} onSubmit={() => {}}>
        {(f) => {
          values = f.values;
          return <ComboField {...props} />;
        }}
      </Formik>
    </I18nProvider>
  );
  return () => values;
};

describe('filterOptions', () => {
  const opts = countryOptions('en');
  it('is diacritic- and case-insensitive and ranks prefix matches first', () => {
    expect(normalize('Côte d’Ivoire')).toBe('cote d’ivoire');
    const { items } = filterOptions(opts, 'cote');
    expect(items[0].value).toBe('CI');
    const sing = filterOptions(opts, 'SING').items.map((o) => o.value);
    expect(sing[0]).toBe('SG');
  });
  it('searches English keywords and ISO codes', () => {
    expect(filterOptions(opts, 'TR').items.some((o) => o.value === 'TR')).toBe(true);
  });
  it('caps visible results and reports the total', () => {
    const r = filterOptions(opts, '');
    expect(r.items.length).toBeLessThanOrEqual(60);
    expect(r.total).toBe(opts.length);
  });
});

describe('ComboField (single)', () => {
  it('filters as you type and selects with the keyboard', async () => {
    const user = userEvent.setup();
    const getValues = renderCombo({ name: 'nationality', label: 'Nationality', options: countryOptions('en') });
    const input = screen.getByRole('combobox', { name: 'Nationality' });
    await user.type(input, 'singap');
    const list = screen.getByRole('listbox');
    expect(within(list).getByText('Singapore')).toBeInTheDocument();
    await user.keyboard('{Enter}');
    expect(getValues().nationality).toBe('SG');
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    expect(input).toHaveValue('Singapore');
  });

  it('selects with the mouse and can be cleared', async () => {
    const user = userEvent.setup();
    const getValues = renderCombo({ name: 'nationality', label: 'Nationality', options: countryOptions('en') });
    await user.type(screen.getByRole('combobox', { name: 'Nationality' }), 'japan');
    await user.click(screen.getByRole('option', { name: /Japan/ }));
    expect(getValues().nationality).toBe('JP');
    await user.click(screen.getByRole('button', { name: 'Clear' }));
    expect(getValues().nationality).toBe('');
  });

  it('shows "No matches" for nonsense input and closes on Escape', async () => {
    const user = userEvent.setup();
    renderCombo({ name: 'nationality', label: 'Nationality', options: countryOptions('en') });
    await user.type(screen.getByRole('combobox', { name: 'Nationality' }), 'zzzzqq');
    expect(screen.getByText('No matches')).toBeInTheDocument();
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  });
});

describe('ComboField (multi)', () => {
  const opts = [
    { value: 'en', label: 'English' },
    { value: 'fr', label: 'French' },
    { value: 'de', label: 'German' },
  ];

  it('adds chips, hides chosen options, removes with Backspace and respects max', async () => {
    const user = userEvent.setup();
    const getValues = renderCombo({ name: 'langs', label: 'Languages', options: opts, multi: true, max: 2 });
    const input = screen.getByRole('combobox', { name: 'Languages' });
    await user.type(input, 'eng');
    await user.keyboard('{Enter}');
    expect(getValues().langs).toEqual(['en']);
    await user.type(input, 'fre');
    await user.keyboard('{Enter}');
    expect(getValues().langs).toEqual(['en', 'fr']);
    expect(input).toBeDisabled(); // max reached
    expect(screen.getByRole('button', { name: 'Remove French' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Remove French' }));
    expect(getValues().langs).toEqual(['en']);
    await user.click(input);
    const list = screen.getByRole('listbox');
    expect(within(list).queryByText('English')).not.toBeInTheDocument();
    await user.keyboard('{Backspace}');
    expect(getValues().langs).toEqual([]);
  });
});
