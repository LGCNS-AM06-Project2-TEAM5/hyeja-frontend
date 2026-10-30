import Box from '@mui/material/Box';
import Pagination from '@mui/material/Pagination';

/** 홈 정책 목록과 같은 모양의 번호 페이지 이동. 한 페이지뿐이면 그리지 않는다. */
function ListPagination({ page, totalPages, onPageChange }) {
  if (totalPages <= 1) {
    return null;
  }

  return (
    <Box sx={{ display: 'flex', justifyContent: 'center', pt: 3 }}>
      <Pagination
        page={page}
        count={totalPages}
        onChange={(event, value) => onPageChange(value)}
        shape="rounded"
      />
    </Box>
  );
}

export default ListPagination;
