const API_BASE = '/api/tmdb';
const IMAGE_BASE = 'https://image.tmdb.org/t/p';const POSTER_SIZE = 'w500';
const BACKDROP_SIZE = 'original';
const MAX_PAGES = 3;

const heroBgEl = document.getElementById('hero-bg');
const heroTitleEl = document.getElementById('hero-title');
const heroOverviewEl = document.getElementById('hero-overview');
const heroMetaEl = document.getElementById('hero-meta');
const moviesRowEl = document.getElementById('movies-row');
const genresContainerEl = document.getElementById('genres-container');
const headerEl = document.querySelector('.header');

const HANGUL_REGEX = /[\uAC00-\uD7A3]/;

function getPosterUrl(posterPath) {
  if (!posterPath) return null;
  return `${IMAGE_BASE}/${POSTER_SIZE}${posterPath}`;
}

function getBackdropUrl(backdropPath) {
  if (!backdropPath) return null;
  return `${IMAGE_BASE}/${BACKDROP_SIZE}${backdropPath}`;
}

function hasHangul(text) {
  return Boolean(text && HANGUL_REGEX.test(text));
}

function isLikelyBrokenTitle(title) {
  return Boolean(title && title.length > 60);
}

function sanitizeTitle(title, originalTitle) {
  if (!title) return '제목 없음';

  if (isLikelyBrokenTitle(title)) {
    const shortTitle = title.split(':')[0]?.trim();
    if (shortTitle && hasHangul(shortTitle) && shortTitle.length <= 40) {
      return shortTitle;
    }
  }

  return title;
}

function formatRating(voteAverage) {
  return voteAverage ? voteAverage.toFixed(1) : '없음';
}

function formatDate(dateString) {
  if (!dateString) return '미정';
  const [year, month, day] = dateString.split('-').map(Number);
  return `${year}년 ${month}월 ${day}일`;
}

function setHero(movie, genreMap) {
  const backdrop = getBackdropUrl(movie.backdrop_path) || getPosterUrl(movie.poster_path);
  if (backdrop) {
    heroBgEl.style.backgroundImage = `url(${backdrop})`;
  }

  const genres = (movie.genre_ids || [])
    .map((id) => genreMap[id])
    .filter(Boolean)
    .join(' · ');

  heroTitleEl.textContent = movie.title;
  heroOverviewEl.textContent = movie.overview?.trim() || '줄거리 정보가 없습니다.';
  heroMetaEl.innerHTML = `
    <span class="hero__rating">평점 ${formatRating(movie.vote_average)}</span>
    <span>개봉 ${formatDate(movie.release_date)}</span>
    ${genres ? `<span class="hero__genres">${genres}</span>` : ''}
  `;
}

function createMovieCard(movie, genreMap) {
  const card = document.createElement('article');
  card.className = 'movie-card';
  card.setAttribute('role', 'listitem');

  const posterUrl = getPosterUrl(movie.poster_path);
  const posterMarkup = posterUrl
    ? `<img class="movie-card__poster" src="${posterUrl}" alt="${movie.title} 포스터" loading="lazy">`
    : `<div class="movie-card__no-poster">포스터 없음</div>`;

  card.innerHTML = `
    <div class="movie-card__poster-wrap">
      ${posterMarkup}
      <span class="movie-card__rating">평점 ${formatRating(movie.vote_average)}</span>
    </div>
    <h3 class="movie-card__title">${movie.title}</h3>
  `;

  card.addEventListener('click', () => setHero(movie, genreMap));

  return card;
}

function renderMovieRow(container, movies, genreMap) {
  container.innerHTML = '';
  container.setAttribute('role', 'list');

  movies.forEach((movie) => {
    container.appendChild(createMovieCard(movie, genreMap));
  });
}

function groupMoviesByGenre(movies, genreMap) {
  const groups = new Map();

  movies.forEach((movie) => {
    (movie.genre_ids || []).forEach((genreId) => {
      const genreName = genreMap[genreId];
      if (!genreName) return;

      if (!groups.has(genreId)) {
        groups.set(genreId, { id: genreId, name: genreName, movies: [] });
      }

      const group = groups.get(genreId);
      if (!group.movies.some((item) => item.id === movie.id)) {
        group.movies.push(movie);
      }
    });
  });

  return Array.from(groups.values()).sort((a, b) => {
    if (b.movies.length !== a.movies.length) {
      return b.movies.length - a.movies.length;
    }
    return a.name.localeCompare(b.name, 'ko');
  });
}

