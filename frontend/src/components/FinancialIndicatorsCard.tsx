import React from "react";
import "../styles/FinancialIndicatorsCard.css";

type Indicator = {
    name: string;
    value: number | string;
};

type Props = {
    indicators: Indicator[];
};

const FinancialIndicatorsCard: React.FC<Props> = ({ indicators }) => {
    return (
        <div className="indicators-container">
            {indicators.map((ind, i) => (
                <div key={i} className="indicator-card">
                    <span className="indicator-name">{ind.name}</span>
                    <span className="indicator-value">{ind.value}</span>
                </div>
            ))}
        </div>
    );
};

export default FinancialIndicatorsCard;
