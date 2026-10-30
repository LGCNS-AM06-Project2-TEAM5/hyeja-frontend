import { Fragment } from 'react';
import Box from '@mui/material/Box';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';

/**
 * 설계서 S-06: 밑줄 친 단어에 마우스를 올리면 쉬운 설명이 나온다.
 * 문장에서 사전에 있는 용어를 찾아 툴팁을 붙인다.
 */
const escapeRegExp = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const splitByTerms = (text, terms) => {
  const names = [...new Set(terms.map((term) => term.term).filter(Boolean))].sort(
    (first, second) => second.length - first.length,
  );

  if (names.length === 0) {
    return [{ text }];
  }

  const pattern = new RegExp(`(${names.map(escapeRegExp).join('|')})`, 'g');

  return text.split(pattern).map((chunk) => ({
    text: chunk,
    term: terms.find((term) => term.term === chunk),
  }));
};

function TermText({ text, terms = [] }) {
  if (!text) {
    return null;
  }

  return (
    <Typography variant="body1" sx={{ whiteSpace: 'pre-line' }}>
      {splitByTerms(text, terms).map((chunk, index) => {
        if (!chunk.term) {
          return <Fragment key={index}>{chunk.text}</Fragment>;
        }

        return (
          <Tooltip
            key={index}
            arrow
            title={
              <Box sx={{ p: 0.5 }}>
                <Typography variant="body2" sx={{ color: 'common.white' }}>
                  {chunk.term.term}
                </Typography>
                <Typography variant="body1" sx={{ color: 'common.white', mt: 0.5 }}>
                  {chunk.term.easyDescription}
                </Typography>
                {chunk.term.example && (
                  <Typography
                    variant="caption"
                    sx={{ color: 'grey.400', display: 'block', mt: 0.5 }}
                  >
                    {chunk.term.example}
                  </Typography>
                )}
              </Box>
            }
          >
            <Box
              component="span"
              sx={{ textDecoration: 'underline', textUnderlineOffset: 3, cursor: 'help' }}
            >
              {chunk.text}
            </Box>
          </Tooltip>
        );
      })}
    </Typography>
  );
}

export default TermText;
