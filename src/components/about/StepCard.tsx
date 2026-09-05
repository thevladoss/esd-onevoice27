import { GlassCard } from "../layout/GlassCard";

export interface StepCardProps {
  number: 1 | 2 | 3;
  title: string;
  items: readonly string[];
  summary: string;
}

export function StepCard({ number, title, items, summary }: StepCardProps) {
  return (
    <GlassCard className="ab-step">
      <div className="ab-step-head flex items-center gap-2">
        <span className="ab-step-num">{number}</span>
        <h3 className="ab-step-title">{title}</h3>
      </div>
      <ul className="ab-step-list">
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
      <hr className="ab-step-rule" />
      <p className="ab-step-summary">{summary}</p>
    </GlassCard>
  );
}
