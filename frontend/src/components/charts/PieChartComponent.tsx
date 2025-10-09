import { PieChart, Pie, Tooltip, Cell, ResponsiveContainer } from "recharts";
import "../../styles/charts.css"

interface Props {
    data: { name: string, value: number }[];
}

const COLORS = ["#007bff", "#28a745", "#ffc107", "#dc3545"];

export const PieChartComponent = ({ data }: Props) => (
    <div className="chart-container card shadow-sm p-3 mb-3 bg-light rounded">
        <h5 className="card-title mb-3">Distribución de activos</h5>
        <ResponsiveContainer width="100%" height={300}>
            <PieChart>
                <Pie
                    data={data}
                    dataKey="value"
                    nameKey="name"
                    outerRadius={100}
                    fill="#8884d8"
                    label
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