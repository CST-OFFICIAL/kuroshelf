const fs = require('fs');
let content = fs.readFileSync('src/components/AdvancedSearchView.tsx', 'utf-8');

content = content.replace(
  `  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
      setPage(1); // Reset page on new search
      setResults([]);
    }, 500);
    return () => clearTimeout(timer);
  }, [query, status, type, orderBy, sort]);`,
  `  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
    }, 500);
    return () => clearTimeout(timer);
  }, [query]);`
);

content = content.replace(
  `queryParams.set('page', isLoadMore ? String(page + 1) : String(page));`,
  `queryParams.set('page', isLoadMore ? String(page + 1) : '1');`
);

content = content.replace(
  `  useEffect(() => {
    fetchResults(false);
  }, [debouncedQuery, status, type, orderBy, sort]); // initial fetch`,
  `  useEffect(() => {
    setResults([]);
    fetchResults(false);
  }, [debouncedQuery, status, type, orderBy, sort]); // initial fetch`
);

fs.writeFileSync('src/components/AdvancedSearchView.tsx', content);
