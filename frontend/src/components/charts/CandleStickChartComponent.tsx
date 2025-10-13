import { ComposedChart, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Rectangle, Line, Customized, Scatter } from "recharts";
import "../../styles/charts.css";

interface CandleData {
    date: string;
    open: number;
    close: number;
    high: number;
    low: number;
    index: number;
}

interface CandlestickChartProps {
    data: CandleData[];
    title?: string;
    upColor?: string;
    downColor?: string;
}

// Componente personalizado de velas
const CustomCandles: React.FC<any> = (props) => {
    const { data, upColor = "#28a745", downColor = "#dc3545", xAxisMap, yAxisMap } = props;

    if (!data || data.length === 0) return null;

    // Escalas correctas
    const xScale = xAxisMap?.[0]?.scale;
    const yScale = yAxisMap?.[0]?.scale;
    if (!xScale || !yScale) return null;

    const candleWidth = 10;

    return (
        <g>
            {data.map((entry: CandleData, index: number) => {
                const isUp = entry.close >= entry.open;
                const color = isUp ? upColor : downColor;

                const x = xScale(index);

                const openY = yScale(entry.open);
                const closeY = yScale(entry.close);
                const highY = yScale(entry.high);
                const lowY = yScale(entry.low);

                const bodyY = Math.min(openY, closeY);
                const bodyHeight = Math.max(Math.abs(openY - closeY), 1);

                return (
                    <g key={entry.index}>
                        {/* Mecha */}
                        <Line
                            x1={x}
                            y1={highY}
                            x2={x}
                            y2={lowY}
                            stroke={color}
                            strokeWidth={2}
                        />
                        {/* Cuerpo */}
                        <Rectangle
                            x={x - candleWidth / 2}
                            y={bodyY}
                            width={candleWidth}
                            height={bodyHeight}
                            fill={color}
                        />
                    </g>
                );
            })}
        </g>
    );
};

// Componente principal
const CandlestickChartComponent: React.FC<CandlestickChartProps> = ({
    data,
    title = "Candlestick Chart",
    upColor = "#28a745",
    downColor = "#dc3545",
}) => {
    const minWidth = Math.max(300, data.length * 40 + 50);

    // Calculamos padding para que las velas no toquen el eje X
    const dataMin = Math.min(...data.map(d => d.low));
    const dataMax = Math.max(...data.map(d => d.high));
    const padding = (dataMax - dataMin) * 0.05; // 5% de espacio arriba y abajo

    return (
        <div className="chart-container card shadow-sm p-3 mb-3 bg-light rounded">
            <h5 className="card-title mb-3">{title}</h5>

            <div style={{ width: "100%", overflowX: "auto" }}>
                <div style={{ width: minWidth, height: 300 }}>
                    <ResponsiveContainer width="100%" height="100%">
                        <ComposedChart
                            data={data}
                            margin={{ top: 10, right: 20, left: 0, bottom: 50 }} // bottom aumentado
                        >
                            <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                            <XAxis
                                dataKey="index"
                                tick={{ fill: "#6b7280", fontSize: 10 }}
                                angle={-45}
                                textAnchor="end"
                                interval={0}
                                tickLine={false}
                                height={50}
                                scale="point"
                                padding={{ left: 15, right: 15 }}
                                tickFormatter={(index) =>
                                    data.find((d) => d.index === index)?.date || ""
                                }
                            />
                            <YAxis
                                tick={{ fill: "#6b7280" }}
                                domain={[dataMin - padding, dataMax + padding]} // padding extra
                                allowDataOverflow={false}
                            />
                            <Tooltip
                                labelFormatter={(label) =>
                                    data.find((d) => d.index === label)?.date ||
                                    `Día ${label}`
                                }
                            />

                            {/* Invisible scatter para espacio */}
                            <Scatter
                                dataKey="high"
                                fill="#000000"
                                fillOpacity={0}
                                strokeOpacity={0}
                                isAnimationActive={false}
                            />

                            {/* Velas personalizadas */}
                            <Customized
                                component={CustomCandles}
                                data={data}
                                upColor={upColor}
                                downColor={downColor}
                            />
                        </ComposedChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
};

export default CandlestickChartComponent;
