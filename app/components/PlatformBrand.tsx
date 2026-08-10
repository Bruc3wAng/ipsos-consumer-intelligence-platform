export default function PlatformBrand({ compact = false }: { compact?: boolean }) {
  return (
    <div className={`platform-brand ${compact ? "platform-brand-compact" : ""}`}>
      <img src="/ipsos-logo.png" alt="Ipsos" width="56" height="51" />
      <div>
        <strong>Ipsos Intelligence Foundry</strong>
        <span>消费者模型与决策中台</span>
      </div>
    </div>
  );
}
