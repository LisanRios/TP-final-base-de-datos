import LineChartComponent from "./LineChartComponent";
import BarChartComponent from "./BarChartComponent";
import PieChartComponent from "./PieChartComponent";
import CandlestickChartComponent from "./CandleStickChartComponent";
import AreaChartComponent from "./AreaChartComponent";

import {
  normalizeLineData,
  normalizeBarData,
  normalizePieData,
  normalizeCandlestickData,
  normalizeAreaData,
} from "../../utils/dataNormalizer";

interface ChartWrapperProps {
  type: string;
  data: any;
}

const ChartWrapper: React.FC<ChartWrapperProps> = ({ type, data }) => {
  let normalizedData;

  switch (type) {
    case "line":
      normalizedData = normalizeLineData(data);
      return <LineChartComponent data={normalizedData} />;
    case "bar":
      normalizedData = normalizeBarData(data);
      return <BarChartComponent data={normalizedData} />;
    case "pie":
      normalizedData = normalizePieData(data);
      return <PieChartComponent data={normalizedData} />;
    case "candlestick":
      normalizedData = normalizeCandlestickData(data);
      return <CandlestickChartComponent data={normalizedData} />;
    case "area":
      normalizedData = normalizeAreaData(data);
      return <AreaChartComponent data={normalizedData} />;
    default:
      return null;
  }
};

export default ChartWrapper;
