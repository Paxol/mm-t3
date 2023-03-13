import React, { useCallback, useState } from "react";
import { Pie, PieChart, ResponsiveContainer, Sector } from "recharts";

type DoughnutProps = {
  data: DoughnutDataElement[];
  fill: string;
  activeIndex?: number;
};

type DoughnutDataElement = {
  name: string;
  value: number;
};

export const Doughnut: React.FC<DoughnutProps> = ({ data, fill, activeIndex }) => {
  const [hoverIndex, setHoverIndex] = useState(0);

  const onPieEnter = useCallback((_: any, index: number) => {
    setHoverIndex(index);
  }, []);

  return (
    <ResponsiveContainer width="100%" height="100%">
      <PieChart width={300} height={300}>
        <Pie
          activeIndex={activeIndex ?? hoverIndex}
          activeShape={ActiveShape}
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={90}
          outerRadius={120}
          fill={fill}
          dataKey="value"
          onMouseEnter={onPieEnter} />
      </PieChart>
    </ResponsiveContainer>
  );
};

const ActiveShape = (props: any) => {
  const {
    cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill, payload, percent, value,
  } = props;

  return (
    <g>
      <text
        className="fill-black dark:fill-white"
        x={cx}
        y={cy - 20}
        dy={8}
        textAnchor="middle"
      >
        {payload.name}
      </text>
      <text
        className="fill-black dark:fill-white"
        x={cx}
        y={cy}
        dy={8}
        textAnchor="middle"
      >
        {`${Number(value).toFixed(2)}`}
      </text>
      <text
        className="fill-black dark:fill-white"
        x={cx}
        y={cy + 12}
        dy={16}
        textAnchor="middle"
      >
        {`(${(percent * 100).toFixed(2)}%)`}
      </text>
      <Sector
        cx={cx}
        cy={cy}
        innerRadius={innerRadius}
        outerRadius={outerRadius}
        startAngle={startAngle}
        endAngle={endAngle}
        fill={fill} />
      <Sector
        cx={cx}
        cy={cy}
        startAngle={startAngle}
        endAngle={endAngle}
        innerRadius={outerRadius + 6}
        outerRadius={outerRadius + 10}
        fill={fill} />
    </g>
  );
};
