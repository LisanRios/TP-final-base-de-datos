import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import "../../styles/charts.css";

interface AreaChartProps {
    data: { date: string; value: number }[];
    title?: string;
    color?: string;
}

const AreaChartComponent: React.FC<AreaChartProps> = ({ data, title = "Área de evolución", color = "#17a2b8" }) => (
    <div className="chart-container card shadow-sm p-3 mb-3 bg-light rounded">
        <h5 className="card-title mb-3">{title}</h5>
        <ResponsiveContainer width="100%" height={300}>
        <AreaChart data={data} margin={{ top: 10, right: 20, left: 0, bottom: 10 }}>
            <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
            <XAxis dataKey="date" tick={{ fill: "#6b7280" }} />
            <YAxis tick={{ fill: "#6b7280" }} />
            <Tooltip />
            <Area type="monotone" dataKey="value" stroke={color} fill={color} fillOpacity={0.2} />
        </AreaChart>
        </ResponsiveContainer>
    </div>
);

export default AreaChartComponent;
