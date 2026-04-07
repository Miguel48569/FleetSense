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
  // Backend: GET /api/vehicles
  const { data: vehicles = [] } = useQuery({
    queryKey: ["vehicles"],
    queryFn: vehiclesApi.list,
  });

  // Backend: GET /api/drivers
  const { data: drivers = [] } = useQuery({
    queryKey: ["drivers"],
    queryFn: driversApi.list,
  });

  // Backend: GET /api/trips
  const { data: trips = [] } = useQuery({
    queryKey: ["trips"],
    queryFn: tripsApi.list,
  });

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async (text) => {
    if (!text.trim()) return;

    const userMsg = { role: "user", content: text };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      // ── ROTA DA IA ───────────────────────────────────────
      // Backend: POST /api/ai/chat
      //
      // Esta chamada envia a mensagem do usuário + contexto da frota
      // para o backend de IA. O time de IA deve implementar esta rota.
      //
      // Ver documentação completa em: src/lib/api.js → aiApi.chat
      // ─────────────────────────────────────────────────────
      const result = await aiApi.chat({
        message: text,
        context: { vehicles, drivers, trips },
        history: messages.slice(-10), // últimas 10 mensagens como histórico
      });

      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: result.reply },
      ]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: `**Erro ao conectar com a IA:** ${err.message}\n\nVerifique se o backend está rodando e a variável \`VITE_API_URL\` está configurada no arquivo \`.env\`.`,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)]">
      <div className="mb-4">
        <h1 className="text-2xl font-bold tracking-tight">Chat com IA</h1>
        <p className="text-muted-foreground mt-1">
          Faça perguntas sobre sua frota em linguagem natural
        </p>
      </div>

      <Card className="flex-1 border-0 shadow-sm flex flex-col overflow-hidden">
        <CardContent className="flex-1 overflow-y-auto p-6 space-y-4">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
                <Bot className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Assistente de Frota</h3>
              <p className="text-sm text-muted-foreground mb-6 max-w-md">
                Pergunte qualquer coisa sobre seus veículos, motoristas, viagens
                e custos.
              </p>
              <div className="flex flex-wrap gap-2 justify-center max-w-lg">
                {SUGGESTIONS.map((s, i) => (
                  <button
                    key={i}
                    onClick={() => sendMessage(s)}
                    className="text-xs px-3 py-2 rounded-full border border-border hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((msg, i) => (
            <div
              key={i}
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
                className={`max-w-[75%] rounded-2xl px-4 py-3 ${
                  msg.role === "user"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted"
                }`}
              >
                {msg.role === "user" ? (
                  <p className="text-sm">{msg.content}</p>
                ) : (
                  <ReactMarkdown className="text-sm prose prose-sm max-w-none [&>*:first-child]:mt-0 [&>*:last-child]:mb-0">
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
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Bot className="w-4 h-4 text-primary" />
              </div>
              <div className="bg-muted rounded-2xl px-4 py-3">
                <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </CardContent>

        <div className="p-4 border-t">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              sendMessage(input);
            }}
            className="flex gap-3"
          >
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Faça uma pergunta sobre a frota..."
              className="flex-1"
              disabled={loading}
            />
            <Button type="submit" disabled={loading || !input.trim()}>
              <Send className="w-4 h-4" />
            </Button>
          </form>
        </div>
      </Card>
    </div>
  );
}
