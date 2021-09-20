<template>
  <div class="items">
    <j-menu-item
      :selected="index === selectedIndex"
      v-for="(item, index) in items"
      :key="index"
      @click="selectItem(index)"
    >
      {{ item.label }}
    </j-menu-item>
  </div>
</template>

<script lang="ts">
export default {
  props: {
    items: {
      type: Array,
      required: true,
    },

    command: {
      type: Function,
      required: true,
    },
  },

  data() {
    return {
      selectedIndex: 0 as number,
    };
  },

  watch: {
    items: function () {
      this.selectedIndex = 0;
    },
  },

  methods: {
    onKeyDown({ event }: { event: any }) {
      if (event.key === "ArrowUp") {
        this.upHandler();
        return true;
      }

      if (event.key === "ArrowDown") {
        this.downHandler();
        return true;
      }

      if (event.key === "Enter") {
        this.enterHandler();
        return true;
      }

      return false;
    },

    upHandler() {
      this.selectedIndex =
        (this.selectedIndex + this.items.length - 1) % this.items.length;
    },

    downHandler() {
      this.selectedIndex = (this.selectedIndex + 1) % this.items.length;
    },

    enterHandler() {
      this.selectItem(this.selectedIndex);
    },

    selectItem(index) {
      const item = this.items[index];

      if (item) {
        this.command({ id: item.id, label: item.label });
      }
    },
  },
};
</script>
