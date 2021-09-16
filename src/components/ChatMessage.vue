<template>
  <div class="message-item-wrapper">
    <div class="message-item__reply" v-if="replyMessage">
      <j-icon size="sm" name="arrow-90deg-down"></j-icon>
      <div v-html="replyMessage.content"></div>
    </div>
    <div
      class="message-item"
      :class="{ 'message-item--is-replying': isReplying }"
      ref="messageItem"
    >
      <div class="message-item__left-column">
        <j-avatar
          class="message-item__avatar"
          @click="handleProfileClick"
          v-if="showAvatar"
          :hash="did"
          :src="profileImg"
        />

        <j-tooltip placement="top" v-else>
          <j-timestamp
            slot="title"
            :value="timestamp"
            datestyle="medium"
            timestyle="short"
          ></j-timestamp>
          <j-timestamp
            class="message-item__timestamp"
            hour="numeric"
            minute="numeric"
            :value="timestamp"
          ></j-timestamp>
        </j-tooltip>
      </div>
      <div class="message-item__right-column">
        <div class="message-item__message-info" v-if="showAvatar">
          <j-text
            @click="handleProfileClick"
            slot="trigger"
            :id="username"
            color="black"
            nomargin
            weight="500"
            class="message-item__username"
            >{{ username }}
          </j-text>
          <j-tooltip placement="top">
            <j-timestamp
              slot="title"
              :value="timestamp"
              dateStyle="medium"
              timeStyle="short"
            ></j-timestamp>
            <j-timestamp
              class="message-item__timestamp"
              relative
              :value="timestamp"
            ></j-timestamp>
          </j-tooltip>
        </div>
        <div
          class="message-item__message"
          @click="onMessageClick"
          v-html="message"
        ></div>
      </div>
      <div class="message-item__toolbar">
        <j-tooltip placement="top" title="Add emoji">
          <j-button variant="ghost" size="sm">
            <j-icon size="sm" name="emoji-smile" />
          </j-button>
        </j-tooltip>
        <j-tooltip placement="top" title="Reply">
          <j-button
            @click="() => $emit('replyClick')"
            variant="ghost"
            size="sm"
          >
            <j-icon size="sm" name="reply" />
          </j-button>
        </j-tooltip>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from "vue";

export default defineComponent({
  emits: ["mentionClick", "profileClick", "replyClick"],
  props: {
    did: String,
    replyMessage: Object,
    timestamp: String,
    username: String,
    message: String,
    profileImg: String,
    showAvatar: Boolean,
    isReplying: Boolean,
  },
  computed: {
    html() {
      return this.message;
    },
  },
  methods: {
    onMessageClick() {
      console.log("message click");
    },
    handleProfileClick() {
      this.$emit("profileClick", this.did);
    },
  },
});
</script>
