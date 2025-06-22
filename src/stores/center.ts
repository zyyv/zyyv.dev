import { defineStore } from 'pinia';
import { ref } from 'vue';

export const useCenterStore = defineStore('center', ()=>{
  const center = ref({
    x: 0.5,
    y: 0.5,
  })

  return {
    center,
  };
});
