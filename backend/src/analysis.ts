/* eslint-disable @typescript-eslint/no-explicit-any */

type HistoricalRaw = {
	last_close?: number;
	last_open?: number;
	last_max?: number;
	last_min?: number;
	volume?: number;
};

export type HistoricalEntry = {
	date: string;
	raw: HistoricalRaw;
};

type PreparedPoint = {
	date: Date;
	close: number;
	open: number;
	high: number;
	low: number;
	volume: number;
};

type ReturnPoint = {
	date: Date;
	value: number;
};

const TRADING_DAYS = 252;
const RISK_FREE_RATE = 0.04; // 4 % anual
const CHART_WINDOW_POINTS = 180;

const WEEKDAY_NAMES = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
const MONTH_NAMES = [
	'enero',
	'febrero',
	'marzo',
	'abril',
	'mayo',
	'junio',
	'julio',
	'agosto',
	'septiembre',
	'octubre',
	'noviembre',
	'diciembre'
];

function safeNumber(value: any): number | null {
	const num = Number(value);
	return Number.isFinite(num) ? num : null;
}

function differenceInDays(a: Date, b: Date): number {
	const diff = a.getTime() - b.getTime();
	return Math.round(diff / (1000 * 60 * 60 * 24));
}

function mean(values: number[]): number {
	if (!values.length) return 0;
	return values.reduce((acc, v) => acc + v, 0) / values.length;
}

function variance(values: number[]): number {
	if (values.length < 2) return 0;
	const m = mean(values);
	return values.reduce((acc, v) => acc + (v - m) ** 2, 0) / (values.length - 1);
}

function std(values: number[]): number {
	return Math.sqrt(variance(values));
}

function formatPercent(value: number, decimals = 2): string {
	if (!Number.isFinite(value)) return 'N/D';
	return `${(value * 100).toFixed(decimals)}%`;
}

function formatNumber(value: number, decimals = 2): string {
	if (!Number.isFinite(value)) return 'N/D';
	return value.toFixed(decimals);
}

function formatDate(date: Date): string {
	return date.toISOString().split('T')[0];
}

function takeLast<T>(arr: T[], count: number): T[] {
	if (arr.length <= count) return [...arr];
	return arr.slice(arr.length - count);
}

function normalizeHistoricalData(data: HistoricalEntry[]): PreparedPoint[] {
	return data
		.map((entry) => {
			const close = safeNumber(entry.raw?.last_close);
			const open = safeNumber(entry.raw?.last_open);
			const high = safeNumber(entry.raw?.last_max);
			const low = safeNumber(entry.raw?.last_min);
			const volume = safeNumber(entry.raw?.volume);

			if (
				close === null ||
				open === null ||
				high === null ||
				low === null ||
				volume === null
			) {
				return null;
			}

			const date = new Date(entry.date);
			if (Number.isNaN(date.getTime())) {
				return null;
			}

			return {
				date,
				close,
				open,
				high,
				low,
				volume
			} as PreparedPoint;
		})
		.filter((item): item is PreparedPoint => Boolean(item))
		.sort((a, b) => a.date.getTime() - b.date.getTime());
}

function calculateSimpleReturns(points: PreparedPoint[]): ReturnPoint[] {
	const result: ReturnPoint[] = [];
	for (let i = 1; i < points.length; i += 1) {
		const prev = points[i - 1];
		const curr = points[i];
		const value = prev.close === 0 ? 0 : (curr.close - prev.close) / prev.close;
		result.push({ date: curr.date, value });
	}
	return result;
}

function calculateLogReturns(points: PreparedPoint[]): ReturnPoint[] {
	const result: ReturnPoint[] = [];
	for (let i = 1; i < points.length; i += 1) {
		const prev = points[i - 1];
		const curr = points[i];
		const value = prev.close === 0 ? 0 : Math.log(curr.close / prev.close);
		result.push({ date: curr.date, value });
	}
	return result;
}

function getWindowSlice(values: number[], index: number, period: number): number[] {
	const start = index - period + 1;
	if (start < 0) return [];
	return values.slice(start, index + 1);
}

