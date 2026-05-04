import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { motion } from 'framer-motion';

export default function SpeedGraph({ data }) {
  if (!data || data.length === 0) return null;

  return (
    <motion.div 
      className="speed-graph-container"
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 180 }}
      transition={{ duration: 0.5 }}
      style={{ marginTop: '2rem', width: '100%', maxWidth: '600px', margin: '2rem auto 0' }}
    >
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="colorDownload" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.8}/>
              <stop offset="95%" stopColor="#06b6d4" stopOpacity={0}/>
            </linearGradient>
            <linearGradient id="colorUpload" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.8}/>
              <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <XAxis dataKey="time" hide={true} />
          <YAxis stroke="var(--text-muted)" fontSize={11} tickFormatter={(val) => Math.round(val)} />
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: 'var(--bg-secondary)', 
              border: '1px solid var(--border)', 
              borderRadius: '8px',
              fontSize: '12px'
            }}
            itemStyle={{ color: 'var(--text-primary)' }}
            labelStyle={{ display: 'none' }}
          />
          <Area 
            type="monotone" 
            dataKey="download" 
            stroke="#06b6d4" 
            strokeWidth={2}
            fillOpacity={1} 
            fill="url(#colorDownload)" 
            isAnimationActive={false}
          />
          <Area 
            type="monotone" 
            dataKey="upload" 
            stroke="#8b5cf6" 
            strokeWidth={2}
            fillOpacity={1} 
            fill="url(#colorUpload)" 
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </motion.div>
  );
}
