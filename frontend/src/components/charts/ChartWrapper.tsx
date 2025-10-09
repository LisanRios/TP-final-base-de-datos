import LineChartComponent from "./LineChartComponent";
import BarChartComponent from "./BarChartComponent";
import PieChartComponent from "./PieChartComponent";

interface ChartWrapperProps {
  type: string;
  data: any;
}

const ChartWrapper: React.FC<ChartWrapperProps> = ({ type, data }) => {
  switch (type) {
    case "line":
      return <LineChartComponent data={data} />;
    case "bar":
      return <BarChartComponent data={data} />;
    case "pie":
      return <PieChartComponent data={data} />;
    default:
      return <p>No hay gráfico disponible para este tipo de dato.</p>;
  }
};

export default ChartWrapper;
