import api from './axios';

const surahAudioRequests = new Map();

export async function getSurahs() {
  const response = await api.get('/quran/surahs');
  return response.data.data;
}

export async function getSurah(number, params = {}) {
  const response = await api.get(`/quran/surahs/${number}`, { params });
  return response.data.data;
}

export function getSurahAudio(number, edition) {
  const key = `${number}:${edition}`;
  const pendingRequest = surahAudioRequests.get(key);

  if (pendingRequest) {
    return pendingRequest;
  }

  const request = api
    .get(`/quran/surahs/${number}/audio`, { params: { edition } })
    .then((response) => response.data.data)
    .finally(() => {
      if (surahAudioRequests.get(key) === request) {
        surahAudioRequests.delete(key);
      }
    });

  surahAudioRequests.set(key, request);
  return request;
}

export async function getEditions(params = {}) {
  const response = await api.get('/quran/editions', { params });
  return response.data.data;
}

export async function searchQuran(query, params = {}) {
  const response = await api.get('/quran/search', {
    params: {
      q: query,
      ...params,
    },
  });
  return response.data.data;
}

export async function getAudioEditions() {
  const response = await api.get('/quran/audio-editions');
  return response.data.data;
}
