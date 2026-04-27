// src/components/article/disclosure-box.tsx
// Hardcoded FCA-style disclosure. Auto-rendered at the end of every
// article body so writers can't accidentally omit it. See plan §4.3.

export function DisclosureBox() {
  return (
    <div className="disclosure">
      <strong>Disclosure.</strong> This article is for general information
      only. It is not financial advice, investment advice, or a recommendation
      to buy or sell any security. Price and company data are indicative and
      may be delayed. Past performance is not a reliable indicator of future
      results. Capital at risk. Business Fortitude is not authorised or
      regulated by the Financial Conduct Authority.
    </div>
  );
}
