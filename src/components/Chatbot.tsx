import { useState, type FormEvent, useRef, useEffect } from "react";

// Definimos los tipos de mensajes
interface Message {
  role: "user" | "model";
  parts: { text: string }[];
}

export default function Chatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Efecto para hacer scroll hacia abajo cuando llegan mensajes nuevos
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: Message = { role: "user", parts: [{ text: input }] };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      // Prepara el historial para la API (omite el primer mensaje de bienvenida de la IA si existe)
      const history = messages.filter(
        (msg, index) => !(index === 0 && msg.role === 'model')
      );

      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          history: history, // Envía el historial
          message: input,     // Envía el nuevo mensaje
        }),
      });

      if (!response.ok) {
        throw new Error("La respuesta de la API no fue exitosa");
      }

      const data = await response.json();
      const modelMessage: Message = { role: "model", parts: [{ text: data.text }] };
      setMessages((prev) => [...prev, modelMessage]);

    } catch (error) {
      console.error("Error al contactar la API:", error);
      const errorMessage: Message = {
        role: "model",
        parts: [{ text: "Lo siento, algo salió mal. Por favor, intenta de nuevo." }],
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  // Mensaje de bienvenida inicial
  useEffect(() => {
    setMessages([
      {
        role: "model",
        parts: [{ text: "¡Hola! Soy AlanBot, el asistente virtual de Alan. ¿Cómo puedo ayudarte hoy?" }],
      },
    ]);
  }, []);

  return (
    <>
      {/* Botón Flotante */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 bg-blue-600 text-white p-4 rounded-full shadow-lg hover:bg-blue-700 transition-transform duration-300 z-50"
        aria-label="Abrir chat"
      >
        {/* Icono de Chat (puedes usar un SVG) */}
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
      </button>

      {/* Ventana de Chat */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 w-80 h-[400px] bg-white shadow-2xl rounded-lg flex flex-col z-50">
          {/* Header */}
          <div className="bg-blue-600 text-white p-3 rounded-t-lg flex justify-between items-center">
            <h3 className="font-bold">Chat con AlanBot</h3>
            <button onClick={() => setIsOpen(false)} className="text-white">&times;</button>
          </div>

          {/* Área de Mensajes */}
          <div className="flex-1 p-4 overflow-y-auto bg-gray-50">
            {messages.map((msg, index) => (
              <div
                key={index}
                className={`my-2 p-3 rounded-lg max-w-[85%] ${
                  msg.role === "user"
                    ? "bg-blue-100 ml-auto"
                    : "bg-gray-200 mr-auto"
                }`}
              >
                {/* Usamos 'whitespace-pre-wrap' para respetar saltos de línea */}
                <p className="text-sm whitespace-pre-wrap">{msg.parts[0].text}</p>
              </div>
            ))}
            {/* Indicador de "Escribiendo..." */}
            {isLoading && (
              <div className="my-2 p-3 rounded-lg bg-gray-200 mr-auto">
                <p className="text-sm text-gray-500 italic">Escribiendo...</p>
              </div>
            )}
            {/* Referencia para auto-scroll */}
            <div ref={messagesEndRef} />
          </div>

          {/* Formulario de Envío */}
          <form onSubmit={handleSubmit} className="p-3 border-t bg-white rounded-b-lg">
            <div className="flex">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Escribe tu mensaje..."
                className="flex-1 border rounded-l-md p-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={isLoading}
              />
              <button
                type="submit"
                className="bg-blue-600 text-white px-4 rounded-r-md hover:bg-blue-700 disabled:bg-gray-400"
                disabled={isLoading}
              >
                Enviar
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}