function calculateSMA(values: number[], index: number, period: number): number | null {
	const window = getWindowSlice(values, index, period);
	if (window.length !== period) return null;
	return window.reduce((acc, v) => acc + v, 0) / period;
}

function calculateEMA(values: number[], index: number, period: number, prevEMA?: number | null): number | null {
	const price = values[index];
	if (price === undefined) return null;

	if (index + 1 === period) {
		const window = getWindowSlice(values, index, period);
		if (window.length !== period) return null;
		return window.reduce((acc, v) => acc + v, 0) / period;
	}

	if (index + 1 < period) {
		return null;
	}

	if (prevEMA === null || prevEMA === undefined) {
		return price;
	}

	const multiplier = 2 / (period + 1);
	return (price - prevEMA) * multiplier + prevEMA;
}

function calculateVolatility(returns: ReturnPoint[], window = 21): {
	windowVol: number | null;
	annualizedVol: number | null;
	fullVol: number | null;
	fullAnnualized: number | null;
} {
	if (!returns.length) {
		return {
			windowVol: null,
			annualizedVol: null,
			fullVol: null,
			fullAnnualized: null
		};
	}

	const values = returns.map((r) => r.value);
	const windowSlice = values.slice(-window);
	const windowVol = windowSlice.length ? std(windowSlice) : null;
	const annualizedVol = windowVol !== null ? windowVol * Math.sqrt(TRADING_DAYS) : null;
	const fullVol = std(values);
	const fullAnnualized = fullVol * Math.sqrt(TRADING_DAYS);

	return { windowVol, annualizedVol, fullVol, fullAnnualized };
}

function calculateDrawdowns(points: PreparedPoint[]) {
	if (!points.length) {
		return {
			series: [] as Array<{ date: Date; drawdown: number }> ,
			maxDrawdown: null as number | null,
			maxDrawdownStart: null as Date | null,
			maxDrawdownTrough: null as Date | null,
			recoveryDate: null as Date | null,
			latestDrawdown: null as number | null
		};
	}

	let peak = points[0].close;
	let peakDate = points[0].date;
	let maxDrawdown = 0;
	let maxDrawdownStart: Date | null = peakDate;
	let maxDrawdownTrough: Date | null = null;
	let recoveryDate: Date | null = null;
	let troughForRecovery: number | null = null;

	const series: Array<{ date: Date; drawdown: number }> = [];

	for (const point of points) {
		if (point.close > peak) {
			peak = point.close;
			peakDate = point.date;
		}

		const drawdown = peak === 0 ? 0 : point.close / peak - 1;
		series.push({ date: point.date, drawdown });

		if (drawdown < maxDrawdown) {
			maxDrawdown = drawdown;
			maxDrawdownStart = peakDate;
			maxDrawdownTrough = point.date;
			troughForRecovery = point.close;
			recoveryDate = null;
		}

		if (troughForRecovery !== null && point.close >= peak && !recoveryDate) {
			recoveryDate = point.date;
			troughForRecovery = null;
		}
	}

	const latestDrawdown = series[series.length - 1]?.drawdown ?? null;

	return {
		series,
		maxDrawdown,
		maxDrawdownStart,
		maxDrawdownTrough,
		recoveryDate,
		latestDrawdown
	};
}

function calculateRSI(points: PreparedPoint[], period = 14): number | null {
	if (points.length <= period) return null;

	let gains = 0;
	let losses = 0;

	for (let i = 1; i <= period; i += 1) {
		const change = points[i].close - points[i - 1].close;
		if (change >= 0) gains += change; else losses -= change;
	}

	gains /= period;
	losses /= period;

	let rs = losses === 0 ? 0 : gains / losses;
	let rsi = losses === 0 ? 100 : 100 - 100 / (1 + rs);

	for (let i = period + 1; i < points.length; i += 1) {
		const change = points[i].close - points[i - 1].close;
		let gain = 0;
		let loss = 0;
		if (change >= 0) gain = change; else loss = -change;

		gains = (gains * (period - 1) + gain) / period;
		losses = (losses * (period - 1) + loss) / period;

		rs = losses === 0 ? 0 : gains / losses;
		rsi = losses === 0 ? 100 : 100 - 100 / (1 + rs);
	}

	return rsi;
}

