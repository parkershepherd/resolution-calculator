<script lang="ts">

export default {
  name: 'Configuration',
  props: {
    screenSize: {
      type: Number,
      default: 60,
    },
    resolution: {
      type: Number,
      default: 2160,
    },
  },
}

</script>

<template>
  <div class="border-1 border-gray-400 py-2 px-4 pt-4 rounded-lg">
    <button
      @click="$emit('delete')"
      class="float-right cursor-pointer text-xs">
      🗑️
    </button>
    <div class="mb-2">
      <label for="screenSize" class="mr-2">Size: <pre class="inline">{{ screenSize }}"</pre></label>
      <input
        class="cursor-pointe absolute mt-0.5"
        id="screenSize"
        type="range"
        min="32"
        max="100"
        :value="screenSize"
        @input="$emit('update:screen-size', ($event.target as HTMLTextAreaElement).value)" />
    </div>
    <div>
      <label for="resolution" class="mr-2">Resolution (p):</label>
      <select
        class="cursor-pointer border-1 border-gray-400 rounded-lg px-2 py-1"
        id="resolution"
        :value="resolution"
        @input="$emit('update:resolution', ($event.target as HTMLTextAreaElement).value)">
        <option value="720">720p</option>
        <option value="1080">1080p</option>
        <option value="2160">4K (2160p)</option>
        <option value="4320">8K (4320p)</option>
      </select>
    </div>
  </div>
</template>

<style scoped>
</style>
