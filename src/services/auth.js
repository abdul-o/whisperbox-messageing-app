import axios from "axios";

const API = "https://whisperbox.koyeb.app";

export async function register(data) {
  return axios.post(`${API}/auth/register`, data);
}

export async function login(data) {
  return axios.post(`${API}/auth/login`, data);
}