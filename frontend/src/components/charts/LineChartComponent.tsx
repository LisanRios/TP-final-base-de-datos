import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import "../../styles/charts.css"

interface Props {
    data: { date: string, price: number }[];
}

export const LineChartComponent = ({ data }: Props) => {
    const minWidth = Math.max(300, data.length * 50);

    return (
        <div className="chart-container card shadow-sm p-3 mb-3 bg-light rounded">
            <h5 className="card-title mb-3">Evolución del precio</h5>

            {/* Contenedor con scroll horizontal si hay muchos datos */}
            <div style={{ width: "100%", overflowX: "auto" }}>
                <div style={{ width: minWidth, height: 300 }}>
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={data} margin={{ top: 10, right: 20, left: 0, bottom: 10 }}>
                            <XAxis dataKey="date" tick={{ fill: "#6b7280" }} />
                            <YAxis tick={{ fill: "#6b7280" }} />
                            <Tooltip />
                            <Line type="monotone" dataKey="price" stroke="#007bff" strokeWidth={2} dot={false} />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
};

export default LineChartComponent;