function calculateMACD(points: PreparedPoint[]) {
	const closes = points.map((p) => p.close);
	const macdLine: Array<number | null> = [];
	const signalLine: Array<number | null> = [];
	const histogram: Array<number | null> = [];

	let ema12: number | null = null;
	let ema26: number | null = null;
	let signal: number | null = null;

	for (let i = 0; i < closes.length; i += 1) {
		ema12 = calculateEMA(closes, i, 12, ema12);
		ema26 = calculateEMA(closes, i, 26, ema26);
		const macdValue = ema12 !== null && ema26 !== null ? ema12 - ema26 : null;
		macdLine.push(macdValue);
		if (macdValue !== null) {
			signal = calculateEMA(
				macdLine.map((v) => (v === null ? 0 : v)),
				i,
				9,
				signal
			);
			const histValue = signal !== null ? macdValue - signal : null;
			signalLine.push(signal);
			histogram.push(histValue);
		} else {
			signalLine.push(null);
			histogram.push(null);
		}
	}

	const lastIndex = closes.length - 1;
	return {
		macd: macdLine[lastIndex] ?? null,
		signal: signalLine[lastIndex] ?? null,
		histogram: histogram[lastIndex] ?? null
	};
}

function calculateBollinger(points: PreparedPoint[], period = 20, stdMultiplier = 2) {
	const closes = points.map((p) => p.close);
	if (closes.length < period) return null;
	const window = closes.slice(-period);
	const middle = mean(window);
	const deviation = std(window);
	return {
		middle,
		upper: middle + stdMultiplier * deviation,
		lower: middle - stdMultiplier * deviation,
		bandwidth: deviation / middle
	};
}

function detectCrossSignals(points: PreparedPoint[]) {
	const closes = points.map((p) => p.close);
	if (closes.length < 200) {
		return {
			status: 'series insuficiente',
			lastSignal: null as string | null,
			lastSignalDate: null as Date | null,
			sma50: null as number | null,
			sma200: null as number | null
		};
	}

	const diffs: Array<{ date: Date; diff: number }> = [];
	for (let i = 0; i < closes.length; i += 1) {
		const sma50 = calculateSMA(closes, i, 50);
		const sma200 = calculateSMA(closes, i, 200);
		if (sma50 === null || sma200 === null) continue;
		diffs.push({ date: points[i].date, diff: sma50 - sma200 });
	}

	if (!diffs.length) {
		return {
			status: 'series insuficiente',
			lastSignal: null,
			lastSignalDate: null,
			sma50: null,
			sma200: null
		};
	}

	const last = diffs[diffs.length - 1];
	const prev = diffs[diffs.length - 2] ?? last;

	let lastSignal: string | null = null;
	let lastSignalDate: Date | null = null;

	if (prev.diff <= 0 && last.diff > 0) {
		lastSignal = 'cruce dorado (SMA50 > SMA200)';
		lastSignalDate = last.date;
	} else if (prev.diff >= 0 && last.diff < 0) {
		lastSignal = 'cruce de la muerte (SMA50 < SMA200)';
		lastSignalDate = last.date;
	}

	return {
		status: last.diff >= 0 ? 'tendencia alcista (SMA50 por encima de SMA200)' : 'tendencia bajista (SMA50 por debajo de SMA200)',
		lastSignal,
		lastSignalDate,
		sma50: calculateSMA(closes, closes.length - 1, 50),
		sma200: calculateSMA(closes, closes.length - 1, 200)
	};
}

