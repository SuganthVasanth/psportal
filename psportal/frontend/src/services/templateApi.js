import API from "./api";

const BASE = "/api/templates";

export const templateApi = {
  getAll(search = "") {
    const params = search ? { search: search.trim() } : {};
    return API.get(BASE, { params }).then((res) => res.data);
  },
  getById(id) {
    return API.get(`${BASE}/${id}`).then((res) => res.data);
  },
  create(body) {
    return API.post(BASE, body).then((res) => res.data);
  },
  update(id, body) {
    return API.put(`${BASE}/${id}`, body).then((res) => res.data);
  },
  delete(id) {
    return API.delete(`${BASE}/${id}`).then((res) => res.data);
  },
};
