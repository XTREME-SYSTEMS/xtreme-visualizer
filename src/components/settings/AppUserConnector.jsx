import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Loader2, Check, Unlink } from "lucide-react";

/**
 * Lets an app user connect/disconnect their own account for a given
 * app-user connector. Connection status is detected by calling `checkFn`
 * (a backend function that uses the connector) — succeeds = connected.
 */
export default function AppUserConnector({
  connectorId,
  icon: Icon,
  label,
  description,
  checkFn,
  user,
}) {
  const [connected, setConnected] = useState(false);
  const [checking, setChecking] = useState(true);
  const [busy, setBusy] = useState(false);

  const check = async () => {
    setChecking(true);
    try {
      await checkFn();
      setConnected(true);
    } catch {
      setConnected(false);
    } finally {
      setChecking(false);
    }
  };

  useEffect(() => {
    if (user) check();
    else setChecking(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const connect = async () => {
    setBusy(true);
    try {
      const url = await base44.connectors.connectAppUser(connectorId);
      const popup = window.open(url, "_blank");
      const timer = setInterval(() => {
        if (!popup || popup.closed) {
          clearInterval(timer);
          check();
          setBusy(false);
        }
      }, 500);
    } catch {
      setBusy(false);
    }
  };

  const disconnect = async () => {
    setBusy(true);
    try {
      await base44.connectors.disconnectAppUser(connectorId);
      setConnected(false);
    } finally {
      setBusy(false);
    }
  };

  if (checking) {
    return (
      <div className="flex items-center gap-2 text-[12px] text-[var(--vx-muted)]">
        <Loader2 className="w-4 h-4 animate-spin" /> Checking connection…
      </div>
    );
  }

  if (!user) {
    return (
      <div className="space-y-3">
        <p className="text-[13px] text-[var(--vx-muted)]">Sign in to connect your {label}.</p>
        <Button onClick={() => (/** @type {any} */ (base44.auth)).redirectToLogin()}>Sign in</Button>
      </div>
    );
  }

  if (connected) {
    return (
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="w-8 h-8 rounded-full bg-emerald-50 grid place-items-center">
            <Check className="w-4 h-4 text-emerald-600" />
          </span>
          <div>
            <p className="text-[13px] font-medium text-[var(--vx-text)]">{label} connected</p>
            <p className="text-[12px] text-[var(--vx-muted)]">{user.email}</p>
          </div>
        </div>
        <Button variant="outline" size="sm" disabled={busy} onClick={disconnect}>
          {busy ? <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> : <Unlink className="w-3.5 h-3.5 mr-1.5" />}
          Disconnect
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-[13px] text-[var(--vx-muted)]">{description}</p>
      <Button disabled={busy} onClick={connect}>
        {busy ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Icon className="w-4 h-4 mr-2" />}
        Connect {label}
      </Button>
    </div>
  );
}