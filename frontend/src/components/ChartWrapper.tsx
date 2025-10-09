import LineChart from "./LineChart";
import BarChart from "./BarChart";
import PieChart from "./PieChart";

interface ChartWrapperProps {
  tipo: string;
  data: any;
}

const ChartWrapper: React.FC<ChartWrapperProps> = ({ tipo, data }) => {
  switch (tipo) {
    case "line":
      return <LineChart data={data} />;
    case "bar":
      return <BarChart data={data} />;
    case "pie":
      return <PieChart data={data} />;
    default:
      return <p>No hay gráfico disponible para este tipo de dato.</p>;
  }
};

export default ChartWrapper;