function backtestCrossStrategy(points: PreparedPoint[]) {
	const closes = points.map((p) => p.close);
	if (closes.length < 200) return null;

	let position = 0;
	let entryPrice = 0;
	let capital = 1;

	for (let i = 199; i < closes.length; i += 1) {
		const sma50 = calculateSMA(closes, i, 50);
		const sma200 = calculateSMA(closes, i, 200);
		if (sma50 === null || sma200 === null) continue;

		if (sma50 > sma200 && position === 0) {
			position = 1;
			entryPrice = closes[i];
		} else if (sma50 < sma200 && position === 1) {
			capital *= closes[i] / entryPrice;
			position = 0;
		}
	}

	if (position === 1) {
		capital *= closes[closes.length - 1] / entryPrice;
	}

	const buyHold = closes[closes.length - 1] / closes[199] - 1;
	const stratReturn = capital - 1;

	return {
		strategyReturn: stratReturn,
		buyHoldReturn: buyHold,
		startDate: points[199].date,
		endDate: points[closes.length - 1].date
	};
}

function analyzeVolume(points: PreparedPoint[]) {
	const volumes = points.map((p) => p.volume);
	if (!volumes.length) {
		return {
			average20: null,
			peak: null,
			obv: null,
			peaks: [] as Array<{ date: Date; volume: number; multiple: number }>
		};
	}

	const average20Window = volumes.slice(-20);
	const average20 = average20Window.length ? mean(average20Window) : mean(volumes);

	const peaks = points
		.map((p) => ({
			date: p.date,
			volume: p.volume,
			multiple: average20 === 0 ? 0 : p.volume / average20
		}))
		.sort((a, b) => b.volume - a.volume)
		.slice(0, 3);

	let obv = 0;
	for (let i = 1; i < points.length; i += 1) {
		if (points[i].close > points[i - 1].close) obv += points[i].volume;
		else if (points[i].close < points[i - 1].close) obv -= points[i].volume;
	}

	return {
		average20,
		peak: peaks[0] ?? null,
		obv,
		peaks
	};
}

function analyzeSeasonality(returns: ReturnPoint[]) {
	if (!returns.length) {
		return {
			weekday: null,
			month: null,
			autocorrelation: null,
			adf: null
		};
	}

	const weekdayMap = new Map<number, number[]>();
	const monthMap = new Map<number, number[]>();

	for (const ret of returns) {
		const weekday = ret.date.getUTCDay();
		const month = ret.date.getUTCMonth();
		if (!weekdayMap.has(weekday)) weekdayMap.set(weekday, []);
		if (!monthMap.has(month)) monthMap.set(month, []);
		weekdayMap.get(weekday)!.push(ret.value);
		monthMap.get(month)!.push(ret.value);
	}

	const weekdayAverages = Array.from(weekdayMap.entries()).map(([day, values]) => ({
		day,
		average: mean(values)
	}));

	const monthAverages = Array.from(monthMap.entries()).map(([month, values]) => ({
		month,
		average: mean(values)
	}));

	const weekdayBest = weekdayAverages.sort((a, b) => b.average - a.average)[0];
	const weekdayWorst = weekdayAverages.sort((a, b) => a.average - b.average)[0];
	const monthBest = monthAverages.sort((a, b) => b.average - a.average)[0];
	const monthWorst = monthAverages.sort((a, b) => a.average - b.average)[0];

	const autocorrelation = [1, 5, 10].map((lag) => ({ lag, value: autocorr(returns, lag) }));

	const adf = adfTest(returns.map((r) => r.value));

	return {
		weekday: {
			best: weekdayBest ? { day: WEEKDAY_NAMES[weekdayBest.day], value: weekdayBest.average } : null,
			worst: weekdayWorst ? { day: WEEKDAY_NAMES[weekdayWorst.day], value: weekdayWorst.average } : null
		},
		month: {
			best: monthBest ? { month: MONTH_NAMES[monthBest.month], value: monthBest.average } : null,
			worst: monthWorst ? { month: MONTH_NAMES[monthWorst.month], value: monthWorst.average } : null
		},
		autocorrelation,
		adf
	};
}

