import { connectedAddress } from "../domain/fixtures";

function shorten(address: string) {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export function WalletStatus() {
  const hasContractAddress = Boolean(import.meta.env.VITE_CONTRACT_ADDRESS);

  return (
    <div className="wallet-status" aria-label="Wallet and network status">
      <span className="status-dot" aria-hidden="true" />
      <span>Studionet</span>
      <span className="mono">{shorten(connectedAddress)}</span>
      {!hasContractAddress && <span>No deployed address yet</span>}
    </div>
  );
}
