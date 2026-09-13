const { createElement, useState, useMemo, useEffect } = require('react');
const { renderToStaticMarkup } = require('react-dom/server');

// Mock getImageCandidates
function getImageCandidates(images, src) {
  return ['https://bad.jpg', 'https://good.jpg'];
}

function MediaImage({ images, src }) {
  const candidatesKey = JSON.stringify(images) + '|' + (src || '');
  const candidates = useMemo(() => getImageCandidates(images, src), [candidatesKey]);
  const [candidateIndex, setCandidateIndex] = useState(0);
  useEffect(() => { setCandidateIndex(0); }, [candidatesKey]);
  
  const activeUrl = candidates[candidateIndex] || null;
  const isFailed = candidateIndex >= candidates.length || !activeUrl;
  
  if (isFailed) return createElement('div', null, 'FALLBACK');
  
  return createElement('img', { 
    src: activeUrl, 
    onError: () => setCandidateIndex(prev => prev + 1)
  });
}

console.log(renderToStaticMarkup(createElement(MediaImage, { images: { jpg: { image_url: 'https://bad.jpg' } } })));
