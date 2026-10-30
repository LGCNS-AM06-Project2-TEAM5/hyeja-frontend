import Box from '@mui/material/Box';

/** public/icons의 단색 SVG를 현재 글자색으로 표시한다. */
function AppIcon({ name, size = 20, sx, className }) {
  const iconUrl = `${import.meta.env.BASE_URL}icons/${name}.svg`;

  return (
    <Box
      component="span"
      aria-hidden="true"
      className={className}
      sx={{
        display: 'inline-block',
        width: size,
        height: size,
        flexShrink: 0,
        verticalAlign: 'middle',
        backgroundColor: 'currentColor',
        mask: `url("${iconUrl}") center / contain no-repeat`,
        WebkitMask: `url("${iconUrl}") center / contain no-repeat`,
        ...sx,
      }}
    />
  );
}

export default AppIcon;
