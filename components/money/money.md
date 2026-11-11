---
name: money
title: Money
summary: An amount in minor units and its currency code, shown in that currency's own places, short, signed, several currencies side by side, and read back from a form.
parts: [behavior]
tool: own JavaScript
states: []
added: 0.102.0
source: Foxhound's app/lib/money-format.ts (the canonical copy), its settings dollars helpers and wrappers, and txasm's app/lib/format.ts (which divided every currency by 100)
replaces:
  - 'function (formatMoney|formatMoneyShort|formatAmounts|toMajorUnits|fromMajorUnits|currencyExponent|signedMoney|parseDollarsToCents|centsToDollarsInput|formatCentsAsDollars)\('
---

# Money

`capsomer/behavior/money`: plain functions with no DOM. Every amount is an integer in minor units with an ISO 4217 code, the way Stripe and the sites' databases store it.

## The default and its reason

- **Each currency keeps its own places.** The places follow [Stripe's minor-unit table](https://docs.stripe.com/currencies#zero-decimal): JPY and the other zero-decimal currencies are stored whole ("¥5,000" from 5000), BHD, JOD, KWD, OMR and TND in thousandths ("KWD 12.345" from 12345), ISK and UGX are sent as hundredths and shown whole, and every other code has two. Dividing every currency by 100 shows a yen amount as a hundredth of itself.
- **`formatMoney(minor, currency)`** is the exact amount: "$1,234.56", "-$45.00". The locale is en-US, the network's one.
- **`formatMoneyShort`** rounds to whole units ("$11" from 1060 cents) for a tile or an axis. **`signedMoney`** always writes the sign of a change ("+$120", "-$45", "+$0").
- **`formatAmounts(rows, { short, empty })`** shows totals in several currencies side by side ("$1,200.00 · €80.00"), each in its own. They are never summed across currencies, and no rows reads as zero in `empty` (USD by default).
- **A malformed code is shown, never thrown**: "50.00 US", so a bad row cannot take a page down.
- **`parseMoneyInput(raw, currency)`** reads what a person typed into minor units in that currency, allowing grouping commas and a leading symbol; blank, not a number or below zero is `null`, so the form says so. `plainMajorAmount` is the field's value back ("50.00", "5000"), and the figure for a CSV cell.
- `toMajorUnits`, `fromMajorUnits`, `currencyExponent` and `byCurrencyCode` are the parts underneath.

## What it does not do

- Fees, caps and rounding rules for a charge (Foxhound's basis-point fees, Stripe's multiple-of-10 rule for three-decimal amounts) are the site's billing logic. It imports `currencyExponent` from here.
- Percents and basis points: [number words](../format/format.md).
