/**
 * Servicio responsable de manejar la comunicación del chat con el backend.
 * Permite centralizar la lógica de red y mantener el componente Chat limpio.
 */
export const chatService = {
    /**
     * Envía una consulta al backend del chat.
     * @param query Texto del usuario.
     * @returns Respuesta del modelo o un error.
     */
    async sendMessage(query: string): Promise<{ response: string }> {
        const trimmed = query?.toString() || "";
        if (!trimmed.trim()) throw new Error("Consulta vacía");
    
        const url =
            process.env.NODE_ENV === "development"
            ? "http://localhost:3001/api/chat"
            : "/api/chat";
    
        try {
            const res = await fetch(url, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ query: trimmed }),
            });

            const data = await res.json().catch(() => null);
    
            if (!res.ok) {
                const errDetail = data?.error || data || res.statusText;
                throw new Error(
                    typeof errDetail === "string"
                    ? errDetail
                    : JSON.stringify(errDetail)
                );
            }

            if (!data || typeof data.response !== "string") {
                throw new Error("Respuesta inválida desde el backend");
            }

            return { response: data.response };
        } catch (err) {
            console.error("Error en chatService.sendMessage:", err);
            throw err;
        }
    },
};
