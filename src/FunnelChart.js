import { FunnelChart, Funnel, LabelList, Tooltip, ResponsiveContainer } from 'recharts';

export default function FunnelVisualizer({ data, stages }) {
  const funnelData = data.map((value, index) => ({
    name: stages[index],
    value: value
  }));

  return (
    <div style={{ height: 400, marginBottom: "2rem" }}>
      <ResponsiveContainer width="100%" height="100%">
        <FunnelChart>
          <Tooltip />
          <Funnel
            dataKey="value"
            data={funnelData}
            isAnimationActive
            fill="#C44528"
          >
            <LabelList dataKey="name" position="inside" fill="#fff" />
          </Funnel>
        </FunnelChart>
      </ResponsiveContainer>
    </div>
  );
}
