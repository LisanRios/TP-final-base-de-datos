/**
 * Servicio responsable de manejar la comunicación del chat con el backend.
 * Permite centralizar la lógica de red y mantener el componente Chat limpio.
 */

export type PriceLinePoint = {
    date: string;
    price: number;
    sma50?: number | null;
    sma200?: number | null;
};

export type PriceCandlePoint = {
    date: string;
    open: number;
    high: number;
    low: number;
    close: number;
};

export type ValuePoint = {
    date: string;
    value: number;
};

export type EstadoTimeseries = {
    priceLine?: PriceLinePoint[];
    priceCandle?: PriceCandlePoint[];
    returns?: ValuePoint[];
    drawdowns?: ValuePoint[];
    volume?: ValuePoint[];
};

export type EstadoReport = {
    company: string;
    generatedAt: string;
    summaryText: string;
    metrics: {
        timeseries?: EstadoTimeseries;
        [key: string]: unknown;
    };
    aiAnalysis?: {
        past: string;
        present: string;
        future: string;
        conclusion: string;
    } | null;
};

export const slugifyCompany = (input: string): string =>
    input
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9-\s]/g, "")
        .trim()
        .replace(/\s+/g, "-");

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

                // Detectar rate-limit upstream (429) y devolver mensaje amigable
                const isRateLimit = (errDetail && typeof errDetail === 'object' && (
                    errDetail.code === 429 ||
                    errDetail?.metadata?.raw?.toString().toLowerCase().includes('rate') ||
                    errDetail?.message?.toString().toLowerCase().includes('rate')
                ));

                if (isRateLimit) {
                    console.warn('Proveedor rate-limited:', errDetail);
                    throw new Error('El servicio de IA está limitando las solicitudes (429). Intenta de nuevo en unos segundos o configura tu propia clave en https://openrouter.ai/settings/integrations');
                }

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

    async scrapeCompany(company: string): Promise<{ company: string; historicalData: any; technicalData: any; financialData: any }> {
        const trimmed = company?.toString().trim();
        if (!trimmed) throw new Error("Compañía inválida");

        const baseUrl = process.env.NODE_ENV === "development" ? "http://localhost:3001" : "";
        const url = `${baseUrl}/api/scrape/company?company=${encodeURIComponent(trimmed)}`;

        try {
            const res = await fetch(url, { method: "GET" });
            const raw = await res.text();

            if (!res.ok) {
                let errDetail: unknown = raw;
                try {
                    errDetail = JSON.parse(raw);
                } catch (_) {
                    // mantener raw como string
                }

                throw new Error(
                    typeof errDetail === "string"
                        ? errDetail
                        : JSON.stringify(errDetail)
                );
            }

            let parsed: any;
            try {
                parsed = JSON.parse(raw);
            } catch (_) {
                parsed = raw;
            }

            if (!parsed || typeof parsed !== "object") {
                throw new Error("Respuesta inválida del scraping");
            }

            return parsed;
        } catch (err) {
            console.error("Error en chatService.scrapeCompany:", err);
            throw err;
        }
    },

    async fetchEstado(company: string): Promise<EstadoReport> {
        const original = company?.toString().trim();
        if (!original) throw new Error("Compañía inválida");

        const baseUrl = process.env.NODE_ENV === "development" ? "http://localhost:3001" : "";

        const requestReport = async (identifier: string): Promise<EstadoReport> => {
            const url = `${baseUrl}/api/estado?company=${encodeURIComponent(identifier)}`;
            const res = await fetch(url, { method: "GET" });
            const text = await res.text();

            let parsed: any = null;
            try {
                parsed = JSON.parse(text);
            } catch (_) {
                parsed = null;
            }

            if (!res.ok) {
                const message =
                    typeof parsed?.error === "string"
                        ? parsed.error
                        : typeof parsed === "string"
                        ? parsed
                        : res.statusText || "Error desconocido";
                const error = new Error(message) as Error & { status?: number };
                error.status = res.status;
                throw error;
            }

            if (!parsed || typeof parsed !== "object" || typeof parsed.summaryText !== "string") {
                throw new Error("Reporte inválido recibido desde el backend");
            }

            const ai = (parsed as Record<string, unknown>).aiAnalysis;
            const normalizedAnalysis =
                ai &&
                typeof ai === "object" &&
                typeof (ai as Record<string, unknown>).past === "string" &&
                typeof (ai as Record<string, unknown>).present === "string" &&
                typeof (ai as Record<string, unknown>).future === "string" &&
                typeof (ai as Record<string, unknown>).conclusion === "string"
                    ? (ai as EstadoReport["aiAnalysis"])
                    : null;

            const metricsRaw = (parsed as Record<string, unknown>).metrics;
            let normalizedTimeseries: EstadoTimeseries | undefined;
            if (metricsRaw && typeof metricsRaw === "object") {
                const ts = (metricsRaw as Record<string, unknown>).timeseries;
                if (ts && typeof ts === "object") {
                    const timeseriesRecord = ts as Record<string, unknown>;
                    normalizedTimeseries = {
                        priceLine: Array.isArray(timeseriesRecord.priceLine)
                            ? (timeseriesRecord.priceLine as PriceLinePoint[])
                            : undefined,
                        priceCandle: Array.isArray(timeseriesRecord.priceCandle)
                            ? (timeseriesRecord.priceCandle as PriceCandlePoint[])
                            : undefined,
                        returns: Array.isArray(timeseriesRecord.returns)
                            ? (timeseriesRecord.returns as ValuePoint[])
                            : undefined,
                        drawdowns: Array.isArray(timeseriesRecord.drawdowns)
                            ? (timeseriesRecord.drawdowns as ValuePoint[])
                            : undefined,
                        volume: Array.isArray(timeseriesRecord.volume)
                            ? (timeseriesRecord.volume as ValuePoint[])
                            : undefined
                    };
                }
            }

            return {
                ...(parsed as Omit<EstadoReport, "aiAnalysis">),
                metrics: {
                    ...(parsed as EstadoReport).metrics,
                    timeseries: normalizedTimeseries
                },
                aiAnalysis: normalizedAnalysis
            };
        };

        const attempts: string[] = [original];
        const slug = slugifyCompany(original);
        if (slug && slug !== original) {
            attempts.push(slug);
        }

        let lastError: Error | null = null;

        for (const identifier of attempts) {
            try {
                return await requestReport(identifier);
            } catch (error) {
                lastError = error as Error;
            }
        }

        throw lastError ?? new Error("No se pudo generar el estado solicitado");
    }
};
