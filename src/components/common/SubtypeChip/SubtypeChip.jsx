import Chip from '@mui/material/Chip';

function SubtypeChip({ label, isSelected = false, onClick }) {
  return (
    <Chip
      label={label}
      variant={isSelected ? 'filled' : 'outlined'}
      color={isSelected ? 'primary' : 'default'}
      clickable={Boolean(onClick)}
      onClick={onClick}
      sx={{
        height: 34,
        px: 0.5,
        fontWeight: 700,
        ...(!isSelected && {
          bgcolor: 'rgba(255, 255, 255, 0.85)',
          borderColor: 'rgba(101, 88, 211, 0.22)',
          color: 'primary.main',
          '&&:hover': { bgcolor: 'common.white', borderColor: 'primary.main' },
        }),
      }}
    />
  );
}

export default SubtypeChip;
