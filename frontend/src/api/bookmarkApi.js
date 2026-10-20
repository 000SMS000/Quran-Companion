import api from './axios';

export async function getBookmarks() {
  const response = await api.get('/bookmarks');
  return response.data.data;
}

export async function saveBookmark(surahNumber, ayahNumber) {
  const response = await api.post('/bookmarks', {
    surah_number: surahNumber,
    ayah_number: ayahNumber,
  });

  return response.data.data;
}

export async function deleteBookmark(bookmarkId) {
  const response = await api.delete(`/bookmarks/${bookmarkId}`);
  return response.data;
}
