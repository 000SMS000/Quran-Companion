import api from './axios';

export async function getSurahs() {
  const response = await api.get('/quran/surahs');
  return response.data.data;
}

export async function getSurah(number, params = {}) {
  const response = await api.get(`/quran/surahs/${number}`, { params });
  return response.data.data;
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
