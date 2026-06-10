const ALLOWED_PATHS = [
  /^genre\/movie\/list$/,
  /^movie\/now_playing$/,
  /^movie\/\d+$/,
];

module.exports = async (req, res) => {
  const apiKey = process.env.TMDB_API_KEY;

  if (!apiKey) {
    res.status(500).json({ error: 'TMDB_API_KEY 환경 변수가 설정되지 않았습니다.' });
    return;
  }

  const { path, ...query } = req.query;

  if (!path || typeof path !== 'string') {
    res.status(400).json({ error: 'path 쿼리가 필요합니다.' });
    return;
  }

  const isAllowed = ALLOWED_PATHS.some((pattern) => pattern.test(path));
  if (!isAllowed) {
    res.status(403).json({ error: '허용되지 않은 API 경로입니다.' });
    return;
  }

  const url = new URL(`https://api.themoviedb.org/3/${path}`);
  url.searchParams.set('api_key', apiKey);

  Object.entries(query).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      url.searchParams.set(key, String(value));
    }
  });

  try {
    const response = await fetch(url);
    const data = await response.json();
    res.status(response.status).json(data);
  } catch {
    res.status(502).json({ error: 'TMDB API 요청에 실패했습니다.' });
  }
};
