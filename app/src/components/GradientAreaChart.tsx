import {
  Area,
  AreaChart,
  CartesianGrid,
  Rectangle,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type AreaDataElement = {
  name: string;
  value: number;
};

export const GradientAreaChart: React.FC<{
  data?: AreaDataElement[];
}> = ({ data }) => {
  const maxValue = data?.reduce((a, b) => (b.value > a ? b.value : a), 0) ?? 0;

  return (
    <ResponsiveContainer>
      <AreaChart
        width={800}
        height={300}
        data={data}
        margin={{ top: 0, right: 5, left: -10, bottom: 0 }}
      >
        <defs>
          <linearGradient id="gradientAreaChart" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#f87171" stopOpacity={0.05} />
            <stop offset="95%" stopColor="#f87171" stopOpacity={0.05} />
          </linearGradient>
        </defs>
        <Tooltip cursor={<CustomCursor maxValue={maxValue} />} />
        <Area
          dot={<></>}
          type="monotone"
          dataKey="value"
          stroke="#7f1d1d"
          strokeWidth={3}
          fillOpacity={1}
          fill="#7f1d1d0f"
        />

        <CartesianGrid vertical={false} opacity={0.2} strokeDasharray="10 10" />

        {/* 
          TODO: Change colors based on theme 
          <XAxis stroke={ darkTheme ? "#f1f5f9" : "#27272a"} />
          <YAxis stroke={ darkTheme ? "#f1f5f9" : "#27272a"} /> 
          */}
        <XAxis dataKey="name" stroke="#f1f5f9" opacity={0.7} tickLine={false} />
        <YAxis stroke="#f1f5f9" opacity={0.7} tickLine={false} />
      </AreaChart>
    </ResponsiveContainer>
  );
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const CustomCursor = (props: any) => {
  const {
    points,
    height,
    maxValue,
    payload: [{ value }],
  } = props;

  // TODO: Change colors based on theme
  // const backgroundColor = darkTheme ? "#1f293700" : "#ffffff00";
  const backgroundColor = "#1f293700";

  const percentage = (1 - value / (maxValue * 1.05)) * 100;

  return (
    <>
      <defs>
        <linearGradient id="strokeGradient" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={backgroundColor} />
          <stop offset={`${percentage}%`} stopColor="#7f1d1da0" />
          <stop offset="100%" stopColor={backgroundColor} />
        </linearGradient>
      </defs>
      <Rectangle
        fill="url(#strokeGradient)"
        x={points[0].x - 10}
        y={points[0].y}
        width={20}
        height={height}
      />
    </>
  );
};
