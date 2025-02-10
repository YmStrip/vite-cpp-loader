### STEP
1. put in vite plugin and install node-gyp , deps
2. import
```vue
<template>
  <Button @click="test()"></Button>
</template>
<script lang="ts" setup>
import api from "./hello.cc"
const test = () => {
  api.hello()
}
</script>
 ```
