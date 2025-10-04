// src/components/Graph.tsx
import React from "react";
import {
  BarChart, Bar,
  LineChart, Line,
  AreaChart, Area,
  PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, CartesianGrid, Legend
} from "recharts";


type ChartType = "bar" | "line" | "area" | "pie";


interface GraphProps {
  type?: ChartType;
  data: Array<Record<string, any>>;   // datos genéricos [{ clave: valor }]
  xKey: string;                       // clave para el eje X
  yKey: string;                       // clave para los valores
  color?: string;                     
}

const Graph: React.FC<GraphProps> = ({
  type = "bar",
  data,
  xKey,
  yKey,
  color = "#8884d8",
}) => {
  
  if (!data || data.length === 0) {
    return <p>No hay datos para mostrar</p>;
  }

  switch (type) {
    case "bar":
      return (
        <BarChart width={500} height={300} data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey={xKey} />
          <YAxis />
          <Tooltip />
          <Legend />
          <Bar dataKey={yKey} fill={color} />
        </BarChart>
      );

    case "line":
      return (
        <LineChart width={500} height={300} data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey={xKey} />
          <YAxis />
          <Tooltip />
          <Legend />
          <Line type="monotone" dataKey={yKey} stroke={color} />
        </LineChart>
      );

    case "area":
      return (
        <AreaChart width={500} height={300} data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey={xKey} />
          <YAxis />
          <Tooltip />
          <Legend />
          <Area type="monotone" dataKey={yKey} stroke={color} fill={color} />
        </AreaChart>
      );

    case "pie":
      return (
        <PieChart width={400} height={400}>
          <Tooltip />
          <Legend />
          <Pie
            data={data}
            dataKey={yKey}
            nameKey={xKey}
            cx="50%"
            cy="50%"
            outerRadius={120}
            fill={color}
            label
          >
            {data.map((_, index) => (
              <Cell key={`cell-${index}`} fill={color} />
            ))}
          </Pie>
        </PieChart>
      );

    default:
      return <p>Tipo de gráfico no soportado</p>;
  }
};

export default Graph;
