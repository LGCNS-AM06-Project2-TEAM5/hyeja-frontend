const NATIONWIDE_LABEL = '전국';

/**
 * 정책 대상 지역을 목록 한 칸에 들어가도록 요약한다.
 * 지역이 여럿이면 "첫 지역 외 N곳"으로 줄이고, 첫 지역은 회원 거주지를 우선하며 없으면 지역 코드 순서를 따른다.
 */
export const summarizePolicyRegions = ({
  regions = [],
  nationwide = false,
  memberRegionCode = null,
}) => {
  if (nationwide || regions.length === 0) {
    return { label: NATIONWIDE_LABEL, regionLabels: [] };
  }

  const sortedRegions = [...regions].sort((first, second) =>
    String(first.region_code).localeCompare(String(second.region_code)),
  );
  const regionLabels = sortedRegions.map((region) => region.region_name);

  if (sortedRegions.length === 1) {
    return { label: regionLabels[0], regionLabels };
  }

  const leadingRegion =
    sortedRegions.find((region) => region.region_code === memberRegionCode) ?? sortedRegions[0];

  return { label: `${leadingRegion.region_name} 외 ${sortedRegions.length - 1}곳`, regionLabels };
};
