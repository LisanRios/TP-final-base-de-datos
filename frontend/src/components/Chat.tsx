import React, { useState, useRef, useEffect, useMemo } from 'react';
import TypingIndicator from './TypingIndicator.tsx';
import FinancialIndicatorsCard from "./FinancialIndicatorsCard.tsx";
import ChartWrapper from "./charts/ChartWrapper.tsx";
import { chatService, slugifyCompany } from '../services/chatService.ts';
import type { EstadoReport } from '../services/chatService.ts';
import { graphService } from '../services/graphService.ts';
import { mockService } from "../services/mockService.ts";
import '../styles/Chat.css';
import  ExportChatButton  from "./ExportChatButton.tsx"
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeRaw from 'rehype-raw'

export type Message = {
    content: string;
    sender: 'user' | 'bot';
    graph_type?: string;
    data?: any;
    indicators?: { name: string; value: number | string }[];
    timestamp: string;
};

const CHAT_HISTORY_ID = 'financial-chat-history';

const Chat = () => {
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [isExportingReport, setIsExportingReport] = useState(false);
    const [reportGeneratedAt, setReportGeneratedAt] = useState<Date | null>(null);
    const [lastMessageAt, setLastMessageAt] = useState<Date | null>(null);

    const chatRef = useRef<HTMLDivElement>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const conversationStartedAtRef = useRef<Date | null>(null);

    useEffect(() => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
        }
    }, [messages, isLoading]);

    useEffect(() => {
        if (!isLoading && messages[messages.length - 1]?.sender === 'bot' && inputRef.current) {
            setTimeout(() => inputRef.current?.focus(), 50);
        }
    }, [messages, isLoading]);

    const addMessage = (
        content: string, 
        sender: 'user' | 'bot', 
        graph_type?: string, 
        data?: any, 
        indicators?: { name: string; value: number | string }[]
    ) => {
        const timestamp = new Date();

        setMessages(prev => {
            if (!conversationStartedAtRef.current && prev.length === 0) {
                conversationStartedAtRef.current = timestamp;
            }

            return [
                ...prev,
                {
                    content,
                    sender,
                    graph_type,
                    data,
                    indicators,
                    timestamp: timestamp.toISOString()
                }
            ];
        });

        setLastMessageAt(timestamp);
    };

    type ChartOptions = {
        priceLine?: boolean;
        priceCandle?: boolean;
        returns?: boolean;
        drawdowns?: boolean;
        volume?: boolean;
    };

    const pushTimeseriesCharts = (timeseries: any, options: ChartOptions) => {
        if (!timeseries || typeof timeseries !== 'object') return;

        if (options.priceLine && Array.isArray(timeseries.priceLine) && timeseries.priceLine.length >= 2) {
            const priceData = timeseries.priceLine.map((point: any) => ({
                date: point.date,
                price: Number(point.price ?? 0),
                ...(typeof point.sma50 === 'number' ? { sma50: point.sma50 } : {}),
                ...(typeof point.sma200 === 'number' ? { sma200: point.sma200 } : {})
            }));

            addMessage(
                '📈 Precio de cierre y medias móviles (últimos datos disponibles).',
                'bot',
                'line',
                priceData
            );
        }

        if (options.priceCandle && Array.isArray(timeseries.priceCandle) && timeseries.priceCandle.length >= 2) {
            const candleData = timeseries.priceCandle.map((point: any) => ({
                date: point.date,
                open: Number(point.open ?? 0),
                high: Number(point.high ?? 0),
                low: Number(point.low ?? 0),
                close: Number(point.close ?? 0)
            }));

            addMessage(
                '🕯️ Velas OHLC recientes.',
                'bot',
                'candlestick',
                candleData
            );
        }

        if (options.returns && Array.isArray(timeseries.returns) && timeseries.returns.length >= 2) {
            const returnsData = timeseries.returns.map((point: any) => ({
                date: point.date,
                value: Number(point.value ?? 0) * 100
            }));

            addMessage(
                '📊 Retornos diarios (%)',
                'bot',
                'area',
                returnsData
            );
        }

        if (options.drawdowns && Array.isArray(timeseries.drawdowns) && timeseries.drawdowns.length >= 2) {
            const drawdownData = timeseries.drawdowns.map((point: any) => ({
                date: point.date,
                value: Number(point.value ?? 0) * 100
            }));

            addMessage(
                '📉 Evolución del drawdown (%)',
                'bot',
                'area',
                drawdownData
            );
        }

        if (options.volume && Array.isArray(timeseries.volume) && timeseries.volume.length >= 2) {
            const volumeData = timeseries.volume.map((point: any) => ({
                date: point.date,
                value: Number(point.value ?? 0)
            }));

            addMessage(
                '📦 Volumen negociado',
                'bot',
                'bar',
                volumeData
            );
        }
    };

    const formatPercent = (value: number | null | undefined, decimals = 2) => {
        if (value === null || value === undefined || Number.isNaN(value)) return 'N/D';
        return `${(value * 100).toFixed(decimals)}%`;
    };

    const formatNumber = (value: number | null | undefined, decimals = 2) => {
        if (value === null || value === undefined || Number.isNaN(value)) return 'N/D';
        return value.toFixed(decimals);
    };

    const formatCurrency = (value: number | null | undefined) => {
        if (value === null || value === undefined || Number.isNaN(value)) return 'N/D';
        try {
            return value.toLocaleString('es-AR', {
                style: 'currency',
                currency: 'USD',
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            });
        } catch (error) {
            console.error('Error formateando moneda', error);
            return `$${value.toFixed(2)}`;
        }
    };

    const formatDateShort = (value: string | Date | null | undefined) => {
        if (!value) return 'N/D';
        const date = value instanceof Date ? value : new Date(value);
        if (Number.isNaN(date.getTime())) return 'N/D';
        return date.toLocaleDateString('es-AR', { dateStyle: 'medium' });
    };

    const formatDateTimeLong = (value: string | Date | null | undefined) => {
        if (!value) return 'N/D';
        const date = value instanceof Date ? value : new Date(value);
        if (Number.isNaN(date.getTime())) return 'N/D';
        return date.toLocaleString('es-AR', {
            dateStyle: 'long',
            timeStyle: 'short'
        });
    };

    const reportStats = useMemo(() => {
        const totalMessages = messages.length;
        const userMessagesCount = messages.filter(msg => msg.sender === 'user').length;
        const botMessagesCount = totalMessages - userMessagesCount;
        const commandsUsed = Array.from(new Set(
            messages
                .filter(msg => msg.sender === 'user' && msg.content.trim().startsWith('/'))
                .map(msg => msg.content.trim().split(/\s+/)[0])
        ));
        const chartsCount = messages.reduce((acc, msg) => acc + (msg.graph_type ? 1 : 0), 0);
        const indicatorsCount = messages.reduce((acc, msg) => acc + (msg.indicators?.length ?? 0), 0);

        return {
            totalMessages,
            userMessagesCount,
            botMessagesCount,
            commandsUsed,
            chartsCount,
            indicatorsCount
        };
    }, [messages]);

    const exportFileName = useMemo(() => {
        if (!messages.length) return 'Reporte_Analisis_Financiero.pdf';

        const referenceDate = lastMessageAt ?? new Date();
        const iso = referenceDate.toISOString().replace(/[:]/g, '-').split('.')[0];
        const primaryCommand = reportStats.commandsUsed[0]?.replace(/^\//, '') ?? 'chat';
        const sanitizedCommand = primaryCommand.replace(/[^a-zA-Z0-9-_]+/g, '-');

        return `Informe_${sanitizedCommand}_${iso}.pdf`;
    }, [lastMessageAt, messages, reportStats]);

    const conversationStartedAt = conversationStartedAtRef.current;

    type ComparisonSnapshot = {
        company: string;
        close: number | null;
        latestDate: string | null;
        latestReturn: number | null;
        annualizedReturn: number | null;
        sharpe: number | null;
        sortino: number | null;
        maxDrawdown: number | null;
        latestDrawdown: number | null;
        volatilityAnnualized: number | null;
        rsi: number | null;
        crossStatus: string | null;
        rawStatus: string | null;
    };

    const extractComparisonSnapshot = (report: EstadoReport): ComparisonSnapshot => {
        const metrics = (report.metrics ?? {}) as Record<string, any>;
        const latest = (metrics.latest ?? {}) as Record<string, any>;
        const returns = (metrics.returns ?? {}) as Record<string, any>;
        const risk = (metrics.risk ?? {}) as Record<string, any>;
        const drawdowns = (metrics.drawdowns ?? {}) as Record<string, any>;
        const crosses = (metrics.crosses ?? {}) as Record<string, any>;

        const close = typeof latest.close === 'number' ? latest.close : null;
        const latestDate = typeof latest.date === 'string' || latest.date instanceof Date ? latest.date : null;
        const latestReturn = typeof returns.latestReturn === 'number' ? returns.latestReturn : null;
        const annualizedReturn = typeof returns.annualizedReturn === 'number' ? returns.annualizedReturn : null;
        const sharpe = typeof risk.sharpe === 'number' ? risk.sharpe : null;
        const sortino = typeof risk.sortino === 'number' ? risk.sortino : null;
        const maxDrawdown = typeof drawdowns.maxDrawdown === 'number' ? drawdowns.maxDrawdown : null;
        const latestDrawdown = typeof drawdowns.latestDrawdown === 'number' ? drawdowns.latestDrawdown : null;
        const volatilityAnnualized = typeof risk.volatilityAnnualized === 'number' ? risk.volatilityAnnualized : null;
        const rsi = typeof metrics.rsi === 'number' ? metrics.rsi : null;
        const rawStatus = typeof crosses.status === 'string' ? crosses.status : null;
        const crossStatus = rawStatus ? rawStatus.charAt(0).toUpperCase() + rawStatus.slice(1) : null;

        return {
            company: report.company,
            close,
            latestDate: latestDate ? latestDate.toString() : null,
            latestReturn,
            annualizedReturn,
            sharpe,
            sortino,
            maxDrawdown,
            latestDrawdown,
            volatilityAnnualized,
            rsi,
            crossStatus,
            rawStatus
        };
    };

    type OutlookEvaluation = ComparisonSnapshot & {
        score: number;
    };

    const evaluateOutlook = (snapshot: ComparisonSnapshot): OutlookEvaluation => {
        let score = 0;

        if (typeof snapshot.annualizedReturn === 'number') {
            score += snapshot.annualizedReturn * 100;
        }
        if (typeof snapshot.latestReturn === 'number') {
            score += snapshot.latestReturn * 100;
        }
        if (typeof snapshot.sharpe === 'number') {
            score += snapshot.sharpe * 10;
        }
        if (typeof snapshot.maxDrawdown === 'number') {
            score -= Math.abs(snapshot.maxDrawdown) * 50;
        }
        if (typeof snapshot.latestDrawdown === 'number') {
            score -= Math.abs(snapshot.latestDrawdown) * 20;
        }
        if (typeof snapshot.volatilityAnnualized === 'number') {
            score -= Math.max(snapshot.volatilityAnnualized, 0) * 10;
        }
        if (typeof snapshot.rsi === 'number') {
            if (snapshot.rsi >= 40 && snapshot.rsi <= 60) {
                score += 5;
            } else if (snapshot.rsi < 30 || snapshot.rsi > 70) {
                score -= 5;
            }
        }
        if (snapshot.rawStatus) {
            const statusLower = snapshot.rawStatus.toLowerCase();
            if (statusLower.includes('alcista') || statusLower.includes('bullish')) {
                score += 10;
            }
            if (statusLower.includes('bajista') || statusLower.includes('bearish')) {
                score -= 10;
            }
        }

        return {
            ...snapshot,
            score
        };
    };

    const formatDiffInsight = (
        label: string,
        valueA: number | null,
        valueB: number | null,
        threshold: number,
        formatter: (value: number | null) => string,
        higherIsBetter: boolean,
        nameA: string,
        nameB: string
    ) => {
        if (valueA === null || valueB === null) return null;
        const diff = valueA - valueB;
        if (Math.abs(diff) < threshold) return null;

        let preferred: string;
        if (higherIsBetter) {
            preferred = diff > 0 ? nameA : nameB;
        } else {
            preferred = diff < 0 ? nameA : nameB;
        }

        return `${label}: ${formatter(valueA)} (${nameA}) vs ${formatter(valueB)} (${nameB}) → favorece a **${preferred}**`;
    };

    const buildComparisonMessage = (reportA: EstadoReport, reportB: EstadoReport) => {
        const snapshotA = evaluateOutlook(extractComparisonSnapshot(reportA));
        const snapshotB = evaluateOutlook(extractComparisonSnapshot(reportB));

        const tableRows = [
            ['Cierre reciente', `${formatCurrency(snapshotA.close)} (${formatDateShort(snapshotA.latestDate)})`, `${formatCurrency(snapshotB.close)} (${formatDateShort(snapshotB.latestDate)})`],
            ['Retorno diario más reciente', formatPercent(snapshotA.latestReturn), formatPercent(snapshotB.latestReturn)],
            ['Retorno anualizado', formatPercent(snapshotA.annualizedReturn), formatPercent(snapshotB.annualizedReturn)],
            ['Sharpe ratio', formatNumber(snapshotA.sharpe), formatNumber(snapshotB.sharpe)],
            ['Sortino', formatNumber(snapshotA.sortino), formatNumber(snapshotB.sortino)],
            ['Máximo drawdown', formatPercent(snapshotA.maxDrawdown), formatPercent(snapshotB.maxDrawdown)],
            ['Drawdown actual', formatPercent(snapshotA.latestDrawdown), formatPercent(snapshotB.latestDrawdown)],
            ['Volatilidad anualizada', formatPercent(snapshotA.volatilityAnnualized), formatPercent(snapshotB.volatilityAnnualized)],
            ['RSI (14)', formatNumber(snapshotA.rsi), formatNumber(snapshotB.rsi)],
            ['Cruce de medias', snapshotA.crossStatus ?? 'N/D', snapshotB.crossStatus ?? 'N/D'],
            ['Score compuesto', formatNumber(snapshotA.score, 1), formatNumber(snapshotB.score, 1)]
        ];

        const table =
            `| Indicador | ${snapshotA.company} | ${snapshotB.company} |\n| --- | --- | --- |\n` +
            tableRows.map((row) => `| ${row[0]} | ${row[1]} | ${row[2]} |`).join('\n');

        const insights: string[] = [];

        const sharpeInsight = formatDiffInsight(
            'Sharpe ratio',
            snapshotA.sharpe,
            snapshotB.sharpe,
            0.3,
            (value) => formatNumber(value, 2),
            true,
            snapshotA.company,
            snapshotB.company
        );
        if (sharpeInsight) insights.push(sharpeInsight);

        const returnInsight = formatDiffInsight(
            'Retorno anualizado',
            snapshotA.annualizedReturn,
            snapshotB.annualizedReturn,
            0.03,
            (value) => formatPercent(value, 2),
            true,
            snapshotA.company,
            snapshotB.company
        );
        if (returnInsight) insights.push(returnInsight);

        const drawdownInsight = formatDiffInsight(
            'Máximo drawdown',
            snapshotA.maxDrawdown,
            snapshotB.maxDrawdown,
            0.05,
            (value) => formatPercent(value, 2),
            false,
            snapshotA.company,
            snapshotB.company
        );
        if (drawdownInsight) insights.push(drawdownInsight);

        const volatilityInsight = formatDiffInsight(
            'Volatilidad anualizada',
            snapshotA.volatilityAnnualized,
            snapshotB.volatilityAnnualized,
            0.05,
            (value) => formatPercent(value, 2),
            false,
            snapshotA.company,
            snapshotB.company
        );
        if (volatilityInsight) insights.push(volatilityInsight);

        const diffScore = snapshotA.score - snapshotB.score;
        let conclusion: string;
        const threshold = 1.5;

        if (Math.abs(diffScore) <= threshold) {
            conclusion = 'Panorama equilibrado: ambas compañías muestran métricas similares en la evaluación compuesta.';
        } else if (diffScore > threshold) {
            conclusion = `El panorama más favorable lo presenta **${snapshotA.company}** (score ${formatNumber(snapshotA.score, 1)} vs ${formatNumber(snapshotB.score, 1)}).`;
        } else {
            conclusion = `El panorama más favorable lo presenta **${snapshotB.company}** (score ${formatNumber(snapshotB.score, 1)} vs ${formatNumber(snapshotA.score, 1)}).`;
        }

        const insightBlock = insights.length
            ? `**Principales diferencias:**\n${insights.map((line) => `- ${line}`).join('\n')}`
            : null;

        return [
            `## Comparativa entre **${snapshotA.company}** y **${snapshotB.company}**`,
            table,
            insightBlock,
            `**Conclusión:** ${conclusion}`,
            '_Nota: el score compuesto pondera retornos recientes/anualizados, ratios de riesgo y drawdowns. No reemplaza un análisis fundamental._'
        ]
            .filter(Boolean)
            .join('\n\n');
    };

    const handleEstadoFetchError = (company: string, error: unknown) => {
        console.error(error);
        const err = error as Error & { status?: number };
        if (err?.status === 404) {
            addMessage(
                `No encontré datos guardados para **${company}**. Ejecuta \/analiza ${company} primero para cargar el histórico.`,
                'bot'
            );
        } else {
            const message = err?.message || 'Ocurrió un problema recuperando el informe.';
            addMessage(`No se pudo obtener el informe para **${company}**: ${message}`, 'bot');
        }
    };

    const fetchEstadoWithAutoScrape = async (companyInput: string): Promise<EstadoReport | null> => {
        try {
            return await chatService.fetchEstado(companyInput);
        } catch (error) {
            const err = error as Error & { status?: number };
            if (err?.status !== 404) {
                handleEstadoFetchError(companyInput, error);
                return null;
            }

            const slug = slugifyCompany(companyInput);
            const target = slug || companyInput;
            addMessage(
                `No encontré datos guardados para **${companyInput}**. Iniciando scraping automático (${target})...`,
                'bot'
            );

            try {
                const scrapeResult = await chatService.scrapeCompany(target);
                const companyName = typeof scrapeResult?.company === 'string' ? scrapeResult.company : companyInput;
                addMessage(
                    `Datos de **${companyName}** actualizados. Reintentando informe cuantitativo...`,
                    'bot'
                );
                return await chatService.fetchEstado(companyInput);
            } catch (scrapeError) {
                console.error(scrapeError);
                const message = (scrapeError as Error).message || 'No fue posible completar el scraping.';
                addMessage(`No logré obtener datos para **${companyInput}**: ${message}`, 'bot');
                return null;
            }
        }
    };

    const sendMessage = async () => {
        const trimmed = input.trim();
        if (!trimmed || isLoading) return;

        addMessage(trimmed, 'user');
        setInput("");
        setIsLoading(true);

        const analyzeMatch = trimmed.match(/^\/analiza\s+(.+)/i);
        if (analyzeMatch) {
            const companyInput = analyzeMatch[1].trim();

            if (!companyInput) {
                addMessage("Por favor indica una compañía después de /analiza", 'bot');
                setIsLoading(false);
                return;
            }
            const slug = slugifyCompany(companyInput);

            if (!slug) {
                addMessage("No pude generar un identificador válido para la compañía.", 'bot');
                setIsLoading(false);
                return;
            }

            try {
                addMessage(`Iniciando scraping para **${companyInput}**...`, 'bot');
                const data = await chatService.scrapeCompany(slug);
                const companyName = typeof data?.company === 'string' ? data.company : slug;
                addMessage(
                    `Datos de **${companyName}** actualizados en la base de datos. Se recuperaron ${data?.historicalData?.length ?? 0} registros históricos.`,
                    'bot'
                );
            } catch (error) {
                console.error(error);
                addMessage(
                    `No fue posible completar el scraping: ${(error as Error).message || 'error desconocido.'}`,
                    'bot'
                );
            } finally {
                setIsLoading(false);
            }

            return;
        }

        const estadoMatch = trimmed.match(/^\/estado\s+(.+)/i);
        if (estadoMatch) {
            const companyInput = estadoMatch[1].trim();

            if (!companyInput) {
                addMessage("Por favor indica una compañía después de /estado", 'bot');
                setIsLoading(false);
                return;
            }

            try {
                addMessage(`Generando informe técnico cuantitativo para **${companyInput}**...`, 'bot');
                const report = await fetchEstadoWithAutoScrape(companyInput);

                if (!report) {
                    setIsLoading(false);
                    return;
                }

                const generatedDate = new Date(report.generatedAt);
                const timestamp = Number.isNaN(generatedDate.getTime())
                    ? report.generatedAt
                    : generatedDate.toLocaleString('es-AR', {
                          dateStyle: 'medium',
                          timeStyle: 'short'
                      });

                let message = `Informe generado el ${timestamp}.

${report.summaryText}`;

                if (report.aiAnalysis) {
                    message += `

### Interpretación del analista

**Pasado:** ${report.aiAnalysis.past}

**Presente:** ${report.aiAnalysis.present}

**Futuro:** ${report.aiAnalysis.future}

**Conclusión:** ${report.aiAnalysis.conclusion}`;
                }

                addMessage(message, 'bot');

                const timeseries = report.metrics?.timeseries;
                pushTimeseriesCharts(timeseries, { priceLine: true, priceCandle: true });
            } catch (error) {
                console.error(error);
                const status = (error as Error & { status?: number }).status;
                if (status === 404) {
                    addMessage(
                        `No encontré datos guardados para **${companyInput}**. Ejecuta \/analiza ${companyInput} primero para cargar el histórico.`,
                        'bot'
                    );
                } else {
                    const msg = (error as Error).message || 'Ocurrió un problema generando el informe.';
                    addMessage(msg, 'bot');
                }
            } finally {
                setIsLoading(false);
            }

            return;
        }

        const graficosMatch = trimmed.match(/^\/graficos\s+(.+)/i);
        if (graficosMatch) {
            const companyInput = graficosMatch[1].trim();

            if (!companyInput) {
                addMessage("Por favor indica una compañía después de /graficos", 'bot');
                setIsLoading(false);
                return;
            }

            try {
                addMessage(`Recuperando todas las visualizaciones para **${companyInput}**...`, 'bot');
                const report = await fetchEstadoWithAutoScrape(companyInput);

                if (!report) {
                    setIsLoading(false);
                    return;
                }
                const timeseries = report.metrics?.timeseries;

                if (!timeseries) {
                    addMessage('No se encontraron series temporales para esa compañía.', 'bot');
                } else {
                    addMessage('Mostrando todos los gráficos disponibles.', 'bot');
                    pushTimeseriesCharts(timeseries, {
                        priceLine: true,
                        priceCandle: true,
                        returns: true,
                        drawdowns: true,
                        volume: true
                    });
                }
            } catch (error) {
                console.error(error);
                const status = (error as Error & { status?: number }).status;
                if (status === 404) {
                    addMessage(
                        `No encontré datos guardados para **${companyInput}**. Ejecuta \/analiza ${companyInput} primero para cargar el histórico.`,
                        'bot'
                    );
                } else {
                    const msg = (error as Error).message || 'Ocurrió un problema recuperando los gráficos.';
                    addMessage(msg, 'bot');
                }
            } finally {
                setIsLoading(false);
            }

            return;
        }

        const compareMatch = trimmed.match(/^\/compara\s+(.+?)\s+y\s+(.+)/i);
        if (compareMatch) {
            const firstCompany = compareMatch[1]?.trim();
            const secondCompany = compareMatch[2]?.trim();

            if (!firstCompany || !secondCompany) {
                addMessage('Por favor indica dos compañías separadas por "y" después de /compara', 'bot');
                setIsLoading(false);
                return;
            }

            addMessage(`Comparando **${firstCompany}** y **${secondCompany}**...`, 'bot');

            const firstReport = await fetchEstadoWithAutoScrape(firstCompany);
            if (!firstReport) {
                setIsLoading(false);
                return;
            }

            const secondReport = await fetchEstadoWithAutoScrape(secondCompany);
            if (!secondReport) {
                setIsLoading(false);
                return;
            }

            if (firstReport && secondReport) {
                const comparison = buildComparisonMessage(firstReport, secondReport);
                addMessage(comparison, 'bot');
            }

            setIsLoading(false);
            return;
        }

        if (trimmed.toLowerCase() === '/help') {
            addMessage(
                `Comandos disponibles:
- \`/analiza <compañía>\`: ejecuta el scraping y actualiza la base.
- \`/estado <compañía>\`: genera el informe cuantitativo y muestra gráficos clave (scraping automático si faltan datos).
- \`/graficos <compañía>\`: despliega todas las visualizaciones disponibles (scraping automático si faltan datos).
- \`/compara <compañía A> y <compañía B>\`: compara métricas cuantitativas de ambas compañías.
`,
                'bot'
            );
            setIsLoading(false);
            return;
        }

        // Comando de prueba
        if (trimmed.toLowerCase() === "/test-indicators") {
            const messages = mockService.getTestIndicators();
            messages.forEach(msg => addMessage(msg.content, msg.sender, msg.graph_type, msg.data, msg.indicators));
            setIsLoading(false);
            return;
        }

        // Comando de gráfico
        const graph = graphService.getMockGraph(trimmed);
        if (graph) {
            addMessage(`Gráfico ${graph.graph_type} generado 📊`, 'bot');
            addMessage("", 'bot', graph.graph_type, graph.data);
            setIsLoading(false);
            return;
        }

        // Consulta al backend
        try {
            const { response } = await chatService.sendMessage(trimmed);

            // Intentar parsear la respuesta como JSON; si falla, usarla como texto plano
            let parsed: any = null;
            try {
                parsed = JSON.parse(response);
            } catch (e) {
                parsed = null;
            }

            

            /* const cleanResponse = response.replace(/<\|?[^>]+?\|?>/g, '').trim(); */

            // Si viene un objeto JSON con gráfico y datos, renderizarlo
            if (parsed && typeof parsed === 'object' && parsed.graph_type && parsed.data) {
                // Texto descriptivo opcional
                if (parsed.text && typeof parsed.text === 'string' && parsed.text.trim().length > 0) {
                    addMessage(parsed.text, 'bot');
                }

                addMessage(
                    "",
                    'bot',
                    parsed.graph_type,
                    parsed.data,
                    parsed.indicators
                );
            } else if (parsed && typeof parsed === 'object' && typeof parsed.text === 'string') {
                // Si es un objeto con campo `text`, mostrarlo
                addMessage(parsed.text, 'bot');
            } else {
                // Respuesta como texto plano (no JSON)
                addMessage(response, 'bot');
            }
        } catch (error) {
            console.error(error);
            const msg = (error as Error).message.includes("fuera de contexto")
                ? "Disculpa, mi función principal es el **Análisis Financiero**."
                : "Lo siento, hubo un error de conexión inesperado. Inténtalo de nuevo.";
            addMessage(msg, 'bot');
        } finally {
            setIsLoading(false);
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter") sendMessage();
    };

    return (
        <div className={`chat-app-container${isExportingReport ? ' exporting' : ''}`}>
            <div className="chat-header-row">
                <div className="chat-header">
                    Asistente Financiero IA
                </div>
                <ExportChatButton
                    elementId={CHAT_HISTORY_ID}
                    fileName={exportFileName}
                    disabled={!messages.length}
                    onBeforeExport={() => {
                        setIsExportingReport(true);
                        setReportGeneratedAt(new Date());
                    }}
                    onAfterExport={() => setIsExportingReport(false)}
                    onError={() => setIsExportingReport(false)}
                />
            </div>

            <div ref={chatRef} id={CHAT_HISTORY_ID} className={`chat-messages${isExportingReport ? ' report-surface' : ''}`}>
                {isExportingReport && messages.length > 0 && (
                    <div className="report-summary report-section">
                        <h2>Informe de conversación</h2>
                        <p className="report-summary__timestamp">
                            Generado el {formatDateTimeLong(reportGeneratedAt)}
                        </p>
                        <ul className="report-summary__metrics">
                            <li><strong>Inicio:</strong> {formatDateTimeLong(conversationStartedAt)}</li>
                            <li><strong>Última actualización:</strong> {formatDateTimeLong(lastMessageAt)}</li>
                            <li><strong>Mensajes totales:</strong> {reportStats.totalMessages}</li>
                            <li><strong>Interacciones del usuario:</strong> {reportStats.userMessagesCount}</li>
                            <li><strong>Respuestas del asistente:</strong> {reportStats.botMessagesCount}</li>
                            <li><strong>Gráficos renderizados:</strong> {reportStats.chartsCount}</li>
                            <li><strong>Indicadores financieros:</strong> {reportStats.indicatorsCount}</li>
                        </ul>
                        {reportStats.commandsUsed.length > 0 && (
                            <div className="report-summary__commands">
                                <strong>Comandos utilizados:</strong>
                                <ul>
                                    {reportStats.commandsUsed.map((command, index) => (
                                        <li key={`${command}-${index}`}>{command}</li>
                                    ))}
                                </ul>
                            </div>
                        )}
                        <p className="report-summary__note">
                            Este informe refleja el intercambio mantenido con el Asistente Financiero IA y las visualizaciones generadas durante la sesión.
                        </p>
                    </div>
                )}

                {messages.length === 0 && !isExportingReport && (
                    <div className="welcome-message">
                        <p className="text-xl font-bold mb-2">¡Hola! Soy tu Asistente Financiero IA.</p>
                        <p className="text-sm">Pregúntame sobre análisis financiero, inversiones, etc.</p>
                    </div>
                )}

                {messages.map((msg, i) => {
                    const messageWrapperClass = `message-wrapper ${msg.sender}${isExportingReport ? ' report-section' : ''}`;
                    const messageBubbleClass = `message-bubble ${msg.sender} markdown-body${isExportingReport ? ' report-mode' : ''}`;
                    const senderLabel = msg.sender === 'user' ? 'Usuario' : 'Asistente Financiero IA';

                    return (
                        <div key={i} className={messageWrapperClass}>
                            <div className={messageBubbleClass}>
                                {isExportingReport && (
                                    <div className="message-report-meta">
                                        <span className="message-report-sender">{senderLabel}</span>
                                        <span className="message-report-timestamp">{formatDateTimeLong(msg.timestamp)}</span>
                                    </div>
                                )}
                                {msg.content && (
                                    <ReactMarkdown
                                        remarkPlugins={[remarkGfm]}
                                        rehypePlugins={[rehypeRaw]}
                                    >
                                        {msg.content}
                                    </ReactMarkdown>
                                )}

                                {msg.graph_type && msg.data && (
                                    <div className="mt-3">
                                        <ChartWrapper type={msg.graph_type} data={msg.data} />
                                        {msg.indicators && msg.indicators.length > 0 && (
                                            <FinancialIndicatorsCard indicators={msg.indicators} />
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}

                {isLoading && (
                    <div className={`message-wrapper bot${isExportingReport ? ' report-section' : ''}`}>
                        <div className={`message-bubble typing${isExportingReport ? ' report-mode' : ''}`}>
                            <TypingIndicator />
                        </div>
                    </div>
                )}

                <div ref={messagesEndRef}></div>
            </div>

            <div className="chat-input-wrapper">
                <input
                    id="chat-input"
                    name="chat-input"
                    type="text"
                    placeholder={isLoading ? "Pensando..." : "Escribe un mensaje..."}
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={handleKeyPress}
                    ref={inputRef}
                    disabled={isLoading}
                />
                <button
                    onClick={sendMessage}
                    disabled={isLoading || !input.trim()}
                >
                    Enviar
                </button>
            </div>
        </div>
    );
};

export default Chat;
