import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from "recharts";
import "../../styles/charts.css" 

interface BarChartProps {
  data: { name: string; value: number }[]; 
  color?: string; 
  title?: string; 
}

const BarChartComponent: React.FC<BarChartProps> = ({ data, color = "#4f46e5", title }) => {
  const minWidth = Math.max(300, data.length * 50);

  return (
    <div className="chart-container card shadow-sm p-3 mb-3 bg-light rounded">
      <h5 className="card-title mb-3">{title || "Gráfico de Barras"}</h5>

      {/* Contenedor con scroll horizontal si hay muchas barras */}
      <div style={{ width: '100%', overflowX: 'auto' }}>
        <div style={{ width: minWidth, height: 300 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 10, right: 20, left: 0, bottom: 10 }}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
              <XAxis dataKey="name" tick={{ fill: "#6b7280" }} />
              <YAxis tick={{ fill: "#6b7280" }} />
              <Tooltip />
              <Legend />
              <Bar dataKey="value" name="Valor" fill={color} radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default BarChartComponent;