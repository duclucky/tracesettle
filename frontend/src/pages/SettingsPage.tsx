import { connectedAddress } from "../domain/fixtures";

export function SettingsPage() {
  const contractAddress = import.meta.env.VITE_CONTRACT_ADDRESS;

  return (
    <section className="page">
      <div className="page-header">
        <span className="page-kicker">Connection truth</span>
        <h1>Wallet and network</h1>
        <p className="lead">
          TraceSettle uses Studionet and browser wallet signing. Private keys never belong
          in frontend code or public environment variables.
        </p>
      </div>

      <div className="grid two">
        <section className="panel stack">
          <h2>Connected wallet</h2>
          <p className="mono">{connectedAddress}</p>
          <p className="muted">Provider preference may be remembered locally; canonical state is not.</p>
        </section>
        <section className={`panel stack ${contractAddress ? "" : "danger-note"}`}>
          <h2>Contract address</h2>
          <p className="mono">{contractAddress || "Missing VITE_CONTRACT_ADDRESS"}</p>
          <p className="muted">
            Missing configuration is shown honestly until a Studionet deployment is verified.
          </p>
        </section>
      </div>
    </section>
  );
}
