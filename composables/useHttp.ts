import axios from 'axios';
import { computed, ref } from '#build/imports';

const Axios = axios.create({
  baseURL: 'https://api.staging.betufantasy.com',
});
const request: typeof Axios.request = Axios.request.bind(Axios);

const adminToken = ref<string>();
const isAuth = computed(() => !!adminToken.value);

const login = async (username: string, password: string) => {
  const { data } = await request({
    url: '/api/v1/auth/signin',
    method: 'POST',
    data: { username, password },
  });
  return data.data;
};

type CreateUser = {
  username: string;
  password: string;
  email: string;
};
const createUser = async (data: CreateUser) => {
  const res = await request({
    url: '/api/v1/fantasy/admin/create-user',
    method: 'POST',
    data,
    headers: {
      authorization: `Bearer ${adminToken.value}`,
    },
  });
  return res.data;
};

const authAdmin = async (username: string, password: string) => {
  const result = await login(username, password);
  adminToken.value = result.access_token;
  console.log('res', result);
};

const getAvailableBetu = async (userToken: string) => {
  const res = await request({
    url: '/api/v3/wallet/get-available-betu',
    method: 'GET',
    headers: {
      authorization: `Bearer ${userToken}`,
    },
  });
  return res.data.data;
};

const joinRound = async (userToken: string, balance: string) => {
  const res = await request({
    url: '/api/v3/fantasy/join-round',
    method: 'POST',
    data: { balance_hold: balance },
    headers: {
      authorization: `Bearer ${userToken}`,
    },
  });
  return res.data.data;
};

const getCurrentRound = async (userToken: string) => {
  const res = await request({
    url: '/api/v3/fantasy/get-current-round',
    method: 'GET',
    headers: {
      authorization: `Bearer ${userToken}`,
    },
  });
  return res.data.data;
};

const getConfigs = async () => {
  const res = await request({
    url: '/api/v3/fantasy-configs/get-all-configs',
    method: 'GET',
  });
  return res.data.data;
};

const getMyBets = async (userToken: string) => {
  const res = await request({
    url: '/api/v3/bet/get-my-bet',
    method: 'POST',
    data: {
      status: 4,
      page_index: 1,
      page_size: 100,
    },
    headers: {
      authorization: `Bearer ${userToken}`,
    },
  });
  return [res.data.data.items, res.data.data.meta.total_count];
};

type PlaceBet = {
  data: {
    bet_game_id: string;
    fixture_id: string;
    odds: string;
    stake: string;
  }[];
};
const placeBet = async (userToken: string, data: PlaceBet) => {
  const res = await request({
    url: '/api/v3/bet/place-bet',
    method: 'POST',
    data,
    headers: {
      authorization: `Bearer ${userToken}`,
    },
  });
  return res.data.data;
};

type PlaceMultiBet = {
  stake: string;
  data: { bet_game_id: string; fixture_id: string; odds: string }[];
};
const placeMultiBet = async (userToken: string, data: PlaceMultiBet) => {
  const res = await request({
    url: '/api/v3/bet/place-multi-bet',
    method: 'POST',
    data,
    headers: {
      authorization: `Bearer ${userToken}`,
    },
  });
  return res.data.data;
};

const getFixtureDetail = async (fixtureId: string) => {
  const res = await request({
    url: '/api/v4/get-detail-fixture',
    method: 'POST',
    data: { br_fixture_id: fixtureId },
  });
  return res.data.data;
};

export const useHttp = () => {
  return {
    authAdmin,
    login,
    createUser,
    isAuth,
    getAvailableBetu,
    getCurrentRound,
    joinRound,
    getConfigs,
    getMyBets,
    placeBet,
    placeMultiBet,
    getFixtureDetail,
  };
};
