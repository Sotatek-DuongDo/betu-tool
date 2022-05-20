<template>
  <div>
    <div style="margin-bottom: 10px">
      <el-button type="primary" @click="addUser">Add user</el-button>
      <el-button type="primary" @click="() => userFileRef.click()"
        >Import users</el-button
      >
      <input
        ref="userFileRef"
        type="file"
        style="display: none"
        @change="importUsers"
      />
    </div>
    <el-table :data="userStore.users" border>
      <el-table-column prop="username" label="Username" />
      <el-table-column prop="availableBalance" label="Available balance" />
      <el-table-column prop="betuHold" label="Betu hold" />
      <el-table-column>
        <template #header>
          <el-button type="primary" size="small" @click="handleJoin"
            >Join All</el-button
          >
        </template>
        <template #default="{ row }">
          <div v-if="row.loading !== false">Loading...</div>
          <template v-if="row.loading === false">
            <el-button type="primary" size="small" @click="row.joinRound"
              >Join</el-button
            >
            <el-button type="primary" size="small" @click="showMyBets(row)"
              >Show bets</el-button
            >
            <el-button type="primary" size="small" @click="showBetForm(row)"
              >Bet</el-button
            >
          </template>
        </template>
      </el-table-column>
      <el-table-column prop="result" label="Result" />
    </el-table>
  </div>

  <el-dialog v-model="dialogVisible" title="All my bets">
    <el-table-v2 :data="gridData" :columns="columns" :width="900" :height="400">
      <el-table-column property="round" label="round" />
      <el-table-column property="type" label="type" />
      <el-table-column property="odds" label="odds" />
      <el-table-column property="payout" label="payout" />
      <el-table-column property="stake" label="stake" />
      <el-table-column property="status" label="status" />
    </el-table-v2>
  </el-dialog>

  <el-dialog v-model="dialogFormVisible" title="Bet">
    <input type="file" @change="handleFileUpload" />
    <el-select-v2
      v-model="userSelected"
      :options="userOptions"
      style="width: 240px"
      multiple
      collapse-tags
      collapse-tags-tooltip
    />
    <json-viewer :value="jsonData" />
    <el-button @click="handleBet">Confirm bet</el-button>
  </el-dialog>

  <el-dialog v-model="dialogLoginVisible" title="Add user" width="400px">
    <el-form :model="formLoginData" label-width="150px" label-position="top">
      <el-form-item label="Username">
        <el-input v-model="formLoginData.username" />
      </el-form-item>
      <el-form-item label="Password">
        <el-input v-model="formLoginData.password" type="password" />
      </el-form-item>
    </el-form>
    <template #footer>
      <span class="dialog-footer">
        <el-button @click="dialogLoginVisible = false">Cancel</el-button>
        <el-button type="primary" @click="handleAddUser">Add</el-button>
      </span>
    </template>
  </el-dialog>
</template>

<script lang="ts" setup>
import { computed, onMounted, ref, useHttp, useUserStore } from '#imports';
import type { Column } from 'element-plus';
import _ from 'lodash';

const { authAdmin, placeMultiBet, placeBet, getFixtureDetail } = useHttp();
const userStore = useUserStore();
const dialogVisible = ref(false);
const dialogFormVisible = ref(false);
const columns: Column[] = [
  { title: 'round', dataKey: 'round', width: 150 },
  { title: 'type', dataKey: 'type', width: 150 },
  { title: 'odds', dataKey: 'odds', width: 150 },
  { title: 'payout', dataKey: 'payout', width: 150 },
  { title: 'stake', dataKey: 'stake', width: 150 },
  { title: 'status', dataKey: 'status', width: 150 },
];
const gridData = ref([]);
const jsonData = ref();
const userOptions = computed(() =>
  userStore.users.map((item) => ({
    value: item.username,
    label: item.username,
  })),
);
const userSelected = ref([]);
const dialogLoginVisible = ref(false);
const formLoginData = ref<any>({});
const userFileRef = ref();

const showMyBets = async (row) => {
  gridData.value = [];
  dialogVisible.value = true;
  const [items] = await row.getMyBets();
  gridData.value = items;
};

const showBetForm = async (row) => {
  dialogFormVisible.value = true;
};

const readFile = (file: File) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (res) => resolve(res.target.result);
    reader.onerror = (err) => reject(err);
    reader.readAsText(file);
  });
};

const parseJsonString = (content) => {
  try {
    return JSON.parse(content);
  } catch {
    return null;
  }
};

const importUsers = async (event) => {
  try {
    const fileContent = await readFile(event.target.files[0]);
    const contentJson = parseJsonString(fileContent);
    if (!_.isArray(contentJson)) return;
    for (const user of contentJson) {
      await userStore.login(user.username, user.password);
    }
  } finally {
    userFileRef.value.value = null;
  }
};

const handleFileUpload = async (event) => {
  const fileContent = await readFile(event.target.files[0]);
  jsonData.value = parseJsonString(fileContent);
};

const handleJoin = () => {
  for (const user of userStore.users) {
    try {
      if (user.isLogged) user.joinRound();
    } catch (err) {
      console.log(err);
    }
  }
};

const addUser = () => {
  formLoginData.value = {};
  dialogLoginVisible.value = true;
};

const handleAddUser = async () => {
  try {
    await userStore.login(
      formLoginData.value.username,
      formLoginData.value.password,
    );
    dialogLoginVisible.value = false;
  } catch (e) {
    console.log(e);
  }
};

const handleBet = async () => {
  const promises = {};
  let outcomes = [];
  for (const item of jsonData.value.data) {
    promises[item.fixture_id] = getFixtureDetail(item.fixture_id).then(
      (data) => {
        const temps = _.get(data, 'group.templates');
        outcomes = [
          ...outcomes,
          ..._.chain(temps)
            .map('markets')
            .flatten()
            .map('outcomeGroups')
            .flatten()
            .map('outcomes')
            .flatten()
            .value(),
        ];
      },
    );
  }

  for (const username of userSelected.value) {
    const user = _.find(userStore.users, { username });
    if (!user) return;
    const isMultiBet = 'data' in jsonData.value && 'stake' in jsonData.value;
    try {
      if (isMultiBet) {
        await Promise.all(
          _.map(jsonData.value.data, async (item) => {
            await promises[item.fixture_id];
            const currentOdds = _.find(outcomes, [
              'id',
              item.bet_game_id,
            ])?.currentOdd;
            if (currentOdds) item.odds = currentOdds;
          }),
        );
        await placeMultiBet(user.accessToken, jsonData.value);
      } else {
        await placeBet(user.accessToken, jsonData.value);
      }
    } catch (e) {
      console.log(e);
    }
  }
};

onMounted(async () => {
  await authAdmin('admin', 'Admin_12345');
  await userStore.getConfigs();
  _.forEach(userStore.users, (item) => {
    userStore.login(item.username, item.password);
  });
  userSelected.value = userStore.users.map((u) => u.username);
});
</script>
