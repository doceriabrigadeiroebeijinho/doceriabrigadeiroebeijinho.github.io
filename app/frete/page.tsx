"use client";

import { useState } from "react";

const money = (value: number) =>
  new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);

export default function FretePage() {
  const [address, setAddress] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [error, setError] = useState("");
  const [result, setResult] = useState<{
    fee: number;
    oneWayKm: number;
    roundTripKm: number;
    locatedAddress?: string;
  } | null>(null);

  const calculate = async () => {
    if (!address.trim()) {
      setStatus("error");
      setError("Cole ou digite o endereço completo.");
      return;
    }

    setStatus("loading");
    setError("");
    setResult(null);

    try {
      const response = await fetch("/api/shipping-address", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ address }),
      });
      const data = (await response.json()) as {
        fee?: number;
        oneWayKm?: number;
        roundTripKm?: number;
        locatedAddress?: string;
        error?: string;
      };

      if (
        !response.ok ||
        typeof data.fee !== "number" ||
        typeof data.oneWayKm !== "number" ||
        typeof data.roundTripKm !== "number"
      ) {
        throw new Error(data.error || "Não foi possível calcular a entrega.");
      }

      setResult({
        fee: data.fee,
        oneWayKm: data.oneWayKm,
        roundTripKm: data.roundTripKm,
        locatedAddress: data.locatedAddress,
      });
      setStatus("success");
    } catch (err) {
      setStatus("error");
      setError(err instanceof Error ? err.message : "Não foi possível calcular a entrega.");
    }
  };

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#fffaf8",
        padding: "32px 18px",
        fontFamily: "Arial, sans-serif",
        color: "#2c2523",
      }}
    >
      <section
        style={{
          width: "min(680px, 100%)",
          margin: "0 auto",
          background: "white",
          border: "1px solid #eadfdb",
          borderRadius: 24,
          padding: 28,
          boxShadow: "0 12px 34px rgba(70, 45, 35, 0.08)",
        }}
      >
        <a
          href="/"
          style={{ color: "#7a5148", textDecoration: "none", fontSize: 14 }}
        >
          ← Voltar ao site
        </a>

        <div style={{ marginTop: 22 }}>
          <span
            style={{
              fontSize: 12,
              textTransform: "uppercase",
              letterSpacing: 1.4,
              color: "#a06c60",
              fontWeight: 700,
            }}
          >
            Ferramenta da doceria
          </span>
          <h1 style={{ fontSize: 30, margin: "8px 0 10px" }}>
            Calcular entrega pelo endereço
          </h1>
          <p style={{ lineHeight: 1.6, margin: 0, color: "#665a56" }}>
            Não precisa de CEP. Cole o endereço que a cliente enviou e calcule a
            taxa considerando ida + volta a R$ 1,00 por km.
          </p>
        </div>

        <label
          style={{ display: "block", marginTop: 26, fontWeight: 700, fontSize: 14 }}
        >
          Endereço completo
          <textarea
            value={address}
            onChange={(event) => {
              setAddress(event.target.value);
              setStatus("idle");
              setError("");
              setResult(null);
            }}
            rows={4}
            placeholder="Ex.: Avenida Warley Aparecido Martins, 971, Solar do Barreiro, Belo Horizonte - MG"
            style={{
              width: "100%",
              boxSizing: "border-box",
              marginTop: 8,
              border: "1px solid #d9cbc6",
              borderRadius: 14,
              padding: 14,
              font: "inherit",
              resize: "vertical",
              outline: "none",
            }}
          />
        </label>

        <button
          type="button"
          onClick={calculate}
          disabled={status === "loading"}
          style={{
            width: "100%",
            marginTop: 14,
            border: 0,
            borderRadius: 14,
            padding: "14px 18px",
            background: "#6f4339",
            color: "white",
            fontWeight: 700,
            fontSize: 16,
            cursor: status === "loading" ? "wait" : "pointer",
            opacity: status === "loading" ? 0.7 : 1,
          }}
        >
          {status === "loading" ? "Calculando..." : "Calcular entrega"}
        </button>

        {status === "error" && (
          <p
            style={{
              marginTop: 16,
              padding: 12,
              borderRadius: 12,
              background: "#fff0ed",
              color: "#8c3527",
            }}
          >
            {error}
          </p>
        )}

        {status === "success" && result && (
          <div
            style={{
              marginTop: 22,
              padding: 20,
              border: "1px solid #e2d2cc",
              borderRadius: 18,
              background: "#fffaf8",
            }}
          >
            <span style={{ fontSize: 13, color: "#776863" }}>Taxa de entrega</span>
            <strong
              style={{
                display: "block",
                fontSize: 36,
                marginTop: 4,
                color: "#5d382f",
              }}
            >
              {money(result.fee)}
            </strong>
            <div style={{ marginTop: 14, lineHeight: 1.7, color: "#665a56" }}>
              <div>Ida: {result.oneWayKm.toFixed(2)} km</div>
              <div>Ida + volta: {result.roundTripKm.toFixed(2)} km</div>
            </div>
            {result.locatedAddress && (
              <p
                style={{
                  margin: "14px 0 0",
                  paddingTop: 14,
                  borderTop: "1px solid #eadfdb",
                  fontSize: 13,
                  lineHeight: 1.5,
                  color: "#776863",
                }}
              >
                <strong>Endereço localizado:</strong> {result.locatedAddress}
              </p>
            )}
          </div>
        )}

        <p style={{ fontSize: 12, lineHeight: 1.5, color: "#8a7b76", marginTop: 18 }}>
          Antes de confirmar uma taxa, confira o “endereço localizado” exibido no
          resultado para garantir que o mapa encontrou a rua correta.
        </p>
      </section>
    </main>
  );
}
