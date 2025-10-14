import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import "../../styles/charts.css";

interface AreaChartProps {
    data: { date: string; value: number }[];
    title?: string;
    color?: string;
}

const AreaChartComponent: React.FC<AreaChartProps> = ({
    data,
    title = "Área de evolución",
    color = "#17a2b8"
}) => {
    const minWidth = Math.max(300, data.length * 50);

    return (
        <div className="chart-container card shadow-sm p-3 mb-3 bg-light rounded">
            <h5 className="card-title mb-3">{title}</h5>

            {/* Contenedor con scroll horizontal si hay muchos datos */}
            <div style={{ width: "100%", overflowX: "auto" }}>
                <div style={{ width: minWidth, height: 300 }}>
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={data} margin={{ top: 10, right: 20, left: 0, bottom: 10 }}>
                            <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                            <XAxis dataKey="date" tick={{ fill: "#6b7280" }} />
                            <YAxis tick={{ fill: "#6b7280" }} />
                            <Tooltip />
                            <Area
                                type="monotone"
                                dataKey="value"
                                stroke={color}
                                fill={color}
                                fillOpacity={0.2}
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
};

export default AreaChartComponent;
