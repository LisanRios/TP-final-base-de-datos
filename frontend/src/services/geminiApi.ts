/**
 * Función que llama al backend para obtener la respuesta del chat.
 * @param {string} query La consulta del usuario.
 * @returns {Promise<{response: string}>} La respuesta de la IA.
 */
/**
 * Llama al backend para obtener la respuesta del chat.
 * En desarrollo apunta a http://localhost:3001/api/chat; en producción
 * asume el path relativo `/api/chat` (puedes ajustar según despliegue).
 */
export const fetchChatResponse = async (query: string): Promise<{response: string}> => {
    const trimmed = query?.toString() || "";
    if (!trimmed.trim()) throw new Error('Query vacía');

    // Usar localhost en desarrollo, path relativo en producción
    const url = process.env.NODE_ENV === 'development' ? 'http://localhost:3001/api/chat' : '/api/chat';

    try {
        const res = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ query: trimmed })
        });

        // Intentar parsear JSON (backend devuelve { response })
        const data = await res.json().catch(() => null);

        if (!res.ok) {
            const errDetail = data?.error || data || res.statusText;
            throw new Error(typeof errDetail === 'string' ? errDetail : JSON.stringify(errDetail));
        }

        if (!data || typeof data.response !== 'string') {
            throw new Error('Respuesta inválida desde el backend');
        }

        return { response: data.response };
    } catch (err) {
        // Propagar el error para que el frontend lo maneje (Chat.tsx ya muestra mensajes amigables)
        console.error('Error en fetchChatResponse:', err);
        throw err;
    }
};