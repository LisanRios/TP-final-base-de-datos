import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import "../../styles/charts.css"

interface Props {
    data: { date: string, price: number }[];
}

export const LineChartComponent = ({ data }: Props) => (
    <div className="chart-container card shadow-sm p-3 mb-3 bg-light rounded">
        <h5 className="card-title mb-3">Evolución del precio</h5>
        <ResponsiveContainer width="100%" height={300}>
            <LineChart data={data}>
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="precio" stroke="#007bff" strokeWidth={2} dot={false} />
            </LineChart>
        </ResponsiveContainer>
    </div>
);