function autocorr(returns: ReturnPoint[], lag: number): number | null {
	if (returns.length <= lag) return null;
	const values = returns.map((r) => r.value);
	const meanValue = mean(values);
	let numerator = 0;
	let denominator = 0;
	for (let i = lag; i < values.length; i += 1) {
		numerator += (values[i] - meanValue) * (values[i - lag] - meanValue);
	}
	for (let i = 0; i < values.length; i += 1) {
		denominator += (values[i] - meanValue) ** 2;
	}
	if (denominator === 0) return null;
	return numerator / denominator;
}

function adfTest(values: number[]) {
	if (values.length < 10) return null;
	const y = values;
	const dy = [] as number[];
	const yLag = [] as number[];

	for (let i = 1; i < y.length; i += 1) {
		dy.push(y[i] - y[i - 1]);
		yLag.push(y[i - 1]);
	}

	const n = dy.length;
	const sumXY = yLag.reduce((acc, val, idx) => acc + val * dy[idx], 0);
	const sumXX = yLag.reduce((acc, val) => acc + val * val, 0);
	if (sumXX === 0) return null;

	const phi = sumXY / sumXX;
	const residuals = dy.map((val, idx) => val - phi * yLag[idx]);
	const sigma2 = residuals.reduce((acc, val) => acc + val * val, 0) / (n - 1);
	const se = Math.sqrt(sigma2 / sumXX);
	const statistic = se === 0 ? null : phi / se;
	const critical = -2.86; // aproximación para 5%

	return {
		statistic,
		criticalValue5: critical,
		stationary: statistic !== null ? statistic < critical : null
	};
}

function detectAnomalies(returns: ReturnPoint[]) {
	if (!returns.length) return [] as Array<{ date: Date; zScore: number; value: number }>;
	const values = returns.map((r) => r.value);
	const mu = mean(values);
	const sigma = std(values);
	if (sigma === 0) return [];
	return returns
		.map((r) => ({
			date: r.date,
			value: r.value,
			zScore: (r.value - mu) / sigma
		}))
		.filter((item) => Math.abs(item.zScore) >= 2)
		.sort((a, b) => Math.abs(b.zScore) - Math.abs(a.zScore))
		.slice(0, 3);
}

function calculateRiskMetrics(returns: ReturnPoint[], drawdowns: ReturnPoint[], points: PreparedPoint[]) {
	if (!returns.length || !points.length) {
		return {
			averageDaily: null,
			annualizedReturn: null,
			volatilityDaily: null,
			volatilityAnnualized: null,
			sharpe: null,
			sortino: null,
			maxDrawdown: null,
			maxDrawdownDays: null
		};
	}

	const dailyReturns = returns.map((r) => r.value);
	const averageDaily = mean(dailyReturns);
	const stdDaily = std(dailyReturns);
	const annualizedReturn = (1 + averageDaily) ** TRADING_DAYS - 1;
	const volatilityAnnualized = stdDaily * Math.sqrt(TRADING_DAYS);
	const sharpe = volatilityAnnualized === 0 ? null : (annualizedReturn - RISK_FREE_RATE) / volatilityAnnualized;

	const downsideReturns = dailyReturns.filter((r) => r < 0);
	const downsideStd = downsideReturns.length ? std(downsideReturns) : 0;
	const sortino = downsideStd === 0 ? null : (annualizedReturn - RISK_FREE_RATE) / (downsideStd * Math.sqrt(TRADING_DAYS));

	const maxDrawdownPoint = drawdowns.reduce(
		(acc, curr) => (curr.value < acc.value ? curr : acc),
		{ date: returns[0].date, value: 0 }
	);

	const maxDrawdown = maxDrawdownPoint.value;

	const startPrice = points[0].close;
	const endPrice = points[points.length - 1].close;
	const buyHoldReturn = startPrice === 0 ? null : endPrice / startPrice - 1;

	return {
		averageDaily,
		annualizedReturn,
		volatilityDaily: stdDaily,
		volatilityAnnualized,
		sharpe,
		sortino,
		maxDrawdown,
		buyHoldReturn,
		daysSample: points.length
	};
}

export type CompanyDocument = {
	company: string;
	historicalData: HistoricalEntry[];
	technicalData?: any;
	createdAt?: Date | string;
};

