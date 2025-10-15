import { PieChart, Pie, Tooltip, Cell, ResponsiveContainer } from "recharts";
import "../../styles/charts.css";

interface Props {
    data: { name: string; value: number }[];
}

const COLORS = [
    "#007bff", "#28a745", "#ffc107", "#dc3545",
    "#6f42c1", "#fd7e14", "#20c997", "#6610f2",
];

export const PieChartComponent = ({ data }: Props) => {
    const minRadius = 60;
    const maxRadius = 120;
    const step = 3;

    let outerRadius = minRadius + data.length * step;
    if (outerRadius > maxRadius) outerRadius = maxRadius;

    const fontSize =
        data.length >= 20 ? 8 :
        data.length >= 10 ? 10 :
        12;
    const labelOffset = 25;

    return (
        <div
            className="chart-container card shadow-sm p-3 mb-3 bg-light rounded"
            style={{ minWidth: 400 }}
        >
            <h5 className="card-title mb-3">Distribución de activos</h5>
            <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                    <Pie
                        data={data}
                        dataKey="value"
                        nameKey="name"
                        outerRadius={outerRadius}
                        fill="#8884d8"
                        label={({ cx, cy, midAngle, outerRadius, name, percent, index }) => {
                            const RADIAN = Math.PI / 180;
                            const radius = outerRadius + labelOffset;
                            const x = cx + radius * Math.cos(-midAngle * RADIAN);
                            const y = cy + radius * Math.sin(-midAngle * RADIAN);

                            const fillColor = COLORS[index % COLORS.length];

                            return (
                                <text
                                    x={x}
                                    y={y}
                                    fill={fillColor}
                                    fontSize={fontSize}
                                    textAnchor={x > cx ? "start" : "end"}
                                    dominantBaseline="central"
                                >
                                    {name} ({(percent * 100).toFixed(1)}%)
                                </text>
                            );
                        }}
                        labelLine={true}
                    >
                        {data.map((_, index) => (
                            <Cell key={index} fill={COLORS[index % COLORS.length]} />
                        ))}
                    </Pie>
                    <Tooltip />
                </PieChart>
            </ResponsiveContainer>
        </div>
    );
};

export default PieChartComponent;