function renderGenreSections(movies, genreMap) {
  genresContainerEl.innerHTML = '';
  const genreGroups = groupMoviesByGenre(movies, genreMap);

  genreGroups.forEach((group) => {
    const section = document.createElement('section');
    section.className = 'movies genre-section';

    const title = document.createElement('h2');
    title.className = 'section__title';
    title.textContent = `${group.name} (${group.movies.length}편)`;

    const row = document.createElement('div');
    row.className = 'movies__row';

    renderMovieRow(row, group.movies, genreMap);

    section.appendChild(title);
    section.appendChild(row);
    genresContainerEl.appendChild(section);
  });
}

function showError(message) {
  moviesRowEl.innerHTML = `
    <div class="error">
      <p class="error__title">영화를 불러올 수 없습니다</p>
      <p>${message}</p>
    </div>
  `;
  genresContainerEl.innerHTML = '';
  heroTitleEl.textContent = '오류가 발생했습니다';
  heroOverviewEl.textContent = '';
  heroMetaEl.innerHTML = '';
}

async function fetchJson(path, params = {}) {
  const searchParams = new URLSearchParams({ path });

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      searchParams.set(key, String(value));
    }
  });

  const response = await fetch(`${API_BASE}?${searchParams.toString()}`);

  if (!response.ok) {
    throw new Error(`API 요청 실패 (${response.status})`);
  }

  return response.json();
}

async function fetchGenres() {
  const data = await fetchJson('genre/movie/list', { language: 'ko-KR' });  const genreMap = {};

  (data.genres || []).forEach((genre) => {
    genreMap[genre.id] = genre.name;
  });

  return genreMap;
}

async function fetchNowPlayingPages() {
  const pageRequests = Array.from({ length: MAX_PAGES }, (_, index) =>
    fetchJson('movie/now_playing', {
      language: 'ko-KR',
      region: 'KR',
      page: index + 1,
    }),
  );
  const pages = await Promise.all(pageRequests);
  const movieMap = new Map();

  pages.forEach((page) => {
    (page.results || []).forEach((movie) => {
      if (!movieMap.has(movie.id)) {
        movieMap.set(movie.id, movie);
      }
    });
  });

  return Array.from(movieMap.values());
}

async function resolveKoreanMovieInfo(movie) {
  const needsTitleFix = !hasHangul(movie.title) || isLikelyBrokenTitle(movie.title);
  const needsOverviewFix = !movie.overview?.trim();

  let title = sanitizeTitle(movie.title, movie.original_title);
  let overview = movie.overview || '';

  if (needsTitleFix || needsOverviewFix) {
    try {
      const detail = await fetchJson(`movie/${movie.id}`, { language: 'ko-KR' });
      title = sanitizeTitle(
        hasHangul(detail.title) ? detail.title : title,
        movie.original_title,
      );
      overview = detail.overview?.trim() || overview;
    } catch {
      // 목록 데이터 그대로 사용
    }
  }

  return {
    ...movie,
    title,
    overview,
  };
}

async function localizeMovies(movies) {
  const localized = await Promise.all(movies.map(resolveKoreanMovieInfo));

  return localized.filter((movie) => hasHangul(movie.title));
}

async function fetchNowPlaying() {
  try {
    const [genreMap, rawMovies] = await Promise.all([fetchGenres(), fetchNowPlayingPages()]);
    const movies = await localizeMovies(rawMovies);

    if (movies.length === 0) {
      showError('한국어 제목이 있는 현재 상영작을 찾지 못했습니다.');
      return;
    }

    setHero(movies[0], genreMap);
    renderMovieRow(moviesRowEl, movies, genreMap);
    renderGenreSections(movies, genreMap);
  } catch (error) {
    showError(error.message);
  }
}

window.addEventListener('scroll', () => {
  headerEl.classList.toggle('header--scrolled', window.scrollY > 50);
});

fetchNowPlaying();
