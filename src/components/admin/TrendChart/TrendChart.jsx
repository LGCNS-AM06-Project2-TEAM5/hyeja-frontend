import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import { toTrendSummary } from '@/api/prometheusApi';

function TrendChart({ title, points, kind, isLoading }) {
  const summary = toTrendSummary(points, kind);
  const samples = points ?? [];
  const start = samples[0]?.t ?? 0;
  const duration = (samples.at(-1)?.t ?? start) - start || 1;
  const max = Math.max(1e-9, ...samples.map(({ v }) => (Number.isFinite(v) && v >= 0 ? v : 0)));
  const segments = [];
  let segment = [];
  samples.forEach(({ t, v }) => {
    if (Number.isFinite(v) && v >= 0) {
      segment.push([((t - start) / duration) * 100, 70 - (v / max) * 68]);
    } else if (segment.length) {
      segments.push(segment);
      segment = [];
    }
  });
  if (segment.length) segments.push(segment);

  return (
    <Card component="section" aria-label={title} variant="outlined" sx={{ p: 2 }}>
      <Stack spacing={1}>
        <Typography variant="subtitle1">{title}</Typography>
        <Typography variant="body1">
          {isLoading ? '불러오는 중…' : points === null ? '불러오지 못했어요' : summary.current}
        </Typography>
        {!isLoading && points?.length > 0 && (
          <Typography variant="body2" color="text.secondary">
            최대 {summary.max}
          </Typography>
        )}
        <Box
          component="svg"
          role="img"
          aria-label={`${title} 최근 15분 추이`}
          viewBox="0 0 100 72"
          preserveAspectRatio="none"
          sx={{ height: 72, width: '100%', color: 'primary.main' }}
        >
          {segments.map((values, index) => {
            const coordinates = values.map((point) => point.join(',')).join(' ');
            return (
              <g key={index}>
                <polygon
                  points={`${values[0][0]},72 ${coordinates} ${values.at(-1)[0]},72`}
                  fill="currentColor"
                  opacity="0.08"
                />
                <polyline
                  points={coordinates}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  vectorEffect="non-scaling-stroke"
                />
              </g>
            );
          })}
        </Box>
      </Stack>
    </Card>
  );
}

export default TrendChart;
