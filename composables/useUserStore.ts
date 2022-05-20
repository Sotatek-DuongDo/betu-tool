import { defineStore } from 'pinia';
import _ from 'lodash';
import BigNumber from 'bignumber.js';
import { useHttp } from './useHttp';
import { toRaw } from '#build/imports';

const {
  login,
  getAvailableBetu,
  getCurrentRound,
  joinRound,
  getConfigs,
  getMyBets,
} = useHttp();

export const useUserStore = defineStore('user-store', {
  state: () => ({
    users: [],
    configs: {} as any,
  }),
  getters: {
    isAuth() {
      return true;
    },
  },
  actions: {
    async login(username: string, password: string) {
      const logged = await login(username, password);
      const user = _.find(this.users, { username });
      const loading = (bool: boolean) => {
        if (user) user.loading = bool;
      };
      loading(true);
      const [balance, currentRound] = await Promise.all([
        getAvailableBetu(logged.access_token),
        getCurrentRound(logged.access_token),
      ]).finally(() => loading(false));
      const accessToken = logged.access_token;
      const newUser = {
        username,
        password,
        accessToken: logged.access_token,
        isLogged: true,
        loading: false,
        result: 'logged',
        availableBalance: balance.available_balance,
        betuHold: currentRound.joinedInfo?.betuHold,
        isJoined: !!currentRound.joinedInfo,
        joinRound: async () => {
          const self = _.find(this.users, { accessToken });
          if (self.isJoined) return;
          const maxStake = this.configs['MAX_STAKE'];
          const balance = new BigNumber(self.availableBalance).gt(maxStake || 0)
            ? maxStake
            : self.availableBalance;
          const joined = await joinRound(self.accessToken, balance);
          self.betuHold = joined.betuLock;
        },
        getMyBets: () => getMyBets(accessToken),
      };
      if (user) Object.assign(user, newUser);
      else this.users.push(newUser);
    },
    async getConfigs() {
      const result = await getConfigs();
      this.configs = _.chain(result)
        .map((item) => [item.key, item.value])
        .fromPairs()
        .value();
    },
  },
  persist: {
    key: 'test',
    storage: window.sessionStorage,
    paths: ['users'],
    serializer: {
      serialize: (value) => {
        value.users = _.map(toRaw(value.users), (item) => {
          return _.omit(item, ['loading', 'isLogged', 'isJoined']);
        });
        return JSON.stringify(value);
      },
      deserialize: JSON.parse,
    },
  },
});
