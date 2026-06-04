// Projeto SENAC 2026 - FleetSense
import React, { useState, useRef, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Send, Bot, User, Loader2 } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { vehiclesApi, driversApi, tripsApi, aiApi } from "@/lib/api";

const SUGGESTIONS = [
  "Qual veículo tem maior consumo de combustível?",
  "Quais motoristas estão ativos?",
  "Qual o custo total das viagens este mês?",
  "Quantos veículos estão em manutenção?",
  "Qual a média de km por litro da frota?",
];

export default function Chat() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);

  // ── Buscar dados da frota para contexto da IA ────────────
  // Backend: GET /api/veiculos
  const { data: vehicles = [] } = useQuery({
    queryKey: ["vehicles"],
    queryFn: vehiclesApi.list,
  });

  // Backend: GET /api/motoristas
  const { data: drivers = [] } = useQuery({
    queryKey: ["drivers"],
    queryFn: driversApi.list,
  });

  // Backend: GET /api/viagens
  const { data: trips = [] } = useQuery({
    queryKey: ["trips"],
    queryFn: tripsApi.list,
  });

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    let mounted = true;

    const loadWelcomeMessage = async () => {
      try {
        const response = await aiApi.welcome();
        const welcomeText =
          response?.resposta ||
          response?.reply ||
          response?.mensagem ||
          response?.message ||
          response?.data?.resposta ||
          response?.data?.reply ||
          response?.data?.mensagem ||
          response?.data?.message ||
          "Olá! Como posso ajudar com a sua frota hoje?";

        if (mounted && welcomeText) {
          setMessages((prev) => (prev.length === 0 ? [buildMessage("assistant", formatAssistantText(welcomeText))] : prev));
        }
      } catch (error) {
        console.error("[Chat] Falha ao buscar mensagem inicial via GET /chat:", error);
      }
    };

    loadWelcomeMessage();

    return () => {
      mounted = false;
    };
  }, []);

  const buildMessage = (role, content) => ({
    id: window.crypto?.randomUUID
      ? window.crypto.randomUUID()
      : `${role}-${Date.now()}-${Math.random()}`,
    role,
    content,
  });

  const formatAssistantText = (rawContent) => {
    const initialText = typeof rawContent === "string" ? rawContent : `${rawContent ?? ""}`;
    if (!initialText.trim()) return "";

    let formatted = initialText.replace(/\r\n/g, "\n").trim();

    formatted = formatted.replace(/\{([^{}]+)\}/g, (match, inner) => {
      const pairs = inner
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean);

      const transformedPairs = pairs
        .map((pair) => {
          const [rawKey, rawValue] = pair.split(":");
          if (!rawKey || rawValue == null) return null;

          const key = rawKey.replace(/^['"]|['"]$/g, "").trim();
          const value = rawValue.replace(/^['"]|['"]$/g, "").trim();
          return key && value ? `${key} (${value})` : null;
        })
        .filter(Boolean);

      return transformedPairs.length > 0 ? transformedPairs.join(", ") : match;
    });

    formatted = formatted.replace(/Resumo geral do sistema\s*:/i, "**Resumo geral do sistema:**");

    const segments = formatted.split(/\s-\s/g).map((segment) => segment.trim()).filter(Boolean);
    if (segments.length > 1) {
      const [header, ...items] = segments;
      const lines = [header, ...items.map((item) => `- ${item}`)];
      formatted = lines.join("\n");
    }

    return formatted;
  };

  const extractAssistantContent = (response) =>
    response?.data?.resposta ||
    response?.data?.resumo ||
    response?.data?.reply ||
    response?.data?.message ||
    response?.data?.mensagem ||
    response?.resposta ||
    response?.reply ||
    response?.message ||
    response?.mensagem ||
    (typeof response === "string" ? response : "NÃ£o foi possÃ­vel ler a resposta do Chat IA.");

  const markdownComponents = {
    h1: ({ children }) => <h1 className="mb-3 text-lg font-bold tracking-tight text-slate-900">{children}</h1>,
    h2: ({ children }) => <h2 className="mb-2 text-base font-semibold text-slate-900">{children}</h2>,
    h3: ({ children }) => <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-700">{children}</h3>,
    p: ({ children }) => <p className="mb-3 leading-7 text-slate-700 last:mb-0">{children}</p>,
    strong: ({ children }) => <strong className="font-semibold text-slate-900">{children}</strong>,
    ul: ({ children }) => <ul className="mb-3 ml-5 list-disc space-y-2 text-slate-700 last:mb-0">{children}</ul>,
    ol: ({ children }) => <ol className="mb-3 ml-5 list-decimal space-y-2 text-slate-700 last:mb-0">{children}</ol>,
    li: ({ children }) => <li className="pl-1 leading-7">{children}</li>,
    blockquote: ({ children }) => (
      <blockquote className="mb-3 border-l-4 border-primary/30 bg-primary/5 px-4 py-3 text-slate-700 last:mb-0">
        {children}
      </blockquote>
    ),
    a: ({ children, href }) => (
      <a className="font-medium text-primary underline decoration-primary/30 underline-offset-4 transition-colors hover:decoration-primary" href={href} target="_blank" rel="noreferrer">
        {children}
      </a>
    ),
    code: ({ inline, children }) =>
      inline ? (
        <code className="rounded-md bg-slate-200/70 px-1.5 py-0.5 font-mono text-[0.85em] text-slate-900">{children}</code>
      ) : (
        <code className="block whitespace-pre-wrap rounded-xl bg-slate-950 px-4 py-3 font-mono text-sm text-slate-100 shadow-inner">{children}</code>
      ),
    pre: ({ children }) => <pre className="mb-3 overflow-x-auto rounded-xl bg-slate-950 p-4 text-sm text-slate-100 last:mb-0">{children}</pre>,
    table: ({ children }) => (
      <div className="mb-3 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm last:mb-0">
        <table className="w-full border-collapse text-left text-sm text-slate-700">{children}</table>
      </div>
    ),
    thead: ({ children }) => <thead className="bg-slate-100 text-slate-900">{children}</thead>,
    tr: ({ children }) => <tr className="border-b border-slate-200 last:border-b-0">{children}</tr>,
    th: ({ children }) => <th className="px-4 py-2.5 font-semibold">{children}</th>,
    td: ({ children }) => <td className="px-4 py-2.5 align-top">{children}</td>,
  };

  const getChatErrorMessage = (error) => {
    if (error?.status === 401) {
      return "Erro 401: Usuário não autenticado. Verifique se o token JWT expirou.";
    }

    if (error?.status === 403) {
      return "Erro 403: Acesso negado. Seu usuário não tem permissão para usar o Chat IA.";
    }

    if ([500, 502, 503, 504].includes(error?.status) || error?.status == null) {
      const serverDetail =
        error?.raw?.message ||
        error?.raw?.error ||
        error?.raw?.msg ||
        error?.message ||
        "Falha ao se comunicar com o servidor.";
      return `Erro no Servidor: ${serverDetail}`;
    }

    return error?.message || "Erro ao conectar com o Chat IA.";
  };

  const sendMessage = async (text) => {
    if (!text.trim()) return;

    const userMsg = buildMessage("user", text);
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      console.log("[Chat] Enviando mensagem para POST /chat:", { mensagem: text });
      const response = await aiApi.chat(text);
      console.log("Resposta do Backend no POST:", response);
      const assistantContent = formatAssistantText(extractAssistantContent(response));

      setMessages((prev) => [...prev, buildMessage("assistant", assistantContent)]);
    } catch (err) {
      const userMessage = getChatErrorMessage(err);
      console.error("[Chat] Falha ao chamar POST /chat:", {
        status: err?.status,
        message: err?.message,
        raw: err?.raw,
      });

      setMessages((prev) => [
        ...prev,
        buildMessage("assistant", userMessage),
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-full min-h-[70vh] flex-col">
      <div className="mb-4">
        <h1 className="text-xl font-bold tracking-tight sm:text-2xl">Chat com IA</h1>
        <p className="text-muted-foreground mt-1">
          Faça perguntas sobre sua frota em linguagem natural
        </p>
      </div>

      <Card className="flex-1 border-0 shadow-sm flex flex-col overflow-hidden">
        <CardContent className="flex-1 overflow-y-auto space-y-4 p-3 sm:p-6">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 sm:h-16 sm:w-16">
                <Bot className="h-7 w-7 text-primary sm:h-8 sm:w-8" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Assistente de Frota</h3>
              <p className="mb-6 max-w-md text-sm text-muted-foreground">
                Pergunte qualquer coisa sobre seus veículos, motoristas, viagens
                e custos.
              </p>
              <div className="flex max-w-lg flex-wrap justify-center gap-2">
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    onClick={() => sendMessage(s)}
                    className="rounded-full border border-border px-3 py-2 text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex gap-3 ${
                msg.role === "user" ? "justify-end" : "justify-start"
              }`}
            >
              {msg.role === "assistant" && (
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Bot className="w-4 h-4 text-primary" />
                </div>
              )}
              <div
                className={`max-w-[90%] rounded-2xl px-4 py-3 sm:max-w-[75%] ${
                  msg.role === "user"
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "border border-slate-200/80 bg-gradient-to-br from-white to-slate-50 text-slate-800 shadow-[0_10px_30px_rgba(15,23,42,0.06)]"
                }`}
              >
                {msg.role === "user" ? (
                  <p className="whitespace-pre-wrap text-sm leading-7">{msg.content}</p>
                ) : (
                  <ReactMarkdown
                    className="max-w-none break-words text-sm leading-7"
                    components={markdownComponents}
                  >
                    {msg.content}
                  </ReactMarkdown>
                )}
              </div>
              {msg.role === "user" && (
                <div className="w-8 h-8 rounded-lg bg-foreground/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <User className="w-4 h-4" />
                </div>
              )}
            </div>
          ))}

          {loading && (
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0 shadow-sm">
                <Bot className="w-4 h-4 text-primary" />
              </div>
              <div className="rounded-2xl border border-slate-200/80 bg-white px-4 py-3 shadow-sm">
                <Loader2 className="w-4 h-4 animate-spin text-slate-500" />
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </CardContent>

        <div className="border-t p-3 sm:p-4">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              sendMessage(input);
            }}
            className="flex gap-2 sm:gap-3"
          >
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Faça uma pergunta sobre a frota..."
              className="flex-1"
              disabled={loading}
            />
            <Button type="submit" disabled={loading || !input.trim()} className="h-10 w-10 shrink-0">
              <Send className="w-4 h-4" />
            </Button>
          </form>
        </div>
      </Card>
    </div>
  );
}
