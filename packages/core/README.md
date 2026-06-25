# @bid-ai/core

Open-source core of the Bid AI platform - analysis engine and UI components.

## Features

- **UI Components**: Glass morphism design system (GlassCard, ScoreGauge, RiskBadge)
- **Document Parsers**: PDF, Word, Excel parsing with table extraction
- **Utility Functions**: Date formatting, currency formatting, risk level helpers
- **Type Definitions**: Complete TypeScript types for bid analysis

## Installation

```bash
npm install @bid-ai/core
```

## Usage

```tsx
import { GlassCard, ScoreGauge, RiskBadge } from '@bid-ai/core';
import { parseFile } from '@bid-ai/core';
import { formatDate, formatCurrency } from '@bid-ai/core';

function MyComponent() {
  return (
    <GlassCard>
      <ScoreGauge score={85} />
      <RiskBadge level="low" />
    </GlassCard>
  );
}
```

## Components

### GlassCard
Glass morphism card container with hover effects.

```tsx
<GlassCard hover={true} className="custom-class">
  {children}
</GlassCard>
```

### ScoreGauge
SVG ring gauge for displaying scores (0-100).

```tsx
<ScoreGauge score={75} size="md" showLabel={true} />
```

### RiskBadge
Risk level indicator with color coding.

```tsx
<RiskBadge level="high" label="Custom Label" />
```

## Parsers

### parseFile
Parse PDF, Word, or Excel files and extract content + tables.

```tsx
const result = await parseFile(file);
// { title, content, tables, metadata }
```

## Utilities

- `cn()` - Merge Tailwind CSS classes
- `formatDate()` - Format dates to Chinese locale
- `formatCurrency()` - Format numbers to CNY
- `getDaysRemaining()` - Calculate days until deadline
- `getRiskLevelColor()` - Get color classes for risk levels

## License

MIT License - see [LICENSE](./LICENSE)

## Contributing

Contributions are welcome! Please read our contributing guidelines first.

## Related Packages

- `@bid-ai/saas` - Enterprise features (authentication, payment, AI services)
