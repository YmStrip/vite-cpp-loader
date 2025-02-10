<template>
  <Button @click="test()"></Button>
</template>
<script lang="ts" setup>
import api from "./hello.cc"
const test = () => {
  api.hello()
}
</script>
