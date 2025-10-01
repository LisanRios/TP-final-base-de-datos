/**
 * Función que llama al backend para obtener la respuesta del chat.
 * @param {string} query La consulta del usuario.
 * @returns {Promise<{response: string}>} La respuesta de la IA.
 */
export const fetchChatResponse = async (query: string): Promise<{response: string}> => {
    const response = await fetch('http://localhost:3001/api/chat', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ query })
    });

    if (!response.ok) {
        throw new Error('Error fetching response');
    }

    return await response.json();
};
