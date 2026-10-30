import Box from '@mui/material/Box';

/** public/illustrations의 장식용 그림. 뜻을 전하지 않으므로 보조기기에는 숨긴다. */
function Illustration({ name, sx }) {
  return (
    <Box
      component="img"
      src={`${import.meta.env.BASE_URL}illustrations/${name}.svg`}
      alt=""
      aria-hidden="true"
      sx={{ display: 'block', maxWidth: '100%', height: 'auto', userSelect: 'none', ...sx }}
    />
  );
}

export default Illustration;