export type EstadoReport = {
	company: string;
	generatedAt: string;
	summaryText: string;
	metrics: any;
};

export function generateEstadoReport(document: CompanyDocument): EstadoReport {
	const prepared = normalizeHistoricalData(document.historicalData || []);

	if (!prepared.length) {
		return {
			company: document.company,
			generatedAt: new Date().toISOString(),
			summaryText: `No se encontraron datos históricos para **${document.company}**.`,
			metrics: {}
		};
	}

	const simpleReturns = calculateSimpleReturns(prepared);
	const logReturns = calculateLogReturns(prepared);
	const volatility = calculateVolatility(simpleReturns);
	const drawdowns = calculateDrawdowns(prepared);
	const rsi = calculateRSI(prepared);
	const macd = calculateMACD(prepared);
	const bollinger = calculateBollinger(prepared);
	const crosses = detectCrossSignals(prepared);
	const backtest = backtestCrossStrategy(prepared);
	const volume = analyzeVolume(prepared);
	const seasonality = analyzeSeasonality(simpleReturns);
	const anomalies = detectAnomalies(simpleReturns);
	const risk = calculateRiskMetrics(simpleReturns, simpleReturns, prepared);

	const closes = prepared.map((point) => point.close);
	const priceSeriesFull = prepared.map((point, index) => ({
		date: formatDate(point.date),
		open: point.open,
		high: point.high,
		low: point.low,
		close: point.close,
		sma50: calculateSMA(closes, index, 50),
		sma200: calculateSMA(closes, index, 200)
	}));

	const priceLineSeries = takeLast(priceSeriesFull, CHART_WINDOW_POINTS).map((item) => ({
		date: item.date,
		price: item.close,
		sma50: item.sma50,
		sma200: item.sma200
	}));

	const priceCandleSeries = takeLast(priceSeriesFull, CHART_WINDOW_POINTS).map((item) => ({
		date: item.date,
		open: item.open,
		high: item.high,
		low: item.low,
		close: item.close
	}));

	const returnsSeries = takeLast(simpleReturns, CHART_WINDOW_POINTS).map((r) => ({
		date: formatDate(r.date),
		value: r.value
	}));

	const drawdownSeries = takeLast(drawdowns.series, CHART_WINDOW_POINTS).map((item) => ({
		date: formatDate(item.date),
		value: item.drawdown
	}));

	const volumeSeries = takeLast(prepared, CHART_WINDOW_POINTS).map((point) => ({
		date: formatDate(point.date),
		value: point.volume
	}));

	const lastPoint = prepared[prepared.length - 1];
	const prevPoint = prepared[prepared.length - 2];
	const latestReturn = simpleReturns[simpleReturns.length - 1]?.value ?? null;
	const latestLog = logReturns[logReturns.length - 1]?.value ?? null;

	const summaryLines: string[] = [];
	summaryLines.push(`## Estado técnico y cuantitativo de **${document.company}**`);
	summaryLines.push(`Último dato: ${formatDate(lastPoint.date)} (cierre ${formatNumber(lastPoint.close, 2)} USD)`);
	summaryLines.push('');

	summaryLines.push('### 1. Series temporales y momentum');
	summaryLines.push(
		`- Retorno diario más reciente: ${latestReturn !== null ? formatPercent(latestReturn) : 'N/D'} (${latestLog !== null ? `${formatPercent(latestLog)} log` : 'log N/D'})`
	);
	summaryLines.push(
		`- Retorno promedio diario: ${risk.averageDaily !== null ? formatPercent(risk.averageDaily) : 'N/D'} (${risk.annualizedReturn !== null ? `${formatPercent(risk.annualizedReturn)} anualizado` : 'Anualizado N/D'})`
	);
	if (rsi !== null) {
		summaryLines.push(`- RSI (14): ${formatNumber(rsi, 1)} (${rsi < 30 ? 'sobreventa' : rsi > 70 ? 'sobrecompra' : 'neutral'})`);
	}
	if (macd.macd !== null && macd.signal !== null) {
		summaryLines.push(
			`- MACD (12-26-9): línea ${formatNumber(macd.macd, 3)}, señal ${formatNumber(macd.signal, 3)}, histograma ${macd.histogram !== null ? formatNumber(macd.histogram, 3) : 'N/D'}`
		);
	}
	if (bollinger) {
		summaryLines.push(
			`- Bandas de Bollinger (20, 2σ): banda media ${formatNumber(bollinger.middle, 2)}, superior ${formatNumber(bollinger.upper, 2)}, inferior ${formatNumber(bollinger.lower, 2)}`
		);
	}

	summaryLines.push('');
	summaryLines.push('### 2. Volatilidad y drawdowns');
	summaryLines.push(
		`- Volatilidad 21 días: ${volatility.windowVol !== null ? formatPercent(volatility.windowVol) : 'N/D'} (anualizada ${volatility.annualizedVol !== null ? formatPercent(volatility.annualizedVol) : 'N/D'})`
	);
	summaryLines.push(
		`- Volatilidad histórica: ${volatility.fullVol !== null ? formatPercent(volatility.fullVol) : 'N/D'} (anualizada ${volatility.fullAnnualized !== null ? formatPercent(volatility.fullAnnualized) : 'N/D'})`
	);
	summaryLines.push(
		`- Drawdown actual: ${drawdowns.latestDrawdown !== null ? formatPercent(drawdowns.latestDrawdown) : 'N/D'}; Máximo drawdown: ${drawdowns.maxDrawdown !== null ? formatPercent(drawdowns.maxDrawdown) : 'N/D'}`
	);
	if (drawdowns.maxDrawdownStart && drawdowns.maxDrawdownTrough) {
		summaryLines.push(
			`  (desde ${formatDate(drawdowns.maxDrawdownStart)} hasta ${formatDate(drawdowns.maxDrawdownTrough)}${drawdowns.recoveryDate ? `, recuperado el ${formatDate(drawdowns.recoveryDate)}` : ', sin recuperación total aún'})`
		);
	}

	summaryLines.push('');
	summaryLines.push('### 3. Cruces y estrategias');
	summaryLines.push(
		`- SMA50: ${crosses.sma50 !== null ? formatNumber(crosses.sma50, 2) : 'N/D'} vs SMA200: ${crosses.sma200 !== null ? formatNumber(crosses.sma200, 2) : 'N/D'} → ${crosses.status}`
	);
	if (crosses.lastSignal && crosses.lastSignalDate) {
		summaryLines.push(`- Última señal: ${crosses.lastSignal} el ${formatDate(crosses.lastSignalDate)}`);
	}
	if (backtest) {
		summaryLines.push(
			`- Backtest SMA50/200 desde ${formatDate(backtest.startDate)}: estrategia ${formatPercent(backtest.strategyReturn)}, buy & hold ${formatPercent(backtest.buyHoldReturn ?? 0)}`
		);
	}

	summaryLines.push('');
	summaryLines.push('### 4. Volumen');
	summaryLines.push(
		`- Volumen medio 20 días: ${volume.average20 !== null ? volume.average20.toLocaleString('es-ES', { maximumFractionDigits: 0 }) : 'N/D'} contratos`
	);
	if (volume.peak) {
		summaryLines.push(
			`- Pico reciente: ${volume.peak.volume.toLocaleString('es-ES')} (${formatNumber(volume.peak.multiple, 2)}x sobre la media) el ${formatDate(volume.peak.date)}`
		);
	}
	summaryLines.push(`- OBV (tendencia de volumen acumulado): ${volume.obv !== null ? volume.obv.toLocaleString('es-ES') : 'N/D'}`);

	summaryLines.push('');
	summaryLines.push('### 5. Estacionalidad y autocorrelación');
	if (seasonality.weekday?.best && seasonality.weekday?.worst) {
		summaryLines.push(
			`- Mejor día: ${seasonality.weekday.best.day} (${formatPercent(seasonality.weekday.best.value)}); Peor día: ${seasonality.weekday.worst.day} (${formatPercent(seasonality.weekday.worst.value)})`
		);
	}
	if (seasonality.month?.best && seasonality.month?.worst) {
		summaryLines.push(
			`- Mejor mes: ${seasonality.month.best.month} (${formatPercent(seasonality.month.best.value)}); Peor mes: ${seasonality.month.worst.month} (${formatPercent(seasonality.month.worst.value)})`
		);
	}
	const acfLine = (seasonality.autocorrelation ?? [])
		.map((item) => (item.value !== null ? `lag ${item.lag}: ${formatNumber(item.value, 3)}` : null))
		.filter(Boolean)
		.join(' | ');
	if (acfLine) summaryLines.push(`- Autocorrelación de retornos: ${acfLine}`);
	if (seasonality.adf && seasonality.adf.statistic !== null) {
		summaryLines.push(
			`- Test ADF: estadístico ${formatNumber(seasonality.adf.statistic, 2)} vs crítico ${formatNumber(seasonality.adf.criticalValue5, 2)} → ${seasonality.adf.stationary === null ? 'N/D' : seasonality.adf.stationary ? 'serie estacionaria' : 'no se rechaza raíz unitaria'}`
		);
	}

	summaryLines.push('');
	summaryLines.push('### 6. Rendimiento y riesgo');
	summaryLines.push(
		`- Volatilidad diaria: ${risk.volatilityDaily !== null ? formatPercent(risk.volatilityDaily) : 'N/D'} (anualizada ${risk.volatilityAnnualized !== null ? formatPercent(risk.volatilityAnnualized) : 'N/D'})`
	);
	summaryLines.push(
		`- Sharpe ratio: ${risk.sharpe !== null ? formatNumber(risk.sharpe, 2) : 'N/D'} | Sortino: ${risk.sortino !== null ? formatNumber(risk.sortino, 2) : 'N/D'}`
	);
	const buyHoldText =
		risk.buyHoldReturn !== null && risk.buyHoldReturn !== undefined
			? formatPercent(risk.buyHoldReturn)
			: 'N/D';
	const sampleText = risk.daysSample !== undefined ? risk.daysSample : 'N/D';
	summaryLines.push(`- Buy & hold desde inicio de serie: ${buyHoldText} (muestra de ${sampleText} sesiones)`);

	summaryLines.push('');
	summaryLines.push('### 7. Rupturas y anomalías');
	if (anomalies.length) {
		anomalies.forEach((item) => {
			summaryLines.push(
				`- ${formatDate(item.date)}: retorno ${formatPercent(item.value)} (z-score ${formatNumber(item.zScore, 2)})`
			);
		});
	} else {
		summaryLines.push('- No se detectaron anomalías relevantes (|z| ≥ 2) en la ventana analizada.');
	}

	if (document.technicalData?.indicators?.summary?.value) {
		summaryLines.push('');
		summaryLines.push('### 8. Resumen Investing.com');
		summaryLines.push(
			`- Señal agregada: ${document.technicalData.indicators.summary.value} | Compra: ${document.technicalData.indicators.summary.buy} | Venta: ${document.technicalData.indicators.summary.sell}`
		);
	}

	const summaryText = summaryLines.join('\n');

	const metrics = {
		latest: {
			date: lastPoint.date,
			close: lastPoint.close,
			open: lastPoint.open,
			change: prevPoint ? (lastPoint.close - prevPoint.close) / prevPoint.close : null
		},
		returns: {
			latestReturn,
			latestLog,
			averageDaily: risk.averageDaily,
			annualizedReturn: risk.annualizedReturn
		},
		volatility,
		drawdowns,
		rsi,
		macd,
		bollinger,
		crosses,
		backtest,
		volume,
		seasonality,
		anomalies,
		risk,
		timeseries: {
			priceLine: priceLineSeries,
			priceCandle: priceCandleSeries,
			returns: returnsSeries,
			drawdowns: drawdownSeries,
			volume: volumeSeries
		}
	};

	return {
		company: document.company,
		generatedAt: new Date().toISOString(),
		summaryText,
		metrics
	};
}

